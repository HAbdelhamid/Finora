"use client";
import {Cloud,CloudOff,HardDrive,RefreshCw,ShieldCheck,CloudDownload,CloudUpload,AlertTriangle,LogOut,CheckCircle2,ExternalLink} from "lucide-react";
import {useStorage} from "./storage-provider";
import {Card} from "./widgets";
import type {StorageMode} from "@/lib/cloud-storage";
const modes:{id:StorageMode;name:string;description:string;icon:"local"|"cloud"|"hybrid"}[]=[
 {id:"local",name:"On this browser",description:"Keep records on this device in browser storage. No account or server required.",icon:"local"},
 {id:"cloud",name:"Secure cloud",description:"Save your finance records to your private Supabase database. Login is required; financial snapshots are not stored locally.",icon:"cloud"},
 {id:"hybrid",name:"Both · synced",description:"Use this browser and your private cloud account, with revision-checked syncing and conflict review.",icon:"hybrid"}
];
export function StorageSettings(){
 const sync=useStorage();
 const Icon=({type}:{type:string})=>type==="local"?<HardDrive size={22}/>:type==="hybrid"?<RefreshCw size={22}/>:<Cloud size={22}/>;
 return <div className="page-stack"><div className="section-intro"><h2>Storage & identity</h2><p>Choose where your information lives. You stay in control, with no surprise uploads.</p></div>
 <Card tourId="storage" title="Where should we save your finances?" subtitle="Your selection applies to all Finora workspaces on this browser.">
 <div className="storage-modes">{modes.map(m=><button className={"storage-mode "+(sync.mode===m.id?"selected":"")} key={m.id} onClick={()=>void sync.chooseMode(m.id)}><div className="storage-mode-icon"><Icon type={m.icon}/></div><div><strong>{m.name}</strong><p>{m.description}</p></div><span className="storage-choice">{sync.mode===m.id?<CheckCircle2 size={18}/>:<span/>}</span></button>)}</div>
 <div className="info-strip"><ShieldCheck size={18}/><span>Browser storage isn't a file on your C: drive and may be cleared by the browser. Download JSON backups regularly. Cloud-only requires a working connection for durable saves; hybrid is better if you need to work offline.</span></div>
 </Card>
 <div className="form-layout"><Card title="Your account" subtitle="Google or email sign-in through Supabase Auth">
 {sync.user?<div className="account-identity"><div className="identity-icon">{sync.user.email?.slice(0,1).toUpperCase()||"G"}</div><div className="flex-fill"><strong>{sync.user.user_metadata?.full_name||"Signed in"}</strong><small>{sync.user.email||"Google account"}</small></div><span className="mini-badge">Connected</span></div>:<div className="account-identity"><div className="identity-icon"><CloudOff size={20}/></div><div><strong>Not signed in</strong><small>Local tracking works without an account</small></div></div>}
 {sync.configured?<div className="storage-actions">{sync.user?<button className="btn btn-outline" onClick={()=>void sync.signOut()}><LogOut size={17}/> Sign out</button>:<><button className="btn btn-primary" onClick={()=>void sync.signIn()}>Continue with Google</button><a className="btn btn-outline" href="/login">Sign in with email</a></>}</div>:<div className="notice-warning"><AlertTriangle size={18}/> Cloud sign-in is not configured yet. Set your Supabase environment variables and Google provider credentials before enabling remote storage.</div>}
 <p className="field-help">Finora uses Google OAuth, similar to Rolevia's sign-in flow, but financial data authorization is enforced using Supabase Auth and per-user PostgreSQL Row Level Security.</p></Card>
 <Card title="Sync health" subtitle="Status and conflict-safe cloud revision tracking">
 <div className="sync-status"><span className={"sync-dot "+sync.status}/><div className="flex-fill"><strong>{({
 local:"Local-only · nothing uploaded",
 "sign-in-required":"Google sign-in required",
 loading:"Loading cloud data…",
 syncing:"Uploading changes…",
 synced:"Saved and in sync",
 offline:"Cloud unavailable or save failed",
 conflict:"Different local and cloud versions"
 } as Record<string,string>)[sync.status]}</strong><small>{sync.mode==="local"?"All updates stay in this browser.":sync.mode==="hybrid"?"Changes are stored here and submitted after a short delay.":"Cloud-only mode does not keep financial snapshots on the device."}</small></div></div>
 {sync.error&&<div className="notice-warning"><AlertTriangle size={17}/>{sync.error}</div>}
 <button className="btn btn-outline" disabled={sync.mode==="local"||!sync.user||!sync.ready||sync.status==="syncing"||!!sync.conflict} onClick={()=>void sync.syncNow()}><RefreshCw size={16}/> Sync now</button>
 {sync.status==="offline"&&<p className="field-help">Cloud-only changes may not survive a refresh while the connection is down. Export your data before closing this tab, or switch to hybrid mode once the connection returns.</p>}
 </Card></div>
 {sync.conflict&&<Card title="Choose which financial version to keep" subtitle="A different snapshot already exists in your account. Finora will never overwrite it without your choice."><div className="notice-warning"><AlertTriangle size={18}/> This is a complete-snapshot choice, not an automatic field-by-field merge. Export a backup of either version before replacing it.</div><div className="storage-actions"><button className="btn btn-outline" onClick={()=>void sync.resolveConflict("remote")}><CloudDownload size={17}/> Load cloud snapshot</button><button className="btn btn-primary" onClick={()=>void sync.resolveConflict("local")}><CloudUpload size={17}/> Keep this device's snapshot</button></div></Card>}
 </div>;
}
