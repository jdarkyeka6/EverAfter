# Everafter 🎮

An original, choice-driven life simulator for iOS and iPadOS, moved from the working TideLife prototype into its own separate App Store app.

## What's included?

**The complete playable Everafter game**, not the smaller earlier TideLife simulator. It includes dozens of careers, life events and choices, relationships, education, money and investing, businesses, property, vehicles, pets, achievements, challenges, royalty, politics, creative careers, space missions, clubs and more. The Creator Mode controls are unlocked. There are **no paywalls, ads or subscriptions**.

The game is bundled in `Everafter/Game/index.html`. The SwiftUI entry point and WebKit offline wrapper load it from inside the app; no web server is necessary to play.

## Identity

| Item | Value |
|---|---|
| Display name | EverAfter |
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

The previous TideLife pipeline had signing errors. This new EverAfter pipeline automatically signed and exported a valid IPA. The first EverAfter attempt ([run #1](https://github.com/jdarkyeka6/EverAfter/actions/runs/38117767256)) was **rejected by Apple** because the app was missing required iPad orientations. The uploader printed `UPLOAD FAILED` but exited with code 0, so GitHub incorrectly reported success. The fix added the four required iPad orientations and an explicit upload-output check.

**Apple accepted the second upload on 11 October 2026:** [successful verified upload run #2](https://github.com/jdarkyeka6/EverAfter/actions/runs/38118332836). The log explicitly confirms `UPLOAD SUCCEEDED with no errors`. Apple may need to process the build before it appears in App Store Connect → EverAfter → TestFlight, and tester access may need to be configured.

## Local Xcode

On a Mac with Xcode and XcodeGen:

```bash
brew install xcodegen
swift scripts/make_app_icon.swift Everafter/Assets.xcassets/AppIcon.appiconset/Icon-1024.png
xcodegen generate
open Everafter.xcodeproj
```

Keep Everafter's exact registered bundle ID under the target's Signing settings. App Store Connect listing name and home-screen display name can be changed separately without changing the bundle ID.

## Successful TestFlight upload

- **Bundle ID:** `com.jdarkyeka6.everafter`
- **Display name:** `EverAfter`
- **Signing:** Xcode automatic signing
- **Apple uploader confirmation:** `UPLOAD SUCCEEDED with no errors`
- **Run:** [EverAfter TestFlight run #2](https://github.com/jdarkyeka6/EverAfter/actions/runs/38118332836)

Check App Store Connect for subsequent processing status. A successful upload is not a guarantee that the build has already finished processing or can be installed by testers.

## Mobile life-screen redesign (build 3)

On 11 October 2026, the iOS home screen was redesigned for a compact, non-scrolling phone layout. It now shows the EverAfter header with menu/save/settings, the character's nationality/age and cash on the same row, four tappable stats, a scrollable recent-events area, and fixed Actions / Baby-School-Employment-Unemployed / Age Up buttons. The Actions menu uses full-screen categories and the age counter animates before life-event choices are shown. The full game content and save-key format remain unchanged.

**Apple confirmed TestFlight build 3 upload:** [GitHub Actions run #3](https://github.com/jdarkyeka6/EverAfter/actions/runs/38119329058), log text `UPLOAD SUCCEEDED with no errors`. Apple's processing and tester availability may follow later.

## Export compliance

EverAfter is a standalone offline life simulator. It does not implement custom cryptography or non-exempt encryption, so the XcodeGen `project.yml` supplies `ITSAppUsesNonExemptEncryption: false` in the generated app `Info.plist`, as prescribed by Apple. The TestFlight workflow validates that the built app contains this Boolean value before distribution.

This is intended to prevent future **Missing Compliance** warnings on new builds. Existing builds (including build 3) are not changed: answer Apple's **Manage** export-compliance questions for them in App Store Connect.

If the app later adds non-exempt encryption or third-party encryption libraries, reassess this declaration rather than keeping it false automatically.

## Storage

The game uses a persistent `WKWebView` data store for local save slots. It supports JSON export and import from the in-game interface. Like any app, save data could be lost when uninstalling, so export anything important beforehand.

## Safety

The game contains fictional events involving crime and other adult topics. It is a fictional simulator, not instructions for real-world harm.
