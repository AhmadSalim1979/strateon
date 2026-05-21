import { readFileSync } from 'node:fs';
const content = readFileSync('src/core/reflective-coherence-validate.js', 'utf8');
const lines = content.split('\n');

// Find lines with unbalanced braces (excluding strings)
let b = 0, p = 0;
let prevC = '';
let inStr = false, strChar = '';

const issues = [];

for (let li = 0; li < lines.length; li++) {
  const line = lines[li];
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (prevC !== '\\' && !inStr && (c === '"' || c === "'" || c === '`')) {
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
  }
  if (b < 0 || p < 0) {
    issues.push({ line: li+1, text: line.slice(0,60), b, p });
  }
}

console.log('Final: b=', b, 'p=', p);
console.log('Negative events:', issues.length);
issues.forEach(x => console.log(' Line', x.line, 'b='+x.b, 'p='+x.p, x.text));

// Find where the extra opens are by scanning for specific patterns
// Look for template literals, regex, etc that contain { but aren't counted
console.log('\nSearching for potential untracked { patterns...');

// Check lines with comments or strings containing {
for (let li = 0; li < lines.length; li++) {
  const l = lines[li];
  // Skip lines that are just whitespace
  if (!l.trim()) continue;
  // Find lines where our simple count might be wrong
  if (l.includes('/*') || l.includes('*/') || l.includes('//')) {
    // Check for comment with {
    const inComment = l.match(/(\/\/.*|\/\*.*\*\/)/);
    if (inComment && inComment[0].includes('{')) {
      console.log('Comment line', li+1, ':', l.slice(0,80));
    }
  }
}

// Also check the last 50 lines more carefully
console.log('\nLast 50 lines brace/parens trace:');
b = 0; p = 0; inStr = false; strChar = ''; prevC = '';
for (let li = 850; li < lines.length; li++) {
  const line = lines[li] + '\n';
  const startB = b, startP = p;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (prevC !== '\\' && !inStr && (c === '"' || c === "'" || c === '`')) {
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
  }
  if (b !== startB || p !== startP) {
    console.log('  Line', li+1, 'b:', startB, '->', b, 'p:', startP, '->', p, '|', lines[li].slice(0,70));
  }
}