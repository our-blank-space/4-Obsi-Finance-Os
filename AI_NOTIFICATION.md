# Comprehensive Settings & Module Fix Complete

I have successfully updated the `dataReducer.ts` to include all the missing action types that were preventing various modules from saving their data or updating the state correctly.

## Summary of Fixes

1.  **Settings:** Fixed generic settings updates (`UPDATE_SETTINGS`).
2.  **Modules Enabled:** Enabled toggle persistence.
3.  **Portability:** Enabled CSV Import (`ADD_TRANSACTIONS_BULK`) and JSON Backup Restoration.
4.  **Simulation:** Enabled Scenario Simulator state updates (`SET_SCENARIOS`).
5.  **Custodial Accounts:** Enabled adding/updating accounts and transactions.
6.  **Business:** Enabled business data updates.
7.  **Trading, Assets, Lending:** Added `SET_...` actions for all major modules to ensure compatibility with existing components.

## Verification

The system should now correctly persist changes across ALL tabs and modules. Please verify by:

1.  Changing a setting.
2.  Creating a Custodial Account.
3.  Simulating a scenario.
4.  Importing a CSV (if you have one).
