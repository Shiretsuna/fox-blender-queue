@echo off
:: Builds a Linux AppImage (universal) and .deb package (Debian/Ubuntu).
:: Output: release\Fox Blender Queue-X.X.X.AppImage, release\*.deb
:: NOTE: Best run on Linux or WSL for proper results.
npm run build && npx electron-builder --linux
