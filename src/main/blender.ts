import { spawn, ChildProcess } from 'child_process'
import { RenderJob } from './types'

// Regex to parse Blender's frame output: "Fra:10 Mem:..."
const FRAME_RE = /^Fra:(\d+)\s/m
// Blender completion line
const DONE_RE = /Saved:\s*'(.+)'/

export type ProgressCallback = (frame: number, line: string) => void
export type DoneCallback = (exitCode: number | null, error?: string) => void

export function spawnBlender(
  blenderPath: string,
  job: RenderJob,
  onProgress: ProgressCallback,
  onDone: DoneCallback
): ChildProcess {
  const args = buildArgs(job)
  const proc = spawn(blenderPath, args, { stdio: ['ignore', 'pipe', 'pipe'] })

  const handleLine = (line: string): void => {
    const frameMatch = FRAME_RE.exec(line)
    if (frameMatch) {
      onProgress(parseInt(frameMatch[1], 10), line)
    } else if (DONE_RE.test(line)) {
      onProgress(job.currentFrame ?? job.frameStart, line)
    }
  }

  let stdoutBuf = ''
  proc.stdout?.on('data', (chunk: Buffer) => {
    stdoutBuf += chunk.toString()
    const lines = stdoutBuf.split('\n')
    stdoutBuf = lines.pop() ?? ''
    lines.forEach(handleLine)
  })

  let stderrBuf = ''
  let lastError = ''
  proc.stderr?.on('data', (chunk: Buffer) => {
    stderrBuf += chunk.toString()
    const lines = stderrBuf.split('\n')
    stderrBuf = lines.pop() ?? ''
    lines.forEach((line) => {
      if (line.trim()) lastError = line
    })
  })

  proc.on('close', (code) => {
    onDone(code, code !== 0 ? lastError || `Blender exited with code ${code}` : undefined)
  })

  return proc
}

function buildArgs(job: RenderJob): string[] {
  const args: string[] = [
    '-b', job.blendFile,
    '--engine', job.engine,
    '-o', job.outputPath,
    '-s', String(job.frameStart),
    '-e', String(job.frameEnd),
    '-j', String(job.frameStep),
    '-t', String(job.threads)
  ]

  if (job.resolutionX != null) {
    args.push('--python-expr',
      `import bpy; bpy.context.scene.render.resolution_x = ${job.resolutionX}`)
  }
  if (job.resolutionY != null) {
    args.push('--python-expr',
      `import bpy; bpy.context.scene.render.resolution_y = ${job.resolutionY}`)
  }
  if (job.resolutionScale != null) {
    args.push('--python-expr',
      `import bpy; bpy.context.scene.render.resolution_percentage = ${job.resolutionScale}`)
  }
  if (job.samples != null) {
    args.push('--python-expr',
      `import bpy; s = bpy.context.scene; hasattr(s.cycles, 'samples') and setattr(s.cycles, 'samples', ${job.samples}) or setattr(s.eevee, 'taa_render_samples', ${job.samples})`)
  }

  args.push('-x', '1', '-a')
  return args
}

/** Try common default Blender install paths per platform */
export function getDefaultBlenderPaths(): string[] {
  const platform = process.platform
  if (platform === 'win32') {
    return [
      'C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe',
      'C:\\Program Files\\Blender Foundation\\Blender 4.1\\blender.exe',
      'C:\\Program Files\\Blender Foundation\\Blender 4.0\\blender.exe',
      'C:\\Program Files\\Blender Foundation\\Blender\\blender.exe',
      'blender'
    ]
  } else if (platform === 'darwin') {
    return [
      '/Applications/Blender.app/Contents/MacOS/Blender',
      '/Applications/Blender.app/Contents/MacOS/blender',
      'blender'
    ]
  } else {
    return ['/usr/bin/blender', '/usr/local/bin/blender', 'blender']
  }
}
