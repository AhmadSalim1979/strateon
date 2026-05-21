import { readFileSync } from 'node:fs';
const content = readFileSync('/home/node/.openclaw/workspace/src/core/reflective-coherence-validate.js', 'utf8');
const lines = content.split('\n');

// Find what's creating the second { and (
// We know from line 881 onwards b=2 p=2 persistently
// So the extra open must happen before line 881
// Let's find when b goes from 1 to 2

let b = 0, p = 0;
let prevC = '';
let inStr = false, strChar = '';
let prevWasBackslash = false;

for (let li = 14; li < lines.length; li++) {
  const line = lines[li];
  const startB = b, startP = p;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (prevWasBackslash && !inStr) {
      prevWasBackslash = false;
      prevC = c;
      continue;
    }
    if (!inStr && (c === '"' || c === "'" || c === '`')) {
      inStr = true; strChar = c;
    } else if (inStr && c === strChar && prevC !== '\\') {
      inStr = false;
    } else if (!inStr) {
      if (c === '{') { b++; }
      if (c === '}') { b--; }
      if (c === '(') { p++; }
      if (c === ')') { p--; }
    }
    prevC = c;
    prevWasBackslash = (c === '\\');
  }
  if (b !== startB || p !== startP) {
    console.log(`L${li+1} b:${startB}->${b} p:${startP}->${p} | ${line.slice(0,80)}`);
  }
  // Stop after we see it go to b=2 p=2
  if (b === 2 && p === 2) {
    console.log('  --> b=2 p=2 reached at line', li+1);
  }
}
console.log('Final: b=', b, 'p=', p);