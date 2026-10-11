// Verifies the site copy against the client's PDF text (copy-check/hope-copy.txt).
//   1. every string in src/copy.js must appear word-for-word in the PDF
//   2. every word of the PDF must be used somewhere in src/copy.js (nothing left out)
// Usage: npm run check:copy
import fs from "node:fs";
import { COPY } from "./src/copy.js";

const norm = (s) =>
  s.replace(/[​‌‍﻿]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();

const pdf = norm(fs.readFileSync(new URL("./copy-check/hope-copy.txt", import.meta.url), "utf8"));

// collect every string (and every arrow-chain the PDF shows)
const strings = [];
const walk = (v) => (Array.isArray(v) ? v.forEach(walk) : v && typeof v === "object" ? Object.values(v).forEach(walk) : typeof v === "string" && strings.push(v));
walk(COPY);
const chains = [
  COPY.how.steps.join(" → "),
  COPY.built.levels.join(" → "),
  COPY.used.outreach.join(" → "),
  COPY.humans.loop.join(" → "),
  COPY.example.steps.join(" → ") + ".",
];

let bad = 0;
for (const s of [...strings, ...chains]) {
  if (!pdf.includes(norm(s))) { bad++; console.log("NOT IN PDF  →", s); }
}

// coverage: strip everything we use, see what is left of the PDF
let rest = pdf;
for (const s of [...chains, ...strings].map(norm).sort((a, b) => b.length - a.length)) rest = rest.split(s).join(" ");
rest = rest.replace(/→/g, " ").replace(/\s+/g, " ").trim();
const ignorable = /^(HOPE PRODUCT BIBLE\s*)?$/i;
const left = rest.replace(/HOPE PRODUCT BIBLE/i, "").replace(/\s+/g, " ").trim();

console.log(`${strings.length} copy strings checked.`);
console.log(bad ? `${bad} NOT matching the PDF — fix src/copy.js.` : "All copy matches the PDF word-for-word.");
console.log(ignorable.test(left) ? "Nothing from the PDF is left out." : `PDF text not used on the page: "${left}"`);
process.exit(bad ? 1 : 0);
