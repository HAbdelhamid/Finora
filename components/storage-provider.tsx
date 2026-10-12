"use client";
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from "react";
import type {User} from "@supabase/supabase-js";
import {getSupabase,cloudConfigured} from "@/lib/supabase";
import {useFinance,getFinoraSnapshot} from "@/lib/finance-store";
import type {FinoraData} from "@/lib/models";
import {commitCloudSnapshot,googleSignIn,loadCloudSnapshot,MODE_KEY,readMode,signOutCloud,type RemoteSnapshot,type StorageMode} from "@/lib/cloud-storage";

type SyncStatus="local"|"sign-in-required"|"loading"|"synced"|"syncing"|"offline"|"conflict";
type Conflict={remote:NonNullable<RemoteSnapshot>;requestedMode:StorageMode};
type Context={
 mode:StorageMode;ready:boolean;configured:boolean;user:User|null;status:SyncStatus;
 error:string;conflict:Conflict|null;chooseMode:(next:StorageMode)=>Promise<void>;
 syncNow:()=>Promise<void>;resolveConflict:(choice:"remote"|"local")=>Promise<void>;
 signIn:()=>Promise<void>;signOut:()=>Promise<void>;
};
const CloudContext=createContext<Context|null>(null);
const SERIALIZED_KEY="finora-v2";
const pack=()=>JSON.stringify({state:getFinoraSnapshot(),version:2});
const fingerprint=(snapshot:FinoraData)=>JSON.stringify(snapshot);

export function StorageProvider({children}:{children:ReactNode}){
 const [mode,setMode]=useState<StorageMode>("local");
 const [user,setUser]=useState<User|null>(null);
 const [configuredReady,setConfiguredReady]=useState(false);
 const [ready,setReady]=useState(true);
 const [status,setStatus]=useState<SyncStatus>("local");
 const [error,setError]=useState("");
 const [conflict,setConflict]=useState<Conflict|null>(null);
 const modeRef=useRef<StorageMode>("local"),revRef=useRef(0),lastSyncedRef=useRef("");
 const lockRef=useRef(false),suspendRef=useRef(false),timerRef=useRef<ReturnType<typeof setTimeout>|null>(null);

 const commitMode=(next:StorageMode)=>{
  if(next==="cloud")window.localStorage.removeItem(SERIALIZED_KEY);
  else window.localStorage.setItem(SERIALIZED_KEY,pack());
  window.localStorage.setItem(MODE_KEY,next);
  modeRef.current=next;setMode(next);
 };
 useEffect(()=>{
  const fromDisk=readMode();modeRef.current=fromDisk;setMode(fromDisk);setConfiguredReady(true);
  const client=getSupabase();if(!client)return;
  let alive=true;
  client.auth.getUser().then(({data})=>{if(alive)setUser(data.user)}).catch(()=>{if(alive)setUser(null)});
  const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>{if(alive)setUser(session?.user??null)});
  return()=>{alive=false;subscription.unsubscribe()};
 },[]);

 useEffect(()=>{
  if(!configuredReady)return;
  if(mode==="local"){setReady(true);setStatus("local");return}
  if(!user){setReady(false);setStatus("sign-in-required");return}
  let cancelled=false;
  const bootstrap=async()=>{
   suspendRef.current=true;setReady(false);setError("");setStatus("loading");
   try{
    const remote=await loadCloudSnapshot(user.id);
    if(cancelled)return;
    const local=getFinoraSnapshot();
    if(remote){
     revRef.current=remote.revision;
     lastSyncedRef.current=fingerprint(remote.snapshot);
     if(mode==="hybrid"&&fingerprint(local)!==lastSyncedRef.current){
      setConflict({remote,requestedMode:mode});setStatus("conflict");
      return;
     }
     useFinance.getState().restore(remote.snapshot);
     setStatus("synced");setReady(true);
    }else{
     const response=await commitCloudSnapshot(0,local);
     if(cancelled)return;
     if(response.conflict){setError("Your cloud storage changed while loading. Refresh and choose which version to keep.");setStatus("conflict");return}
     revRef.current=response.revision;lastSyncedRef.current=fingerprint(local);
     setStatus("synced");setReady(true);
    }
   }catch(e){if(!cancelled){setError(e instanceof Error?e.message:"Cloud connection failed.");setStatus("offline");if(mode==="hybrid")setReady(true)}}
   finally{if(!cancelled)suspendRef.current=false}
  };
  void bootstrap();
  return()=>{cancelled=true;suspendRef.current=false};
 },[configuredReady,mode,user?.id]);

 const syncNow=useCallback(async()=>{
  if(mode==="local"||!user||!ready||conflict||lockRef.current||suspendRef.current)return;
  const snapshot=getFinoraSnapshot(),hash=fingerprint(snapshot);
  if(hash===lastSyncedRef.current){setStatus("synced");return}
  lockRef.current=true;setStatus("syncing");setError("");
  let successful=false;
  try{
   const result=await commitCloudSnapshot(revRef.current,snapshot);
   if(result.conflict){
    const remote=await loadCloudSnapshot(user.id);
    if(remote){setConflict({remote,requestedMode:mode});setStatus("conflict");}
    else{setStatus("offline");setError("Cloud changed unexpectedly; nothing was overwritten.");}
   }else{revRef.current=result.revision;lastSyncedRef.current=hash;successful=true;setStatus("synced");}
  }catch(e){setError(e instanceof Error?e.message:"Could not save to cloud.");setStatus("offline")}
  finally{
   lockRef.current=false;
   // If another edit landed during the network request, queue it after the
   // successful commit. Never retry automatically after a conflict or error.
   if(successful&&fingerprint(getFinoraSnapshot())!==hash){
    if(timerRef.current)clearTimeout(timerRef.current);
    timerRef.current=setTimeout(()=>{void syncNow()},1100);
   }
  }
 },[mode,user?.id,ready,conflict]);

 useEffect(()=>{
  if(mode==="local"||!user||!ready||conflict)return;
  const unsubscribe=useFinance.subscribe(()=>{
   if(suspendRef.current)return;
   if(timerRef.current)clearTimeout(timerRef.current);
   timerRef.current=setTimeout(()=>{void syncNow()},1100);
  });
  return()=>{unsubscribe();if(timerRef.current)clearTimeout(timerRef.current)};
 },[mode,user?.id,ready,conflict,syncNow]);

 const chooseMode=async(next:StorageMode)=>{
  if(next===mode)return;
  setError("");
  if(next==="local"){commitMode("local");setConflict(null);setStatus("local");setReady(true);return}
  if(!cloudConfigured){setError("Cloud setup is unavailable. Configure Supabase and Google sign-in first.");return}
  if(!user){setError("Sign in with Google before choosing cloud or hybrid storage.");return}
  setStatus("loading");
  try{
   const remote=await loadCloudSnapshot(user.id);
   const local=getFinoraSnapshot(),hash=fingerprint(local);
   if(remote&&fingerprint(remote.snapshot)!==hash){
    setConflict({remote,requestedMode:next});setStatus("conflict");return;
   }
   if(remote){revRef.current=remote.revision;lastSyncedRef.current=hash;}
   else{
    const saved=await commitCloudSnapshot(0,local);
    if(saved.conflict){setError("A new cloud snapshot appeared. Please retry.");setStatus("conflict");return}
    revRef.current=saved.revision;lastSyncedRef.current=hash;
   }
   commitMode(next);setStatus("synced");setReady(true);
  }catch(e){setError(e instanceof Error?e.message:"Could not connect.");setStatus(mode==="local"?"local":"offline")}
 };

 const resolveConflict=async(choice:"remote"|"local")=>{
  const pending=conflict;if(!pending)return;
  setError("");setStatus("syncing");
  try{
   if(choice==="local"){
    const snapshot=getFinoraSnapshot();
    const saved=await commitCloudSnapshot(pending.remote.revision,snapshot);
    if(saved.conflict){
     const newest=await loadCloudSnapshot(user!.id);
     if(newest)setConflict({remote:newest,requestedMode:pending.requestedMode});
     setError("The cloud changed again. Review both versions before retrying.");
     setStatus("conflict");return;
    }
    revRef.current=saved.revision;lastSyncedRef.current=fingerprint(snapshot);
   }else{
    // Replace only after explicit choice. Cloud-only removes finance browser cache.
    commitMode(pending.requestedMode);
    suspendRef.current=true;
    useFinance.getState().restore(pending.remote.snapshot);
    suspendRef.current=false;
    revRef.current=pending.remote.revision;lastSyncedRef.current=fingerprint(pending.remote.snapshot);
   }
   if(choice==="local")commitMode(pending.requestedMode);
   setConflict(null);setReady(true);setStatus("synced");
  }catch(e){suspendRef.current=false;setError(e instanceof Error?e.message:"Conflict resolution failed.");setStatus("conflict")}
 };

 const signIn=async()=>{try{setError("");await googleSignIn()}catch(e){setError(e instanceof Error?e.message:"Sign-in failed.")}};
 const signOut=async()=>{try{
  if(mode==="cloud"&&status==="offline")return setError("Unsaved cloud-only changes may exist. Export a backup before signing out.");
  await signOutCloud();setUser(null);revRef.current=0;lastSyncedRef.current="";
  if(mode==="cloud"){suspendRef.current=true;useFinance.getState().reset();suspendRef.current=false}
 }catch(e){setError(e instanceof Error?e.message:"Sign out failed.")}};
 const blocked=mode==="cloud"&&(!user||!ready);
 return <CloudContext.Provider value={{mode,ready,configured:cloudConfigured,user,status,error,conflict,chooseMode,syncNow,resolveConflict,signIn,signOut}}>
  {children}
  {conflict&&<div className="cloud-lock" role="dialog" aria-modal="true" aria-label="Cloud sync conflict">
   <div className="cloud-lock-card"><div className="lock-mark">!</div><h2>Two different finance versions</h2>
    <p>Your browser and Google account contain different records. Nothing has been overwritten. Export a copy before choosing which complete snapshot to keep.</p>
    <button className="btn btn-outline" onClick={()=>{
     const url=URL.createObjectURL(new Blob([JSON.stringify(getFinoraSnapshot(),null,2)],{type:"application/json"}));
     const a=document.createElement("a");a.href=url;a.download="finora-local-before-conflict.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }}>Download this browser's backup</button>
    <button className="btn btn-outline" onClick={()=>{
     const url=URL.createObjectURL(new Blob([JSON.stringify(conflict.remote.snapshot,null,2)],{type:"application/json"}));
     const a=document.createElement("a");a.href=url;a.download="finora-cloud-before-conflict.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }}>Download cloud backup</button>
    <button className="btn btn-primary" onClick={()=>void resolveConflict("remote")}>Load cloud version on this device</button>
    <button className="btn btn-outline" onClick={()=>void resolveConflict("local")}>Replace cloud with this device's version</button>
    {error&&<p className="warning-text">{error}</p>}
   </div></div>}
  {!conflict&&blocked&&<div className="cloud-lock" role="status"><div className="cloud-lock-card"><div className="lock-mark">f.</div><h2>{!user?"Your cloud workspace is locked":"Opening your cloud vault"}</h2><p>{!user?"Sign in with Google to access your saved workspaces and transactions. Your data is private to your account.":status==="loading"?"Fetching your encrypted-transport cloud snapshot…":error||"Choose a version to continue."}</p>{!user&&<button className="btn btn-primary" onClick={()=>void signIn()}>Sign in with Google</button>}<button className="btn btn-outline" onClick={()=>void chooseMode("local")}>Use this browser instead</button>{error&&<p className="warning-text">{error}</p>}</div></div>}
 </CloudContext.Provider>;
}
export function useStorage(){const value=useContext(CloudContext);if(!value)throw Error("StorageProvider is missing");return value}
