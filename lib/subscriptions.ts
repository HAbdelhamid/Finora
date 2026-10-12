import type {Subscription,SubscriptionCycle} from "./models";

const iso=/^\d{4}-\d{2}-\d{2}$/;
export function isDate(value:string):boolean {
 if(!iso.test(value))return false;
 const date=new Date(value+"T12:00:00Z");
 return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;
}
export function isSafeProviderWebsite(value:string):boolean {
 if(!value)return true;
 try{const url=new URL(value);return ["https:","http:"].includes(url.protocol)&&!!url.hostname&&url.username===""&&url.password===""}
 catch{return false}
}
export const subscriptionCategories=[
 {value:"mobile",label:"Phone & mobile"},
 {value:"internet",label:"Home internet"},
 {value:"ai_tools",label:"AI & coding tools"},
 {value:"software",label:"Software & productivity"},
 {value:"streaming",label:"Streaming & media"},
 {value:"cloud",label:"Cloud & hosting"},
 {value:"insurance",label:"Insurance"},
 {value:"other",label:"Other services"}
] as const;
export const billingCycles=[
 {value:"weekly",label:"Weekly"},
 {value:"monthly",label:"Monthly"},
 {value:"quarterly",label:"Every 3 months"},
 {value:"yearly",label:"Yearly"}
] as const;
export const subscriptionStates=[
 {value:"active",label:"Active"},{value:"trial",label:"Trial"},
 {value:"paused",label:"Paused"},{value:"cancelled",label:"Cancelled"}
] as const;

/** Monthly and yearly equivalents are estimates; no FX conversion occurs. */
export function monthlyEquivalent(amount:number,cycle:SubscriptionCycle):number {
 const multiple={weekly:52/12,monthly:1,quarterly:1/3,yearly:1/12}[cycle];
 return Math.round(amount*multiple*100)/100;
}
export function yearlyEquivalent(amount:number,cycle:SubscriptionCycle):number {
 const multiple={weekly:52,monthly:12,quarterly:4,yearly:1}[cycle];
 return Math.round(amount*multiple*100)/100;
}
function addPeriod(date:string,cycle:SubscriptionCycle):string {
 const start=new Date(date+"T12:00:00Z");
 if(cycle==="weekly"){start.setUTCDate(start.getUTCDate()+7);return start.toISOString().slice(0,10)}
 const count=cycle==="monthly"?1:cycle==="quarterly"?3:12;
 const year=start.getUTCFullYear(),month=start.getUTCMonth()+count;
 const first=new Date(Date.UTC(year,month,1,12));
 const last=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0,12)).getUTCDate();
 first.setUTCDate(Math.min(start.getUTCDate(),last));
 return first.toISOString().slice(0,10);
}
/** Next renewal strictly after the payment date, even for an overdue plan. */
export function advanceRenewalAfter(due:string,cycle:SubscriptionCycle,paidAt:string):string {
 if(!isDate(due)||!isDate(paidAt))throw Error("Invalid subscription billing date");
 let next=due;
 for(let n=0;n<1300&&next<=paidAt;n++)next=addPeriod(next,cycle);
 if(next<=paidAt)throw Error("Could not calculate next renewal");
 return next;
}
export function subscriptionMetrics(items:Subscription[]) {
 const active=items.filter(s=>s.status==="active"||s.status==="trial");
 return {activeCount:active.length,
  monthlyCost:Math.round(active.reduce((sum,s)=>sum+monthlyEquivalent(s.amount,s.cycle),0)*100)/100,
  annualCost:Math.round(active.reduce((sum,s)=>sum+yearlyEquivalent(s.amount,s.cycle),0)*100)/100};
}
