# DKLedger — How To Test Locally

This guide covers how to verify the app is working correctly during development.

---

## A. Quick Health Checks

Run these before every commit:

### Type check
```bash
npx tsc --noEmit
```
Must exit with no errors.

### Lint
```bash
npm run lint
```
Fix any warnings or errors before committing.

### Metro bundle sanity check (release-style JS bundle)
```bash
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output /tmp/index.android.bundle \
  --assets-dest /tmp/rn-assets
```
This catches import errors that TypeScript alone may not catch.

---

## B. Run on Android (Debug)

### Step 1 — Start Metro bundler
Open a terminal and run:
```bash
npm start
```
Leave this running. Metro serves the JS bundle to the app.

### Step 2 — Run app on device or emulator
Open a second terminal and run:
```bash
npm run android
```
This builds the native Android debug APK and installs it.

> If using a physical device: enable USB debugging in Android settings and connect via USB.

---

## C. Day-to-Day Development Loop

| Action | Command |
|---|---|
| Reload JS bundle | Press `r` in Metro terminal, or shake device |
| Clear Metro cache | `npm start -- --reset-cache` |
| View device logs | `adb logcat` or `adb logcat -s ReactNative ReactNativeJS` |
| Forward Metro port | `adb reverse tcp:8081 tcp:8081` (needed if Metro isn't connecting) |
| List connected devices | `adb devices` |
| Open emulator | Android Studio → Device Manager → Start |

---

## D. Manual Functional Checklist

Verify these flows work correctly in the app after any change:

1. Add a new expense.
2. Edit an existing expense.
3. Delete an expense.
4. Dashboard current month summary updates correctly.
5. Budget save, edit, clear, and threshold alerts work.
6. History shows only months/years that have data.
7. Month detail totals and category splits are correct.

---

## E. Android Release Build Check

Use this to verify the production build compiles without errors:

```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

> Note: the current project release build is still wired to debug signing in `android/app/build.gradle`. This is fine for local verification. See [RELEASE.md](RELEASE.md) to configure proper signing before publishing.

---

## See Also

- [SETUP.md](SETUP.md) — installation requirements
- [CONTRIBUTING.md](CONTRIBUTING.md) — safe change checklist before committing
- [RELEASE.md](RELEASE.md) — versioning and Play Store publishing
