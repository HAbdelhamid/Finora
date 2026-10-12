"use client";
import {useEffect,useState} from "react";
import type {User} from "@supabase/supabase-js";
import {accountInitials,googleAccountAvatar} from "@/lib/account-profile";

export function AccountAvatar({user,size=36,className=""}:{user:User|null;size?:number;className?:string}){
 const photo=googleAccountAvatar(user);
 const [broken,setBroken]=useState(false);
 useEffect(()=>setBroken(false),[photo]);
 return <span className={"finora-user-avatar "+className} style={{width:size,height:size}} aria-hidden="true">
  {photo&&!broken?
   // Google profile images are from HTTPS Google avatar hosts only.
   // eslint-disable-next-line @next/next/no-img-element
   <img src={photo} alt="" referrerPolicy="no-referrer" width={size} height={size} onError={()=>setBroken(true)}/>:
   <span className="finora-user-initials">{accountInitials(user)}</span>}
 </span>;
}
