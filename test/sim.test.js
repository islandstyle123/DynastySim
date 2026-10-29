// Checks of the simulation against results that can be worked out by hand, plus basic sanity rules.
"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {load,defaults,HTML}=require("./harness");
const {sim,solveFor,tornado}=load(),D=defaults();
const close=(a,b,rel,msg)=>assert.ok(Math.abs(a-b)<=rel*Math.abs(b),`${msg}: ${a} vs ${b}`);
// No randomness in returns, no inflation, fees or taxes: the trust only shrinks by what it pays out.
const flat={...D,mode:"simple",ret:0,infl:0,fee:0,taxm:"simple",tx:0,fw:0,sw:100,H:50,N:100,cens:true};

test("same settings give the same results",()=>{const P={...D,H:60,N:100};assert.deepEqual(sim(P).kpi,sim(P).kpi)});

test("a percentage payout with no growth shrinks the trust by exactly that percentage each year",()=>{
const r=sim({...flat,dist:2}),F0=flat.fund*1e6;
for(const t of [0,9,24,49])close(r.trust[1][t],F0*Math.pow(.98,t+1),1e-6,"median at year "+(t+1))});

test("a fixed payout with no growth reduces the trust by the payout each year until it runs out",()=>{
const r=sim({...flat,dmode:"fixed",fx:300000}),F0=flat.fund*1e6;
close(r.trust[1][9],F0-10*300000,1e-6,"year 10");assert.ok(r.trust[1][40]<1,"empty after about 33 years")});

test("two equal children split the first year's payout equally",()=>{
const r=sim({...flat,dist:2});close(r.med[0][0],flat.fund*1e6*.02/2,.015,"generation 1 payout in year 1")});

test("percentile lines report the average real return of the simulation on them",()=>{
// Fixed 6% nominal return with 2% inflation is 1.06/1.02 - 1 real every year, on every line.
const r=sim({...flat,ret:6,infl:2,rtype:"nom",dist:2});for(const k of [0,1,2])for(const t of [0,24,49])close(r.trust.ret[k][t],1.06/1.02-1,1e-5,`line ${k} year ${t+1}`);
// With random returns, the line higher up had the better average return.
const m=sim({...D,H:100,N:300});for(const t of [49,99])assert.ok(m.trust.ret[0][t]<m.trust.ret[1][t]&&m.trust.ret[1][t]<m.trust.ret[2][t],"year "+(t+1))});

test("percentiles are in order and shares are between 0 and 1",()=>{
for(const mode of ["mc","lay","hist","simple"]){const r=sim({...D,mode,H:80,N:150});
for(let t=0;t<80;t++){const [a,b,c]=[r.trust[0][t],r.trust[1][t],r.trust[2][t]];assert.ok(a<=b&&b<=c,`${mode} year ${t+1}`)}
for(const k of ["low","ext"])assert.ok(r.kpi[k]>=0&&r.kpi[k]<=1,`${mode} ${k}`)}});

test("lite mode gives the same headline numbers as a full run",()=>{
const P={...D,H:80,N:150},full=sim(P),lite=sim({...P,lite:true});
for(const k of ["fin","low","ext","rec","drag","p50"])assert.equal(lite.kpi[k],full.kpi[k],k)});

test("solver finds the payout rate that keeps half the value after 50 years",()=>{
// (1-d)^50 >= 0.5 gives d <= 1.377%; the solver rounds down to 0.01 points.
const r=solveFor(flat,{x:"dist",goal:"keep",y:50,pct:50,prob:90,n:100});
assert.equal(r.status,"ok");close(r.x,1.37,.006,"rate");assert.ok(r.m>=.9,"goal met at the answer")});

test("solver finds the funding for a payout target",()=>{
// Each of two children gets F0 * 0.98^9 * 2% / 2 in year 10, so $50K needs about $6.0M.
const r=solveFor({...flat,dist:2},{x:"fund",goal:"pay",y:10,g:1,amt:50000,n:100});
assert.equal(r.status,"ok");close(r.x,6.0,.03,"funding");assert.ok(r.m>=50000,"goal met at the answer")});

test("solver reports goals that are out of reach or do not depend on the setting",()=>{
// Random returns, so the chance is between 0 and 1, and with a percentage payout it is the same at any funding.
assert.equal(solveFor({...D,H:40,N:100},{x:"fund",goal:"keep",y:40,pct:100,prob:90,n:100}).status,"flat");
assert.equal(solveFor(flat,{x:"dist",goal:"keep",y:50,pct:200,prob:90,n:100}).status,"never");
assert.equal(solveFor(flat,{x:"dist",goal:"keep",y:50,pct:0,prob:90,n:100}).status,"always");
assert.throws(()=>solveFor(flat,{x:"dist",goal:"pay",y:10,g:1,amt:1,n:100}));
assert.throws(()=>solveFor(flat,{x:"fx",goal:"keep",y:10,pct:50,prob:90,n:100}))});

test("sensitivity varies only settings in use, within their limits, largest effect first",()=>{
const r=tornado({...D,H:60,N:100},{metric:"fin",n:100}),ks=r.rows.map(t=>t.k);
assert.ok(ks.includes("ret")&&ks.includes("dist")&&!ks.includes("fx")&&!ks.includes("hsv"));
const sw=r.rows.find(t=>t.k=="sw");assert.equal(sw.hi,100);assert.equal(sw.vhi,r.base,"stock share already at 100%: no upper run");
const sp=r.rows.map(t=>Math.abs(t.vlo-r.base)+Math.abs(t.vhi-r.base));for(let i=1;i<sp.length;i++)assert.ok(sp[i]<=sp[i-1]);
const fx=tornado({...D,dmode:"fixed",mode:"hist",H:40,N:100},{metric:"low",n:100}).rows.map(t=>t.k);
assert.ok(fx.includes("fx")&&fx.includes("fund")&&fx.includes("hsv")&&!fx.includes("dist")&&!fx.includes("ret"))});

test("version stamps in the page agree",()=>{
const a=HTML.match(/<!-- Long Trust Lab version (\S+), built (.+?)\./),b=HTML.match(/APP_VERSION="([^"]+)",APP_BUILT="([^"]+)"/);
assert.ok(a&&b);assert.equal(a[1],b[1]);assert.equal(a[2],b[2])});
