# EverAfter for Windows 💜

A native Windows desktop edition of the same **offline EverAfter life-simulation game** available on iOS. It uses Electron but packages the whole HTML game and its 187 SVG assets inside a desktop application. No website, internet connection, or game server is required to play.

## Install without coding

1. Go to [EverAfter Windows Desktop builds](https://github.com/jdarkyeka6/EverAfter/actions/workflows/windows-desktop.yml).
2. Open the newest **successful** run and download the **EverAfter-Windows-Desktop** artifact under Artifacts. GitHub may require you to sign in.
3. Unzip the artifact. It includes:
   - `EverAfter-1.0.0-x64-nsis.exe`: Windows installer with shortcuts.
   - `EverAfter-1.0.0-x64-portable.exe`: standalone EXE, no installation required.

Builds are **not code-signed**; Windows may show an unknown-publisher warning. Obtain the application only from the trusted repository's own GitHub Actions run.

## Run from source (Windows 11)

Install Node.js 22+, then open PowerShell in the `desktop` folder:

```powershell
npm install
npm start
```

To build the installer and portable EXE locally:

```powershell
npm run build:win
```

## Saves and device transfers

Your game saves automatically to the desktop app's persistent local storage, keyed to a stable `everafter://game` origin. Moving the portable EXE or installing updates **does not reset saves**. The app does not automatically sync with your iPhone: export a `.json` save using **Save & Load** and import it on the other device. The export feature opens a Windows Save dialog.

## Security

Electron has `nodeIntegration: false`, `contextIsolation: true`, renderer sandboxing and web security enabled. The app serves only files inside its bundled game directory from a secure custom protocol, blocks permission requests and opens external links in the default browser.

This desktop packaging does not modify the iOS bundle identifier, Apple keys, iPhone TestFlight releases or existing game files. Both apps continue to share the same game source.
