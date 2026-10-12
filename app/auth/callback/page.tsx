"use client";
import {useEffect,useState} from "react";
import {getSupabase} from "@/lib/supabase";
export default function AuthCallback(){
 const [error,setError]=useState("");
 useEffect(()=>{
  let mounted=true;
  async function finish(){
   const client=getSupabase();if(!client){setError("Cloud authentication is not configured.");return}
   const params=new URLSearchParams(window.location.search);
   const code=params.get("code");
   const failure=params.get("error_description")||params.get("error");
   if(failure||!code){setError(failure||"Google did not return an authorization code.");return}
   try{
    const {error}=await client.auth.exchangeCodeForSession(code);
    if(error)throw error;
    if(mounted)window.location.replace("/");
   }catch(e){if(mounted)setError(e instanceof Error?e.message:"Sign-in failed.")}
  }
  void finish();return()=>{mounted=false};
 },[]);
 return <main className="auth-callback"><div className="cloud-lock-card"><div className="lock-mark">f.</div><h1>{error?"Could not sign you in":"Finishing secure sign-in"}</h1><p>{error||"Exchanging your Google authorization code for a Supabase session…"}</p><a href="/">Return to Finora</a></div></main>;
}
