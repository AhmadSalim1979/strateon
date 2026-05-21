import { readFileSync } from 'node:fs';
const content = readFileSync('/home/node/.openclaw/workspace/src/core/reflective-coherence-validate.js', 'utf8');
const lines = content.split('\n');

// More accurate bracket counter that handles:
// 1. Single/double quoted strings
// 2. Template literals (track ${...} nesting inside them)
// 3. Escaped characters

let b = 0, p = 0;
let prevC = '';
let inSingleQuote = false;
let inDoubleQuote = false;
let inTemplateLiteral = false;
let templateNesting = 0; // tracks ${...} depth inside template literal
let prevWasBackslash = false;

for (let li = 14; li < lines.length; li++) {
  const line = lines[li];
  const startB = b, startP = p;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];

    // Handle escape sequences
    if (prevWasBackslash) {
      prevWasBackslash = false;
      prevC = c;
      continue;
    }
    if (c === '\\') {
      prevWasBackslash = true;
      prevC = c;
      continue;
    }

    // Track string boundaries
    if (!inSingleQuote && !inDoubleQuote && !inTemplateLiteral && c === '`') {
      inTemplateLiteral = true;
    } else if (inTemplateLiteral && c === '$' && line[i+1] === '{') {
      // Entering ${...} inside template literal - braces inside don't count as code
      templateNesting++;
      i++; // skip the {
      prevC = c;
      continue;
    } else if (inTemplateLiteral && templateNesting > 0 && c === '}') {
      templateNesting--;
    } else if (inTemplateLiteral && !inSingleQuote && !inDoubleQuote && c === '`') {
      inTemplateLiteral = false;
    } else if (!inSingleQuote && !inDoubleQuote && !inTemplateLiteral && c === "'") {
      inSingleQuote = true;
    } else if (inSingleQuote && c === "'") {
      inSingleQuote = false;
    } else if (!inSingleQuote && !inDoubleQuote && !inTemplateLiteral && c === '"') {
      inDoubleQuote = true;
    } else if (inDoubleQuote && c === '"') {
      inDoubleQuote = false;
    }

    // Count braces/parens only when NOT inside any string
    if (!inSingleQuote && !inDoubleQuote && !inTemplateLiteral) {
      if (c === '{') b++;
      if (c === '}') b--;
      if (c === '(') p++;
      if (c === ')') p--;
    }

    prevC = c;
  }
  if (b !== startB || p !== startP) {
    console.log(`L${li+1} b:${startB}->${b} p:${startP}->${p} | ${line.slice(0,80)}`);
  }
  if (b === 2 && p === 2) {
    console.log('  --> b=2 p=2 first reached at line', li+1);
  }
}
console.log('\nFinal: b=', b, 'p=', p);