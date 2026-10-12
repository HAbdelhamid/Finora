"use client";
import {useEffect,useRef,useState} from "react";
import type {User} from "@supabase/supabase-js";
import {LogOut,Settings2,ChevronDown} from "lucide-react";
import {AccountAvatar} from "@/components/account-avatar";
import {accountDisplayName} from "@/lib/account-profile";

export function AccountControls({user,onSettings,onSignOut,error}:{
 user:User|null;onSettings:()=>void;onSignOut:()=>void;error?:string;
}){
 const [open,setOpen]=useState(false);
 const region=useRef<HTMLDivElement>(null);
 const trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(!open)return;
  const dismiss=(event:PointerEvent)=>{if(region.current&&!region.current.contains(event.target as Node))setOpen(false)};
  const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){setOpen(false);trigger.current?.focus()}};
  document.addEventListener("pointerdown",dismiss);
  document.addEventListener("keydown",escape);
  return()=>{document.removeEventListener("pointerdown",dismiss);document.removeEventListener("keydown",escape)};
 },[open]);
 const name=accountDisplayName(user);
 const openSettings=()=>{setOpen(false);onSettings()};
 return <div className="finora-account-controls" ref={region}>
  {user&&<button type="button" className="finora-quick-signout" onClick={()=>{setOpen(true);onSignOut()}} title="Sign out of Finora" aria-label="Sign out of Finora"><LogOut size={17}/><span>Sign out</span></button>}
  <button ref={trigger} type="button" className="top-avatar finora-avatar-trigger" aria-haspopup="menu" aria-expanded={open} aria-label={user?"Account menu for "+name:"Guest account menu"} onClick={()=>setOpen(x=>!x)}>
   <AccountAvatar user={user} size={36}/><ChevronDown className="finora-avatar-chevron" size={12}/>
  </button>
  {open&&<div className="finora-account-menu" role="menu" aria-label="Account options">
   <div className="finora-account-summary"><AccountAvatar user={user} size={43}/><div><strong>{user?name:"Guest workspace"}</strong><small>{user?.email||"Data saved in this browser"}</small></div></div>
   <div className="finora-account-menu-actions">
    <button type="button" role="menuitem" onClick={openSettings}><Settings2 size={17}/> Account & storage</button>
    {user?<button type="button" role="menuitem" className="signout" onClick={onSignOut}><LogOut size={17}/> Sign out</button>:
     <a href="/login" role="menuitem">Sign in to Finora</a>}
   </div>
   {error&&<p className="finora-signout-error" role="alert">{error}</p>}
  </div>}
 </div>;
}
