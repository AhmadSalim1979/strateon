import { readFileSync } from 'node:fs';
const content = readFileSync('/home/node/.openclaw/workspace/src/core/reflective-coherence-validate.js', 'utf8');
const lines = content.split('\n');

// Find lines 80-90 with char-by-char for parens and braces
for (let li = 79; li < 92; li++) {
  const line = lines[li];
  let p = 0, b = 0;
  let inStr = false, strChar = '', prevC = '', escaped = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (escaped) { escaped = false; prevC = c; continue; }
    if (!inStr && (c === '"' || c === "'" || c === '`')) { inStr = true; strChar = c; }
    else if (inStr && c === strChar && prevC !== '\\') { inStr = false; }
    else if (!inStr) {
      if (c === '(') { p++; console.log(`  L${li+1} pos${i} ( -> p=${p} context: ${line.slice(Math.max(0,i-15),i+10)}`); }
      if (c === ')') { p--; console.log(`  L${li+1} pos${i} ) -> p=${p}`); }
      if (c === '{') { b++; console.log(`  L${li+1} pos${i} { -> b=${b}`); }
      if (c === '}') { b--; console.log(`  L${li+1} pos${i} } -> b=${b}`); }
    }
    prevC = c;
    if (c === '\\') escaped = true;
  }
  console.log(`L${li+1} end: b=${b} p=${q} | ${line.slice(0,80)}`);
}