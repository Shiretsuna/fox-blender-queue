@echo off
:: Builds all platforms at once: Windows installer + portable, Mac DMG, Linux AppImage.
:: Output: everything goes into the release\ folder.
:: NOTE: Cross-compiling Mac/Linux from Windows may have limitations.
::       For best results, build each platform on its native OS.
:: CSC_IDENTITY_AUTO_DISCOVERY=false skips code signing (no certificate needed for personal builds).
set CSC_IDENTITY_AUTO_DISCOVERY=false
npm run build && npx electron-builder --win --mac --linux
