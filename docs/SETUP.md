# DKLedger — Local Setup Requirements

If you are new to React Native, install these tools first before running the project.

---

## Required Tools

### 1. Node.js (LTS)
- Use Node 18+ (project requires `>=18`).
- Download from: https://nodejs.org/

### 2. Java JDK
- JDK 17 is recommended for the current Android Gradle setup.
- Download from: https://adoptium.net/

### 3. Android Studio
- Install Android SDK and SDK Platform 34.
- Install Android Build-Tools 34.x.
- Install Android Platform-Tools (provides `adb`).
- Optional: create an emulator (Pixel API 34).
- Download from: https://developer.android.com/studio

### 4. Watchman (macOS recommended)
- Helps Metro file watching performance.
- Install via Homebrew: `brew install watchman`

### 5. Git
- For source control and collaboration.
- Download from: https://git-scm.com/

---

## Verify Basic Environment

Run these commands from your terminal to confirm installations:

```bash
node -v
npm -v
java -version
adb --version
```

---

## Install Project Dependencies

From the project root directory:

```bash
npm install
npm run postinstall
```

These two commands must both pass without errors before running the app.

---

## Environment Variables / SDK Path

Android Studio requires `ANDROID_HOME` to be set.

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Then reload: `source ~/.zshrc`

---

## See Also

- [TESTING.md](TESTING.md) — how to run and test the app locally
- [RELEASE.md](RELEASE.md) — versioning and Play Store publishing
