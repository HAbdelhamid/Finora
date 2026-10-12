import type { User } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";
import { parseSnapshot } from "./finance-store";
import type { FinoraData } from "./models";

export type StorageMode = "local" | "cloud" | "hybrid";
export type RemoteSnapshot = { snapshot: FinoraData; revision: number } | null;
export const MODE_KEY = "finora-storage-mode";
export const MODES:StorageMode[]=["local","cloud","hybrid"];

export function readMode():StorageMode {
 if(typeof window==="undefined")return "local";
 const stored=window.localStorage.getItem(MODE_KEY);
 return stored==="cloud"||stored==="hybrid"?stored:"local";
}

export async function loadCloudSnapshot(userId:string):Promise<RemoteSnapshot>{
 const client=getSupabase();
 if(!client)throw Error("Connect a Supabase project before enabling cloud storage.");
 // Identity is enforced by RLS; userId is only a scoped query filter.
 const {data,error}=await client.from("finance_workspaces").select("data,revision").eq("user_id",userId).maybeSingle();
 if(error)throw Error("Cloud read failed: "+error.message);
 if(!data)return null;
 const parsed=parseSnapshot(data.data);
 if(!parsed)throw Error("The cloud snapshot is invalid. Download and inspect a backup before proceeding.");
 return {snapshot:parsed,revision:Number(data.revision)};
}

export async function commitCloudSnapshot(expectedRevision:number,snapshot:FinoraData):Promise<{revision:number;conflict:boolean}>{
 const client=getSupabase();
 if(!client)throw Error("Supabase configuration is missing.");
 const parsed=parseSnapshot(snapshot);
 if(!parsed)throw Error("Invalid finance data. Remote save cancelled.");
 const {data,error}=await client.rpc("finance_commit_snapshot",{expected_revision:expectedRevision,payload:parsed});
 if(error)throw Error("Cloud save failed: "+error.message);
 const reply=data as {ok?:boolean;conflict?:boolean;revision?:number}|null;
 if(reply?.conflict)return {revision:Number(reply.revision||0),conflict:true};
 const nextRevision=reply?.revision;
 if(!reply?.ok||typeof nextRevision!=="number"||!Number.isInteger(nextRevision))throw Error("Cloud save did not return a valid revision.");
 return {revision:nextRevision,conflict:false};
}

export async function googleSignIn():Promise<void>{
 const client=getSupabase();
 if(!client)throw Error("Supabase is not configured.");
 const {error}=await client.auth.signInWithOAuth({
  provider:"google",
  options:{redirectTo:window.location.origin+"/auth/callback",queryParams:{prompt:"select_account"}}
 });
 if(error)throw Error(error.message);
}

export async function signOutCloud():Promise<void>{
 const client=getSupabase();
 if(!client)return;
 const {error}=await client.auth.signOut();
 if(error)throw Error(error.message);
}
