// Split a style-diff.json (style-diff.cjs) into whitespace-only custom-property
// differences and everything else; prints counts and every other change.
// Usage: node nonws.cjs <style-diff.json>
const fs=require("fs"),d=JSON.parse(fs.readFileSync(process.argv[2]));
const norm=s=>s==null?s:s.replace(/\s+/g," ").replace(/\s*([,()])\s*/g,"$1").trim();
let cases=0,total=0,ws=0,other=[];const props=new Set();
for(const [id,r] of Object.entries(d)){cases++;if(r.onlyInA.length||r.onlyInB.length)other.push(id+" element sets differ");
 for(const c of r.changes){total++;if(c.prop.startsWith("--")&&norm(c.a)===norm(c.b)){ws++;props.add(c.prop)}else other.push(`${id} ${c.el} ${c.pseudo||""} ${c.prop}: ${c.a} -> ${c.b}`)}}
console.log({cases,total,whitespaceOnly:ws,props:[...props].sort(),other:other.length});console.log(other.slice(0,20).join("\n"));
