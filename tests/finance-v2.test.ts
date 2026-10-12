import {describe,expect,it} from "vitest";
import {balanceFor,calculateZakat,categorySpend,monthReport,monthlySeries,portfolioCost,portfolioValue,remainingDebt,taxEstimate,totalFlow} from "../lib/ledger";
import {defaultZakat} from "../lib/models";
import {makeSeed} from "../lib/seed";

describe("account ledger",()=>{
 it("treats transfers as balance-neutral at workspace level",()=>{
  const first={id:"a",workspaceId:"x",name:"Checking",kind:"checking" as const,openingBalance:2000};
  const second={...first,id:"b",name:"Savings",openingBalance:0};
  const transactions=[{id:"1",workspaceId:"x",accountId:"a",toAccountId:"b",type:"transfer" as const,amount:600,category:"Transfer",description:"Internal",date:"2026-10-01"}];
  expect(balanceFor(first,transactions)).toBe(1400);
  expect(balanceFor(second,transactions)).toBe(600);
  expect(totalFlow(transactions,"income")).toBe(0);
  expect(totalFlow(transactions,"expense")).toBe(0);
 });
 it("counts debt repayment against account balance but not expense totals",()=>{
  const account={id:"a",workspaceId:"x",name:"Checking",kind:"checking" as const,openingBalance:3000};
  const transactions=[{id:"1",workspaceId:"x",accountId:"a",type:"debt_out" as const,amount:500,category:"Debt repayment",description:"Repay",date:"2026-10-01"}];
  expect(balanceFor(account,transactions)).toBe(2500);
  expect(totalFlow(transactions,"expense")).toBe(0);
 });
 it("restricts monthly totals",()=>{
  const data=makeSeed(new Date("2026-10-15"));
  expect(totalFlow(data.transactions.filter(x=>x.workspaceId==="demo-personal"),"income","2026-10")).toBe(12100);
  expect(categorySpend(data.transactions,"2026-10").length).toBeGreaterThan(2);
  expect(monthlySeries(data.transactions,3,new Date("2026-10-10")).map(x=>x.key)).toEqual(["2026-08","2026-09","2026-10"]);
 });
});

describe("tax and portfolio math",()=>{
 it("uses a user-configurable revenue rate",()=>{
  const data=makeSeed(new Date("2026-10-15")),ws={...data.workspaces[1],taxRate:1.5,taxBasis:"revenue" as const};
  const transactions=[{id:"1",workspaceId:ws.id,accountId:"x",type:"income" as const,amount:100000,category:"Services",description:"Invoice",date:"2026-10-15"},
  {id:"2",workspaceId:ws.id,accountId:"x",type:"expense" as const,amount:25000,category:"Overheads",description:"Supplies",date:"2026-10-20"}];
  expect(taxEstimate(ws,transactions,"2026").estimate).toBe(1500);
  expect(taxEstimate({...ws,taxBasis:"profit"},transactions,"2026").estimate).toBe(1125);
 });
 it("values investments at manually entered prices",()=>{
  const i={id:"1",workspaceId:"w",name:"Fund",symbol:"ETF",units:3,costPerUnit:100,pricePerUnit:120,assetClass:"funds" as const};
  expect(portfolioCost([i])).toBe(300);
  expect(portfolioValue([i])).toBe(360);
 });
 it("caps paid-off debts at zero",()=>{
  expect(remainingDebt([{id:"a",workspaceId:"w",name:"Loan",direction:"owe",principal:150,paid:150}],"owe")).toBe(0);
 });
});

describe("nisab and hawl",()=>{
 it("uses entered metal prices, net assets and 2.5% after a full approximate lunar year",()=>{
  const config={...defaultZakat(),basis:"gold" as const,goldPricePerGram:800,haulStart:"2024-01-01"};
  const r=calculateZakat(config,100000,0,new Date("2026-10-12T00:00:00Z"));
  expect(r.nisab).toBe(68000);expect(r.meetsNisab).toBe(true);
  expect(r.eligible).toBe(true);expect(r.potentialZakat).toBe(2500);
 });
 it("does not claim eligibility when price is not entered",()=>{
  const r=calculateZakat(defaultZakat(),999999,0,new Date("2026-10-12"));
  expect(r.nisab).toBe(0);expect(r.eligible).toBe(false);expect(r.potentialZakat).toBe(0);
 });
 it("handles an unfinished hawl",()=>{
  const cfg={...defaultZakat(),basis:"silver" as const,silverPricePerGram:15,haulStart:"2026-09-01"};
  const r=calculateZakat(cfg,30000,0,new Date("2026-10-12"));
  expect(r.nisab).toBe(8925);expect(r.meetsNisab).toBe(true);
  expect(r.eligible).toBe(false);expect(r.daysToDue).toBeGreaterThan(0);
 });
});

describe("reports and demo fixtures",()=>{
 it("isolates transactions by workspace",()=>{
  const d=makeSeed(new Date("2026-10-15"));
  const m=monthReport(d,"demo-personal","2026-10");
  expect(m.income).toBeGreaterThan(0);
  expect(monthReport(d,"demo-company","2026-10").income).toBe(0);
 });
});
