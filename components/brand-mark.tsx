import type {SVGProps} from "react";

/** Finora identity: a clear F paired with an ascending financial trend. */
export function BrandMark({size=40,className="",...props}:SVGProps<SVGSVGElement>&{size?:number}) {
 return <svg viewBox="0 0 64 64" width={size} height={size} fill="none" className={className} aria-hidden="true" focusable="false" {...props}>
  <rect x="2" y="2" width="60" height="60" rx="18" fill="#0C9677"/>
  <path d="M2 39C17 60 39 65 62 36V44C62 54 54 62 44 62H20C10 62 2 54 2 44V39Z" fill="#0E574F" fillOpacity=".48"/>
  <path d="M21 46V19H43M21 32H35" stroke="#FFFFFF" strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M34 46L41.5 38L46.5 41L53.5 29" stroke="#B9FFE3" strokeWidth="4.3" strokeLinecap="round" strokeLinejoin="round"/>
  <circle cx="53.5" cy="29" r="2.9" fill="#FFFFFF"/>
 </svg>;
}
