import type {Metadata} from "next";
import {AuthScreen} from "@/components/auth-screen";
export const metadata:Metadata={title:"Create your account | Finora",description:"Create a Finora account or start locally without signing up."};
export default function SignUp(){return <AuthScreen initialMode="signup"/>}
