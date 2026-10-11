# Everafter 🎮

An original, choice-driven life simulator for iOS and iPadOS, moved from the working TideLife prototype into its own separate App Store app.

## What's included?

**The complete playable Everafter game**, not the smaller earlier TideLife simulator. It includes dozens of careers, life events and choices, relationships, education, money and investing, businesses, property, vehicles, pets, achievements, challenges, royalty, politics, creative careers, space missions, clubs and more. The Creator Mode controls are unlocked. There are **no paywalls, ads or subscriptions**.

The game is bundled in `Everafter/Game/index.html`. The SwiftUI entry point and WebKit offline wrapper load it from inside the app; no web server is necessary to play.

## Identity

| Item | Value |
|---|---|
| Display name | Everafter |
| Xcode project / scheme | Everafter |
| Default bundle ID | `com.jdarkyeka6.everafter` (suggested; **must match your Apple registration**) |
| Version | 1.0.0 |
| Minimum iOS | 17 |
| Signing | Automatic |

If you register a different bundle ID, tell us its **exact spelling** and set the repository variable `EVERAFTER_BUNDLE_ID` under **Settings → Secrets and variables → Actions → Variables**. The TestFlight workflow substitutes that registered ID before compiling. Also update `project.yml` for local Xcode builds.

## GitHub Actions secrets

Go to **Settings → Secrets and variables → Actions → Repository secrets** and add exactly these:

- `APPLE_TEAM_ID`: 10-character Apple Developer Team ID
- `ASC_KEY_ID`: App Store Connect API Key ID
- `ASC_ISSUER_ID`: App Store Connect API Issuer ID
- `ASC_KEY_CONTENT`: entire **.p8 private key contents** (PEM) or base64 of the .p8

Do not commit certificates, passwords or API keys to the repository. You can reuse an existing App Store Connect API key if it belongs to the correct team and has sufficient permissions.

## Build

**Continuous integration:** pushes to `main` run **Everafter iOS Build**, an unsigned iPhone Simulator build checking the native wrapper and game assets.

**TestFlight:** after your new Everafter app record, registered bundle ID and four secrets are ready, go to **Actions → Everafter TestFlight Upload → Run workflow**. It archives the complete game and attempts to sign it automatically with Xcode and the stored API key, then upload it to the newly created Everafter app.

GitHub's previous TideLife pipeline had an Apple signing error: `No Account for Team`. The new repo is configured for automatic signing, but the same Apple Developer team/API permission issue may need to be fixed in Apple Developer/App Store Connect. **Successful compilation is not the same as a TestFlight upload.**

## Local Xcode

On a Mac with Xcode and XcodeGen:

```bash
brew install xcodegen
swift scripts/make_app_icon.swift Everafter/Assets.xcassets/AppIcon.appiconset/Icon-1024.png
xcodegen generate
open Everafter.xcodeproj
```

Keep Everafter's exact registered bundle ID under the target's Signing settings. App Store Connect listing name and home-screen display name can be changed separately without changing the bundle ID.

## Storage

The game uses a persistent `WKWebView` data store for local save slots. It supports JSON export and import from the in-game interface. Like any app, save data could be lost when uninstalling, so export anything important beforehand.

## Safety

The game contains fictional events involving crime and other adult topics. It is a fictional simulator, not instructions for real-world harm.
