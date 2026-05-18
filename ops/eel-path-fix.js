#!/usr/bin/env node
/**
 * EEL Supabase Path Fix — CRITICAL
 * File: strateon/eel/src/apac-whatsapp-hook.js
 * Bug: require('../../../secrets/supabase.json') → wrong depth
 * Fix: require('../../../../secrets/supabase.json') → correct depth
 */

const fs = require('fs');
const path = '/home/node/.openclaw/workspace/strateon/eel/src/apac-whatsapp-hook.js';

const content = fs.readFileSync(path, 'utf8');
const old = "const secrets = require('../../../secrets/supabase.json');";
const newStr = "const secrets = require('../../../../secrets/supabase.json');";

if (!content.includes(old)) {
  console.log('ERROR: Pattern not found. Checking current state...');
  const match = content.match(/require\(['"](\.\.\/[^'"]+)'\)/);
  if (match) console.log('Found:', match[0]);
  process.exit(1);
}

const updated = content.replace(old, newStr);
fs.writeFileSync(path, updated, 'utf8');
console.log('FIXED: apac-whatsapp-hook.js — path depth corrected');
console.log('Before:', old);
console.log('After: ', newStr);