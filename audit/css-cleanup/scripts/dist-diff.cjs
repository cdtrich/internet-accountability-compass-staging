// Which files differ between two builds, ignoring the content hash in
// style.<hash>.css names (and references to them in HTML/JS)?
// Usage: node dist-diff.cjs <distA> <distB>
const fs = require("fs"), path = require("path");
const [A, B] = process.argv.slice(2).map((p) => path.resolve(p));
const walk = (d, b = "") => fs.readdirSync(path.join(d, b), { withFileTypes: true })
  .flatMap((e) => e.isDirectory() ? walk(d, path.join(b, e.name)) : [path.join(b, e.name).split(path.sep).join("/")]);
const HASH = /style\.[0-9a-f]{8}\.css/g;
const key = (f) => f.replace(HASH, "style.HASH.css");
const filesB = new Map(walk(B).map((f) => [key(f), f]));
let same = 0; const differ = [], onlyA = [];
for (const f of walk(A)) {
  const g = filesB.get(key(f));
  if (!g) { onlyA.push(f); continue; }
  filesB.delete(key(f));
  const x = fs.readFileSync(path.join(A, f)), y = fs.readFileSync(path.join(B, g));
  if (x.equals(y) || (/\.(html|js)$/.test(f) && x.toString().replace(HASH, "H") === y.toString().replace(HASH, "H"))) same++;
  else differ.push(f);
}
console.log(JSON.stringify({ identicalAfterHashNormalisation: same, differ, onlyInA: onlyA, onlyInB: [...filesB.values()] }, null, 1));
