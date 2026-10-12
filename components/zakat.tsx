"use client";
import {useEffect,useState} from "react";
import {Bell,CalendarClock,CheckCircle2,Info,ShieldCheck} from "lucide-react";
import {useFinance} from "@/lib/finance-store";
import {balanceFor,calculateZakat,portfolioValue,workspaceItems} from "@/lib/ledger";
import {formatMoney} from "@/lib/models";
import type {ZakatConfig} from "@/lib/models";
import {Card} from "./widgets";

type NumericKey="goldPricePerGram"|"silverPricePerGram"|"goldGrams"|"silverGrams"|"otherCash"|"tradeInventory"|"collectibleReceivables"|"immediatelyDueLiabilities"|"reminderDays";
function NumberField({label,value,onChange,help}:{label:string;value:number;onChange:(n:number)=>void;help?:string}){
 return <label>{label}<input type="number" min="0" step="any" value={value||""} placeholder="0" onChange={e=>onChange(Number(e.target.value))}/>{help&&<small className="field-help">{help}</small>}</label>;
}
export function Zakat(){
 const s=useFinance(),w=s.workspaces.find(x=>x.id===s.activeId)!,d=workspaceItems(s,w.id),config=w.zakat;
 const balances=d.accounts.reduce((sum,a)=>sum+balanceFor(a,d.transactions),0),investments=portfolioValue(d.investments);
 const calc=calculateZakat(config,balances,investments),money=(n:number)=>formatMoney(n,w.currency);
 const [permission,setPermission]=useState("unknown");
 const patch=(key:NumericKey,value:number)=>s.updateWorkspace(w.id,{zakat:{...config,[key]:Math.max(0,Number.isFinite(value)?value:0)}});
 const apply=(p:Partial<ZakatConfig>)=>s.updateWorkspace(w.id,{zakat:{...config,...p}});
 useEffect(()=>{if(typeof Notification==="undefined")return;setPermission(Notification.permission);
 if(!calc.reminder||Notification.permission!=="granted")return;
 const key="finora-zakat-notification-"+w.id+"-"+new Date().toISOString().slice(0,10);
 if(localStorage.getItem(key))return;
 try{new Notification("Finora · Zakat check",{body:"Your recorded wealth has met the selected nisab. Review your hawl date and calculation."});localStorage.setItem(key,"1")}catch{}
 },[calc.reminder,w.id]);
 return <div className="page-stack"><div className="section-intro"><h2>Zakat intelligence</h2><p>Estimate nisab, examine zakatable assets, and track your lunar-year assessment date.</p></div>
 <div className="zakat-hero"><div><span className="overline light">YOUR ZAKAT ASSESSMENT</span><h2>{calc.nisab===0?"Set your nisab reference":calc.meetsNisab?calc.haulComplete?"Review your Zakat now":"Nisab threshold reached":"Below selected nisab"}</h2><p>{calc.nisab===0?"Enter the current price per gram in your currency to begin.":calc.meetsNisab?"Your entered net zakatable wealth meets the selected reference. Confirm your hawl and applicable scholarly guidance.":"Your entered net zakatable wealth is below the selected nisab reference."}</p></div><div className="zakat-amount"><span>Illustrative 2.5% of net wealth</span><strong>{money(calc.potentialZakat)}</strong><small>{calc.eligible?"Hawl date reached (estimated)":"Not a confirmed amount due"}</small></div></div>
 <div className="zakat-stats"><div><span>Net zakatable wealth</span><strong>{money(calc.net)}</strong></div><div><span>{config.basis==="gold"?"Gold":"Silver"} nisab</span><strong>{money(calc.nisab)}</strong></div><div><span>Lunar year (hawl)</span><strong>{calc.dueDate||"Not set"}</strong></div><div><span>Reminder status</span><strong>{calc.reminder?"Review due":"Not due"}</strong></div></div>
 <div className="form-layout"><Card title="Nisab reference & hawl" subtitle={"Metal prices must be entered in "+w.currency+" per gram. Finora does not fetch live quotes."}>
 <div className="stack-form"><label>Nisab comparison<select value={config.basis} onChange={e=>apply({basis:e.target.value as "gold"|"silver"})}><option value="gold">Gold · 85 grams</option><option value="silver">Silver · 595 grams</option></select></label>
 <div className="field-row"><NumberField label={"Gold / gram · "+w.currency} value={config.goldPricePerGram} onChange={n=>patch("goldPricePerGram",n)}/><NumberField label={"Silver / gram · "+w.currency} value={config.silverPricePerGram} onChange={n=>patch("silverPricePerGram",n)}/></div>
 <label>When did your wealth first reach nisab?<input type="date" value={config.haulStart} onChange={e=>apply({haulStart:e.target.value})}/><small className="field-help">Enter this date yourself; Finora cannot determine it from current balances.</small></label>
 <NumberField label="Remind me this many days before the estimated due date" value={config.reminderDays} onChange={n=>patch("reminderDays",Math.floor(n))}/>
 <button className="btn btn-outline" onClick={async()=>{if(typeof Notification==="undefined")return alert("Browser notifications are not supported.");const p=await Notification.requestPermission();setPermission(p)}}><Bell size={17}/> {permission==="granted"?"Browser alerts enabled":"Enable browser alerts"}</button>
 <div className="info-strip"><CalendarClock size={17}/><span>Estimated due date uses 354 days as a lunar-year approximation. Browser notifications work only while Finora is open; no background push service is configured.</span></div></div></Card>
 <Card title="Assets & immediate liabilities" subtitle="Review what is zakatable under the guidance you follow">
 <div className="zakat-auto"><div className="allocation"><span>Workspace cash & savings</span><b>{money(Math.max(0,balances))}</b></div><div className="allocation"><span>Recorded investments</span><b>{money(investments)}</b></div><label className="check-row"><input type="checkbox" checked={config.includeInvestments} onChange={e=>apply({includeInvestments:e.target.checked})}/> Include positions at entered market values</label></div>
 <div className="field-row"><NumberField label="Gold owned (grams)" value={config.goldGrams} onChange={n=>patch("goldGrams",n)}/><NumberField label="Silver owned (grams)" value={config.silverGrams} onChange={n=>patch("silverGrams",n)}/></div>
 <div className="field-row"><NumberField label="Other cash not tracked" value={config.otherCash} onChange={n=>patch("otherCash",n)}/><NumberField label="Trade inventory value" value={config.tradeInventory} onChange={n=>patch("tradeInventory",n)}/></div>
 <div className="field-row"><NumberField label="Collectible money owed to you" value={config.collectibleReceivables} onChange={n=>patch("collectibleReceivables",n)}/><NumberField label="Liabilities due immediately" value={config.immediatelyDueLiabilities} onChange={n=>patch("immediatelyDueLiabilities",n)}/></div>
 <div className="zakat-subtotal"><div className="allocation"><span>Gross zakatable assets</span><b>{money(calc.gross)}</b></div><div className="allocation"><span>After eligible liabilities</span><strong>{money(calc.net)}</strong></div></div></Card></div>
 <div className="info-strip"><ShieldCheck size={19}/><span>Zakat eligibility and deductibility can differ by school of thought, asset type, ownership and timing. This is an editable aid, not a religious ruling. Gold/silver gram conventions also vary; consult trusted religious guidance to confirm your obligation.</span></div>
 </div>;
}
