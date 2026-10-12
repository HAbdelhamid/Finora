import type {jsPDF} from "jspdf";
import type {Subscription,Transaction} from "./models";
import {monthlyEquivalent,subscriptionMetrics} from "./subscriptions";

// Print-safe text for jsPDF's built-in Latin font. Keep supported European
// letters intact while avoiding control codes that break table rendering.
const safe=(value:unknown)=>String(value??"").replace(/[\u0000-\u001F\u007F]/g," ").replace(/\s+/g," ").trim();
const money=(n:number,currency:string)=>new Intl.NumberFormat("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number.isFinite(n)?n:0)+" "+currency;
const C={
 navy:[17,39,48] as const,green:[16,143,114] as const,mint:[220,246,236] as const,
 sand:[223,189,120] as const,paper:[249,252,250] as const,white:[255,255,255] as const,
 muted:[106,126,134] as const,border:[225,235,233] as const,negative:[193,77,88] as const,
};
type RGB=readonly[number,number,number];
const fill=(doc:jsPDF,c:RGB)=>doc.setFillColor(c[0],c[1],c[2]);
const text=(doc:jsPDF,c:RGB)=>doc.setTextColor(c[0],c[1],c[2]);
const line=(doc:jsPDF,c:RGB)=>doc.setDrawColor(c[0],c[1],c[2]);
const WIDTH=210,HEIGHT=297,X=14,INNER=182,MAXY=270;
type Row={cells:string[];tone?:"positive"|"negative"|"neutral"};
type PremiumStatementInput={
 workspaceName:string;kind:string;currency:string;month:string;
 income:number;expenses:number;net:number;
 categories:{name:string;value:number}[];
 balances:{name:string;balance:number}[];
 transactions:Transaction[];
 accountNames:Record<string,string>;
 subscriptions:Subscription[];
};

export function buildPremiumStatement(doc:jsPDF,data:PremiumStatementInput):void{
 let y=0;let page=1;
 const footer=()=>{
  line(doc,C.border);doc.setLineWidth(.25);doc.line(X,279,WIDTH-X,279);
  doc.setFont("helvetica","normal");doc.setFontSize(7.5);text(doc,C.muted);
  doc.text("FINORA  /  PRIVATE FINANCIAL REPORT",X,285);
  doc.text("Page "+page,WIDTH-X,285,{align:"right"});
  doc.setFontSize(7);doc.text("User-entered records. Not an audited financial statement or tax filing.",X,289);
 };
 const topNewPage=()=>{
  footer();doc.addPage();page++;fill(doc,C.navy);doc.rect(0,0,WIDTH,17,"F");
  doc.setFont("helvetica","bold");doc.setFontSize(10);text(doc,C.white);
  doc.text("FINORA",X,11.5);doc.setFont("helvetica","normal");doc.setFontSize(8);
  doc.text(data.month+"  |  "+safe(data.workspaceName).slice(0,64),WIDTH-X,11.5,{align:"right"});
  y=26;
 };
 const ensure=(needed:number)=>{if(y+needed>MAXY)topNewPage()};
 const section=(name:string,detail?:string)=>{
  ensure(19);doc.setFont("helvetica","bold");doc.setFontSize(11);text(doc,C.navy);
  doc.text(name,X,y+5);
  if(detail){doc.setFont("helvetica","normal");doc.setFontSize(8);text(doc,C.muted);doc.text(detail,WIDTH-X,y+5,{align:"right"})}
  y+=11;line(doc,C.border);doc.setLineWidth(.3);doc.line(X,y,WIDTH-X,y);y+=5;
 };
 const table=(headers:string[],widths:number[],rows:Row[],alignRight:number[]=[])=>{
  const lefts=widths.reduce<number[]>((a,w,i)=>{a.push(i? a[i-1]+widths[i-1]:X);return a},[]);
  const header=()=>{
   fill(doc,C.navy);doc.roundedRect(X,y,INNER,10,1.5,1.5,"F");
   doc.setFont("helvetica","bold");doc.setFontSize(7.3);text(doc,C.white);
   headers.forEach((h,i)=>doc.text(safe(h),lefts[i]+3,y+6.5,{align:alignRight.includes(i)?"right":"left"}));
   y+=11;
  };
  ensure(20);header();
  if(!rows.length){fill(doc,C.paper);doc.rect(X,y,INNER,13,"F");doc.setFont("helvetica","normal");doc.setFontSize(8);text(doc,C.muted);doc.text("No records for this period.",X+4,y+8);y+=14;return}
  rows.forEach((row,n)=>{
   const cells=row.cells.map((value,i)=>{
    const usable=widths[i]-(alignRight.includes(i)?5:6);
    doc.setFont("helvetica","normal");doc.setFontSize(7.8);
    const lines=doc.splitTextToSize(safe(value),Math.max(8,usable)) as string[];
    return lines.slice(0,3);
   });
   const lines=Math.max(...cells.map(c=>c.length),1);
   const height=Math.max(11,lines*4.3+5);
   if(y+height>MAXY){topNewPage();header()}
   if(n%2===0){fill(doc,C.paper);doc.rect(X,y,INNER,height,"F")}
   line(doc,C.border);doc.setLineWidth(.15);doc.line(X,y+height,WIDTH-X,y+height);
   cells.forEach((lines,i)=>{
    doc.setFont("helvetica",i===0?"bold":"normal");doc.setFontSize(7.8);
    const color=i===headers.length-1&&row.tone==="negative"?C.negative:
     i===headers.length-1&&row.tone==="positive"?C.green:i===0?C.navy:C.muted;
    text(doc,color);
    lines.forEach((t,index)=>doc.text(t,alignRight.includes(i)?lefts[i]+widths[i]-3:lefts[i]+3,y+6.8+index*4.3,{align:alignRight.includes(i)?"right":"left"}));
   });
   y+=height;
  });
  y+=8;
 };
 // Executive cover: a bespoke dark-ink stripe with gold and mint accents.
 fill(doc,C.navy);doc.roundedRect(X,12,INNER,49,4,4,"F");
 fill(doc,C.green);doc.roundedRect(X+8,20,12,12,3,3,"F");
 doc.setFont("helvetica","bold");doc.setFontSize(17);text(doc,C.white);
 doc.text("F",X+14,28.8,{align:"center"});
 fill(doc,C.sand);doc.circle(X+17.5,22.4,1.2,"F");
 doc.setFontSize(10);doc.text("FINORA",X+25,26);
 doc.setFont("helvetica","normal");doc.setFontSize(7.7);text(doc,[174,209,201]);
 doc.text("FINANCIAL INTELLIGENCE  /  PRIVATE RECORD",X+25,33);
 doc.setFont("helvetica","bold");doc.setFontSize(17);text(doc,C.white);
 doc.text("Monthly financial statement",X+8,46.5);
 doc.setFontSize(8);doc.setFont("helvetica","normal");text(doc,[188,216,209]);
 const period=new Date(data.month+"-01T12:00:00Z").toLocaleDateString("en-US",{month:"long",year:"numeric",timeZone:"UTC"});
 doc.text(safe(data.workspaceName).slice(0,66)+"  |  "+period+"  |  "+data.currency,X+8,54.2);
 y=69;
 const summary=[
  {label:"INCOME",value:data.income,color:C.green},
  {label:"EXPENSES",value:data.expenses,color:C.negative},
  {label:"NET CASH FLOW",value:data.net,color:data.net>=0?C.navy:C.negative}
 ];
 const cw=(INNER-8)/3;
 summary.forEach((v,i)=>{
  const x=X+i*(cw+4);fill(doc,C.paper);doc.roundedRect(x,y,cw,29,3,3,"F");
  line(doc,C.border);doc.roundedRect(x,y,cw,29,3,3,"S");
  fill(doc,v.color);doc.roundedRect(x+4,y+5,2,7,1,1,"F");
  doc.setFont("helvetica","bold");doc.setFontSize(7.1);text(doc,C.muted);doc.text(v.label,x+9,y+10);
  doc.setFontSize(11.5);text(doc,C.navy);
  const f=money(v.value,data.currency);const chunk=f.length>20?f.slice(0,20):f;
  doc.text(chunk,x+5,y+22);
 });
 y+=40;
 section("Expenses by category","ACTUAL BOOKED EXPENDITURE");
 const largest=Math.max(1,...data.categories.map(v=>v.value));
 const categoryRows=data.categories.map(c=>({cells:[c.name,money(c.value,data.currency),(c.value/Math.max(1,data.expenses)*100).toFixed(1)+"%"]}));
 table(["CATEGORY","AMOUNT","SHARE"],[99,52,31],categoryRows,[2]);
 if(data.categories.length){
  ensure(17);doc.setFont("helvetica","bold");doc.setFontSize(8);text(doc,C.muted);doc.text("Largest expense category",X+2,y);
  const first=data.categories[0];
  doc.setFont("helvetica","normal");text(doc,C.green);doc.text(safe(first.name).slice(0,55),WIDTH-X,y,{align:"right"});y+=9;
 }
 section("Closing account balances","AS AT END OF REPORTING MONTH");
 table(["ACCOUNT","BALANCE"],[120,62],data.balances.map(v=>({cells:[v.name,money(v.balance,data.currency)],tone:v.balance<0?"negative":"neutral"})),[1]);
 section("Detailed transaction register",data.transactions.length+" TRANSACTIONS");
 const tx=[...data.transactions].sort((a,b)=>a.date.localeCompare(b.date));
 table(["DATE","TYPE","CATEGORY","DETAIL","AMOUNT"],[24,23,34,59,42],tx.map(t=>({
  cells:[t.date,t.type.replace("_"," "),t.category,t.description,(t.type==="expense"||t.type==="debt_out"?"-":"")+money(t.amount,data.currency)],
  tone:t.type==="expense"||t.type==="debt_out"?"negative":t.type==="income"||t.type==="debt_in"?"positive":"neutral"
 })),[4]);
 section("Subscription commitments","PLANNED  /  NOT BOOKED AS EXPENSES");
 const subActive=data.subscriptions.filter(s=>s.status==="active"||s.status==="trial");
 const metrics=subscriptionMetrics(subActive);
 ensure(22);fill(doc,C.mint);doc.roundedRect(X,y,INNER,17,2.5,2.5,"F");
 doc.setFont("helvetica","bold");doc.setFontSize(8);text(doc,C.navy);
 doc.text("Estimated monthly: "+money(metrics.monthlyCost,data.currency),X+5,y+10);
 doc.text("Annual: "+money(metrics.annualCost,data.currency),WIDTH-X-5,y+10,{align:"right"});y+=23;
 table(["SERVICE / PLAN","CYCLE","NEXT DATE","PER CYCLE"],[73,33,33,43],subActive.map(s=>({
  cells:[s.provider+" · "+s.plan,s.cycle,s.nextRenewal,money(s.amount,data.currency)]
 })),[3]);
 ensure(20);
 doc.setFont("helvetica","italic");doc.setFontSize(7.5);text(doc,C.muted);
 doc.text("Subscription commitments are forecasts; only payments entered in the ledger count as expenses.",X,y);
 footer();
}
