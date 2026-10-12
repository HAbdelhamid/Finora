"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { z } from "zod";
import { makeSeed } from "./seed";
import { defaultZakat, uid } from "./models";
import type { Account, Budget, Debt, FinoraData, Goal, Investment, RecurringRule, Transaction, Workspace, WorkspaceKind } from "./models";
import { isPositive } from "./ledger";

type Snapshot=FinoraData;
interface FinanceStore extends FinoraData {
 select:(id:string)=>void;
 addWorkspace:(name:string,kind:WorkspaceKind)=>void;
 updateWorkspace:(id:string,patch:Partial<Workspace>)=>void;
 addAccount:(v:Omit<Account,"id">)=>void;
 addTransaction:(v:Omit<Transaction,"id">)=>void;
 removeTransaction:(id:string)=>void;
 upsertBudget:(v:Omit<Budget,"id">)=>void;
 removeBudget:(id:string)=>void;
 addGoal:(v:Omit<Goal,"id">)=>void;
 updateGoal:(id:string,saved:number)=>void;
 addInvestment:(v:Omit<Investment,"id">)=>void;
 updateInvestment:(id:string,patch:Partial<Investment>)=>void;
 removeInvestment:(id:string)=>void;
 addDebt:(v:Omit<Debt,"id">)=>void;
 repayDebt:(id:string,amount:number,accountId:string)=>boolean;
 addRecurring:(v:Omit<RecurringRule,"id">)=>void;
 removeRecurring:(id:string)=>void;
 restore:(snapshot:Snapshot)=>void;
 reset:()=>void;
}

const storedSchema=z.object({
 activeId:z.string(),
 workspaces:z.array(z.object({id:z.string(),name:z.string(),kind:z.enum(["personal","freelance","company"]),currency:z.string(),country:z.string(),monthlySalary:z.number(),taxRate:z.number(),taxBasis:z.enum(["revenue","profit"]),demo:z.boolean(),zakat:z.object({
 basis:z.enum(["gold","silver"]),goldPricePerGram:z.number(),silverPricePerGram:z.number(),goldGrams:z.number(),silverGrams:z.number(),
 otherCash:z.number(),tradeInventory:z.number(),collectibleReceivables:z.number(),immediatelyDueLiabilities:z.number(),
 haulStart:z.string(),reminderDays:z.number(),includeInvestments:z.boolean()})})),
 accounts:z.array(z.object({id:z.string(),workspaceId:z.string(),name:z.string(),kind:z.enum(["checking","cash","savings"]),openingBalance:z.number()})),
 transactions:z.array(z.object({id:z.string(),workspaceId:z.string(),accountId:z.string(),toAccountId:z.string().optional(),type:z.enum(["income","expense","transfer","debt_out","debt_in"]),amount:z.number(),category:z.string(),description:z.string(),date:z.string()})),
 budgets:z.array(z.object({id:z.string(),workspaceId:z.string(),category:z.string(),limit:z.number()})),
 goals:z.array(z.object({id:z.string(),workspaceId:z.string(),name:z.string(),target:z.number(),saved:z.number(),color:z.string()})),
 investments:z.array(z.object({id:z.string(),workspaceId:z.string(),name:z.string(),symbol:z.string(),units:z.number(),costPerUnit:z.number(),pricePerUnit:z.number(),assetClass:z.enum(["stocks","funds","crypto","other"])})),
 debts:z.array(z.object({id:z.string(),workspaceId:z.string(),name:z.string(),direction:z.enum(["owe","owed"]),principal:z.number(),paid:z.number()})),
 recurring:z.array(z.object({id:z.string(),workspaceId:z.string(),accountId:z.string(),name:z.string(),type:z.enum(["income","expense"]),amount:z.number(),category:z.string(),day:z.number(),enabled:z.boolean()}))
});

export function parseSnapshot(input:unknown):FinoraData|null {
 const r=storedSchema.safeParse(input);
 return r.success&&r.data.workspaces.length>0?r.data:null;
}
const seed=makeSeed();
const data=(s:FinanceStore):FinoraData=>({activeId:s.activeId,workspaces:s.workspaces,accounts:s.accounts,transactions:s.transactions,budgets:s.budgets,goals:s.goals,investments:s.investments,debts:s.debts,recurring:s.recurring});
export const useFinance = create<FinanceStore>()(persist((set,get)=>({
 ...seed,
 select:(id)=>set(s=>s.workspaces.some(w=>w.id===id)?{activeId:id}:{}),
 addWorkspace:(name,kind)=>{const id=uid();const ws:Workspace={id,name:name.trim()||"New workspace",kind,currency:"MAD",country:"MA",monthlySalary:0,taxRate:0,taxBasis:kind==="freelance"?"revenue":"profit",demo:false,zakat:defaultZakat()};set(s=>({activeId:id,workspaces:[...s.workspaces,ws],accounts:[...s.accounts,{id:uid(),workspaceId:id,name:"Main account",kind:"checking",openingBalance:0}]}))},
 updateWorkspace:(id,patch)=>set(s=>({workspaces:s.workspaces.map(w=>w.id===id?{...w,...patch}:w)})),
 addAccount:(v)=>set(s=>({accounts:[...s.accounts,{...v,id:uid()}]})),
 addTransaction:(v)=>{if(!isPositive(v.amount))return;set(s=>({transactions:[{...v,id:uid()},...s.transactions]}))},
 removeTransaction:(id)=>set(s=>({transactions:s.transactions.filter(t=>t.id!==id)})),
 upsertBudget:(v)=>{if(!isPositive(v.limit))return;set(s=>({budgets:[...s.budgets.filter(b=>b.workspaceId!==v.workspaceId||b.category!==v.category),{...v,id:uid()}]}))},
 removeBudget:(id)=>set(s=>({budgets:s.budgets.filter(b=>b.id!==id)})),
 addGoal:(v)=>{if(!isPositive(v.target))return;set(s=>({goals:[...s.goals,{...v,id:uid()}]}))},
 updateGoal:(id,saved)=>set(s=>({goals:s.goals.map(g=>g.id===id?{...g,saved:Math.min(g.target,Math.max(0,saved))}:g)})),
 addInvestment:(v)=>set(s=>({investments:[...s.investments,{...v,id:uid()}]})),
 updateInvestment:(id,patch)=>set(s=>({investments:s.investments.map(i=>i.id===id?{...i,...patch}:i)})),
 removeInvestment:(id)=>set(s=>({investments:s.investments.filter(i=>i.id!==id)})),
 addDebt:(v)=>{if(!isPositive(v.principal))return;set(s=>({debts:[...s.debts,{...v,id:uid()}]}))},
 repayDebt:(id,amount,accountId)=>{
  const s=get();const d=s.debts.find(x=>x.id===id);const a=s.accounts.find(x=>x.id===accountId);
  if(!d||!a||a.workspaceId!==d.workspaceId||!isPositive(amount)||amount>d.principal-d.paid+0.0001)return false;
  set(st=>({debts:st.debts.map(x=>x.id===id?{...x,paid:Math.min(x.principal,x.paid+amount)}:x),transactions:[{
   id:uid(),workspaceId:d.workspaceId,accountId,type:d.direction==="owe"?"debt_out":"debt_in",amount,
   category:"Debt repayment",description:"Repayment: "+d.name,date:new Date().toISOString().slice(0,10)
  },...st.transactions]}));return true;
 },
 addRecurring:(v)=>{if(!isPositive(v.amount))return;set(s=>({recurring:[...s.recurring,{...v,id:uid()}]}))},
 removeRecurring:(id)=>set(s=>({recurring:s.recurring.filter(x=>x.id!==id)})),
 restore:(v)=>{const parsed=parseSnapshot(v);if(!parsed)throw Error("Invalid Finora backup");set(parsed)},
 reset:()=>set(makeSeed())
}),{
 name:"finora-v2",
 version:2,
 partialize:state=>data(state),
 merge:(persisted,current)=>({...current,...(parseSnapshot(persisted)??makeSeed())})
}));
