# Finora — Financial Command Center

Finora v2 is a responsive, local-first finance tracker with separate **personal, independent / auto-entrepreneur and company workspaces**.

## What works

- **Dashboard:** Interactive Apache ECharts 6 cash-flow trends, spending mix and allocation; monthly income and expenses; account balances, budgets, goals and activity feed.
- **Workspace isolation:** Separate accounts, transactions, budgets, goals, liabilities and investment positions per workspace. Create as many as needed.
- **Income & expenses:** Manually post salary, business revenue, freelance income and spending. Categorize and search entries.
- **Transfers:** Account-to-account movements change balances but *never* count as new income or expenses.
- **Planning:** Monthly category budgets, savings targets (manual progress), debt repayments. Debt principal repayments affect cash balances but don't inflate spending.
- **Recurring rules:** Manual posting shortcuts for salary, retainers or regular bills. Entries are **not** automatically posted.
- **Investments:** Maintain positions, quantities, cost basis and manually updated prices. Unrealized returns are indicative, not live quotes.
- **Monthly bilan:** Period selection, category breakdown, PDF monthly statement and CSV transaction export.
- **Tax estimates:** Workspace-specific scenario builder with user-entered percentage and selectable **gross revenue** or **positive recorded profit** base.
- **Zakat planning:** Cash + entered jewellery / trade inventory / collectible receivables + optionally valued investment positions, immediate liabilities, gold or silver nisab, estimated 354-day hawl and browser alerts while the app is open.
- **Privacy:** Data kept in this browser's localStorage, with JSON backup and restore. Sample workspaces are explicitly marked.
- **Design:** Purpose-built responsive UI, Manrope variable font, light/dark themes.

## Stack

Next.js 16 (App Router), React 19, TypeScript strict mode, Tailwind CSS 4, Apache ECharts 6 + echarts-for-react, Zustand 5 with persisted workspace state, Zod 4 for backup validation, jsPDF 4, Lucide, Vitest, GitHub Actions and Vercel.

## Start locally

Node.js 22+ is recommended.

```bash
git clone https://github.com/HAbdelhamid/Finora.git
cd Finora
npm install
npm run dev
```

Open http://localhost:3000. **Sample values are fictitious.** Open Workspaces → Create another workspace to track your own data.

Quality commands:

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

## Calculations and important limitations

### Accounts, income, profits and investments

Balances = opening balances + recorded inflows − recorded outflows ± internal transfers. No bank accounts are connected. Salary targets are *not* recorded earnings until manually posted. Investment price fields are manual and no return history is sourced. Do not record the same asset as both an account balance and a portfolio position.

### Taxes

Finora does not fetch tax legislation, brackets or official rates, and does not file returns. The illustrative tax figure is **entered percentage × [gross recorded annual revenue or max(0, recorded annual income − recorded annual expense)]**. This is not a Moroccan DGI/IR/IS/TVA, payroll or auto-entrepreneur computation and is not a legally complete tax calculator. Consult authoritative filings / an accountant, and configure a tax rate appropriate to your circumstances. A zero configured rate means **not configured**, not "nothing owed".

### Zakat

The nisab is **85 grams of gold** or **595 grams of silver**, each multiplied by a **manually entered** per-gram price. Some authorities instead use **87.48g / 612.36g**, and scholarly interpretation of included assets and deductible debts can vary. The 2.5% illustration applies to positive net zakatable wealth when the entered nisab is met; its assessment due date is calculated as entered haul start + **approximately 354 days**. You must establish when the nisab was initially met and verify the precise religious date yourself. Browser alerts are in-page/foreground only; there is no scheduled backend push notification.

Useful references: [Islamic Relief (Zakat calculator)](https://islamic-relief.org/zakat-calculator/) and [Islamic Relief Australia (nisab conventions)](https://islamicrelief.org.au/our-work/islamic-giving/zakat/zakat-calculator/).

## Data and security

**This is an MVP for testing, not yet a production-grade confidential financial vault.** The app stores records in localStorage, not encrypted and not synchronized across browsers. Keep exports secure. The supplied Supabase schema is a *future* integration starting point; cloud sign-in and server persistence are not wired up. Never place production banking credentials, tax identifiers or confidential company information in a public demo.

On public Vercel deployments, visitors each see their **own browser-local data**, never your data by default.

## Roadmap

- Protected cloud accounts using Supabase Auth, Row Level Security, secure authenticated data syncing, account reconciliation and backups.
- Verified tax modules per jurisdiction and tax year (Moroccan employee, auto-entrepreneur, and corporate profiles), VAT/TVA and accountant export.
- Bank import/reconciliation, multi-currency conversion with sourced exchange rates, receipt management and audit logs.
- Server-side scheduled reminders, recurring transactions with clear approval, real investment feeds and asset-specific zakat treatment.
- Accessibility, end-to-end tests and security review before production financial use.

## License

MIT.
