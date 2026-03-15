# DKLedger — Project Documentation Index

This folder contains separate guides for each topic. Start here to find what you need.

---

## Guides

| File | What it covers |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Project purpose, layered architecture, folder structure, data flow, where to change what |
| [SETUP.md](SETUP.md) | Required installations, environment setup, installing dependencies |
| [TESTING.md](TESTING.md) | Health checks, running debug build, manual test checklist, release build check |
| [RELEASE.md](RELEASE.md) | Versioning strategy, keystore setup, Play Store publishing steps |
| [ROADMAP.md](ROADMAP.md) | Short/mid/long-term future improvements |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Safe change checklist, coding conventions, codebase cleanup notes |

---

## Quick Start

New to the project? Follow this order:

1. Read [ARCHITECTURE.md](ARCHITECTURE.md) to understand how the app is structured.
2. Follow [SETUP.md](SETUP.md) to install all required tools.
3. Follow [TESTING.md](TESTING.md) to run the app on your device or emulator.
4. Read [CONTRIBUTING.md](CONTRIBUTING.md) before making any changes.
5. When ready to publish, follow [RELEASE.md](RELEASE.md).

---

## Tech Stack Summary

- React Native 0.74.3 (Android-only)
- TypeScript 5.0.4
- SQLite via `react-native-sqlite-storage`
- Navigation via `@react-navigation/native-stack`
- Hermes JS engine
- compileSdk 34, minSdk 23

---

*Detailed content for each topic has been moved to its own file above. This file serves as the index only.*
