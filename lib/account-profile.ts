import type {User} from "@supabase/supabase-js";

type Account=Pick<User,"email"|"user_metadata"|"app_metadata"|"identities">;
const txt=(v:unknown)=>typeof v==="string"?v.trim():"";

/** No secrets are needed: these fields are part of the Supabase session's user. */
export function accountDisplayName(user:Account|null|undefined):string {
 const name=txt(user?.user_metadata?.full_name)||txt(user?.user_metadata?.name);
 return name||user?.email?.split("@")[0]||"Finora member";
}

export function accountInitials(user:Account|null|undefined):string {
 if(!user)return "F";
 const label=accountDisplayName(user);
 if(label==="Finora member")return "F";
 const parts=label.split(/\s+/).filter(Boolean);
 return ((parts.length>1?parts[0][0]+parts[parts.length-1][0]:parts[0]?.[0])||"F").toUpperCase();
}

/** Only show Google-hosted profile photos from a verified Google identity. */
export function googleAccountAvatar(user:Account|null|undefined):string|null {
 if(!user)return null;
 const provider=user.app_metadata?.provider;
 const providers=user.app_metadata?.providers;
 const google=provider==="google"||(Array.isArray(providers)&&providers.includes("google"))||user.identities?.some(identity=>identity.provider==="google");
 if(!google)return null;
 const candidate=txt(user.user_metadata?.avatar_url)||txt(user.user_metadata?.picture);
 if(!candidate)return null;
 try {
  const url=new URL(candidate);
  const host=url.hostname.toLowerCase();
  if(url.protocol!=="https:"||url.username||url.password)return null;
  if(host==="googleusercontent.com"||host.endsWith(".googleusercontent.com")||host==="ggpht.com"||host.endsWith(".ggpht.com"))return url.href;
 } catch { /* Untrusted or malformed metadata. */ }
 return null;
}
