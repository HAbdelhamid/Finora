import {afterEach,describe,expect,it} from "vitest";
import {getFinoraSnapshot,parseSnapshot,useFinance} from "../lib/finance-store";

afterEach(()=>useFinance.getState().reset());

describe("first workspace setup",()=>{
 it("creates a usable empty personal workspace without losing sample data",()=>{
  const initial=useFinance.getState();
  const originalCount=initial.workspaces.length;
  const demoCount=initial.workspaces.filter(w=>w.demo).length;
  useFinance.getState().addWorkspace("First personal budget","personal");
  const state=useFinance.getState();
  const workspace=state.workspaces.find(w=>w.id===state.activeId);
  expect(workspace).toMatchObject({name:"First personal budget",kind:"personal",demo:false,currency:"MAD"});
  expect(state.workspaces).toHaveLength(originalCount+1);
  expect(state.workspaces.filter(w=>w.demo)).toHaveLength(demoCount);
  expect(state.accounts.some(a=>a.workspaceId===state.activeId&&a.name==="Main account")).toBe(true);
  expect(parseSnapshot(getFinoraSnapshot())).not.toBeNull();
 });
 it("makes new business workspaces usable immediately",()=>{
  useFinance.getState().addWorkspace("Independent activity","freelance");
  const state=useFinance.getState();
  expect(state.workspaces.find(w=>w.id===state.activeId)?.taxBasis).toBe("revenue");
  expect(state.accounts.find(a=>a.workspaceId===state.activeId)?.openingBalance).toBe(0);
 });
});
