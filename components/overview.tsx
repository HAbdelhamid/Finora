"use client";
import { ArrowDownLeft,ArrowUpRight,ArrowRight,Building2,CalendarClock,CircleDollarSign,Landmark,PiggyBank,Plus,TrendingUp,Wallet } from "lucide-react";
import { useFinance } from "@/lib/finance-store";
import { balanceFor,categorySpend,monthlySeries,portfolioValue,totalFlow,workspaceItems,remainingDebt } from "@/lib/ledger";
import { categoryColors,formatMoney } from "@/lib/models";
import { Card,Metric,CashFlowChart,CategoryChart,AssetChart } from "./widgets";

export function Overview({navigate,openNew}:{navigate:(tab:string)=>void;openNew:()=>void}){
 const data=useFinance(),ws=data.workspaces.find(w=>w.id===data.activeId)!;
 const items=workspaceItems(data,ws.id);
 const month=new Date().toISOString().slice(0,7);
 const income=totalFlow(items.transactions,"income",month),expense=totalFlow(items.transactions,"expense",month);
 const accounts=items.accounts.map(a=>({...a,balance:balanceFor(a,items.transactions)}));
 const cash=accounts.filter(a=>a.kind!=="savings").reduce((n,a)=>n+a.balance,0);
 const savings=accounts.filter(a=>a.kind==="savings").reduce((n,a)=>n+a.balance,0);
 const investments=portfolioValue(items.investments);
 const breakdown=categorySpend(items.transactions,month);
 const recent=[...items.transactions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
 const netWorth=cash+savings+investments-remainingDebt(items.debts,"owe")+remainingDebt(items.debts,"owed");
 return <div className="page-stack">
 {ws.demo&&<div className="demo-banner"><div className="demo-dot"/><strong>Sample data</strong><span>This workspace contains example transactions, not your real money.</span><button onClick={()=>navigate("Workspaces")}>Create workspace <ArrowRight size={15}/></button></div>}
 <div className="welcome-row"><div><p className="overline">YOUR FINANCIAL PULSE</p><h2 className="welcome-title">A clearer picture of your money <span className="sparkle">✳</span></h2><p className="sub-copy">Everything in one place, with insights that make sense.</p></div><button className="btn btn-primary" onClick={openNew}><Plus size={17}/> New transaction</button></div>
 <div className="metric-grid">
 <Metric feature label="Net worth estimate" value={formatMoney(netWorth,ws.currency)} icon={<CircleDollarSign size={20}/>} detail="Cash + holdings − debts"/>
 <Metric label="Income this month" value={formatMoney(income,ws.currency)} icon={<ArrowDownLeft size={19}/>} detail="Recorded revenue"/>
 <Metric label="Expenses this month" value={formatMoney(expense,ws.currency)} icon={<ArrowUpRight size={19}/>} detail="This month's spending"/>
 <Metric label="Cash & savings" value={formatMoney(cash+savings,ws.currency)} icon={<Wallet size={19}/>} detail="All workspace accounts"/>
 </div>
 <div className="viz-grid"><Card className="chart-card" title="Cash flow" subtitle="Monthly income versus expenses · 12 months" action={<div className="series-legend"><i className="legend-green"/> Income <i className="legend-indigo"/> Expenses</div>}><CashFlowChart rows={monthlySeries(items.transactions)} currency={ws.currency}/></Card>
 <Card title="Spending breakdown" subtitle="Expenses by category · This month" action={<span className="mini-badge">{month}</span>}><CategoryChart rows={breakdown} currency={ws.currency}/></Card></div>
 <div className="viz-grid secondary-grid">
 <Card title="Recent activity" subtitle="Latest financial movements" action={<button className="plain-action" onClick={()=>navigate("Transactions")}>View all <ArrowRight size={16}/></button>}>
 {recent.length?recent.map(t=><div className="transaction-line" key={t.id}><div className={"type-icon "+(t.type==="income"||t.type==="debt_in"?"in":"out")}>{t.type==="income"||t.type==="debt_in"?<ArrowDownLeft size={17}/>:<ArrowUpRight size={17}/>}</div><div className="flex-fill"><b>{t.description}</b><small>{t.category} · {t.date}</small></div><strong className={t.type==="income"||t.type==="debt_in"?"value-in":"value-out"}>{t.type==="income"||t.type==="debt_in"?"+":"−"}{formatMoney(t.amount,ws.currency)}</strong></div>):<div className="empty-state">No transactions yet.</div>}</Card>
 <Card title="Your assets" subtitle="Cash, savings & manually valued holdings" action={<Landmark size={18} className="subtle-icon"/>}><AssetChart cash={cash} savings={savings} investments={investments} currency={ws.currency}/><div className="divider"/><div className="allocation"><span><i style={{background:"#15ad91"}}/> Cash</span><b>{formatMoney(cash,ws.currency)}</b></div><div className="allocation"><span><i style={{background:"#7376e7"}}/> Savings</span><b>{formatMoney(savings,ws.currency)}</b></div><div className="allocation"><span><i style={{background:"#edaa5e"}}/> Investments</span><b>{formatMoney(investments,ws.currency)}</b></div></Card>
 </div>
 <div className="viz-grid secondary-grid">
 <Card title="Budget health" subtitle="Spending against monthly limits" action={<button className="plain-action" onClick={()=>navigate("Planning")}>Manage <ArrowRight size={16}/></button>}>{items.budgets.length?items.budgets.slice(0,5).map((b,i)=>{const n=breakdown.find(x=>x.name===b.category)?.value||0;return <div className="budget-line" key={b.id}><div className="between"><strong>{b.category}</strong><span>{formatMoney(n,ws.currency)} <span className="muted">/ {formatMoney(b.limit,ws.currency)}</span></span></div><div className="progress-track"><div className="progress-fill" style={{width:Math.min(n/b.limit*100,100)+"%",background:n>b.limit?"#e6787c":categoryColors[i%categoryColors.length]}}/></div></div>}):<div className="empty-state">Set your first budget to monitor spending.</div>}</Card>
 <Card title="Savings goals" subtitle="Your next big milestones" action={<button className="plain-action" onClick={()=>navigate("Planning")}>Manage <ArrowRight size={16}/></button>}>{items.goals.length?items.goals.map(g=><div className="goal-line" key={g.id}><div className="between"><strong>{g.name}</strong><b>{Math.min(100,Math.round(g.saved/g.target*100))}%</b></div><div className="progress-track"><div className="progress-fill" style={{width:Math.min(100,g.saved/g.target*100)+"%",background:g.color}}/></div><small>{formatMoney(g.saved,ws.currency)} of {formatMoney(g.target,ws.currency)}</small></div>):<div className="empty-state">Plan your first savings milestone.</div>}</Card>
 </div>
 <div className="quick-grid">{[{tab:"Planning",icon:<PiggyBank size={20}/>,name:"Planning",detail:"Budgets, goals and debts"},{tab:"Reports",icon:<TrendingUp size={20}/>,name:"Monthly bilan",detail:"PDF & CSV exports"},{tab:"Zakat",icon:<CalendarClock size={20}/>,name:"Zakat planner",detail:"Nisab, hawl and reminders"},{tab:"Workspaces",icon:<Building2 size={20}/>,name:"Workspaces",detail:"Personal and business"}].map(link=><button key={link.tab} className="quick-link" onClick={()=>navigate(link.tab)}>{link.icon}<span><strong>{link.name}</strong><small>{link.detail}</small></span><ArrowRight size={18}/></button>)}</div></div>;
}
