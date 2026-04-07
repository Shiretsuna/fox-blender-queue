@echo off
:: Builds a Windows NSIS installer (.exe setup file).
:: Output: release\Fox Blender Queue Setup X.X.X.exe
:: Users run this installer to install the app properly (with uninstall support).
:: CSC_IDENTITY_AUTO_DISCOVERY=false skips code signing (no certificate needed for personal builds).
set CSC_IDENTITY_AUTO_DISCOVERY=false
npm run build && npx electron-builder --win nsis
