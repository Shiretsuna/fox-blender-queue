@echo off
:: Builds a portable Windows .exe — no installation needed, runs directly.
:: Output: release\Fox Blender Queue X.X.X.exe
:: Good for sharing or running from a USB drive.
:: CSC_IDENTITY_AUTO_DISCOVERY=false skips code signing (no certificate needed for personal builds).
set CSC_IDENTITY_AUTO_DISCOVERY=false
npm run build && npx electron-builder --win portable
