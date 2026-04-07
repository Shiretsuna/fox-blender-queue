@echo off
:: Builds a macOS .dmg disk image and .zip archive.
:: Output: release\Fox Blender Queue-X.X.X.dmg
:: NOTE: Must be run on a Mac (macOS code signing requires the host OS).
npm run build && npx electron-builder --mac
