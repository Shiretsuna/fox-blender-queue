import { open, writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { deflateSync } from 'zlib'
import { spawn } from 'child_process'
import { BlendInfo } from './types'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function readBlendInfo(filePath: string, blenderPath: string): Promise<BlendInfo> {
  const [thumbnail, settings] = await Promise.all([
    readBlendThumbnail(filePath).catch(() => null),
    readBlendSettings(blenderPath, filePath).catch(() => null)
  ])
  return { thumbnail, ...settings }
}

// ---------------------------------------------------------------------------
// Thumbnail — binary parse of .blend TEST block (no Blender needed, instant)
// ---------------------------------------------------------------------------

async function readBlendThumbnail(filePath: string): Promise<string | null> {
  const fd = await open(filePath, 'r')
  try {
    // Read the 12-byte header: "BLENDER" + ptr_size + endian + version
    const header = Buffer.alloc(12)
    const { bytesRead: hRead } = await fd.read(header, 0, 12, 0)
    if (hRead < 12) return null
    if (header.slice(0, 7).toString('ascii') !== 'BLENDER') return null

    const ptrSize = header[7] === 0x5F ? 8 : 4  // '_' = 8 bytes, '-' = 4 bytes
    const le = header[8] === 0x76               // 'v' = little-endian

    const readU32 = (b: Buffer, o: number) => le ? b.readUInt32LE(o) : b.readUInt32BE(o)

    // Block header layout: code(4) + size(4) + old_ptr(ptrSize) + sdna(4) + count(4)
    const blockHdrSize = 4 + 4 + ptrSize + 4 + 4
    let offset = 12
    const MAX_SCAN = 4 * 1024 * 1024 // scan up to 4 MB

    while (offset < MAX_SCAN) {
      const bh = Buffer.alloc(blockHdrSize)
      const { bytesRead } = await fd.read(bh, 0, blockHdrSize, offset)
      if (bytesRead < blockHdrSize) break

      const code = bh.slice(0, 4).toString('ascii').replace(/\0/g, '')
      const dataSize = readU32(bh, 4)

      if (code === 'ENDB') break

      if (code === 'TEST') {
        const data = Buffer.alloc(dataSize)
        await fd.read(data, 0, dataSize, offset + blockHdrSize)

        const width = readU32(data, 0)
        const height = readU32(data, 4)
        const pixelBytes = width * height * 4

        if (width > 0 && height > 0 && width <= 4096 && height <= 4096 && dataSize >= 8 + pixelBytes) {
          // Pixels are RGBA. Blender stores rows bottom-to-top (OpenGL convention) — flip.
          const rgba = data.slice(8, 8 + pixelBytes)
          const flipped = flipVertical(rgba, width, height)
          const png = encodePNG(width, height, flipped)
          return `data:image/png;base64,${png.toString('base64')}`
        }
        break
      }

      offset += blockHdrSize + dataSize
    }

    return null
  } finally {
    await fd.close()
  }
}

function flipVertical(rgba: Buffer, width: number, height: number): Buffer {
  const out = Buffer.alloc(rgba.length)
  const rowBytes = width * 4
  for (let y = 0; y < height; y++) {
    rgba.copy(out, y * rowBytes, (height - 1 - y) * rowBytes, (height - y) * rowBytes)
  }
  return out
}

// ---------------------------------------------------------------------------
// Minimal PNG encoder (no external deps)
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const t: number[] = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf: Buffer): number {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Buffer): Buffer {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crc])
}

function encodePNG(width: number, height: number, rgba: Buffer): Buffer {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 6 // 8-bit RGBA

  // Prepend filter byte (None=0) to each row
  const raw = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0
    rgba.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4)
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0))
  ])
}

// ---------------------------------------------------------------------------
// Settings — spawn Blender with a Python script (~2–5 s, requires Blender)
// ---------------------------------------------------------------------------

const PYTHON_SCRIPT = `
import bpy, json, sys

s = bpy.context.scene
r = s.render

samples = None
try: samples = s.cycles.samples
except Exception: pass
if samples is None:
    try: samples = s.eevee.taa_render_samples
    except Exception: pass

print('__BLEND_INFO__:' + json.dumps({
  'sceneName': s.name,
  'frameStart': s.frame_start,
  'frameEnd': s.frame_end,
  'frameStep': s.frame_step,
  'outputPath': r.filepath,
  'engine': r.engine,
  'resolutionX': r.resolution_x,
  'resolutionY': r.resolution_y,
  'resolutionScale': r.resolution_percentage,
  'samples': samples
}))
`

async function readBlendSettings(
  blenderPath: string,
  filePath: string
): Promise<Partial<BlendInfo> | null> {
  const scriptPath = join(tmpdir(), `blend_info_${Date.now()}.py`)
  await writeFile(scriptPath, PYTHON_SCRIPT, 'utf8')

  try {
    const output = await runBlenderScript(blenderPath, filePath, scriptPath)
    const match = output.match(/__BLEND_INFO__:(\{.+\})/)
    if (!match) return null

    const raw = JSON.parse(match[1])
    return {
      sceneName: raw.sceneName,
      frameStart: raw.frameStart,
      frameEnd: raw.frameEnd,
      frameStep: raw.frameStep,
      outputPath: raw.outputPath || undefined,
      engine: raw.engine,
      resolutionX: raw.resolutionX,
      resolutionY: raw.resolutionY,
      resolutionScale: raw.resolutionScale,
      samples: raw.samples ?? undefined
    }
  } finally {
    await unlink(scriptPath).catch(() => {})
  }
}

function runBlenderScript(blenderPath: string, blendFile: string, scriptPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(blenderPath, ['-b', blendFile, '-P', scriptPath, '--', '--no-render'], {
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let out = ''
    proc.stdout?.on('data', (d: Buffer) => { out += d.toString() })
    proc.stderr?.on('data', (d: Buffer) => { out += d.toString() })

    const timeout = setTimeout(() => { proc.kill(); reject(new Error('Timeout reading blend settings')) }, 30000)

    proc.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })

    proc.on('close', (code) => {
      clearTimeout(timeout)
      if (out.includes('__BLEND_INFO__')) resolve(out)
      else reject(new Error(`Blender exited ${code} without returning settings`))
    })
  })
}
