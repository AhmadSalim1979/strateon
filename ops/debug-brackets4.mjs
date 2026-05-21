import { readFileSync } from 'node:fs';
const content = readFileSync('/home/node/.openclaw/workspace/src/core/reflective-coherence-validate.js', 'utf8');
const lines = content.split('\n');

// Find ALL test() calls and function declarations - count opens
let b = 0, p = 0;
let prevC = '';
let inStr = false, strChar = '';
let prevWasBackslash = false;
let testOpens = [];

for (let li = 14; li < lines.length; li++) {
  const line = lines[li];
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
  if (li >= 880) {
    console.log(`L${li+1}: b=${b} p=${p} | ${line.slice(0,70)}`);
  }
}
console.log('\nFinal: b=', b, 'p=', p);