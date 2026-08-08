---
name: EAS APK builds
description: Building Android APK/AAB for the BCPL mobile app via EAS from the workspace
---
- Auth: EXPO_TOKEN secret; eas-cli reads it automatically. Account: bcplt20 (project @bcplt20/bcpl-mobile).
- Profiles in eas.json: `apk` (internal, buildType apk) and `production` (app-bundle). Both set EXPO_PUBLIC_API_URL=https://bcplt20.com.
- Kick off non-interactive: `npx eas-cli@latest build -p android --profile apk --non-interactive --no-wait`; poll with `build:list --json`.
- **Release-build crash trap**: package versions that only warn in Expo Go ("expected version" mismatches) CRASH the release APK at launch ("BCPL keeps stopping"). Run `npx expo install --check` and fix ALL mismatches before every EAS build.
- Distribution: APK uploaded to S3 `cms/app/bcpl-t20.apk`; permanent public URL = `https://bcplt20.com/api/app/apk` (302 presign redirect route). Re-upload to the same key to ship updates — link never changes.
- prod DB seed for /download button lives in deploy/sql app-download catch-up (insert-only, never clobbers admin edits).
- Play Store uploads: bump android.versionCode manually (appVersionSource local, no autoIncrement).
