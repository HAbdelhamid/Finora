"use client";
import {useMemo,useState,type FormEvent} from "react";
import {ArrowRight,CalendarClock,CheckCircle2,CreditCard,ExternalLink,Globe2,Layers3,Pencil,Plus,Repeat2,Trash2,X} from "lucide-react";
import {useFinance} from "@/lib/finance-store";
import type {Subscription,SubscriptionCategory,SubscriptionCycle,SubscriptionStatus} from "@/lib/models";
import {formatMoney,today} from "@/lib/models";
import {workspaceItems} from "@/lib/ledger";
import {subscriptionCategories,billingCycles,subscriptionStates,monthlyEquivalent,subscriptionMetrics,isDate,isSafeProviderWebsite} from "@/lib/subscriptions";
import {FinoraSelect} from "@/components/ui/finora-select";
import {useFinoraUi} from "@/components/ui/finora-feedback";
import {Card} from "./widgets";

type Draft={
 name:string;provider:string;plan:string;category:SubscriptionCategory;amount:string;currency:string;conversionRate:string;cycle:SubscriptionCycle;
 nextRenewal:string;accountId:string;status:SubscriptionStatus;autoRenew:boolean;website:string;notes:string;
};
const clean=(accountId:string,currency:string):Draft=>({name:"",provider:"",plan:"",category:"software",amount:"",currency,conversionRate:"1",cycle:"monthly",nextRenewal:today(),accountId,status:"active",autoRenew:true,website:"",notes:""});
const fromItem=(item:Subscription):Draft=>({...item,amount:String(item.amount),conversionRate:String(item.conversionRate)});
const labelOf=(value:string,options:readonly {value:string;label:string}[])=>options.find(x=>x.value===value)?.label||value;
const daysTo=(date:string)=>Math.ceil((new Date(date+"T12:00:00Z").getTime()-new Date(today()+"T12:00:00Z").getTime())/86400000);

export function Subscriptions(){
 const store=useFinance();
 const ws=store.workspaces.find(x=>x.id===store.activeId)!;
 const workspace=workspaceItems(store,ws.id);
 const {confirm,notify}=useFinoraUi();
 const [draft,setDraft]=useState<Draft>(()=>clean("","MAD"));
 const [editing,setEditing]=useState<string|null>(null),[showForm,setShowForm]=useState(false),[filter,setFilter]=useState("all");
 const accountId=workspace.accounts.some(a=>a.id===draft.accountId)?draft.accountId:workspace.accounts[0]?.id||"";
 const update=<K extends keyof Draft>(key:K,value:Draft[K])=>setDraft(s=>({...s,[key]:value}));
 const list=useMemo(()=>workspace.subscriptions.filter(s=>filter==="all"||s.status===filter).sort((a,b)=>a.nextRenewal.localeCompare(b.nextRenewal)),[workspace.subscriptions,filter]);
 const metrics=subscriptionMetrics(workspace.subscriptions);
 const begin=(subscription?:Subscription)=>{
  if(subscription){setEditing(subscription.id);setDraft(fromItem(subscription))}
  else{setEditing(null);setDraft(clean(workspace.accounts[0]?.id||"",ws.currency))}
  setShowForm(true);
 };
 const save=(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  const amount=Number(draft.amount),rate=draft.currency===ws.currency?1:Number(draft.conversionRate);
  if(!draft.name.trim()||!draft.provider.trim()||!draft.plan.trim()){notify("Add a service name, provider and plan name.","error");return}
  if(!Number.isFinite(amount)||amount<=0){notify("Enter the actual positive amount billed each cycle.","error");return}
  if(!Number.isFinite(rate)||rate<=0){notify("Enter a valid exchange rate.","error");return}
  if(!accountId){notify("Create a payment account first.","error");return}
  if(!isDate(draft.nextRenewal)){notify("Enter a valid next renewal date.","error");return}
  if(!isSafeProviderWebsite(draft.website.trim())){notify("Use a valid http or https provider website.","error");return}
  const values={workspaceId:ws.id,accountId,name:draft.name.trim(),provider:draft.provider.trim(),plan:draft.plan.trim(),
   category:draft.category,amount,currency:draft.currency,conversionRate:rate,cycle:draft.cycle,nextRenewal:draft.nextRenewal,status:draft.status,autoRenew:draft.autoRenew,
   website:draft.website.trim(),notes:draft.notes.trim()};
  if(editing)store.updateSubscription(editing,values);
  else store.addSubscription(values);
  setShowForm(false);setEditing(null);notify(editing?"Subscription updated.":"Subscription added.","success");
 };
 const remove=async(sub:Subscription)=>{
  if(await confirm({title:"Remove "+sub.name+"?",description:"Remove this subscription plan from tracking? Existing booked expenses remain untouched.",confirmText:"Remove subscription",danger:true})){
   store.removeSubscription(sub.id);notify("Subscription removed.","success");
  }
 };
 const paid=async(sub:Subscription)=>{
  if(sub.nextRenewal>today())return;
  if(!await confirm({title:"Record payment for "+sub.name+"?",description:"Book "+formatMoney(sub.amount*sub.conversionRate,ws.currency)+" as an expense in "+(workspace.accounts.find(a=>a.id===sub.accountId)?.name||"your account")+" and advance the renewal. This does not charge your bank.",confirmText:"Record expense"}))return;
  if(store.recordSubscriptionPayment(sub.id,today()))notify("Payment recorded. Next renewal updated.","success");
  else notify("Could not record payment. Check renewal date, status and account.","error");
 };
 return <div className="page-stack"><div className="section-intro"><div><h2>Subscriptions</h2><p>Keep every service plan, renewal, and payment detail together. Future bills are forecasts until you record them.</p></div></div>
  <div className="subscription-metrics">
   <div><span>Active & trial plans</span><strong>{metrics.activeCount}</strong><small>Tracked services</small></div>
   <div><span>Monthly equivalent</span><strong>{formatMoney(metrics.monthlyCost,ws.currency)}</strong><small>Estimated recurring commitment</small></div>
   <div><span>Estimated annual cost</span><strong>{formatMoney(metrics.annualCost,ws.currency)}</strong><small>Across active plans</small></div>
  </div>
  <Card title="Your subscriptions" subtitle="Manage phone plans, broadband, AI tools, streaming, cloud services and more"
   action={<button className="btn btn-primary" type="button" onClick={()=>begin()}><Plus size={16}/> Add subscription</button>}>
   <div className="subscription-toolbar"><div className="subscription-filters">{["all","active","trial","paused","cancelled"].map(s=><button type="button" key={s} className={filter===s?"selected":""} onClick={()=>setFilter(s)}>{s==="all"?"All plans":s[0].toUpperCase()+s.slice(1)}</button>)}</div></div>
   {list.length? <div className="subscription-grid">{list.map(sub=>{
    const days=daysTo(sub.nextRenewal),account=workspace.accounts.find(a=>a.id===sub.accountId);
    return <article key={sub.id} className="subscription-card">
     <div className="subscription-card-top"><span className="subscription-symbol"><Layers3 size={19}/></span><span className={"subscription-status "+sub.status}>{sub.status}</span></div>
     <h3>{sub.name}</h3><p className="subscription-plan">{sub.provider} <span>·</span> {sub.plan}</p>
     <div className="subscription-price"><strong>{formatMoney(sub.amount,sub.currency)}</strong><small>/ {labelOf(sub.cycle,billingCycles).toLowerCase()}</small></div>
     <div className="subscription-detail-row"><span>Category</span><b>{labelOf(sub.category,subscriptionCategories)}</b></div>
     <div className="subscription-detail-row"><span>Next renewal</span><b>{sub.nextRenewal} {sub.status==="active"&&days>=0&&days<=7?<i className="subscription-due">Due soon</i>:null}</b></div>
     {sub.currency!==ws.currency&&<div className="subscription-detail-row"><span>Converted total</span><b>{formatMoney(sub.amount*sub.conversionRate,ws.currency)} · rate {sub.conversionRate}</b></div>}
     <div className="subscription-detail-row"><span>Payment account</span><b>{account?.name||"Account unavailable"}</b></div>
     <div className="subscription-detail-row"><span>Auto renew</span><b>{sub.autoRenew?"On":"Off"}</b></div>
     {sub.website&&<a className="subscription-url" href={sub.website} target="_blank" rel="noopener noreferrer"><Globe2 size={14}/> Provider website <ExternalLink size={13}/></a>}
     {sub.notes&&<p className="subscription-notes">{sub.notes}</p>}
     <div className="subscription-card-actions">
      <button type="button" className="btn btn-outline" onClick={()=>begin(sub)}><Pencil size={15}/> Edit</button>
      <button type="button" className="btn btn-outline" disabled={sub.status==="paused"||sub.status==="cancelled"||days>0} onClick={()=>void paid(sub)}><CreditCard size={15}/> Record payment</button>
      <button type="button" className="subscription-delete" aria-label={"Remove "+sub.name} title={"Remove "+sub.name} onClick={()=>void remove(sub)}><Trash2 size={17}/></button>
     </div>
    </article>
   })}</div>:<div className="subscription-empty"><Repeat2 size={28}/><strong>{filter==="all"?"No subscriptions yet":"No matching subscriptions"}</strong><p>Add your internet plan, mobile package, AI coding subscription or any other recurring service with its exact plan and renewal details.</p></div>}
  </Card>
  {showForm&&<div className="finora-dialog-backdrop subscription-editor-backdrop"><section className="subscription-editor" role="dialog" aria-modal="true" aria-labelledby="subscription-editor-title">
   <header><div><span className="overline">RECURRING SERVICE</span><h2 id="subscription-editor-title">{editing?"Edit subscription":"Add a subscription"}</h2><p>Record the real provider, plan, billing and renewal details.</p></div><button type="button" className="subscription-editor-close" aria-label="Close editor" onClick={()=>setShowForm(false)}><X size={20}/></button></header>
   <form className="stack-form subscription-editor-form" onSubmit={save}>
    <div className="field-row"><label>Service name<input required maxLength={80} placeholder="e.g. Claude Code, Fibre Internet" value={draft.name} onChange={e=>update("name",e.target.value)}/></label>
     <label>Provider / brand<input required maxLength={80} placeholder="e.g. Anthropic, Orange" value={draft.provider} onChange={e=>update("provider",e.target.value)}/></label></div>
    <div className="field-row"><label>Exact plan<input required maxLength={100} placeholder="e.g. Pro, 200 Mbps" value={draft.plan} onChange={e=>update("plan",e.target.value)}/></label>
     <label>Type of service<FinoraSelect aria-label="Type of service" value={draft.category} onChange={e=>update("category",e.target.value as SubscriptionCategory)}>{subscriptionCategories.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</FinoraSelect></label></div>
    <div className="field-row"><label>Price per cycle<input required type="number" inputMode="decimal" min=".01" step=".01" placeholder="0.00" value={draft.amount} onChange={e=>update("amount",e.target.value)}/></label>
     <label>Billing frequency<FinoraSelect aria-label="Billing frequency" value={draft.cycle} onChange={e=>update("cycle",e.target.value as SubscriptionCycle)}>{billingCycles.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</FinoraSelect></label></div>
    <div className="field-row"><label>Billing currency<FinoraSelect aria-label="Billing currency" value={draft.currency} onChange={e=>update("currency",e.target.value)}>{Array.from(new Set([ws.currency,"MAD","USD","EUR","GBP","CAD","CHF"])).map(c=><option key={c} value={c}>{c}</option>)}</FinoraSelect></label>
     {draft.currency!==ws.currency?<label>Exchange rate: 1 {draft.currency} in {ws.currency}<input type="number" inputMode="decimal" required min=".000001" step="any" value={draft.conversionRate} onChange={e=>update("conversionRate",e.target.value)}/><small className="field-help">Enter this rate yourself; Finora does not fetch exchange rates.</small></label>:<div className="subscription-base-currency">Same as workspace currency. No conversion needed.</div>}</div>
    <div className="field-row"><label>Next renewal / billing date<input required type="date" value={draft.nextRenewal} onChange={e=>update("nextRenewal",e.target.value)}/></label>
     <label>Payment account<FinoraSelect aria-label="Payment account" value={accountId} onChange={e=>update("accountId",e.target.value)}>{workspace.accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</FinoraSelect></label></div>
    <div className="field-row"><label>Status<FinoraSelect aria-label="Subscription status" value={draft.status} onChange={e=>update("status",e.target.value as SubscriptionStatus)}>{subscriptionStates.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</FinoraSelect></label>
     <label>Provider website (optional)<input type="url" placeholder="https://provider.example" value={draft.website} onChange={e=>update("website",e.target.value)}/></label></div>
    <label className="subscription-checkbox"><input type="checkbox" checked={draft.autoRenew} onChange={e=>update("autoRenew",e.target.checked)}/><span><strong>Automatically renews</strong><small>Informational only — Finora does not contact or charge the provider.</small></span></label>
    <label>Notes / contract details<textarea rows={3} maxLength={700} placeholder="Customer reference, included features, cancellation terms, etc." value={draft.notes} onChange={e=>update("notes",e.target.value)}/></label>
    <div className="info-strip"><CalendarClock size={17}/><span>Saving a plan does not create an expense. Use Record payment after a bill is due to add its cost to your ledger. You can edit the renewal date at any time.</span></div>
    <div className="subscription-form-actions"><button type="button" className="btn btn-outline" onClick={()=>setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary"><CheckCircle2 size={16}/>{editing?"Save changes":"Add subscription"}</button></div>
   </form>
  </section></div>}
 </div>;
}
