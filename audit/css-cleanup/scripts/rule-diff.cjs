// Semantic diff of a stylesheet between a git revision and the working file:
// (context, selector) -> declarations, comments and formatting ignored.
// Usage: node rule-diff.cjs <rev> <file>
const path = require("path"), fs = require("fs"), cp = require("child_process");
const root = path.resolve(__dirname, "../../..");
const csstree = require(path.join(root, "node_modules/css-tree"));
const [rev, file] = process.argv.slice(2);
const flat = (src) => {
  const m = new Map();
  const ast = csstree.parse(src.replace(/\r\n/g, "\n"), { parseValue: false, parseCustomProperty: false });
  csstree.walk(ast, {
    enter(node) {
      const ctx = this.atrule && this.atrule.name !== "keyframes" ? "@" + this.atrule.name + " " + csstree.generate(this.atrule.prelude) + " " : "";
      if (node.type === "Atrule" && node.name === "keyframes") { m.set("@keyframes " + csstree.generate(node.prelude), csstree.generate(node.block)); return csstree.walk.skip; }
      if (node.type !== "Rule") return;
      const body = node.block.children.toArray().filter((d) => d.type === "Declaration").map((d) => `${d.property}:${csstree.generate(d.value)}${d.important ? "!important" : ""}`);
      for (const s of node.prelude.children.toArray()) {
        const k = ctx + csstree.generate(s);
        m.set(k, (m.get(k) ? m.get(k) + ";" : "") + body.join(";"));
      }
    },
  });
  return m;
};
const a = flat(cp.execSync(`git show ${rev}:${file}`, { cwd: root, maxBuffer: 1e8 }).toString());
const b = flat(fs.readFileSync(path.join(root, file), "utf8"));
const removed = [...a.keys()].filter((k) => !b.has(k));
const added = [...b.keys()].filter((k) => !a.has(k));
const changed = [...a.keys()].filter((k) => b.has(k) && a.get(k) !== b.get(k));
console.log(`removed ${removed.length}:`); removed.forEach((k) => console.log("  - " + k));
console.log(`added ${added.length}:`); added.forEach((k) => console.log("  + " + k));
console.log(`changed ${changed.length}:`); changed.forEach((k) => console.log(`  ~ ${k}\n      was: ${a.get(k).slice(0, 200)}\n      now: ${b.get(k).slice(0, 200)}`));
