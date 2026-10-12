import {describe,expect,it} from "vitest";
import {createElement} from "react";
import {readFileSync} from "node:fs";
import {readSelectOptions} from "../components/ui/finora-select";
import {numericError} from "../components/ui/finora-feedback";

describe("Finora selection system",()=>{
 it("preserves option values and visible descriptions",()=>{
  const children=[
   createElement("option",{value:"checking",key:"a"},"Checking account"),
   createElement("option",{value:"savings",key:"b"},"Savings")
  ];
  expect(readSelectOptions(children)).toEqual([
   {value:"checking",label:"Checking account",disabled:false},
   {value:"savings",label:"Savings",disabled:false}
  ]);
 });
 it("supports implicit values and disabled options",()=>{
  const options=readSelectOptions([createElement("option",{key:"m"},"MAD"),createElement("option",{value:"old",disabled:true,key:"o"},"Inactive")]);
  expect(options.map(v=>v.value)).toEqual(["MAD","old"]);
  expect(options[1].disabled).toBe(true);
 });
 it("supports mixed text children for account balance descriptions",()=>{
  const option=createElement("option",{value:"a",key:"a"},"Wallet · ",createElement("strong",null,"100 MAD"));
  expect(readSelectOptions([option])[0].label).toBe("Wallet · 100 MAD");
 });
});
describe("form numeric validation",()=>{
 it("rejects missing, invalid and out-of-range amounts",()=>{
  expect(numericError("",.01)).toBe("Enter an amount.");
  expect(numericError("not a number",.01)).toBe("Enter a valid number.");
  expect(numericError("-3",0)).toMatch(/at least/);
  expect(numericError("101",0,100)).toMatch(/no greater/);
  expect(numericError("0.01",.01)).toBeNull();
  expect(numericError("0",0)).toBeNull();
 });
});
describe("native dialogs and selectors",()=>{
 const files=["transactions","accounts","planning","investments","workspaces","zakat"];
 it.each(files)("does not use browser alerts or prompts in %s",name=>{
  const source=readFileSync("components/"+name+".tsx","utf8");
  expect(source).not.toMatch(/\b(?:window\.)?(?:alert|prompt)\s*\(/);
  expect(source).not.toMatch(/\bwindow\.confirm\s*\(/);
  expect(source).not.toMatch(/<select\b/);
 });
});
