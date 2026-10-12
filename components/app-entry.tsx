"use client";
import {useEffect,useState,type ReactNode} from "react";
import Link from "next/link";
import {ArrowRight,BriefcaseBusiness,Building2,Cloud,HardDrive,LockKeyhole,PlayCircle,UserRound} from "lucide-react";
import {getSupabase} from "@/lib/supabase";
import {useStorage} from "@/components/storage-provider";
import {useFinance} from "@/lib/finance-store";
import type {WorkspaceKind} from "@/lib/models";
type Access="checking"|"none"|"demo"|"local"|"signed";
const ACCESS_KEY="finora-entry-choice";
export function AppEntry({children}:{children:ReactNode}){
 const [access,setAccess]=useState<Access>("checking");
 const [starting,setStarting]=useState(false);
 const [workspaceKind,setWorkspaceKind]=useState<WorkspaceKind>("personal");
 const [name,setName]=useState("");
 const store=useFinance();
 const storage=useStorage();
 const allDemo=store.workspaces.length>0&&store.workspaces.every(w=>w.demo);
 useEffect(()=>{
  let alive=true;
  const params=new URLSearchParams(window.location.search);
  const requested=params.get("demo")==="1"?"demo":params.get("mode")==="local"?"local":null;
  if(requested){
   sessionStorage.setItem(ACCESS_KEY,requested);
   if(requested==="demo"&&useFinance.getState().workspaces.some(w=>w.id==="demo-personal")){
    useFinance.getState().select("demo-personal");
   }
   window.history.replaceState(null,"",window.location.pathname);setAccess(requested);return;
  }
  const saved=sessionStorage.getItem(ACCESS_KEY);
  const cloud=getSupabase();
  if(!cloud){setAccess(saved==="demo"||saved==="local"?saved:"none");return}
  cloud.auth.getUser().then(({data})=>{
   if(!alive)return;
   // A verified sign-in takes precedence over a stale, tab-local demo preference.
   setAccess(data.user?"signed":saved==="demo"||saved==="local"?saved:"none");
  }).catch(()=>{if(alive)setAccess(saved==="demo"||saved==="local"?saved:"none")});
  return()=>{alive=false};
 },[]);
 const choose=(choice:"demo"|"local")=>{sessionStorage.setItem(ACCESS_KEY,choice);setAccess(choice);setStarting(choice==="demo")};
 const create=()=>{
  store.addWorkspace(name.trim()||({personal:"My finances",freelance:"My independent business",company:"My company"} as const)[workspaceKind],workspaceKind);
  sessionStorage.setItem("finora-workspace-started","1");
  setStarting(true);
 };
 if(access==="checking"||(access==="signed"&&storage.mode!=="local"&&!storage.ready))return <div className="boot-screen"><span className="boot-logo">f<span>.</span></span><p>Opening Finora…</p></div>;
 if(access==="none")return <main className="entry-screen"><div className="entry-panel"><Link className="auth-brand" href="/"><span className="auth-brand-icon">f.</span> finora.</Link><span className="entry-eyebrow">YOUR FINANCIAL HOME</span><h1>Your money belongs to you.</h1><p>Sign in for a personal account, or continue privately using local browser storage. A demo is available if you want to explore first.</p><div className="entry-actions"><Link className="entry-primary" href="/signup">Create your account <ArrowRight size={18}/></Link><Link className="entry-outline" href="/login">Sign in</Link><button onClick={()=>choose("local")}><HardDrive size={18}/> Continue locally without an account</button><button onClick={()=>choose("demo")}><PlayCircle size={18}/> Explore sample dashboard</button></div></div></main>;
 if(allDemo&&!starting&&access!=="demo"&&sessionStorage.getItem("finora-workspace-started")!=="1")return <main className="entry-screen"><div className="entry-panel entry-onboarding"><Link className="auth-brand" href="/"><span className="auth-brand-icon">f.</span> finora.</Link><span className="entry-eyebrow">MAKE FINORA YOURS</span><h1>Set up your first workspace.</h1><p>Choose the finances you want to manage. We'll create an empty workspace; your sample data will remain separate.</p><div className="onboarding-types">{([{id:"personal",name:"Personal",icon:UserRound},{id:"freelance",name:"Auto-entrepreneur",icon:BriefcaseBusiness},{id:"company",name:"Company",icon:Building2}] as const).map(({id,name:label,icon:Icon})=><button key={id} className={workspaceKind===id?"active":""} onClick={()=>setWorkspaceKind(id)}><Icon size={21}/>{label}</button>)}</div><label className="onboarding-label">Workspace name<input value={name} onChange={e=>setName(e.target.value)} maxLength={80} placeholder="e.g. My finances"/></label><button className="entry-primary" onClick={create}>Create workspace <ArrowRight size={18}/></button><button className="entry-text-btn" onClick={()=>choose("demo")}>Explore the demo instead →</button></div></main>;
 return <>{children}</>;
}
