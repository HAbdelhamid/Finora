import type { FinoraData, Transaction, Workspace } from "./models";
import { defaultZakat } from "./models";

const personal:Workspace={id:"demo-personal",name:"Personal life",kind:"personal",currency:"MAD",country:"MA",monthlySalary:10500,taxRate:0,taxBasis:"profit",demo:true,zakat:defaultZakat()};
const freelance:Workspace={id:"demo-freelance",name:"Studio freelance",kind:"freelance",currency:"MAD",country:"MA",monthlySalary:0,taxRate:0,taxBasis:"revenue",demo:true,zakat:defaultZakat()};
const company:Workspace={id:"demo-company",name:"Northstar SARL",kind:"company",currency:"MAD",country:"MA",monthlySalary:0,taxRate:0,taxBasis:"profit",demo:true,zakat:defaultZakat()};

export function makeSeed(anchor=new Date()):FinoraData{
 const transactions:Transaction[]=[];
 for(let n=10;n>=0;n--){
  const d=new Date(anchor.getFullYear(),anchor.getMonth()-n,1);
  const prefix=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-";
  const append=(id:string,accountId:string,type:"income"|"expense",amount:number,category:string,description:string,day:number)=>{
   transactions.push({id:id+"-"+n,workspaceId:"demo-personal",accountId,type,amount,category,description,date:prefix+String(day).padStart(2,"0")});
  };
  append("salary","checking-personal","income",10500,"Salary","Monthly salary",2);
  append("housing","checking-personal","expense",2900,"Housing","Rent",4);
  append("groceries","checking-personal","expense",850+(n%3)*130,"Groceries","Groceries & essentials",8);
  append("utilities","checking-personal","expense",375+(n%2)*45,"Utilities","Electricity & internet",12);
  append("restaurants","checking-personal","expense",260+(n%4)*95,"Restaurants","Coffee & dining",17);
  append("transport","checking-personal","expense",360+(n%2)*80,"Transport","Transport passes",19);
  if(n%3===0)append("bonus","checking-personal","income",1600,"Bonus","Project bonus",21);
  if(n%2===0)append("shopping","checking-personal","expense",480+(n%3)*75,"Shopping","Lifestyle",23);
 }
 return {activeId:personal.id,workspaces:[personal,freelance,company],
 accounts:[{id:"checking-personal",workspaceId:personal.id,name:"Everyday checking",kind:"checking",openingBalance:21500},
 {id:"savings-personal",workspaceId:personal.id,name:"Savings vault",kind:"savings",openingBalance:16500},
 {id:"freelance-bank",workspaceId:freelance.id,name:"Studio account",kind:"checking",openingBalance:0},
 {id:"company-bank",workspaceId:company.id,name:"Business account",kind:"checking",openingBalance:0}],
 transactions,
 budgets:[{id:"budget-housing",workspaceId:personal.id,category:"Housing",limit:3200},
 {id:"budget-groceries",workspaceId:personal.id,category:"Groceries",limit:1600},
 {id:"budget-restaurants",workspaceId:personal.id,category:"Restaurants",limit:850},
 {id:"budget-shopping",workspaceId:personal.id,category:"Shopping",limit:1200},
 {id:"budget-transport",workspaceId:personal.id,category:"Transport",limit:700}],
 goals:[{id:"goal-emergency",workspaceId:personal.id,name:"Emergency fund",target:40000,saved:16400,color:"#37b8aa"},
 {id:"goal-travel",workspaceId:personal.id,name:"Summer travel",target:12000,saved:4200,color:"#6f73df"}],
 investments:[{id:"invest-index",workspaceId:personal.id,name:"Global Index Fund",symbol:"ETF",units:12,costPerUnit:900,pricePerUnit:1030,assetClass:"funds"},
 {id:"invest-stock",workspaceId:personal.id,name:"Equity portfolio",symbol:"EQT",units:5,costPerUnit:800,pricePerUnit:845,assetClass:"stocks"}],
 debts:[{id:"debt-phone",workspaceId:personal.id,name:"Device instalments",direction:"owe",principal:4000,paid:2400}],
 subscriptions:[],
 recurring:[{id:"recur-salary",workspaceId:personal.id,accountId:"checking-personal",name:"Monthly salary",type:"income",amount:10500,category:"Salary",day:2,enabled:true},
 {id:"recur-rent",workspaceId:personal.id,accountId:"checking-personal",name:"Monthly rent",type:"expense",amount:2900,category:"Housing",day:4,enabled:true}]
 };
}
