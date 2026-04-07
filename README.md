# Fox Blender Queue

A cross-platform desktop render queue manager for [Blender](https://www.blender.org/). Add your `.blend` scenes, configure render parameters, and let the queue process them one by one — no babysitting required.

![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/license-GPL--3.0-orange)
![Version](https://img.shields.io/badge/version-0.1.0-green)

---

## Features

- **Drag & drop** `.blend` files directly onto the app
- **Auto-reads scene settings** — frame range, output path, render engine, resolution and samples are pulled straight from the file
- **Scene thumbnail preview** extracted from the `.blend` binary (no Blender needed for this step)
- **Queue management** — add, reorder, cancel, retry jobs
- **Per-engine support** — Cycles, EEVEE, EEVEE Next
- **Parameter overrides** — override samples, resolution and thread count per job without touching the original file
- **Live progress** — frame-by-frame progress bar with Blender stdout parsing
- **Job detail panel** — thumbnail, all parameters, real-time log output
- **Global progress bar** — see overall queue completion at a glance
- **Persistent config** — Blender path is saved across sessions
- **First-launch setup** — auto-detects your Blender installation on first run
- **Cross-platform builds** — Windows (installer + portable), macOS (DMG), Linux (AppImage + deb)

---

## Requirements

- [Node.js](https://nodejs.org/) 18 or later (for building from source)
- [Blender](https://www.blender.org/download/) 3.x or 4.x installed on your machine

---

## Installation

### Pre-built releases

Download the latest release for your platform from the [Releases](../../releases) page:

| Platform | File |
|----------|------|
| Windows (installer) | `Fox Blender Queue Setup X.X.X.exe` |
| Windows (portable)  | `Fox Blender Queue X.X.X.exe` |
| macOS               | `Fox Blender Queue-X.X.X.dmg` |
| Linux               | `Fox Blender Queue-X.X.X.AppImage` |

### Build from source

```bash
git clone https://github.com/Shiretsuna/fox-blender-queue.git
cd fox-blender-queue
npm install
```

Then use one of the build scripts (see below) or run in dev mode:

```bash
npm run dev
# or double-click dev.bat on Windows
```

---

## Build scripts

Convenience `.bat` scripts are included at the project root:

| Script | Output |
|--------|--------|
| `dev.bat` | Development mode with hot reload + DevTools |
| `build-win-installer.bat` | Windows NSIS installer `.exe` |
| `build-win-portable.bat` | Single portable `.exe`, no install needed |
| `build-mac.bat` | macOS `.dmg` *(run on macOS)* |
| `build-linux.bat` | Linux `AppImage` + `.deb` *(run on Linux)* |
| `build-all.bat` | All platforms at once |

> **Windows note:** Building requires symlink creation rights. Enable **Developer Mode** in  
> Settings → System → For developers, or run the script as Administrator.

All build output goes to the `release/` folder.

---

## Usage

1. **First launch** — the app will try to auto-detect your Blender installation. If it can't find it, you'll be prompted to locate the executable manually.
2. **Add a job** — drag a `.blend` file onto the window, or click **+ Add Job** and browse. Scene settings are auto-filled.
3. **Review & adjust** — tweak frame range, engine, samples or resolution overrides as needed.
4. **Start the queue** — click **▶ Start Queue**. Jobs run one at a time. Progress is shown per-job and globally at the bottom.
5. **Inspect results** — click any job to open the detail panel with the full Blender log and an "Open Output Folder" shortcut.

---

## Project structure

```
src/
├── main/               # Electron main process (Node.js)
│   ├── index.ts        # App entry, IPC handlers
│   ├── queue.ts        # RenderQueue state machine
│   ├── blender.ts      # Blender process spawning & arg builder
│   ├── blend-reader.ts # .blend binary thumbnail parser + settings via Blender CLI
│   ├── store.ts        # Persistent JSON config
│   └── types.ts        # Shared TypeScript types
├── preload/
│   └── index.ts        # contextBridge API (window.api)
└── renderer/src/       # React UI
    ├── App.tsx
    └── components/
        ├── Toolbar.tsx
        ├── JobList.tsx / JobCard.tsx
        ├── JobDetailPanel.tsx
        ├── AddJobPanel.tsx
        ├── BottomBar.tsx
        ├── SetupModal.tsx
        └── SettingsModal.tsx
```

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

---

## License

This project is licensed under the **GNU General Public License v3.0**.  
See the [LICENSE](LICENSE) file for the full text.
