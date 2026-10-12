import { describe, expect, it } from "vitest";
import { outstandingAmount, totalByType } from "../lib/finance-math";

describe("financial totals", () => {
  const entries = [
    { type: "income" as const, amount: 3000, date: "2026-10-10" },
    { type: "expense" as const, amount: 100, date: "2026-10-10" },
    { type: "income" as const, amount: 1500, date: "2026-09-25" },
    { type: "expense" as const, amount: 200, date: "2026-09-25" },
  ];
  it("sums income without counting expenses", () => {
    expect(totalByType(entries, "income")).toBe(4500);
  });
  it("filters records by year and month", () => {
    expect(totalByType(entries, "expense", "2026-10")).toBe(100);
  });
  it("returns zero for empty datasets", () => {
    expect(totalByType([], "income")).toBe(0);
  });
});

describe("debt progress", () => {
  it("counts only outstanding debts in the selected direction", () => {
    const debts = [
      { direction: "owe" as const, amount: 2000, paid: 500 },
      { direction: "owed" as const, amount: 800, paid: 200 },
    ];
    expect(outstandingAmount(debts, "owe")).toBe(1500);
    expect(outstandingAmount(debts, "owed")).toBe(600);
  });
  it("never counts excess repayments as negative debt", () => {
    expect(outstandingAmount([{ direction: "owe", amount: 50, paid: 100 }], "owe")).toBe(0);
  });
});
