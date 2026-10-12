# Finora — Financial Command Center

Finora is a responsive, local-first finance tracker with separate **personal, independent / auto-entrepreneur and company workspaces**.


## Beginner guide / product tour

Once you've chosen to sign in, use demo, or work locally, Finora offers a small dismissible **"New here?"** invitation. **Show me around** launches an 11-step tour of workspaces, dashboard, transactions, accounts, planning, investments, reports, Zakat and storage. Each step uses plain-language explanations and highlights the real control on the current screen. **Next**, **Back**, **Skip tour** and **Finish** are available; **Escape** closes it. Use the floating **Help & tour** button to replay it.

The guide is not an accounting assistant and does **not** create, edit, or upload financial records. It changes only the visible page and mobile menu during explanations. The invitation is remembered per browser and per signed-in user; no tour preferences are stored in your financial snapshots. It never interrupts the marketing site, login or initial workspace creation screens.

## Consistent form design and feedback

Finora uses the same modern, keyboard-accessible dropdowns for workspace switching, account selection, categories, finance types, currencies and Zakat preferences. Lists open in a viewport-aware overlay, support arrow keys, Enter, Escape, Home/End, and offer in-menu search for longer collections. The visual style follows light/dark themes and works on mobile.

Forms use browser constraint validation with branded error notifications and error outlines, rather than browser alert boxes. A shared toast system displays successful saves and errors. Potentially destructive operations (deleting transactions, resetting data, restoring backups) use explicit, keyboard-accessible confirmation dialogs. Numeric edits such as investment prices, savings progress and debt repayments use validated in-app number dialogs.

These controls do not alter financial calculations or storage behavior. Back up your records before any destructive data operation.

## Subscription manager and premium reports

Open **Subscriptions** from the workspace sidebar to manage individual services (mobile plans, internet, AI coding tools, SaaS, streaming, cloud services and more). Each record captures a service name, exact provider and plan, category, amount in its original billing currency, optional manually entered conversion rate to the workspace currency, billing cycle, next renewal date, payment account, current status, whether it auto-renews, provider website and notes. Users can edit/remove plans or manually **Record payment** when due. Upcoming payments are **forecasts only**: adding a subscription does not create an expense or charge a bank. The monthly and annual commitment numbers are estimates and exclude paused/cancelled subscriptions. No real provider billing API or automatic charging is configured.

Subscription information is included in Finora's local/cloud/hybrid financial snapshot and JSON backups. Existing backups that don't have subscriptions remain compatible and load with an empty subscription collection; nothing is deleted or reset during this update. A manual payment adds a normal transaction and advances the renewal date.

**Reports → Export PDF** now generates a branded, multi-page statement with an executive summary, category and balance tables, a transaction register, subscription commitments, contrasting row stripes, clear total alignment and page numbers. Subscription commitments appear separately as **planned, unbooked spending** to avoid misleading expense totals. PDF values are user-entered and not audited.

## User journeys

- **/** — public marketing homepage with product features, workspace examples, privacy details and clear calls to action.
- **/signup** — create a user account using Google OAuth or email/password.
- **/login** — sign in using Google or email/password; includes a password reset request.
- **/auth/callback** — exchanges OAuth and email confirmation PKCE codes; then sends users to **/app**.
- **/reset-password** — set a new password using a verified recovery session.
- **/app** — financial dashboard (requires sign-in, or an explicit browser-local or demo choice).
- **/app?mode=local** — opt into browser-local storage without an account.
- **/app?demo=1** — explicitly explore sample finances.

First visits to the application are guided toward an **empty** personal, auto-entrepreneur or company workspace. The sample workspace stays separate and remains opt-in. Existing financial snapshots are never automatically deleted by onboarding.

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
- **Storage:** Choose browser-local, cloud-only, or hybrid. Google OAuth via Supabase Auth; per-user Row Level Security and version-checked snapshots. Cloud requires separate configuration; sample workspaces remain clearly marked.
- **Design:** Purpose-built responsive UI, Manrope variable font, light/dark themes, polished platform scrollbars and an interactive sidebar scroll cue.

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

Open http://localhost:3000 for the public landing page. Use **Get started** or **Sign in** for an account, **Continue locally** without one, or **Explore demo** to view fictitious data. After choosing your mode, use the app at `/app`.

Quality commands:

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

## Enabling Google login and optional database storage

Local tracking requires **zero credentials**. For cloud or hybrid, configure a dedicated Supabase project (Google sign-in is implemented through **Supabase Auth's OAuth PKCE flow**, unlike Rolevia's Auth.js/Prisma setup, so Postgres RLS can enforce access with auth.uid()).

1. Create a Supabase project and run **`supabase/schema.sql` first**, then **`supabase/sync-migration.sql`** in the Supabase SQL Editor. The second migration adds revision-based optimistic concurrency and revokes direct finance table writes. **Check existing clients before applying to an existing database**; this is intended for a dedicated Finora project.
2. Supabase → **Authentication → Providers → Google**: enable Google. Create OAuth client credentials in Google Cloud Console, and supply the credentials **inside Supabase**, not in Finora's repository.
3. In Google Cloud's OAuth application add the **authorized redirect URI** `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback` (copy the exact URI shown by Supabase).
4. Supabase → Authentication → URL Configuration: set Site URL `https://finora-nine-self.vercel.app`, and add allowed redirect URLs `https://finora-nine-self.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`. Include the exact preview domain only if you want to test OAuth on previews.
5. **Email/password sign-up:** Supabase → Authentication → Providers → Email should be enabled. Use Supabase's email-confirmation defaults and configure a production SMTP provider and email templates before launching publicly. Add the redirect URL `https://finora-nine-self.vercel.app/auth/callback?flow=recovery` for password resets (and `http://localhost:3000/auth/callback?flow=recovery` if testing locally). The Auth callback uses a verified Supabase session before redirecting to reset-password.
6. Vercel Finora → Settings → Environment Variables: add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the **public publishable/anon** key, **never** service_role). Add them for production and desired preview environments. Redeploy. Locally, create a **git-ignored** `.env.local` from `.env.example`.
7. Open **Storage** in Finora, sign in with Google, select **Cloud** or **Both** and verify Sync health. It does not automatically upload existing local records on sign-in; you must opt into a cloud mode explicitly.

### Storage modes and safety

| Choice | Finances saved on this device | In Supabase | Needs Google login | Offline behavior |
| --- | --- | --- | --- | --- |
| This browser | Yes, browser localStorage | No | No | Works offline after loading |
| Cloud only | No financial localStorage snapshot after successful switch | Yes | Yes | Changes cannot be guaranteed without connectivity |
| Both | Yes, browser localStorage | Yes | Yes | Local changes remain saved, sync on reconnect / manual retry |

Storage mode is remembered **per browser**. Cloud data is tied to the signed-in Supabase user, using authenticated Row Level Security. The database function requires an expected revision; conflicting cloud edits are **not** overwritten silently. Instead, Finora offers a full-snapshot **choose local / choose cloud** dialog and lets you download both JSON versions beforehand. There is **no automatic record-level merge** or real-time multi-user workspace sharing yet.

**Critical:** browser localStorage is not a folder on your hard drive; deleting browser data or using private mode can delete records. Export JSON backups regularly. Cloud-only mode must be online to reliably save edits; a failed request is visibly reported, and refreshing before a successful sync may lose pending changes.

**Google sign-in and email/password require correctly configured Supabase Auth / Vercel variables and redirects.** This repo contains no OAuth client secret, bank tokens, or privileged API keys.

## Calculations and important limitations

### Accounts, income, profits and investments

Balances = opening balances + recorded inflows − recorded outflows ± internal transfers. No bank accounts are connected. Salary targets are *not* recorded earnings until manually posted. Investment price fields are manual and no return history is sourced. Do not record the same asset as both an account balance and a portfolio position.

### Taxes

Finora does not fetch tax legislation, brackets or official rates, and does not file returns. The illustrative tax figure is **entered percentage × [gross recorded annual revenue or max(0, recorded annual income − recorded annual expense)]**. This is not a Moroccan DGI/IR/IS/TVA, payroll or auto-entrepreneur computation and is not a legally complete tax calculator. Consult authoritative filings / an accountant, and configure a tax rate appropriate to your circumstances. A zero configured rate means **not configured**, not "nothing owed".

### Zakat

The nisab is **85 grams of gold** or **595 grams of silver**, each multiplied by a **manually entered** per-gram price. Some authorities instead use **87.48g / 612.36g**, and scholarly interpretation of included assets and deductible debts can vary. The 2.5% illustration applies to positive net zakatable wealth when the entered nisab is met; its assessment due date is calculated as entered haul start + **approximately 354 days**. You must establish when the nisab was initially met and verify the precise religious date yourself. Browser alerts are in-page/foreground only; there is no scheduled backend push notification.

Useful references: [Islamic Relief (Zakat calculator)](https://islamic-relief.org/zakat-calculator/) and [Islamic Relief Australia (nisab conventions)](https://islamicrelief.org.au/our-work/islamic-giving/zakat/zakat-calculator/).

## Data and security

This is a finance-tracking MVP, not an audited accounting system. Local records are **not encrypted on disk**, and cloud records are protected by authenticated Postgres RLS and TLS transport but are not end-to-end encrypted. Browser code is never given server service-role credentials. Backups may contain sensitive data—store them securely. Google OAuth sign-in is separate from any Google Drive access: no Drive permissions are requested.

Only select a cloud mode after the provider, database, and OAuth redirects have been configured and verified. Keep local and remote backups before switching or restoring. Sign out of shared devices; hybrid mode intentionally retains its local copy unless explicitly cleared.

## Roadmap

- Production hardening: browser-level integration and security tests, conflict-free per-record sync, encrypted local persistence and scheduled cloud backups.
- Verified tax modules per jurisdiction and tax year (Moroccan employee, auto-entrepreneur, and corporate profiles), VAT/TVA and accountant export.
- Bank import/reconciliation, multi-currency conversion with sourced exchange rates, receipt management and audit logs.
- Server-side scheduled reminders, recurring transactions with clear approval, real investment feeds and asset-specific zakat treatment.
- Accessibility, end-to-end tests and security review before production financial use.

## License

MIT.
