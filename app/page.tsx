"use client";
import {useEffect,useState} from "react";
import {Activity,ArrowRight,BookOpen,BriefcaseBusiness,Building2,CalendarDays,ChartNoAxesCombined,ChevronDown,Command,FileChartColumn,Landmark,LayoutDashboard,Menu,Moon,Plus,Settings2,ShieldCheck,Sun,Target,UserRound,WalletCards,X} from "lucide-react";
import {useFinance} from "@/lib/finance-store";
import {Overview} from "@/components/overview";
import {Transactions} from "@/components/transactions";
import {Planning} from "@/components/planning";
import {Accounts} from "@/components/accounts";
import {Investments} from "@/components/investments";
import {Reports} from "@/components/reports";
import {Zakat} from "@/components/zakat";
import {Workspaces} from "@/components/workspaces";
import {formatMoney} from "@/lib/models";

const links=[
 {name:"Overview",icon:LayoutDashboard,group:"WORKSPACE"},
 {name:"Transactions",icon:Activity,group:"WORKSPACE"},
 {name:"Planning",icon:Target,group:"WORKSPACE"},
 {name:"Accounts",icon:WalletCards,group:"WORKSPACE"},
 {name:"Investments",icon:ChartNoAxesCombined,group:"INSIGHTS"},
 {name:"Reports",icon:FileChartColumn,group:"INSIGHTS"},
 {name:"Zakat",icon:BookOpen,group:"INSIGHTS"},
 {name:"Workspaces",icon:Settings2,group:"MANAGE"}
];
const label=(name:string)=>name==="Reports"?"Reports & Bilan":name==="Zakat"?"Zakat Planner":name;
export default function FinanceApp(){
 const [mounted,setMounted]=useState(false),[nav,setNav]=useState("Overview"),[drawer,setDrawer]=useState(false);
 const [dark,setDark]=useState(false);
 const s=useFinance();
 useEffect(()=>setMounted(true),[]);
 useEffect(()=>{if(mounted){document.documentElement.dataset.theme=dark?"dark":"light"}},[mounted,dark]);
 if(!mounted)return <div className="boot-screen"><span className="boot-logo">f<span>.</span></span><p>Preparing your financial command center…</p></div>;
 const w=s.workspaces.find(x=>x.id===s.activeId)||s.workspaces[0];
 const navigate=(screen:string)=>{setNav(screen);setDrawer(false);window.scrollTo({top:0,behavior:"smooth"})};
 const navIcon=(kind:string)=>kind==="personal"?<UserRound size={16}/>:kind==="freelance"?<BriefcaseBusiness size={16}/>:<Building2 size={16}/>;
 return <div className="app-shell">
 <aside className={"side-panel "+(drawer?"side-open":"")}>
  <div className="wordmark"><div className="wordmark-symbol"><span>f</span><i/></div><span>finora<span className="brand-period">.</span></span><button className="mobile-close" onClick={()=>setDrawer(false)} aria-label="Close navigation"><X size={20}/></button></div>
  <div className="workspace-caption">ACTIVE WORKSPACE</div>
  <div className="workspace-switch"><div className="switch-icon">{navIcon(w.kind)}</div><div className="flex-fill"><strong>{w.name}</strong><small>{w.kind==="freelance"?"Auto-entrepreneur":w.kind==="company"?"Company":"Personal"} · {w.currency}</small></div><ChevronDown size={15}/>
   <select aria-label="Switch workspace" title="Switch workspace" value={w.id} onChange={e=>s.select(e.target.value)}>{s.workspaces.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
  <div className="side-scroll">{["WORKSPACE","INSIGHTS","MANAGE"].map(group=><div className="nav-group" key={group}><div className="nav-group-title">{group}</div>{links.filter(x=>x.group===group).map(x=><button className={"side-link "+(nav===x.name?"active":"")} key={x.name} onClick={()=>navigate(x.name)}><x.icon size={18} strokeWidth={1.9}/><span>{label(x.name)}</span>{nav===x.name&&<span className="active-indicator"/>}</button>)}</div>)}</div>
  <div className="sidebar-foot"><div className="sidebar-tip"><ShieldCheck size={20}/><b>Your financial space</b><p>Your data is stored locally in this version. Export a backup regularly.</p></div><div className="profile"><div className="profile-avatar">F</div><div><b>Finora workspace</b><small>Local-first preview</small></div></div></div>
 </aside>
 {drawer&&<button className="drawer-shade" aria-label="Close menu" onClick={()=>setDrawer(false)}/>}
 <div className="body-wrap"><header className="top-bar"><div className="top-breadcrumb"><button className="mobile-menu" aria-label="Open menu" onClick={()=>setDrawer(true)}><Menu size={22}/></button><span>My workspace</span><ArrowRight size={14}/><strong>{label(nav)}</strong></div><div className="top-actions"><span className="top-date"><CalendarDays size={16}/>{new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span><span className="local-badge"><span/> {w.demo?"Demo mode":"Local mode"}</span><button className="icon-outline" aria-label="Toggle theme" onClick={()=>setDark(v=>!v)}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button><div className="top-avatar">F</div></div></header>
 <main className="content-area"><div className="content-top"><div><span className="overline">FINORA / YOUR FINANCIAL COMMAND CENTER</span><h1>{label(nav)}</h1></div><div className="top-utility"><span className="mini-badge">{w.currency}</span><span className="mini-badge">{w.kind==="personal"?"Personal":w.kind==="company"?"Business":"Independent"}</span></div></div>
 {nav==="Overview"&&<Overview navigate={navigate} openNew={()=>navigate("Transactions")}/>}
 {nav==="Transactions"&&<Transactions/>}
 {nav==="Planning"&&<Planning/>}
 {nav==="Accounts"&&<Accounts/>}
 {nav==="Investments"&&<Investments/>}
 {nav==="Reports"&&<Reports/>}
 {nav==="Zakat"&&<Zakat/>}
 {nav==="Workspaces"&&<Workspaces/>}
 </main><footer className="main-footer"><span>© 2026 Finora · Make every decision count.</span><span>Local preview · Not financial, tax or religious advice</span></footer></div></div>;
}
