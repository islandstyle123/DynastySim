// Snapshot of key results for a spread of settings. A change to the simulation that moves any number fails here, so model
// changes are always deliberate. After an intended change, review the differences, then refresh with: npm run update-golden
"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("fs"),path=require("path");
const {load,defaults}=require("./harness");
const {sim}=load(),D=defaults(),FILE=path.join(__dirname,"golden.json"),UPDATE=process.env.UPDATE_GOLDEN==="1";
const base={H:150,N:200};
const CASES={
 "defaults":{},
 "layered":{mode:"lay"},
 "historical US":{mode:"hist",hsrc:"us"},
 "historical one country":{mode:"hist",hsrc:"jst"},
 "historical world":{mode:"hist",hsrc:"jstw"},
 "simple returns":{mode:"simple"},
 "60/40 with uncertain return":{sw:60,runc:true,rtype:"real",ret:5},
 "fixed payout":{dmode:"fixed",fx:250000},
 "floor and cap":{dmode:"band",dist:3,fl:150000,fc:300000},
 "smoothed payout":{dmode:"smooth",sy:5,dist:2.5},
 "flat tax, beneficiary tax":{taxm:"simple",tx:.3,btx:true,bst:5},
 "realistic families":{fmod:"parity",ffam:true,func:true,kt:-.3,lx:3,a2:"1, 3"},
 "age weights, payout age cap":{wmode:"age",mw:30,senw:120,cap:80},
 "generation floor":{ratio:40,wmin:30},
 "branch trusts":{cmp:true},
 "no censoring, confidence ranges":{cens:false,ci:true},
 "one family":{one:true,N:1,seed:4242}};
const r6=v=>v==null||typeof v!="number"?v:Number.isFinite(v)?+v.toPrecision(8):String(v);
const at=(a,ys)=>ys.map(y=>r6(a[y-1]));
function snap(r){const Y=[1,10,50,100,150];
if(r.one){const o=r.one,sum=a=>Array.from(a).reduce((x,y)=>x+(y==y?y:0),0);return{people:o.people.length,living:at(o.living,Y),paid:r6(sum(o.D)),tax:r6(sum(o.tax)),fee:r6(sum(o.fee)),end:r6(o.v1[o.v1.length-1]),gen1:r6(sum(o.pay[0]))}}
const s={kpi:Object.fromEntries(Object.entries(r.kpi).map(([k,v])=>[k,v&&typeof v=="object"?JSON.parse(JSON.stringify(v,(_,x)=>r6(x))):r6(v)])),
 trust:r.trust.map(b=>at(b,Y)),trustRet:r.trust.ret.map(b=>at(b,Y)),heads:at(r.heads[1],Y),perBen:at(r.pbn[1],Y),pay:r.med.slice(0,4).map(m=>at(m,Y)),tot:r.tot.map(r6),
 life:r.life.slice(0,4).map(l=>({g:l.g,rec:l.rec.map(r6),nps:r6(l.nps)}))};
if(r.cmp)s.cmp={fin:r6(r.cmp.fin),life:r.cmp.life.slice(0,3).map(l=>({g:l.g,pot:r6(l.pot),alt:r6(l.alt),outr:r6(l.outr),zero:r6(l.zero)}))};
return s}
const got=Object.fromEntries(Object.entries(CASES).map(([k,o])=>[k,snap(sim({...D,...base,...o}))]));
if(UPDATE){fs.writeFileSync(FILE,JSON.stringify(got,null,1)+"\n");console.log("Wrote "+FILE)}
const want=JSON.parse(fs.readFileSync(FILE,"utf8"));
for(const k of Object.keys(CASES))test("snapshot: "+k,()=>assert.deepEqual(got[k],want[k]));
test("snapshot file has no stale cases",()=>assert.deepEqual(Object.keys(want).sort(),Object.keys(CASES).sort()));
