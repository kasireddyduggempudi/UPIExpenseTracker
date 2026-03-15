# DKLedger — Future Improvement Roadmap

Ideas and improvements planned for future development, organized by effort level.

---

## A. Short-Term Improvements

### 1. Better validation
- Centralize form validation helpers (amount/date/category checks).
- Show inline errors below fields instead of alerts.

### 2. Better user feedback
- Add toast/snackbar style feedback for save/update/delete actions.

### 3. Better list performance
- Add memoization for row components in large month lists.

### 4. Error logging
- Add a logging utility for repository/service errors.

---

## B. Mid-Term Improvements

### 1. Repository migration support
- Add explicit DB migration versioning for schema updates.
- Prevents data loss when the SQLite schema changes between app versions.

### 2. Unit tests
- Test service rules (budget thresholds, summary filtering).
- Test repository query outputs using fixture data.

### 3. Reusable UI components
- Move repeated card/header/action UI into `src/components/`.

### 4. Better state management for larger features
- If feature complexity grows, introduce a lightweight state layer (for example Zustand or Redux Toolkit).

---

## C. Long-Term Improvements (API-Ready)

### 1. Add API repository implementation
- Create `ApiTransactionRepository.ts` implementing `ITransactionRepository`.
- Keep all screens unchanged by swapping the active repository in the service layer.

### 2. Sync strategy
- Define local-first and sync conflict resolution rules.
- Add last-updated metadata and a sync queue if needed.

### 3. Authentication and user data isolation
- Add an auth layer and user-scoped storage.

---

## See Also

- [ARCHITECTURE.md](ARCHITECTURE.md) — current project structure
- [CONTRIBUTING.md](CONTRIBUTING.md) — how to safely make changes
