# Everafter 🎮

An original, choice-driven life simulator for iOS and iPadOS, moved from the working TideLife prototype into its own separate App Store app.

## What's included?

**The complete playable Everafter game**, not the smaller earlier TideLife simulator. It includes dozens of careers, life events and choices, relationships, education, money and investing, businesses, property, vehicles, pets, achievements, challenges, royalty, politics, creative careers, space missions, clubs and more. The Creator Mode controls are unlocked. There are **no paywalls, ads or subscriptions**.

The game is bundled in `Everafter/Game/index.html`. The SwiftUI entry point and WebKit offline wrapper load it from inside the app; no web server is necessary to play.

## Play EverAfter on the web 🌐

EverAfter is also a self-contained, responsive website. It runs the **same offline-capable game** as the Windows and iPhone apps.

The repository root has a `vercel.json` file. Connect this GitHub repository to a Vercel project with the **root directory left empty / repository root**. The Vercel build runs `node scripts/build-web.cjs` and serves `web-dist/` as static files.

To test the exact web output locally:

```sh
node scripts/build-web.cjs
node scripts/test-web.cjs
```

The website comes with all 187 illustrated SVG assets, a web-app manifest, 192/512px icons, an installable app experience and a service worker that caches the full game for offline play.

**Saves:** Lives are stored in the browser's local storage. This is separate from iPhone/Windows local storage. Use the in-game **Save & Load → Export / Import** functions to transfer lives. Clearing the browser's site data or using private browsing can remove locally stored saves.

The website does not need any environment variables, database, Apple certificates or paid Vercel add-ons.

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

## Gameplay and layout improvements (build 4)

- Age Up is the central bottom button. A new **Relationships** shortcut sits below the three main controls.
- The birthday sequence shows a full-screen purple chapter transition, old-to-new age flip, animated sparkles and a **Continue** button. Reduced-motion settings are respected.
- The Recent Events panel displays oldest-first chronologically and automatically scrolls to the most recent entry.
- Added **38 new baby, childhood and school events** to vary the youngest years.
- Each incident can appear only once per life. The game also checks the existing timeline when updating older save files, so previously encountered toy/cookie incidents remain excluded.
- Both build and TestFlight workflows run a JavaScript regression test for incident uniqueness, save migration and mobile controls.

## EverAfter quality overhaul (build 5)

- **Cinematic Chapter Reveal:** a custom purple birthday sequence, large animated year transition and three-card year recap showing the current life stage, net cash change and important stat changes.
- **Adjustable pacing:** Settings → Birthday animation → Cinematic / Quick / Off. Stored locally, independent of the life save.
- **Choices with lasting consequences:** 10 follow-up story arcs tie decisions from childhood, school, friendships and projects to later events. The returning event text changes depending on the original choice.
- **Visible consequences:** life-event decisions add their actual stat, cash and grade changes to the saved timeline.
- **More readable journal:** life memories appear in age-grouped chapters, oldest to newest, with a link to the full timeline.
- **Scroll that respects the reader:** the journal keeps its position when rerendering without new events, and follows new moments when the timeline changes.
- **Event decisions redesigned:** richer cards with numbered choices and clear age/context labels.
- **Regression checks:** verify story arcs, old saves, recap calculations, age controls, chronology and animation settings before any build/upload.
- The old `everafter_life_v1` save format and its existing game systems are preserved.

## Built-in custom art assets (build 6)

The game's artwork is now made up of **187 production SVG files** inside `Everafter/Game/assets/`, not a single illustrative style-guide image. Every file is an editable, resolution-independent vector, delivered offline with the iOS app. No external website or remote asset loading.

| Folder | Contents |
|---|---|
| `assets/avatars/` | 60 character portraits, 12 character variants × 5 age stages |
| `assets/stages/` | 5 life-stage scenes: baby, child, teen, adult, elder |
| `assets/events/` | 106 individually keyed, full-scene vector event illustrations covering 96 core events plus 10 connected story arcs |
| `assets/icons/` | 15 custom navigation, stat and action icons |
| `assets/brand/` | The EverAfter SVG wordmark |

The iPhone game now displays the scene for your current age, evolves the character portrait automatically, uses the new vector buttons/stats/logo, and displays the matching full illustration in each story-event popup. The new-game avatar picker previews its art. The existing `s.avatar` identity in old saves is mapped onto the new portrait system without migrating or resetting save data.

Every GitHub Actions build checks the full artwork inventory; the TestFlight workflow also checks that essential assets were embedded into the `.app` archive before Apple upload.

## Artwork quality overhaul (build 7)

The 106 event assets have been **recomposed into distinct scenes**. Instead of a repeated central emoji with virtually identical figures, each event now has hand-authored SVG objects matched to the story (e.g. bakery scenes for cookies, an illustrated puppy, illustrated books, playground equipment, musical instruments, a computer, family scenes, graduation props and more), with environment-specific backgrounds and lighting. The 60 avatar illustrations have also been redrawn with more age-appropriate hairstyles, clothes, accessories and facial details.

A new `scripts/validate_assets.py` runs in both CI and TestFlight workflows. It checks every SVG using a real XML parser, verifies all 187 files are present and self-contained, checks individual portraits and events are unique, and prevents uploading missing or malformed artwork.

Mobile event cards give more screen space to the illustrations, while the home portrait and age-stage background are clearer. Game saves, the 12 avatar IDs, all event IDs and gameplay logic remain compatible.

## Unlimited activities with diminishing returns (build 8)

- Action points (AP) have been removed, with **unlimited actions** in each year.
- Every distinct repeatable activity has three full-strength uses per year. From the fourth onward, personal benefits progressively decline: **72% (4th), 52% (5th), 37% (6th), 27% (7th)** and so on. Aging up refreshes each activity's counter.
- Relevant gains (stats, skills, school grades, relationships, career performance, followers and payouts for actual earning activities) scale down. **Costs and negative consequences stay at full strength**. Ordinary transactions such as purchasing property, investment trades, and borrowing do not lose money or inventory due to the diminishing-returns algorithm.
- Cards show the number of full-benefit attempts remaining, or the next repeat's effectiveness.
- One-off real-life restrictions such as minimum ages and annual raise requests still exist.
- Removed action-result notifications that used to repeatedly obscure the bottom of the screen; important save/error notices appear briefly near the top.
- Existing saves are upgraded in place, and age-up begins a fresh practice year.

## Explore 1,000 things to do

**Exactly 1,000 options** in the Explore library: **976 playable activities** and **24 multi-step projects**. This release added **668 original activities** to the previous 308 without changing or deleting existing content. The 22 categories remain easy to navigate, and existing category/option IDs and save files are preserved.

- Find activities for all ages across school, friendships, sports, coding, art, music, science, small businesses, wellness, home life, travel, family and more.
- Every activity has its own title, description, age eligibility, relevant skill/stat effects and any associated cash cost; some also reward grades, reputation, followers, relationships, volunteering or earned income.
- **For You** selects a small set of age-appropriate activities from each category, while **All** and category browsing show activities **72 at a time** with a Load More button. Search always looks through the complete list of 976.
- Repeating activities follows the existing rule: first three uses per activity per year give full rewards, then returns diminish. Age-up refreshes these counters; lifetime activity histories remain saved.
- The 24 projects still have multi-step progress and one-time completion rewards, with records saved across years.
- Existing `everafter_life_v1` lives gain the new catalogue automatically; no save reset, login, or external service required.
- The expanded `Everafter/Game/content/discover.js` is bundled into the website's offline cache, the iPhone app and the Windows desktop release.
- `scripts/test_discovery.cjs` verifies the exact count, ID uniqueness, playable new activities, age restrictions, search, pagination, projects and save compatibility across platform build pipelines.

## Storage

The game uses a persistent `WKWebView` data store for local save slots. It supports JSON export and import from the in-game interface. Like any app, save data could be lost when uninstalling, so export anything important beforehand.

## Safety

The game contains fictional events involving crime and other adult topics. It is a fictional simulator, not instructions for real-world harm.
