import {readdirSync,readFileSync} from "node:fs";
import {join,relative,resolve} from "node:path";
import assert from "node:assert/strict";
const root=resolve(import.meta.dirname,"..");
let checked=0;
function walk(dir){
  for(const entry of readdirSync(dir,{withFileTypes:true})){
    if(entry.name==="node_modules"||entry.name===".git")continue;
    const path=join(dir,entry.name);
    if(entry.isDirectory()){walk(path);continue;}
    const lines=readFileSync(path,"utf8").replace(/\n$/,"").split("\n").length;
    assert.ok(lines<=377,relative(root,path)+" has "+lines+" lines");
    checked++;
  }
}
walk(root);
const manifest=JSON.parse(readFileSync(join(root,"extension/manifest.json"),"utf8"));
assert.equal(manifest.commands["search-foreground"].suggested_key.default,"F1");
console.log("Checked "+checked+" files, max 377 lines per file");
