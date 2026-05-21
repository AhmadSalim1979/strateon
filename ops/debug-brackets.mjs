import { readFileSync } from 'node:fs';
const content = readFileSync('src/core/reflective-coherence-validate.js', 'utf8');
const lines = content.split('\n');

let b = 0, p = 0;
let prevC = '';
let inStr = false, strChar = '';

for (let li = 14; li < lines.length; li++) {
  const line = lines[li] + '\n';
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (prevC !== '\\' && !inStr && (c === '"' || c === "'" || c === '`')) {
      inStr = true; strChar = c;
    } else if (inStr && c === strChar && prevC !== '\\') {
      inStr = false;
    } else if (!inStr) {
      if (c === '{') b++;
      if (c === '}') { b--; if (b < 0) { console.log('NEGATIVE BRACES at line', li+1, 'b=', b); } }
      if (c === '(') p++;
      if (c === ')') { p--; if (p < 0) { console.log('NEGATIVE PARENS at line', li+1, 'p=', p); } }
    }
    prevC = c;
  }
}
console.log('Final: b=', b, 'p=', p, 'total lines', lines.length);
console.log('Last 3 lines:');
for (let i = lines.length-3; i < lines.length; i++) console.log(i+1, JSON.stringify(lines[i]));