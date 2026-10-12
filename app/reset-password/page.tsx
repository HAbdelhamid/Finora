"use client";
import {useEffect,useState,type FormEvent} from "react";
import Link from "next/link";
import {BrandMark} from "@/components/brand-mark";
import {ArrowRight,CheckCircle2,LockKeyhole} from "lucide-react";
import {getSupabase} from "@/lib/supabase";
export default function ResetPassword(){
 const [ready,setReady]=useState(false),[error,setError]=useState(""),[password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
 useEffect(()=>{let active=true;const cloud=getSupabase();if(!cloud){setError("Authentication is unavailable.");return}
 cloud.auth.getUser().then(({data})=>{if(active){setReady(Boolean(data.user));if(!data.user)setError("Your recovery session has expired. Request a new password reset link.")}}).catch(()=>{if(active)setError("Couldn't verify your recovery session.")});return()=>{active=false}},[]);
 const submit=async(e:FormEvent)=>{e.preventDefault();if(!ready)return;if(password.length<8)return setError("Use a password of at least 8 characters.");if(password!==confirm)return setError("Passwords don't match.");
 setBusy(true);setError("");try{const client=getSupabase();if(!client)throw Error("Authentication isn't configured");const {error}=await client.auth.updateUser({password});if(error)throw error;setDone(true)}catch(e){setError(e instanceof Error?e.message:"Password change failed")}finally{setBusy(false)}
 };
 return <main className="auth-layout auth-reset-layout"><div className="auth-main"><div className="auth-inner"><Link className="auth-brand" href="/"><span className="auth-brand-icon"><BrandMark size={37}/></span> finora.</Link><div className="auth-content"><span className="auth-eyebrow">ACCOUNT SECURITY</span><h1>Choose a new password.</h1><p className="auth-intro">Set a unique password to keep your account protected.</p>{done?<div className="auth-alert auth-success"><CheckCircle2 size={20}/> Password updated successfully. <Link href="/app">Go to Finora →</Link></div>:<form className="auth-form" onSubmit={e=>void submit(e)}><label>New password<div className="auth-input-wrap"><LockKeyhole size={18}/><input type="password" minLength={8} autoComplete="new-password" required value={password} onChange={e=>setPassword(e.target.value)}/></div></label><label>Confirm password<div className="auth-input-wrap"><LockKeyhole size={18}/><input type="password" minLength={8} autoComplete="new-password" required value={confirm} onChange={e=>setConfirm(e.target.value)}/></div></label>{error&&<div className="auth-alert auth-error" role="alert">{error}</div>}<button className="auth-submit" disabled={!ready||busy}>{busy?"Updating…":"Update password"} <ArrowRight size={18}/></button></form>}</div></div></div></main>;
}
