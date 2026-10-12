"use client";
import dynamic from "next/dynamic";
import type { EChartsOption } from "echarts";
import type { ReactNode } from "react";
import { formatMoney } from "@/lib/models";

const Chart=dynamic(()=>import("echarts-for-react"),{ssr:false,loading:()=> <div className="chart-skeleton"/>});
const green="#15ad91",purple="#7376e7",orange="#edaa5e",text="#8c9aa9";
export function Card({title,subtitle,children,action,className=""}:{title:string;subtitle?:string;children:ReactNode;action?:ReactNode;className?:string}){
 return <section className={"surface "+className}><div className="surface-head"><div><h3>{title}</h3>{subtitle&&<p>{subtitle}</p>}</div>{action}</div>{children}</section>;
}
export function Metric({label,value,detail,icon,feature=false}:{label:string;value:string;detail:string;icon:ReactNode;feature?:boolean}){
 return <div className={"metric "+(feature?"metric-feature":"")}><div className="metric-top"><span>{label}</span><div className="metric-icon">{icon}</div></div><strong>{value}</strong><div className="metric-meta">{detail}</div></div>;
}
export function CashFlowChart({rows,currency}:{rows:{label:string;income:number;expense:number}[];currency:string}){
 const option:EChartsOption={
  animationDuration:900,
  grid:{left:15,right:25,top:22,bottom:26,containLabel:true},
  tooltip:{trigger:"axis",backgroundColor:"#162b39",borderWidth:0,textStyle:{color:"#fff"},valueFormatter:(v:unknown)=>formatMoney(Number(v),currency)},
  xAxis:{type:"category",data:rows.map(x=>x.label),boundaryGap:false,axisLine:{show:false},axisTick:{show:false},axisLabel:{color:text}},
  yAxis:{type:"value",axisLine:{show:false},axisLabel:{color:text,formatter:(v:number)=>v>=1000?(v/1000).toFixed(0)+"k":String(v)},splitLine:{lineStyle:{color:"#edf0f5",type:"dashed"}}},
  series:[
   {name:"Income",type:"line",smooth:true,showSymbol:false,data:rows.map(x=>x.income),lineStyle:{width:3,color:green},itemStyle:{color:green},areaStyle:{color:{type:"linear",x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:"rgba(21,173,145,.24)"},{offset:1,color:"rgba(21,173,145,0)"}]}}},
   {name:"Expenses",type:"line",smooth:true,showSymbol:false,data:rows.map(x=>x.expense),lineStyle:{width:3,color:purple},itemStyle:{color:purple}}
  ]};
 return <div role="img" aria-label="Interactive income and expenses chart"><Chart option={option} style={{height:288}}/></div>;
}
export function CategoryChart({rows,currency}:{rows:{name:string;value:number}[];currency:string}){
 const opt:EChartsOption={animationDuration:950,color:[green,purple,orange,"#5f9ed0","#d778a4","#89a8a8"],tooltip:{trigger:"item",valueFormatter:(v:unknown)=>formatMoney(Number(v),currency)},legend:{bottom:0,type:"scroll",icon:"circle",itemWidth:8,itemHeight:8,textStyle:{color:"#8795a4",fontSize:10}},series:[{type:"pie",radius:["60%","78%"],center:["50%","42%"],padAngle:3,itemStyle:{borderRadius:7},label:{show:false},data:rows.length?rows:[{name:"No expenses",value:1,itemStyle:{color:"#e8edf0"}}]}]};
 return <div role="img" aria-label="Expense distribution"><Chart option={opt} style={{height:282}}/></div>;
}
export function AssetChart({cash,savings,investments,currency}:{cash:number;savings:number;investments:number;currency:string}){
 const opt:EChartsOption={animationDuration:850,grid:{left:6,right:15,top:10,bottom:14,containLabel:true},tooltip:{trigger:"axis",axisPointer:{type:"shadow"},valueFormatter:(v:unknown)=>formatMoney(Number(v),currency)},xAxis:{type:"value",axisLabel:{color:text},splitLine:{lineStyle:{color:"#eef1f4"}}},yAxis:{type:"category",data:["Cash","Savings","Investments"],axisLabel:{color:"#68798c"},axisTick:{show:false},axisLine:{show:false}},series:[{type:"bar",barWidth:18,data:[cash,savings,investments].map((value,i)=>({value:Math.max(0,value),itemStyle:{color:[green,purple,orange][i],borderRadius:[0,7,7,0]}}))}]};
 return <Chart option={opt} style={{height:216}}/>;
}
