// Loads the simulation code from index.html (the block between //SIM and //ENDSIM, the same text the page hands its Web Worker)
// and the default settings, so tests run the exact code the page runs.
"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");
const HTML=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
function simSource(){const a=HTML.search(/^\/\/SIM\r?$/m),b=HTML.indexOf("//ENDSIM");if(a<0||b<a)throw new Error("index.html has no //SIM ... //ENDSIM block");return HTML.slice(a,b)}
function defaults(){const m=HTML.match(/^const DEF=(\{.*?\});\r?$/m);if(!m)throw new Error("index.html has no 'const DEF={...};' line");return vm.runInNewContext("("+m[1]+")")}
// new Function (not vm.createContext) keeps the code in this realm; a separate vm context makes the simulation about ten times slower.
function load(){return new Function(simSource()+"\nreturn{sim,solveFor:typeof solveFor=='function'?solveFor:null,tornado:typeof tornado=='function'?tornado:null};")()}
module.exports={load,defaults,HTML};
