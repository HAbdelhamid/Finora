"use client";
import {useEffect,useState,type FormEvent} from "react";
import Link from "next/link";
import {BrandMark} from "@/components/brand-mark";
import {ArrowLeft,ArrowRight,CheckCircle2,Eye,EyeOff,LockKeyhole,Mail,ShieldCheck,Sparkles} from "lucide-react";
import {cloudConfigured,getSupabase} from "@/lib/supabase";
import {googleSignIn} from "@/lib/cloud-storage";

type Mode="login"|"signup"|"forgot";
export function AuthScreen({initialMode}:{initialMode:"login"|"signup"}){
 const [mode,setMode]=useState<Mode>(initialMode);
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [confirmPassword,setConfirmPassword]=useState("");
 const [showPassword,setShowPassword]=useState(false);
 const [fullName,setFullName]=useState("");
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 useEffect(()=>{
  const client=getSupabase();
  let alive=true;
  client?.auth.getUser().then(({data})=>{if(alive&&data.user)window.location.replace("/app")}).catch(()=>{});
  return()=>{alive=false};
 },[]);
 const toggle=(next:Mode)=>{setMode(next);setError("");setMessage("");setPassword("");setConfirmPassword("")};
 const authenticate=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();const client=getSupabase();if(!client){setError("Sign-in isn't configured. You can still explore Finora locally.");return}
  if(loading)return;
  setError("");setMessage("");setLoading(true);
  try{
   const normalized=email.trim().toLowerCase();
   if(mode==="forgot"){
    const {error}=await client.auth.resetPasswordForEmail(normalized,{redirectTo:window.location.origin+"/auth/callback?flow=recovery"});
    if(error)throw error;
    setMessage("If this email is registered, you'll receive a password reset link. Check your inbox.");
   }else if(mode==="signup"){
    if(password.length<8)throw Error("Use a password with at least 8 characters.");
    if(password!==confirmPassword)throw Error("Your passwords don't match.");
    const {data,error}=await client.auth.signUp({email:normalized,password,options:{
     emailRedirectTo:window.location.origin+"/auth/callback",
     data:{full_name:fullName.trim().slice(0,100)}
    }});
    if(error)throw error;
    if(data.session){sessionStorage.removeItem("finora-entry-choice");window.location.replace("/app");return}
    setMessage("Check your email to confirm your account, then sign in. The email may take a minute to arrive.");
   }else{
    const {error}=await client.auth.signInWithPassword({email:normalized,password});
    if(error)throw error;
    sessionStorage.removeItem("finora-entry-choice");window.location.replace("/app");return;
   }
  }catch(e){setError(e instanceof Error?e.message:"Couldn't complete this request. Please try again.")}
  finally{setLoading(false)}
 };
 const google=async()=>{
  if(loading)return;
  setError("");setLoading(true);
  try{await googleSignIn()}catch(e){setError(e instanceof Error?e.message:"Google sign-in could not start.");setLoading(false)}
 };
 return <div className="auth-layout">
  <section className="auth-main"><div className="auth-inner"><Link href="/" className="auth-brand"><span className="auth-brand-icon"><BrandMark size={37}/></span> finora.</Link><div className="auth-content">
   <Link className="auth-back" href="/"><ArrowLeft size={16}/> Back to homepage</Link>
   <span className="auth-eyebrow">{mode==="forgot"?"ACCOUNT RECOVERY":mode==="signup"?"START WITH CLARITY":"WELCOME BACK"}</span>
   <h1>{mode==="signup"?"Make money feel simple.":mode==="forgot"?"Reset your password.":"Welcome back."}</h1>
   <p className="auth-intro">{mode==="signup"?"Create your account, then decide whether to save locally, in the cloud, or both.":mode==="forgot"?"We'll send a password reset link if your email has an account.":"Sign in to access your financial workspace."}</p>
   {mode!=="forgot"&&<><button className="auth-google" type="button" onClick={()=>void google()} disabled={loading}><span className="auth-google-symbol" aria-hidden="true">G</span> Continue with Google <ArrowRight size={17}/></button><div className="auth-divider"><span>or continue with email</span></div></>}
   <form className="auth-form" onSubmit={e=>void authenticate(e)}>
    {mode==="signup"&&<label>Full name <input type="text" autoComplete="name" maxLength={100} placeholder="Your name" value={fullName} onChange={e=>setFullName(e.target.value)}/></label>}
    <label>Email address <div className="auth-input-wrap"><Mail size={18}/><input type="email" name="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></div></label>
    {mode!=="forgot"&&<label>Password<div className="auth-input-wrap"><LockKeyhole size={18}/><input type={showPassword?"text":"password"} name="password" autoComplete={mode==="signup"?"new-password":"current-password"} minLength={mode==="signup"?8:1} required placeholder={mode==="signup"?"At least 8 characters":"Enter your password"} value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" className="auth-eye" aria-label={showPassword?"Hide password":"Show password"} onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>}
    {mode==="signup"&&<label>Confirm password<div className="auth-input-wrap"><ShieldCheck size={18}/><input type={showPassword?"text":"password"} autoComplete="new-password" minLength={8} required placeholder="Repeat your password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}/></div></label>}
    {mode==="login"&&<button className="auth-forgot" type="button" onClick={()=>toggle("forgot")}>Forgot password?</button>}
    {error&&<div role="alert" className="auth-alert auth-error">{error}</div>}
    {message&&<div role="status" className="auth-alert auth-success"><CheckCircle2 size={18}/>{message}</div>}
    <button type="submit" className="auth-submit" disabled={loading||!cloudConfigured}>{loading?"Please wait…":mode==="signup"?"Create my account":mode==="forgot"?"Send reset link":"Sign in to Finora"} <ArrowRight size={18}/></button>
    {!cloudConfigured&&<p className="auth-alert auth-error">Cloud authentication isn't configured. Try the local demo instead.</p>}
   </form>
   <div className="auth-switch">{mode==="signup"?<>Already have an account? <button type="button" onClick={()=>toggle("login")}>Sign in</button></>:mode==="forgot"?<button type="button" onClick={()=>toggle("login")}>← Return to sign in</button>:<>New to Finora? <button type="button" onClick={()=>toggle("signup")}>Create an account</button></>}</div>
   <div className="auth-local"><span>Prefer staying offline?</span><Link href="/app?mode=local">Use Finora without an account <ArrowRight size={15}/></Link></div>
  </div><footer className="auth-footer">© 2026 Finora <span>·</span> <Link href="/">About Finora</Link></footer></div></section>
  <aside className="auth-aside"><div className="auth-aside-orb"/><div className="auth-aside-content"><div className="auth-aside-label"><Sparkles size={15}/> YOUR MONEY, IN FOCUS</div><h2>A little more clarity.<br/>A lot more possibility.</h2><p>Bring your income, budgets, goals and financial plans into a space designed to make everything feel manageable.</p><div className="auth-aside-widget"><div className="auth-widget-icon"><ShieldCheck size={20}/></div><div><strong>Built around your choices.</strong><small>Local, cloud or both — you're in control.</small></div></div><div className="auth-aside-chips"><span>✦ Beautiful insights</span><span>✦ Private workspaces</span><span>✦ Simple planning</span></div></div></aside>
 </div>;
}
