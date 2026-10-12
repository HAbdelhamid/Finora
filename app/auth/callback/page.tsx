"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {getSupabase} from "@/lib/supabase";
export default function AuthCallback(){
 const [error,setError]=useState("");
 useEffect(()=>{
  let alive=true;
  async function finish(){
   const client=getSupabase();if(!client){setError("Authentication is not configured.");return}
   const params=new URLSearchParams(window.location.search);
   const code=params.get("code");
   const failure=params.get("error_description")||params.get("error");
   if(failure){setError(failure);return}
   const destination=params.get("flow")==="recovery"?"/reset-password":"/app";
   try{
    if(code){const {error}=await client.auth.exchangeCodeForSession(code);if(error)throw error;}
    const {data,error}=await client.auth.getUser();
    if(error||!data.user)throw Error("No active session was found. Please try signing in.");
    if(alive){sessionStorage.removeItem("finora-entry-choice");window.location.replace(destination)}
   }catch(e){if(alive)setError(e instanceof Error?e.message:"Could not finish signing in.")}
  }
  void finish();return()=>{alive=false};
 },[]);
 return <main className="auth-callback"><div className="cloud-lock-card"><div className="lock-mark">f.</div><h1>{error?"Sign-in needs attention":"Finishing your sign-in"}</h1><p>{error||"Verifying your session securely…"}</p><Link href="/login">Return to sign in</Link></div></main>;
}
