"use client";
import {createContext,useCallback,useContext,useEffect,useRef,useState,type FormEvent,type ReactNode} from "react";
import {AlertCircle,CheckCircle2,Info,TriangleAlert,X} from "lucide-react";

export type ToastTone="success"|"error"|"info";
type Toast={id:number;message:string;tone:ToastTone};
export type ConfirmOptions={title:string;description:string;confirmText?:string;danger?:boolean};
export type NumberOptions={title:string;description?:string;label:string;initial?:number;min?:number;max?:number;step?:number;confirmText?:string};
type PromptState=({kind:"confirm"}&ConfirmOptions)|({kind:"number"}&NumberOptions);
type UiContextValue={
 notify:(message:string,tone?:ToastTone)=>void;
 confirm:(options:ConfirmOptions)=>Promise<boolean>;
 askNumber:(options:NumberOptions)=>Promise<number|null>;
};
const Context=createContext<UiContextValue|null>(null);
let nextToastId=0;
export function numericError(value:string,min=0,max=Number.POSITIVE_INFINITY):string|null{
 if(value.trim()==="")return "Enter an amount.";
 const amount=Number(value);
 if(!Number.isFinite(amount))return "Enter a valid number.";
 if(amount<min)return "Enter an amount of at least "+min+".";
 if(amount>max)return "Enter an amount no greater than "+max+".";
 return null;
}
export function validationMessage(input:HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement):string {
 const v=input.validity;
 const label=input.closest("label")?.textContent?.trim().replace(/\s+/g," ").slice(0,55)||input.getAttribute("aria-label")||input.name||"This field";
 if(v.valueMissing)return label+" is required.";
 if(v.typeMismatch)return "Enter a valid "+(input instanceof HTMLInputElement&&input.type==="email"?"email address":"value")+".";
 if(v.rangeUnderflow)return "The amount is below the allowed minimum.";
 if(v.rangeOverflow)return "The amount is above the allowed maximum.";
 if(v.stepMismatch)return "Use a valid amount for this field.";
 if(v.tooShort)return "This value is too short.";
 if(v.tooLong)return "This value is too long.";
 return "Please review "+label+".";
}
export function FinoraUiProvider({children}:{children:ReactNode}){
 const [toasts,setToasts]=useState<Toast[]>([]);
 const [modal,setModal]=useState<PromptState|null>(null);
 const [numberValue,setNumberValue]=useState("");
 const [numberError,setNumberError]=useState("");
 const pending=useRef<((value:boolean|number|null)=>void)|null>(null);
 const dialogue=useRef<HTMLDivElement>(null);
 const previouslyFocused=useRef<HTMLElement|null>(null);
 const timers=useRef<ReturnType<typeof setTimeout>[]>([]);
 const lastInvalid=useRef(0);

 const notify=useCallback((message:string,tone:ToastTone="info")=>{
  const id=++nextToastId;
  setToasts(current=>[...current.slice(-3),{id,message,tone}]);
  const timer=setTimeout(()=>setToasts(current=>current.filter(t=>t.id!==id)),5200);
  timers.current.push(timer);
 },[]);
 const dismiss=useCallback((id:number)=>setToasts(items=>items.filter(t=>t.id!==id)),[]);
 const finish=useCallback((value:boolean|number|null)=>{
  const done=pending.current;
  pending.current=null;setModal(null);setNumberError("");
  done?.(value);
  requestAnimationFrame(()=>previouslyFocused.current?.focus());
 },[]);
 const open=(data:PromptState)=>{
  if(pending.current)return false;
  previouslyFocused.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  setNumberError("");setModal(data);
  return true;
 };
 const confirm=useCallback((options:ConfirmOptions)=>new Promise<boolean>(resolve=>{
  if(!open({kind:"confirm",...options})){resolve(false);return}
  pending.current=value=>resolve(value===true);
 }),[]);
 const askNumber=useCallback((options:NumberOptions)=>new Promise<number|null>(resolve=>{
  if(!open({kind:"number",...options})){resolve(null);return}
  setNumberValue(options.initial===undefined?"":String(options.initial));
  pending.current=value=>resolve(typeof value==="number"?value:null);
 }),[]);
 useEffect(()=>{
  return()=>{timers.current.forEach(clearTimeout);pending.current?.(null);pending.current=null};
 },[]);
 useEffect(()=>{
  if(!modal)return;
  dialogue.current?.querySelector<HTMLElement>("input,button")?.focus();
  const handler=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){event.preventDefault();finish(modal.kind==="confirm"?false:null)}
   if(event.key!=="Tab")return;
   const items=Array.from(dialogue.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled)')||[]);
   if(!items.length)return;
   if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items[items.length-1].focus()}
   else if(!event.shiftKey&&document.activeElement===items[items.length-1]){event.preventDefault();items[0].focus()}
  };
  document.addEventListener("keydown",handler);
  return()=>document.removeEventListener("keydown",handler);
 },[modal,finish]);
 useEffect(()=>{
  const handleInvalid=(event:Event)=>{
   const field=event.target;
   if(!(field instanceof HTMLInputElement||field instanceof HTMLTextAreaElement||field instanceof HTMLSelectElement))return;
   event.preventDefault();
   field.setAttribute("aria-invalid","true");
   const now=Date.now();
   if(now-lastInvalid.current<350)return;
   lastInvalid.current=now;
   notify(validationMessage(field),"error");
   field.focus();
  };
  const clear=(event:Event)=>{
   const field=event.target;
   if(field instanceof HTMLInputElement||field instanceof HTMLTextAreaElement||field instanceof HTMLSelectElement){
    if(field.validity.valid)field.removeAttribute("aria-invalid");
   }
  };
  document.addEventListener("invalid",handleInvalid,true);
  document.addEventListener("input",clear,true);
  return()=>{document.removeEventListener("invalid",handleInvalid,true);document.removeEventListener("input",clear,true)};
 },[notify]);
 const submitAmount=(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(!modal||modal.kind!=="number")return;
  const problem=numericError(numberValue,modal.min??0,modal.max);
  if(problem){setNumberError(problem);return}
  finish(Number(numberValue));
 };
 return <Context.Provider value={{notify,confirm,askNumber}}>
  {children}
  <div className="finora-toast-stack" role="region" aria-label="Notifications" aria-live="polite" aria-relevant="additions">
   {toasts.map(t=><div className={"finora-toast "+t.tone} key={t.id} role={t.tone==="error"?"alert":"status"}>
    <span className="finora-toast-icon">{t.tone==="success"?<CheckCircle2 size={20}/>:t.tone==="error"?<AlertCircle size={20}/>:<Info size={20}/>}</span>
    <p>{t.message}</p><button type="button" aria-label="Dismiss notification" onClick={()=>dismiss(t.id)}><X size={16}/></button>
   </div>)}
  </div>
  {modal&&<div className="finora-dialog-backdrop">
   <div ref={dialogue} className="finora-dialog" role="dialog" aria-modal="true" aria-labelledby="finora-dialog-title"
    aria-describedby="finora-dialog-description">
    <div className={"finora-dialog-icon "+(modal.kind==="confirm"&&modal.danger?"danger":"")}>
     {modal.kind==="confirm"&&modal.danger?<TriangleAlert size={24}/>:<Info size={24}/>}
    </div>
    <button type="button" className="finora-dialog-close" aria-label="Close dialog" onClick={()=>finish(modal.kind==="confirm"?false:null)}><X size={19}/></button>
    <h2 id="finora-dialog-title">{modal.title}</h2>
    {modal.description&&<p id="finora-dialog-description">{modal.description}</p>}
    {modal.kind==="confirm"?
     <div className="finora-dialog-actions"><button type="button" className="finora-dialog-cancel" onClick={()=>finish(false)}>Cancel</button>
      <button type="button" className={"finora-dialog-accept "+(modal.danger?"danger":"")} onClick={()=>finish(true)}>{modal.confirmText||"Confirm"}</button></div>:
     <form onSubmit={submitAmount} noValidate className="finora-dialog-form">
      <label htmlFor="finora-dialog-number">{modal.label}</label>
      <input autoFocus id="finora-dialog-number" type="number" inputMode="decimal" min={modal.min??0} max={modal.max} step={modal.step??"any"} value={numberValue} onChange={e=>{setNumberValue(e.target.value);setNumberError("")}} placeholder="0.00" aria-invalid={!!numberError} aria-describedby={numberError?"finora-number-error":undefined}/>
      {numberError&&<div id="finora-number-error" className="finora-input-error" role="alert">{numberError}</div>}
      <div className="finora-dialog-actions"><button type="button" className="finora-dialog-cancel" onClick={()=>finish(null)}>Cancel</button>
       <button type="submit" className="finora-dialog-accept">{modal.confirmText||"Save amount"}</button></div>
     </form>}
   </div>
  </div>}
 </Context.Provider>;
}
export function useFinoraUi(){
 const value=useContext(Context);
 if(!value)throw Error("FinoraUiProvider is missing");
 return value;
}
