import {afterEach,describe,expect,it} from "vitest";
import {makeSeed} from "../lib/seed";
import {parseSnapshot,useFinance,getFinoraSnapshot} from "../lib/finance-store";
import {advanceRenewalAfter,isDate,isSafeProviderWebsite,monthlyEquivalent,subscriptionMetrics} from "../lib/subscriptions";

afterEach(()=>useFinance.getState().reset());

describe("subscription billing calculations",()=>{
 it("normalizes different billing periods without pretending to convert currency",()=>{
  expect(monthlyEquivalent(120,"monthly")).toBe(120);
  expect(monthlyEquivalent(120,"quarterly")).toBe(40);
  expect(monthlyEquivalent(120,"yearly")).toBe(10);
  expect(monthlyEquivalent(12,"weekly")).toBe(52);
 });
 it("handles month ends, annual leap day and overdue renewals",()=>{
  expect(advanceRenewalAfter("2026-01-31","monthly","2026-01-31")).toBe("2026-02-28");
  expect(advanceRenewalAfter("2024-02-29","yearly","2024-02-29")).toBe("2025-02-28");
  expect(advanceRenewalAfter("2026-01-01","monthly","2026-04-03")>"2026-04-03").toBe(true);
 });
 it("rejects malformed billing dates and unsafe website protocols",()=>{
  expect(isDate("2026-02-30")).toBe(false);
  expect(isDate("2026-10-15")).toBe(true);
  expect(isSafeProviderWebsite("javascript:alert(1)")).toBe(false);
  expect(isSafeProviderWebsite("https://provider.example/plan")).toBe(true);
 });
});
describe("backward compatible subscriptions",()=>{
 it("restores existing finance snapshots without a subscriptions property",()=>{
  const old={...makeSeed()} as Record<string,unknown>;
  delete old.subscriptions;
  expect(parseSnapshot(old)?.subscriptions).toEqual([]);
 });
 it("stores detailed plans without posting an expense in advance",()=>{
  const state=useFinance.getState();
  const account=state.accounts[0];
  const before=state.transactions.length;
  state.addSubscription({workspaceId:account.workspaceId,accountId:account.id,
   name:"Claude Code",provider:"Anthropic",plan:"Pro",category:"ai_tools",
   amount:200,currency:"MAD",conversionRate:1,cycle:"monthly",nextRenewal:"2026-10-01",status:"active",
   autoRenew:true,website:"https://example.com",notes:"Coding assistant"});
  const snapshot=getFinoraSnapshot();
  expect(snapshot.subscriptions[0]).toMatchObject({provider:"Anthropic",plan:"Pro",category:"ai_tools",amount:200});
  expect(snapshot.transactions).toHaveLength(before);
  expect(parseSnapshot(snapshot)?.subscriptions).toHaveLength(1);
 });
 it("books a due payment once and moves the renewal forward",()=>{
  const state=useFinance.getState(),account=state.accounts[0];
  state.addSubscription({workspaceId:account.workspaceId,accountId:account.id,name:"Home internet",
   provider:"Provider",plan:"Fiber",category:"internet",amount:300,currency:"MAD",conversionRate:1,cycle:"monthly",
   nextRenewal:"2026-01-01",status:"active",autoRenew:true,website:"",notes:""});
  const before=useFinance.getState().transactions.length;
  const id=useFinance.getState().subscriptions[0].id;
  expect(useFinance.getState().recordSubscriptionPayment(id,"2026-10-12")).toBe(true);
  expect(useFinance.getState().transactions).toHaveLength(before+1);
  expect(useFinance.getState().subscriptions[0].nextRenewal>"2026-10-12").toBe(true);
  expect(useFinance.getState().recordSubscriptionPayment(id,"2026-10-12")).toBe(false);
  expect(useFinance.getState().transactions).toHaveLength(before+1);
 });
 it("excludes paused and cancelled plans from subscription commitments",()=>{
  const seed=makeSeed();
  const sub=(status:"active"|"paused")=>({
   id:status,workspaceId:seed.activeId,accountId:seed.accounts[0].id,name:"A",
   provider:"A",plan:"B",amount:120,currency:"MAD",conversionRate:1,cycle:"monthly" as const,category:"software" as const,
   nextRenewal:"2026-10-01",status,autoRenew:true,website:"",notes:""
  });
  expect(subscriptionMetrics([sub("active"),sub("paused")]).monthlyCost).toBe(120);
 });
});
