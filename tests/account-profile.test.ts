import {describe,expect,it} from "vitest";
import type {User} from "@supabase/supabase-js";
import {accountDisplayName,accountInitials,googleAccountAvatar} from "../lib/account-profile";

const profile=(overrides:Partial<User>={}):User=>({
 id:"abc",aud:"authenticated",created_at:"2026-10-12",app_metadata:{provider:"google",providers:["google"]},
 user_metadata:{full_name:"Alex Morgan",avatar_url:"https://lh3.googleusercontent.com/a/avatar.png"},
 email:"alex@example.com",...overrides
} as User);

describe("signed-in account identity",()=>{
 it("shows Google identity's avatar and full name",()=>{
  const user=profile();
  expect(accountDisplayName(user)).toBe("Alex Morgan");
  expect(accountInitials(user)).toBe("AM");
  expect(googleAccountAvatar(user)).toBe("https://lh3.googleusercontent.com/a/avatar.png");
 });
 it("falls back to initials for email login and no profile picture",()=>{
  const user=profile({app_metadata:{provider:"email"},user_metadata:{},email:"alex@example.com"});
  expect(accountInitials(user)).toBe("A");
  expect(googleAccountAvatar(user)).toBeNull();
 });
 it("does not load arbitrary, insecure or lookalike URLs from user metadata",()=>{
  for(const invalid of ["http://lh3.googleusercontent.com/a/1","https://googleusercontent.com.evil.example/avatar","javascript:alert(1)","https://googleusercontent.com@evil.example/avatar"]){
   expect(googleAccountAvatar(profile({user_metadata:{avatar_url:invalid}}))).toBeNull();
  }
 });
 it("works with a Google provider attached to an email-primary account",()=>{
  const user=profile({app_metadata:{provider:"email"},identities:[{provider:"google"}] as User["identities"]});
  expect(googleAccountAvatar(user)).toContain("googleusercontent.com");
 });
 it("uses Finora as a fallback when not signed in",()=>{
  expect(accountInitials(null)).toBe("F");
 });
});
