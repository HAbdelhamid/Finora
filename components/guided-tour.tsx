"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {ArrowLeft,ArrowRight,Check,ChevronRight,Compass,HelpCircle,X} from "lucide-react";
import {TOUR_STEPS,clampStep,tourPreferenceKey} from "@/lib/tour";

type Rectangle={top:number;bottom:number;left:number;right:number;width:number;height:number};
type Position={left:number;top:number};
type Props={
 onNavigate:(section:string)=>void;
 onDrawerChange:(open:boolean)=>void;
 currentNav:string;
 drawerOpen:boolean;
 userId?:string|null;
};
const pad=8;
const preferredWidth=365;
const estimatedCardHeight=262;

function readRectangle(element:Element):Rectangle{
 const r=element.getBoundingClientRect(),width=window.innerWidth,height=window.innerHeight;
 const left=Math.max(pad,Math.min(width-pad,r.left-pad));
 const right=Math.min(width-pad,Math.max(pad,r.right+pad));
 const top=Math.max(pad,Math.min(height-pad,r.top-pad));
 const bottom=Math.min(height-pad,Math.max(pad,r.bottom+pad));
 return {top,bottom,left,right,width:Math.max(0,right-left),height:Math.max(0,bottom-top)};
}
function placeCard(rect:Rectangle|null):Position{
 const vw=window.innerWidth,vh=window.innerHeight,w=Math.min(preferredWidth,vw-24);
 if(!rect)return {left:Math.max(12,(vw-w)/2),top:Math.max(12,(vh-estimatedCardHeight)/2)};
 let left=Math.max(12,Math.min(vw-w-12,rect.left+(rect.width-w)/2));
 let top:number;
 if(vw-rect.right>w+28){
  left=Math.min(vw-w-12,rect.right+16);
  top=rect.top;
 }else if(vh-rect.bottom>=estimatedCardHeight+24){
  top=rect.bottom+15;
 }else if(rect.top>=estimatedCardHeight+24){
  top=rect.top-estimatedCardHeight-15;
 }else{
  top=vh-estimatedCardHeight-15;
 }
 return {left,top:Math.max(12,Math.min(vh-estimatedCardHeight-12,top))};
}

export function GuidedTour({onNavigate,onDrawerChange,currentNav,drawerOpen,userId}:Props){
 const [active,setActive]=useState(false);
 const [index,setIndex]=useState(0);
 const [invite,setInvite]=useState(false);
 const [rectangle,setRectangle]=useState<Rectangle|null>(null);
 const [position,setPosition]=useState<Position>({left:12,top:12});
 const modalRef=useRef<HTMLDivElement>(null);
 const launcherRef=useRef<HTMLButtonElement>(null);
 const savedFocusRef=useRef<HTMLElement|null>(null);
 const key=tourPreferenceKey(userId);
 const step=TOUR_STEPS[index];

 useEffect(()=>{
  try{setInvite(window.localStorage.getItem(key)===null)}catch{setInvite(true)}
 },[key]);

 const remember=useCallback((outcome:"seen"|"completed")=>{
  try{window.localStorage.setItem(key,outcome)}catch{ /* Private browsing still allows the tour. */ }
 },[key]);
 const close=useCallback((done=false)=>{
  setActive(false);setRectangle(null);setInvite(false);
  onDrawerChange(false);remember(done?"completed":"seen");
  window.requestAnimationFrame(()=>launcherRef.current?.focus());
 },[onDrawerChange,remember]);

 const moveTo=useCallback((stepNumber:number)=>{
  const next=clampStep(stepNumber),chosen=TOUR_STEPS[next];
  setIndex(next);
  if(chosen.section&&chosen.section!==currentNav)onNavigate(chosen.section);
  onDrawerChange(Boolean(chosen.showMobileSidebar&&window.matchMedia("(max-width: 800px)").matches));
 },[currentNav,onNavigate,onDrawerChange]);

 const start=()=>{
  savedFocusRef.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  setInvite(false);setActive(true);moveTo(0);
 };

 // Wait for the destination tab/drawer to mount, then position the spotlight.
 useEffect(()=>{
  if(!active)return;
  let raf=0,delayed=0;
  let target:Element|null=null;
  let observer:ResizeObserver|null=null;
  const measure=()=>{
   if(!step.target){setRectangle(null);setPosition(placeCard(null));return}
   target=document.querySelector('[data-tour="'+step.target+'"]');
   if(!target){setRectangle(null);setPosition(placeCard(null));return}
   const box=readRectangle(target);
   setRectangle(box.width>0&&box.height>0?box:null);
   setPosition(placeCard(box.width>0&&box.height>0?box:null));
  };
  const begin=()=>{
   target=step.target?document.querySelector('[data-tour="'+step.target+'"]'):null;
   if(target){
    target.scrollIntoView({block:"nearest",inline:"nearest",behavior:"instant"});
    if(typeof ResizeObserver!=="undefined"){
     observer=new ResizeObserver(measure);observer.observe(target);
    }
   }
   measure();
   delayed=window.setTimeout(measure,170);
  };
  raf=window.requestAnimationFrame(begin);
  window.addEventListener("resize",measure);
  window.addEventListener("scroll",measure,true);
  return()=>{window.cancelAnimationFrame(raf);window.clearTimeout(delayed);observer?.disconnect();window.removeEventListener("resize",measure);window.removeEventListener("scroll",measure,true)};
 },[active,index,currentNav,drawerOpen,step.target]);

 useEffect(()=>{
  if(!active)return;
  modalRef.current?.focus();
  const handle=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){event.preventDefault();close();return}
   if(event.key==="ArrowRight"&&!(event.target instanceof HTMLInputElement)){
    event.preventDefault();if(index===TOUR_STEPS.length-1)close(true);else moveTo(index+1);return;
   }
   if(event.key==="ArrowLeft"&&!(event.target instanceof HTMLInputElement)){
    event.preventDefault();moveTo(index-1);return;
   }
   if(event.key==="Tab"){
    const items=modalRef.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])");
    if(!items?.length)return;
    const first=items[0],last=items[items.length-1],current=document.activeElement;
    if(event.shiftKey&&(current===first||current===modalRef.current)){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&(current===last||current===modalRef.current)){event.preventDefault();first.focus()}
   }
  };
  document.addEventListener("keydown",handle);
  return()=>document.removeEventListener("keydown",handle);
 },[active,index,close,moveTo]);

 const dismissInvite=()=>{setInvite(false);remember("seen")};
 return <>
  {!active&&<button ref={launcherRef} className="tour-launcher" type="button" onClick={start} aria-label="Take a guided tour of Finora" title="Take a guided tour"><HelpCircle size={19}/><span>Help & tour</span></button>}
  {invite&&!active&&<section className="tour-invitation" aria-label="Introduction to Finora"><button type="button" className="tour-invite-close" onClick={dismissInvite} aria-label="Dismiss tour suggestion"><X size={17}/></button><span className="tour-invite-icon"><Compass size={21}/></span><strong>New here? We can show you around!</strong><p>Take a quick, simple tour. No need to know anything about money yet.</p><div className="tour-invite-actions"><button type="button" className="tour-invite-start" onClick={start}>Show me around <ArrowRight size={16}/></button><button type="button" className="tour-invite-later" onClick={dismissInvite}>Not now</button></div></section>}
  {active&&<>
   {rectangle?<div className="tour-shade-panels" aria-hidden="true">
    <div style={{left:0,top:0,width:"100%",height:rectangle.top}}/>
    <div style={{left:0,top:rectangle.top,width:rectangle.left,height:rectangle.height}}/>
    <div style={{left:rectangle.right,top:rectangle.top,width:Math.max(0,window.innerWidth-rectangle.right),height:rectangle.height}}/>
    <div style={{left:0,top:rectangle.bottom,width:"100%",height:Math.max(0,window.innerHeight-rectangle.bottom)}}/>
    <div className="tour-spotlight-ring" style={{left:rectangle.left,top:rectangle.top,width:rectangle.width,height:rectangle.height}}/>
   </div>:<div className="tour-shade-full" aria-hidden="true"/>}
   <div className="tour-interaction-guard" aria-hidden="true"/>
   <div ref={modalRef} className="tour-popover" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-explanation" tabIndex={-1} style={{left:position.left,top:position.top}}>
    <div className="tour-popover-head"><span><Compass size={15}/> FINORA TOUR</span><button type="button" className="tour-close" aria-label="Skip and close tour" onClick={()=>close()}><X size={18}/></button></div>
    <div className="tour-progress" aria-label={"Step "+(index+1)+" of "+TOUR_STEPS.length}><div style={{width:((index+1)/TOUR_STEPS.length*100)+"%"}}/></div>
    <p className="tour-count">Step {index+1} of {TOUR_STEPS.length}</p>
    <h2 id="tour-title">{step.title}</h2><p id="tour-explanation">{step.explanation}</p>
    <div className="tour-footer"><button type="button" className="tour-skip" onClick={()=>close()}>Skip tour</button><div className="tour-navigation"><button type="button" className="tour-back" onClick={()=>moveTo(index-1)} disabled={index===0}><ArrowLeft size={16}/> Back</button><button type="button" className="tour-next" onClick={()=>index===TOUR_STEPS.length-1?close(true):moveTo(index+1)}>{index===TOUR_STEPS.length-1?"Finish":"Next"} {index===TOUR_STEPS.length-1?<Check size={16}/>:<ArrowRight size={16}/>}</button></div></div>
   </div>
  </>}
 </>;
}
