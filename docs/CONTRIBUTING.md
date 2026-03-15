# DKLedger — Contributing & Safe Change Guide

Guidelines for making changes safely and keeping the project healthy.

---

## Safe Change Checklist

Run these steps before committing any feature change:

### 1. Type check
```bash
npx tsc --noEmit
```
Must pass with no errors.

### 2. Lint
```bash
npm run lint
```
Fix all warnings and errors.

### 3. Verify critical app flows manually

Test these in the app after your change:
- Add expense
- Edit expense
- Delete expense
- Dashboard summary and budget
- History monthly/yearly lists
- Month detail totals and category splits

### 4. If you changed any npm dependencies
- Run `npm install` and confirm it completes.
- Run `npm run postinstall` and confirm it passes.
- Check `babel.config.js` plugins still match installed packages.

---

## Notes About Current Codebase State

### Removed packages
The following packages were removed as part of cleanup (no longer needed):
- `react-native-upi-payment`
- `react-native-vision-camera`
- `react-native-worklets-core`

Their related files were also removed:
- `patches/react-native-upi-payment+1.0.5.patch` — deleted
- `src/types/react-native-upi-payment.d.ts` — deleted

### Removed Android permissions
From `android/app/src/main/AndroidManifest.xml`:
- `android.permission.CAMERA` — removed
- `<queries>` UPI scheme block — removed

Only `android.permission.INTERNET` remains.

### Babel plugin alignment
`babel.config.js` now only contains:
```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-reanimated/plugin'],
};
```

If CI ever fails with a missing Babel plugin error, first check that every entry in `plugins` matches a package that is actually installed in `package.json`.

---

## Coding Conventions

- Screens call service methods — never SQLite directly.
- Service calls repository methods — never SQLite directly.
- New data operations go in `ITransactionRepository.ts` (interface) first, then implement in `SqliteTransactionRepository.ts`.
- Keep TypeScript strict. Run `npx tsc --noEmit` after every change.
- Keep route params typed in `src/navigation/types.ts`.

---

## See Also

- [ARCHITECTURE.md](ARCHITECTURE.md) — project structure overview
- [TESTING.md](TESTING.md) — how to test locally
- [ROADMAP.md](ROADMAP.md) — planned future improvements
