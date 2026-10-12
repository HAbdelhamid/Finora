import {afterEach,describe,expect,it,vi} from "vitest";
import {readMode} from "../lib/cloud-storage";
import {parseSnapshot} from "../lib/finance-store";
import {makeSeed} from "../lib/seed";

afterEach(()=>vi.unstubAllGlobals());

describe("local/cloud/hybrid preferences",()=>{
 it("defaults to local when no browser is available",()=>{
  vi.stubGlobal("window",undefined);
  expect(readMode()).toBe("local");
 });
 it("accepts only recognized storage modes",()=>{
  const records=new Map<string,string>();
  vi.stubGlobal("window",{localStorage:{getItem:(key:string)=>records.get(key)??null}});
  expect(readMode()).toBe("local");
  records.set("finora-storage-mode","hybrid");
  expect(readMode()).toBe("hybrid");
  records.set("finora-storage-mode","cloud");
  expect(readMode()).toBe("cloud");
  records.set("finora-storage-mode","invalid");
  expect(readMode()).toBe("local");
 });
});

describe("cloud snapshot validation",()=>{
 it("accepts a complete Finora snapshot",()=>{
  expect(parseSnapshot(makeSeed(new Date("2026-10-10")))).not.toBeNull();
 });
 it("rejects missing workspace identity and corrupted data",()=>{
  expect(parseSnapshot({workspaces:[]})).toBeNull();
  const seed=makeSeed();
  expect(parseSnapshot({...seed,accounts:"bad"})).toBeNull();
 });
 it("rejects malformed Zakat and out-of-schema workspace modes",()=>{
  const seed=makeSeed();
  expect(parseSnapshot({...seed,workspaces:[{...seed.workspaces[0],kind:"admin"}]})).toBeNull();
  expect(parseSnapshot({...seed,workspaces:[{...seed.workspaces[0],zakat:null}]})).toBeNull();
 });
});
