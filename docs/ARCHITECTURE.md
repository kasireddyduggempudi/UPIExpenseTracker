# DKLedger — Architecture & Project Structure

## 1. Project Purpose

DKLedger is a local-first expense tracker built with React Native.

Current behavior:
- Add, edit, and delete expense items.
- Dashboard for current month summary and budget.
- History view for monthly and yearly summaries.
- Month detail view for transaction-level actions.
- Data stored locally using SQLite.

---

## 2. High-Level Architecture

The app uses a layered structure:

1. Screens (UI layer)
- Lives in `src/screens/`
- Handles user interaction and display.
- Calls service methods, not SQLite directly.

2. Service layer (business logic)
- `src/services/transactionService.ts`
- Provides app use-cases such as add/update/delete expense, summary loading, and budget alert evaluation.
- Uses one active repository implementation.

3. Repository layer (data access abstraction)
- Contract: `src/repositories/ITransactionRepository.ts`
- Concrete implementation: `src/repositories/SqliteTransactionRepository.ts`
- Keeps storage details isolated.

4. Models and utilities
- Models in `src/models/`
- Shared helpers/constants in `src/utils/`

This separation is important: UI should stay independent from database details.

---

## 3. Folder Guide

Root important folders/files:

- `App.tsx`
  - App entry point, theme, navigation container.

- `src/navigation/`
  - `AppNavigator.tsx`: screen registration and startup initialization.
  - `types.ts`: strongly typed route params.

- `src/screens/`
  - `DashboardScreen.tsx`: current month summary and budget controls.
  - `HistoryScreen.tsx`: monthly/yearly summary list.
  - `MonthDetailScreen.tsx`: item-level transaction list, edit/delete.
  - `AddExpenseScreen.tsx`: add and edit expense form.

- `src/services/transactionService.ts`
  - Main API used by screens.

- `src/repositories/`
  - `ITransactionRepository.ts`: data contract.
  - `SqliteTransactionRepository.ts`: SQLite implementation.

- `android/`
  - Native Android project, manifest, Gradle configs, app icons.

---

## 4. Data Flow Example (Add Expense)

1. User enters details in `AddExpenseScreen`.
2. Screen calls `addExpense(...)` in service.
3. Service delegates to active repository.
4. SQLite repository writes to local DB.
5. Service evaluates budget threshold and returns status.
6. UI shows alerts and navigates.

Same idea for edit/delete and summary loading.

---

## 5. Where To Change What

If you need to...

- Change UI layout/text/colors:
  - Update files in `src/screens/`.

- Add a new app feature rule (for example recurring expense logic):
  - Add logic in `transactionService.ts`.
  - Add data methods to repository interface if needed.

- Change storage schema/query behavior:
  - Update `SqliteTransactionRepository.ts`.
  - Keep `ITransactionRepository.ts` contract in sync.

- Add a new screen:
  - Create screen in `src/screens/`.
  - Add route type in `src/navigation/types.ts`.
  - Register in `src/navigation/AppNavigator.tsx`.
