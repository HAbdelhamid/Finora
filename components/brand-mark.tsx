import type {SVGProps} from "react";

/**
 * Finora's premium mark is a custom-cut, geometric F: the wide horizontal
 * strokes evoke the layered structure of financial accounts, while the
 * open upper-right ring suggests a coin / cycle of money. Deliberately
 * distinct from a generic stock chart or currency symbol.
 */
export function BrandMark({size=40,className="",...props}:SVGProps<SVGSVGElement>&{size?:number}) {
 return <svg viewBox="0 0 64 64" width={size} height={size} fill="none" className={className} aria-hidden="true" focusable="false" {...props}>
  <defs>
   <linearGradient id="finoraMarkBackground" x1="2" y1="0" x2="62" y2="68" gradientUnits="userSpaceOnUse">
    <stop stopColor="#153E3C"/><stop offset="1" stopColor="#091F29"/>
   </linearGradient>
   <linearGradient id="finoraMarkMint" x1="15" y1="12" x2="51" y2="49" gradientUnits="userSpaceOnUse">
    <stop stopColor="#9CF8CF"/><stop offset=".55" stopColor="#46D8AD"/><stop offset="1" stopColor="#16B996"/>
   </linearGradient>
  </defs>
  <rect x="1.2" y="1.2" width="61.6" height="61.6" rx="17.2" fill="url(#finoraMarkBackground)"/>
  <rect x="1.7" y="1.7" width="60.6" height="60.6" rx="16.7" stroke="#FFFFFF" strokeOpacity=".14"/>
  <path d="M20 16.5C20 14.57 21.57 13 23.5 13H45.8C48.12 13 50 14.88 50 17.2C50 19.52 48.12 21.4 45.8 21.4H29.5V29.3H40.8C43.12 29.3 45 31.18 45 33.5C45 35.82 43.12 37.7 40.8 37.7H29.5V47.6C29.5 50.22 27.38 52.35 24.75 52.35C22.12 52.35 20 50.22 20 47.6V16.5Z" fill="url(#finoraMarkMint)"/>
  <path d="M46.4 43.8C46.4 47.4 43.4 50.4 39.8 50.4" stroke="#C6B786" strokeWidth="3" strokeLinecap="round" opacity=".9"/>
  <circle cx="49.2" cy="40.0" r="2.15" fill="#E5D4A5"/>
 </svg>;
}
