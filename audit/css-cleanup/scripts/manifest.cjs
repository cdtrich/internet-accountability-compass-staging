// SHA-256 manifest of the captures in a folder (PNGs and style dumps stay out of git).
// Usage: node manifest.cjs <dir> <out.sha256>   (sha256sum format)
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const [dir, outFile] = [path.resolve(process.argv[2]), path.resolve(process.argv[3])];
const lines = fs.readdirSync(dir).filter((f) => /\.(png|styles\.json)$/.test(f)).sort()
  .map((f) => `${crypto.createHash("sha256").update(fs.readFileSync(path.join(dir, f))).digest("hex")}  ${f}`);
fs.writeFileSync(outFile, lines.join("\n") + "\n");
console.log(`${lines.length} files -> ${outFile}`);
