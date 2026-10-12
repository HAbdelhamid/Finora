export type MoneyFlow = { type: "income" | "expense"; amount: number; date: string };
export type Loan = { direction: "owe" | "owed"; amount: number; paid: number };

export function totalByType(entries: readonly MoneyFlow[], type: MoneyFlow["type"], month?: string) {
  return entries
    .filter((entry) => entry.type === type && (!month || entry.date.startsWith(month)))
    .reduce((sum, entry) => sum + entry.amount, 0);
}

export function outstandingAmount(debts: readonly Loan[], direction: Loan["direction"]) {
  return debts
    .filter((debt) => debt.direction === direction)
    .reduce((sum, debt) => sum + Math.max(0, debt.amount - debt.paid), 0);
}
