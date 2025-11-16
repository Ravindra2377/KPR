# Branding assets setup

This folder is a placeholder for native assets used by `cordova-res` and `react-native-bootsplash`.

## Icons
1. Drop a 2048x2048 `icon.png` into this directory.
2. Run
   ```powershell
   cd d:\OneDrive\Desktop\KPR
   cordova-res android --skip-config --copy
   cordova-res ios --skip-config --copy
   ```
   to generate and copy all platform icon sizes.

## Splash / Boot splash
1. Add a 2732x2732 `splash.png` (content centered, transparent background where possible).
2. Generate native splash resources via Bootsplash:
   ```powershell
   cd d:\OneDrive\Desktop\KPR\kpr-app
   npx react-native-bootsplash generate ..\resources\splash.png --platforms android,ios --background-color "#0D0D0F"
   ```
3. Rebuild the apps (`npx react-native run-android` / `npx react-native run-ios`).

Feel free to replace these assets with your production-ready branding files.
