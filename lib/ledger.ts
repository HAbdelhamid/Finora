import type { Account, Debt, FinoraData, FlowType, Investment, Transaction, Workspace, ZakatConfig } from "./models";

export const roundMoney = (n:number) => Math.round((n+Number.EPSILON)*100)/100;
export const isPositive = (n:number) => Number.isFinite(n) && n>0;

export function balanceFor(account:Account, transactions:Transaction[]):number {
 return roundMoney(account.openingBalance+transactions.filter(t=>t.accountId===account.id||t.toAccountId===account.id).reduce((sum,t)=>{
  if(t.type==="income"||t.type==="debt_in")return sum+(t.accountId===account.id?t.amount:0);
  if(t.type==="expense"||t.type==="debt_out")return sum-(t.accountId===account.id?t.amount:0);
  if(t.type==="transfer")return sum+(t.toAccountId===account.id?t.amount:0)-(t.accountId===account.id?t.amount:0);
  return sum;
 },0));
}

export const currentWorkspace = (data:FinoraData) => data.workspaces.find(w=>w.id===data.activeId)??data.workspaces[0];

export const workspaceItems = (data:FinoraData,id:string) => ({
 accounts:data.accounts.filter(x=>x.workspaceId===id),
 transactions:data.transactions.filter(x=>x.workspaceId===id),
 budgets:data.budgets.filter(x=>x.workspaceId===id),
 goals:data.goals.filter(x=>x.workspaceId===id),
 investments:data.investments.filter(x=>x.workspaceId===id),
 debts:data.debts.filter(x=>x.workspaceId===id),
 recurring:data.recurring.filter(x=>x.workspaceId===id)
});

export const totalFlow = (transactions:Transaction[],type:FlowType,month?:string) => roundMoney(transactions.reduce((sum,t)=>
 (t.type===type&&(!month||t.date.startsWith(month)))?sum+t.amount:sum,0));

export function monthlySeries(transactions:Transaction[],months=12,anchor=new Date()) {
 return Array.from({length:months},(_,i)=>{
  const d=new Date(anchor.getFullYear(),anchor.getMonth()-(months-1-i),1);
  const key=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
  return {key,label:d.toLocaleDateString("en-US",{month:"short"}),income:totalFlow(transactions,"income",key),expense:totalFlow(transactions,"expense",key)};
 });
}

export const categorySpend = (transactions:Transaction[],month?:string) => Object.entries(transactions.filter(t=>
 t.type==="expense"&&(!month||t.date.startsWith(month))).reduce<Record<string,number>>((acc,t)=>{
 acc[t.category]=(acc[t.category]??0)+t.amount; return acc;
 },{})).map(([name,value])=>({name,value:roundMoney(value)})).sort((a,b)=>b.value-a.value);

export const portfolioValue = (positions:Investment[]) => roundMoney(positions.reduce((sum,i)=>sum+i.units*i.pricePerUnit,0));
export const portfolioCost = (positions:Investment[]) => roundMoney(positions.reduce((sum,i)=>sum+i.units*i.costPerUnit,0));

export const remainingDebt = (debts:Debt[],direction:Debt["direction"]) => roundMoney(debts.filter(d=>d.direction===direction).reduce((sum,d)=>sum+Math.max(0,d.principal-d.paid),0));

export function taxEstimate(workspace:Workspace,transactions:Transaction[],year:string){
 const items=transactions.filter(t=>t.date.startsWith(year));
 const revenue=totalFlow(items,"income");
 const spending=totalFlow(items,"expense");
 const profit=Math.max(0,revenue-spending);
 const basis=workspace.taxBasis==="revenue"?revenue:profit;
 return {revenue,spending,profit,basis,estimate:roundMoney(basis*Math.max(0,workspace.taxRate)/100)};
}

export function calculateZakat(config:ZakatConfig,balances:number,investments:number,now=new Date()){
 const grams=config.basis==="gold"?85:595;
 const metalPrice=config.basis==="gold"?config.goldPricePerGram:config.silverPricePerGram;
 const nisab=grams*metalPrice;
 const wealth=Math.max(0,balances)+config.otherCash+config.goldGrams*config.goldPricePerGram+
 config.silverGrams*config.silverPricePerGram+config.tradeInventory+config.collectibleReceivables+
 (config.includeInvestments?investments:0);
 const net=Math.max(0,wealth-Math.max(0,config.immediatelyDueLiabilities));
 const meetsNisab=nisab>0&&net>=nisab;
 // 354 days approximates a lunar year. Religious dates should be independently confirmed.
 const start=config.haulStart?new Date(config.haulStart+"T12:00:00"):null;
 const due=start&&!Number.isNaN(start.getTime())?new Date(start.getTime()+354*86400000):null;
 const daysToDue=due?Math.ceil((due.getTime()-now.getTime())/86400000):null;
 const haulComplete=daysToDue!==null&&daysToDue<=0;
 return {
  grams,nisab:roundMoney(nisab),gross:roundMoney(wealth),net:roundMoney(net),
  meetsNisab,haulComplete,daysToDue,
  dueDate:due?due.toISOString().slice(0,10):"",
  potentialZakat:meetsNisab?roundMoney(net*0.025):0,
  eligible:meetsNisab&&haulComplete,
  reminder:meetsNisab&&daysToDue!==null&&daysToDue<=Math.max(0,config.reminderDays)
 };
}

export function monthReport(data:FinoraData,workspaceId:string,month:string){
 const ws=currentWorkspace({...data,activeId:workspaceId});
 const items=workspaceItems(data,workspaceId);
 const transactions=items.transactions.filter(t=>t.date.startsWith(month));
 const income=totalFlow(transactions,"income"),expense=totalFlow(transactions,"expense");
 const expensesByCategory=categorySpend(transactions);
 const historyThroughMonth=items.transactions.filter(t=>t.date.slice(0,7)<=month);
 const balances=items.accounts.map(a=>({name:a.name,balance:balanceFor(a,historyThroughMonth)}));
 const estimate=taxEstimate(ws,items.transactions,month.slice(0,4));
 return {workspace:ws,month,transactions,income,expense,net:roundMoney(income-expense),expensesByCategory,balances,taxEstimate:estimate};
}
