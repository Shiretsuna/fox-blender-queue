# Contributing to Fox Blender Queue

Thanks for your interest in contributing! Here's everything you need to get started.

## Getting started

```bash
git clone https://github.com/Shiretsuna/fox-blender-queue.git
cd fox-blender-queue
npm install
npm run dev
```

## How to contribute

- **Bug reports** — open an issue with steps to reproduce, your OS, Blender version, and any error messages from the DevTools console.
- **Feature requests** — open an issue describing the use case. Check existing issues first to avoid duplicates.
- **Pull requests** — fork the repo, create a branch off `main`, make your changes, and open a PR with a clear description of what changed and why.

## Branch naming

```
feat/short-description
fix/short-description
chore/short-description
```

## Code style

- TypeScript strict mode is enabled — no `any` unless truly unavoidable
- React components use CSS Modules (`.module.css`) — no inline styles except for dynamic values
- IPC pattern: add handler in `src/main/index.ts`, expose in `src/preload/index.ts`, call via `window.api` in renderer
- Keep components focused — if a file is getting long, split it

## Commit messages

Use the imperative mood and a short summary line:

```
Add render priority setting per job
Fix progress bar not resetting on retry
```

## License

By contributing, you agree that your contributions will be licensed under the same [GPL-3.0 license](LICENSE) as the project.
