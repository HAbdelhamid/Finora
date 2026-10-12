import {describe,expect,it} from "vitest";
import {jsPDF} from "jspdf";
import {buildPremiumStatement} from "../lib/premium-pdf";
import type {Transaction} from "../lib/models";

describe("premium monthly PDF statement",()=>{
 const base={
  workspaceName:"My finances",kind:"personal",currency:"MAD",month:"2026-10",
  income:14000,expenses:7200,net:6800,
  categories:[{name:"Housing",value:4200},{name:"Phone & internet",value:1000}],
  balances:[{name:"Current account",balance:13500},{name:"Savings",balance:48000}],
  accountNames:{"test":"Current account"},subscriptions:[]
 };
 it("creates a valid paginated PDF with the finance tables",()=>{
  const transactions:Transaction[]=Array.from({length:100},(_,i)=>({
   id:"t-"+i,workspaceId:"w",accountId:"test",type:i%2===0?"income":"expense",
   amount:i+1,category:i%2===0?"Salary":"Groceries",description:"Monthly transaction with a long description for the ledger "+i,
   date:"2026-10-"+String(i%28+1).padStart(2,"0")
  }));
  const doc=new jsPDF({unit:"mm",format:"a4"});
  expect(()=>buildPremiumStatement(doc,{...base,transactions})).not.toThrow();
  expect(doc.getNumberOfPages()).toBeGreaterThan(1);
  const bytes=doc.output("arraybuffer");
  expect(bytes.byteLength).toBeGreaterThan(3000);
 });
 it("handles empty statements and future subscriptions",()=>{
  const doc=new jsPDF({unit:"mm",format:"a4"});
  expect(()=>buildPremiumStatement(doc,{...base,transactions:[],subscriptions:[{
   id:"sub-1",workspaceId:"w",accountId:"test",name:"AI assistant",provider:"Anthropic",
   plan:"Pro",category:"ai_tools",amount:200,currency:"MAD",conversionRate:1,cycle:"monthly",nextRenewal:"2026-10-20",
   status:"active",autoRenew:true,website:"",notes:""
  }]})).not.toThrow();
  expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
 });
});
