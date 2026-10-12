import type {Metadata} from "next";
import {AuthScreen} from "@/components/auth-screen";
export const metadata:Metadata={title:"Sign in | Finora",description:"Sign in to your Finora financial workspace with Google or email."};
export default function SignIn(){return <AuthScreen initialMode="login"/>}
