import { readFileSync } from 'node:fs';
const content = readFileSync('/home/node/.openclaw/workspace/src/core/reflective-coherence-validate.js', 'utf8');
const lines = content.split('\n');

// The (async () => { starts at line 15 (1-indexed), char position after '(async '
// We need to find exactly what the imbalance is.

// Let's trace from line 15 onwards, char by char, including line 15
let b = 0, p = 0;
let prevC = '';
let inStr = false, strChar = '';
let prevWasBackslash = false;

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
      if (c === '{') b++;
      if (c === '}') b--;
      if (c === '(') p++;
      if (c === ')') p--;
    }
    prevC = c;
    prevWasBackslash = (c === '\\');
  }
  if (li >= 894) {
    console.log(`Line ${li+1}: b=${b} p=${p} | ${lines[li].slice(0,60)}`);
  }
}
console.log('\nFinal: b=', b, 'p=', p);

// The issue: We start at line 14 (0-indexed) which is BEFORE line 15's content
// The (async () => { starts with '(' at the very beginning of line 15
// So when we process line 14 (before line 15), b=0, p=0
// Then when we hit the '(' on line 15, p++ makes p=1
// But we never see a matching ')' for that opening '(' because the async IIFE closing is:
// })(); — the first } closes the { of the function body, first ) closes the async () part
// Wait: (async () => { ... }) — the } closes the { and ) closes the ( — that accounts for 1 b and 1 p
// Then () is the call which adds 2 more parens but they're balanced

// So if our counter starts at line 14 (before processing line 15):
// - Line 15: '(' -> p=1, then '{' -> b=1
// - Eventually at line 900: '}' -> b=0, ')' -> p=0
// But we get b=1 p=1, meaning one extra of each

// This means one { and one ( are opened but never closed within the IIFE
// Let's find exactly where