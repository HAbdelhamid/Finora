"use client";
import {useState} from "react";
import {ArrowDownLeft,ArrowUpRight,Download,FileSpreadsheet,FileText} from "lucide-react";
import {useFinance} from "@/lib/finance-store";
import {categoryColors,formatMoney} from "@/lib/models";
import {monthlySeries,monthReport,taxEstimate,workspaceItems} from "@/lib/ledger";
import {CashFlowChart,Card,Metric} from "./widgets";
import {useFinoraUi} from "@/components/ui/finora-feedback";

const cell=(value:string|number)=>{
 const raw=String(value),safe=/^[=+@\-\t\r]/.test(raw)?"'"+raw:raw;
 return '"'+safe.replaceAll('"','""')+'"';
};
function download(name:string,content:string,mime:string){
 const url=URL.createObjectURL(new Blob(["\ufeff",content],{type:mime+";charset=utf-8"}));
 const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function Reports(){
 const s=useFinance(),w=s.workspaces.find(x=>x.id===s.activeId)!,d=workspaceItems(s,w.id);
 const {notify}=useFinoraUi();
 const [month,setMonth]=useState(new Date().toISOString().slice(0,7));
 const report=monthReport(s,w.id,month),annual=taxEstimate(w,d.transactions,month.slice(0,4));
 const file="finora-"+w.kind+"-"+month;
 const csv=()=>{
  const lines=[["Date","Type","Category","Description","Amount","Currency","Account"],...report.transactions.map(t=>[t.date,t.type,t.category,t.description,t.amount,w.currency,d.accounts.find(a=>a.id===t.accountId)?.name||""])];
  download(file+".csv",lines.map(line=>line.map(cell).join(",")).join("\r\n"),"text/csv");
 };
 const pdf=async()=>{
  try {
   const {jsPDF}=await import("jspdf");
   const {buildPremiumStatement}=await import("@/lib/premium-pdf");
   const doc=new jsPDF({unit:"mm",format:"a4"});
   buildPremiumStatement(doc,{
    workspaceName:w.name,kind:w.kind,currency:w.currency,month,
    income:report.income,expenses:report.expense,net:report.net,
    categories:report.expensesByCategory,balances:report.balances,
    transactions:report.transactions,accountNames:Object.fromEntries(d.accounts.map(a=>[a.id,a.name])),
    subscriptions:d.subscriptions
   });
   doc.save(file+".pdf");
   notify("Premium monthly statement downloaded.","success");
  } catch {
   notify("Unable to generate the report. Please try again.","error");
  }
 };
 return <div className="page-stack"><div className="section-intro"><h2>Reports & statements</h2><p>Your complete monthly financial bilan, with exports ready for your accountant or personal archive.</p></div>
 <Card tourId="reports" title="Monthly financial bilan" subtitle="Choose a reporting period and export your records" action={<input className="month-input" aria-label="Report month" type="month" value={month} onChange={e=>setMonth(e.target.value)}/>}>
 <div className="report-actions"><button className="btn btn-primary" onClick={pdf}><FileText size={17}/> Export PDF</button><button className="btn btn-outline" onClick={csv}><FileSpreadsheet size={17}/> Download CSV</button></div>
 <div className="report-summary"><div><span>Revenue</span><strong className="value-in">{formatMoney(report.income,w.currency)}</strong></div><div><span>Expenses</span><strong className="value-out">{formatMoney(report.expense,w.currency)}</strong></div><div><span>Net result</span><strong>{formatMoney(report.net,w.currency)}</strong></div></div>
 <div className="form-layout"><div><h4 className="minor-title">Spending categories</h4>{report.expensesByCategory.length?report.expensesByCategory.map((x,i)=><div className="allocation" key={x.name}><span><i style={{background:categoryColors[i%categoryColors.length]}}/>{x.name}</span><b>{formatMoney(x.value,w.currency)}</b></div>):<div className="empty-state">No expenses this month.</div>}</div><div><h4 className="minor-title">Closing account balances</h4>{report.balances.map(x=><div className="allocation" key={x.name}><span>{x.name}</span><b>{formatMoney(x.balance,w.currency)}</b></div>)}</div></div>
 </Card>
 <div className="viz-grid"><Card title="Twelve-month trend" subtitle="Visualize how cash flow changes over time"><CashFlowChart rows={monthlySeries(d.transactions)} currency={w.currency}/></Card><Card title="Tax estimation" subtitle="Configurable scenario — not a tax return">
 <div className="estimate-info"><span>Jurisdiction</span><b>{w.country}</b></div><div className="estimate-info"><span>Reporting year</span><b>{month.slice(0,4)}</b></div><div className="estimate-info"><span>Calculation basis</span><b>{w.taxBasis==="revenue"?"Gross revenue":"Positive profit"}</b></div><div className="estimate-info"><span>Entered rate</span><b>{w.taxRate}%</b></div><div className="estimate-info"><span>Annual base</span><b>{formatMoney(annual.basis,w.currency)}</b></div><div className="tax-total"><span>Illustrative estimated tax</span><strong>{w.taxRate>0?formatMoney(annual.estimate,w.currency):"Not configured"}</strong></div>
 <p className="disclaimer">Tax rates depend on jurisdiction, eligibility, activity, thresholds, deductions and filing period. Configure your own rate under Workspaces and verify with a qualified professional. Finora cannot file taxes.</p></Card></div>
 </div>;
}
