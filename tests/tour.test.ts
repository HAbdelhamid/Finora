import {describe,expect,it} from "vitest";
import {TOUR_STEPS,totalTourSteps,clampStep,tourPreferenceKey} from "../lib/tour";

describe("Finora beginner tour",()=>{
 it("covers the primary finance areas and privacy",()=>{
  expect(TOUR_STEPS.map(step=>step.section).filter(Boolean)).toEqual([
   "Overview","Transactions","Accounts","Planning","Investments","Reports","Zakat","Storage"
  ]);
  expect(TOUR_STEPS.some(step=>step.id==="workspaces")).toBe(true);
  expect(TOUR_STEPS.some(step=>step.id==="finish")).toBe(true);
 });
 it("keeps all step ids and spotlight targets unique",()=>{
  const ids=TOUR_STEPS.map(x=>x.id);
  const targets=TOUR_STEPS.map(x=>x.target).filter(Boolean);
  expect(new Set(ids).size).toBe(ids.length);
  expect(new Set(targets).size).toBe(targets.length);
  expect(TOUR_STEPS.every(s=>s.title.length>0&&s.explanation.length>30)).toBe(true);
 });
 it("bounds progress through steps",()=>{
  expect(clampStep(-3)).toBe(0);
  expect(clampStep(3)).toBe(3);
  expect(clampStep(100)).toBe(totalTourSteps-1);
 });
 it("keeps prompts isolated by account and from finance data",()=>{
  expect(tourPreferenceKey(null)).not.toBe(tourPreferenceKey("a-user"));
  expect(tourPreferenceKey("a-user")).not.toBe(tourPreferenceKey("another-user"));
  expect(tourPreferenceKey("a-user")).toContain("finora-guide-");
  expect(TOUR_STEPS.every(s=>!/automatically (save|transfer|pay)/.test(s.explanation))).toBe(true);
 });
});
