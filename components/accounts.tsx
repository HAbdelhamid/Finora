"use client";
import {FinoraSelect} from "@/components/ui/finora-select";
import { useState } from "react";
import { Landmark,Plus,ArrowLeftRight,Wallet,CheckCircle } from "lucide-react";
import { useFinance } from "@/lib/finance-store";
import { balanceFor,workspaceItems } from "@/lib/ledger";
import { formatMoney } from "@/lib/models";
import type { AccountKind } from "@/lib/models";
import {Card} from "./widgets";
export function Accounts(){
 const s=useFinance(),w=s.workspaces.find(x=>x.id===s.activeId)!,d=workspaceItems(s,w.id);
 const [name,setName]=useState(""),[kind,setKind]=useState<AccountKind>("checking"),[opening,setOpening]=useState("");
 const [from,setFrom]=useState(""),[to,setTo]=useState(""),[value,setValue]=useState("");
 const fromId=d.accounts.some(a=>a.id===from)?from:d.accounts[0]?.id||"";
 const toId=d.accounts.some(a=>a.id===to&&a.id!==fromId)?to:d.accounts.find(a=>a.id!==fromId)?.id||"";
 return <div className="page-stack"><div className="section-intro"><h2>Accounts & wallets</h2><p>Manage cash, current accounts and savings separately while maintaining accurate internal transfers.</p></div>
 <div className="account-grid">{d.accounts.map(a=><div className="account-tile" key={a.id}><div className="between"><div className="round-icon"><Landmark size={21}/></div><span className="mini-badge">{a.kind}</span></div><p>{a.name}</p><h3>{formatMoney(balanceFor(a,d.transactions),w.currency)}</h3><small>Opening amount: {formatMoney(a.openingBalance,w.currency)}</small></div>)}</div>
 <div className="form-layout"><Card tourId="accounts" title="New financial account" subtitle="The opening balance is a starting snapshot, not income."><form className="stack-form" onSubmit={e=>{e.preventDefault();if(!name.trim()||!Number.isFinite(+opening))return;s.addAccount({workspaceId:w.id,name,kind,openingBalance:+opening||0});setName("");setOpening("")}}><label>Name<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Cash wallet, checking account"/></label><div className="field-row"><label>Type<FinoraSelect value={kind} onChange={e=>setKind(e.target.value as AccountKind)}><option value="checking">Checking</option><option value="cash">Cash</option><option value="savings">Savings</option></FinoraSelect></label><label>Opening balance<input type="number" required step=".01" value={opening} onChange={e=>setOpening(e.target.value)} placeholder="0.00"/></label></div><button className="btn btn-primary submit-btn" type="submit"><Plus size={16}/> Create account</button></form></Card>
 <Card title="Move funds between accounts" subtitle="Transfers have no effect on income and spending totals" action={<ArrowLeftRight size={19} className="subtle-icon"/>}><form className="stack-form" onSubmit={e=>{e.preventDefault();if(!fromId||!toId||fromId===toId||+value<=0)return;s.addTransaction({workspaceId:w.id,accountId:fromId,toAccountId:toId,type:"transfer",amount:+value,category:"Transfer",description:"Internal transfer",date:new Date().toISOString().slice(0,10)});setValue("")}}><label>From account<FinoraSelect value={fromId} onChange={e=>setFrom(e.target.value)}>{d.accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</FinoraSelect></label><label>To account<FinoraSelect value={toId} onChange={e=>setTo(e.target.value)}>{d.accounts.filter(a=>a.id!==fromId).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</FinoraSelect></label><label>Transfer amount<input required step=".01" min=".01" type="number" value={value} onChange={e=>setValue(e.target.value)} placeholder="500"/></label><button className="btn btn-outline submit-btn" disabled={d.accounts.length<2} type="submit"><ArrowLeftRight size={16}/> Record transfer</button></form></Card></div>
 <div className="info-strip"><Wallet size={18}/><span>Account totals are based on opening balances plus recorded movements. Connect a real bank only through a trusted, separately authorized integration.</span></div></div>;
}
