"use client";
import {Children,isValidElement,useCallback,useEffect,useId,useMemo,useRef,useState,type KeyboardEvent,type ReactNode} from "react";
import {createPortal} from "react-dom";
import {Check,ChevronDown,Search} from "lucide-react";

type Option={value:string;label:string;disabled:boolean};
export type FinoraSelectProps={
 value:string;
 onChange:(event:{target:{value:string}})=>void;
 children:ReactNode;
 label?:string;
 placeholder?:string;
 disabled?:boolean;
 className?:string;
 id?:string;
 "aria-label"?:string;
 title?:string;
};
function contentText(node:ReactNode):string{
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(Array.isArray(node))return node.map(contentText).join("");
 if(isValidElement<{children?:ReactNode}>(node))return contentText(node.props.children);
 return "";
}
export function readSelectOptions(children:ReactNode):Option[]{
 return Children.toArray(children).filter(isValidElement).filter(node=>typeof node.type==="string"&&node.type==="option")
  .map(node=>{
   const props=node.props as {value?:string|number;children?:ReactNode;disabled?:boolean};
   const label=contentText(props.children);
   return {label,value:String(props.value??label),disabled:Boolean(props.disabled)};
  });
}

/** Fully styled select: keyboard navigation, type-ahead, search, and a portal
 * so listboxes aren't clipped by cards, dialogs or scrollable sidebars.
 * The onChange shape intentionally mirrors the old native select callbacks. */
export function FinoraSelect({value,onChange,children,label,placeholder="Choose an option",disabled=false,className="",id,"aria-label":ariaLabel,title}:FinoraSelectProps){
 const options=useMemo(()=>readSelectOptions(children),[children]);
 const selected=options.find(o=>o.value===value);
 const [open,setOpen]=useState(false),[query,setQuery]=useState("");
 const [active,setActive]=useState(0),[mounted,setMounted]=useState(false);
 const [placement,setPlacement]=useState({top:0,left:0,width:270,maxHeight:280});
 const trigger=useRef<HTMLButtonElement>(null),list=useRef<HTMLDivElement>(null);
 const optRefs=useRef<(HTMLButtonElement|null)[]>([]);
 const generatedId=useId(),listId=id? id+"-list":generatedId+"-list";
 const filtered=options.filter(o=>o.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
 const canSearch=options.length>=8;
 useEffect(()=>{setMounted(true)},[]);
 const measure=useCallback(()=>{
  if(!trigger.current)return;
  const r=trigger.current.getBoundingClientRect(),vh=window.innerHeight,vw=window.innerWidth;
  const width=Math.min(vw-20,Math.max(220,r.width)),left=Math.max(10,Math.min(vw-width-10,r.left));
  const roomBelow=vh-r.bottom-12,roomAbove=r.top-12;
  const above=roomBelow<190&&roomAbove>roomBelow;
  const maxHeight=Math.max(130,Math.min(320,(above?roomAbove:roomBelow)-8));
  const top=above?Math.max(8,r.top-maxHeight-7):Math.min(vh-8,r.bottom+7);
  setPlacement({top,left,width,maxHeight});
 },[]);
 useEffect(()=>{
  if(!open)return;
  measure();
  const closeOutside=(e:PointerEvent)=>{
   if(!trigger.current?.contains(e.target as Node)&&!list.current?.contains(e.target as Node))setOpen(false);
  };
  const scroll=(e:Event)=>{if(list.current?.contains(e.target as Node))return;measure()};
  document.addEventListener("pointerdown",closeOutside);
  window.addEventListener("resize",measure);
  window.addEventListener("scroll",scroll,true);
  return()=>{document.removeEventListener("pointerdown",closeOutside);window.removeEventListener("resize",measure);window.removeEventListener("scroll",scroll,true)};
 },[open,measure]);
 useEffect(()=>{
  if(open)optRefs.current[active]?.scrollIntoView({block:"nearest"});
 },[active,open]);
 const activate=()=>{
  if(disabled||!options.length)return;
  setQuery("");
  setActive(Math.max(0,options.findIndex(o=>o.value===value)));
  setOpen(true);
 };
 const choose=(option:Option)=>{
  if(option.disabled)return;
  onChange({target:{value:option.value}});
  setOpen(false);setQuery("");
  trigger.current?.focus();
 };
 const keyDown=(event:KeyboardEvent<HTMLElement>)=>{
  if(disabled)return;
  if(event.key==="Escape"){if(open){event.preventDefault();setOpen(false);trigger.current?.focus()}return}
  if(!open){
   if(["ArrowDown","ArrowUp","Enter"," "].includes(event.key)){event.preventDefault();activate()}
   return;
  }
  if(event.key==="ArrowDown"||event.key==="ArrowUp"){
   event.preventDefault();
   const dir=event.key==="ArrowDown"?1:-1;
   let i=active;for(let n=0;n<filtered.length;n++){i=(i+dir+filtered.length)%filtered.length;if(!filtered[i]?.disabled){setActive(i);break}}
  }else if(event.key==="Home"){event.preventDefault();setActive(0)}
  else if(event.key==="End"){event.preventDefault();setActive(Math.max(0,filtered.length-1))}
  else if(event.key==="Enter"||event.key===" "){
   if(event.target instanceof HTMLInputElement)return;
   event.preventDefault();if(filtered[active])choose(filtered[active]);
  }else if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&event.target!==list.current?.querySelector("input")){
   const match=filtered.findIndex(o=>o.label.toLowerCase().startsWith(event.key.toLowerCase()));
   if(match>=0)setActive(match);
  }
 };
 return <>
  <button id={id} type="button" ref={trigger} disabled={disabled} className={"finora-select-trigger "+className} role="combobox"
   aria-haspopup="listbox" aria-expanded={open} aria-controls={open?listId:undefined}
   aria-label={ariaLabel||label||"Choose an option"} aria-activedescendant={open?listId+"-option-"+active:undefined}
   title={title} onClick={()=>open?setOpen(false):activate()} onKeyDown={keyDown}>
   <span className={"finora-select-value "+(!selected?"empty":"")}>{selected?.label||placeholder}</span>
   <ChevronDown size={17} strokeWidth={2} className={"finora-select-chevron "+(open?"expanded":"")}/>
  </button>
  {mounted&&open&&createPortal(<div ref={list} className="finora-select-popover" style={{left:placement.left,top:placement.top,width:placement.width,maxHeight:placement.maxHeight}}
    onKeyDown={keyDown}>
   {canSearch&&<div className="finora-select-search"><Search size={16}/><input aria-label={"Search "+(label||"options")} type="search" value={query} autoFocus placeholder="Search options…" onChange={e=>{setQuery(e.target.value);setActive(0)}}/></div>}
   <div id={listId} className="finora-select-options" role="listbox" aria-label={label||"Choose an option"}>
    {filtered.length?filtered.map((option,i)=><button type="button" key={option.value} id={listId+"-option-"+i} role="option" aria-selected={option.value===value}
     ref={el=>{optRefs.current[i]=el}} disabled={option.disabled}
     className={"finora-select-option "+(option.value===value?"selected ":"")+(active===i?"highlighted":"")}
     onPointerEnter={()=>setActive(i)} onClick={()=>choose(option)}>
     <span>{option.label}</span>{option.value===value&&<Check size={16}/>}
    </button>):<div className="finora-select-empty">No matching options</div>}
   </div>
  </div>,document.body)}
 </>;
}
