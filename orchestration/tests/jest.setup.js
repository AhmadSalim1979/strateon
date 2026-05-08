// Jest setup file — provides test globals for all test files
// @ts-check
/** */
const { describe, it, test, before, after, beforeEach, afterEach, expect } = require('@jest/globals');

if (typeof global.describe !== 'function') {
  global.describe = describe;
}
if (typeof global.it !== 'function') {
  global.it = it;
}
if (typeof global.test !== 'function') {
  global.test = test;
}
if (typeof global.before !== 'function') {
  global.before = before;
}
if (typeof global.after !== 'function') {
  global.after = after;
}
if (typeof global.beforeEach !== 'function') {
  global.beforeEach = beforeEach;
}
if (typeof global.afterEach !== 'function') {
  global.afterEach = afterEach;
}
if (typeof global.expect !== 'function') {
  global.expect = expect;
}

console.log('[jest.setup] Test globals initialized');