# DKLedger — Versioning & Play Store Publishing

---

## 1. Versioning (What To Update Before Each Release)

Android app version is controlled in `android/app/build.gradle` under `defaultConfig`:

- `versionCode` — integer, must always increase for every Play Store upload.
- `versionName` — user-facing string, for example `1.2.0`.

### Recommended version strategy

Use semantic versioning format for `versionName`: `MAJOR.MINOR.PATCH`

| Type | When to use | Example |
|---|---|---|
| PATCH | Bug fixes only | `1.0.0` → `1.0.1` |
| MINOR | New feature, backward-compatible | `1.0.1` → `1.1.0` |
| MAJOR | Breaking changes | `1.1.0` → `2.0.0` |

### For every release

1. Increase `versionCode` by at least 1.
2. Update `versionName` to match release scope.
3. Commit version changes with a clear release note.

---

## 2. How To Publish To Google Play Store

### A. Create upload keystore (one-time only)

Run this command once and store the output file safely:

```bash
keytool -genkeypair \
  -v \
  -storetype PKCS12 \
  -keystore android/app/upload-keystore.jks \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

> Keep `upload-keystore.jks` and its passwords safe. If you lose them, you cannot update the app on Play Store.

> Do NOT commit the keystore file to git. Add it to `.gitignore`.

---

### B. Add signing secrets (local only)

Add these lines to `android/gradle.properties`:

```
MYAPP_UPLOAD_STORE_FILE=upload-keystore.jks
MYAPP_UPLOAD_KEY_ALIAS=upload
MYAPP_UPLOAD_STORE_PASSWORD=your_store_password_here
MYAPP_UPLOAD_KEY_PASSWORD=your_key_password_here
```

> Do NOT commit real passwords to git.

---

### C. Configure release signing in Gradle

Update `android/app/build.gradle` to add a release signing config:

```groovy
android {
    signingConfigs {
        release {
            storeFile file(MYAPP_UPLOAD_STORE_FILE)
            storePassword MYAPP_UPLOAD_STORE_PASSWORD
            keyAlias MYAPP_UPLOAD_KEY_ALIAS
            keyPassword MYAPP_UPLOAD_KEY_PASSWORD
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release  // replace signingConfigs.debug
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}
```

---

### D. Build the release artifact (AAB)

```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

Output file will be at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

### E. Upload to Google Play Console

1. Open [Google Play Console](https://play.google.com/console).
2. Create a new app (first time) or open your existing app.
3. Go to **Release > Production** (or **Internal testing** first).
4. Upload `app-release.aab`.
5. Add release notes.
6. Complete required Play forms (Data safety, content rating, etc.).
7. Roll out the release.

---

### F. Recommended release track order

Start small to catch issues before reaching all users:

1. Internal testing track.
2. Closed testing track.
3. Open testing (optional).
4. Production rollout.

---

## See Also

- [TESTING.md](TESTING.md) — verify the app before releasing
- [CONTRIBUTING.md](CONTRIBUTING.md) — safe change checklist
