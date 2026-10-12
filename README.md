# Finora 💸

Personal finance management starter app using **Next.js 16, React 19, TypeScript and Tailwind CSS 4**.

## Current GitHub version

The current published starter includes a responsive overview with balance, monthly income, expenses, transaction management, debt tracking and repayment progress, and local JSON backup/restore. **This repository is an initial subset of the complete 34-file prototype archive**, not the entire full-feature prototype. Additional project components (analytics charts, budgeting views, recurring bills, savings goals, account wallets, authentication, persistence helpers, and tests) are still available in the original archive but have **not** been integrated into this GitHub version. The Supabase schema and environment template are included for future integration, but cloud authentication is **not connected** to this starter yet.

No real banking connectivity or payment execution is implemented. Money figures are user-entered and browser-local; they are not bank balances. Debt repayments currently update debt progress only and do not adjust cash-flow totals automatically.

## Run

Requires Node.js 20.9+ and npm.

```sh
npm install
npm run dev
```

Visit http://localhost:3000. The app starts empty, in MAD currency. Records persist in this browser's localStorage. Use Settings to back up the data before clearing browser storage.

## Commands

```sh
npm run dev
npm run build
npm run lint
npm run typecheck
```

CI is configured to run checks but a full successful build has not been verified.

## Future work

Import the remaining screens from the prototype archive, add unit and end-to-end tests, complete Supabase login and authenticated persistence, normalized money ledger and account transfers, and harden before holding sensitive data.

## License

MIT.
