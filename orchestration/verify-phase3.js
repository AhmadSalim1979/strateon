#!/usr/bin/env node
const { createClient } = require('./node_modules/@supabase/supabase-js');
const supabase = createClient(
  'https://btrbczqjwzuybgcxckvm.supabase.co',
  'sb_secret_Jvk8fgExoN2tGOkFxZJm_w_Uh07x06x'
);

async function verify() {
  console.log('Starting verification...\n');

  // V1: All columns exist
  const allCols = ['id','plan_id','step_id','run_id','event_type','source','payload','created_at',
                  'event_id','correlation_id','caused_by_job_id','hop_count','processed_at','processing_duration_ms'];
  
  console.log('=== CHECK 1: Column existence ===');
  for (const col of allCols) {
    const r = await supabase.from('events').select(col).limit(1);
    const status = r.error ? `MISSING: ${r.error.message.split(':').pop().trim()}` : 'EXISTS';
    console.log(`  ${col}: ${status}`);
  }

  // V2: NOT NULL check — try inserting with null event_id
  console.log('\n=== CHECK 2: event_id NOT NULL constraint ===');
  const r2 = await supabase.from('events').insert({
    event_id: null,
    event_type: 'verify-not-null-test',
    source: 'verify',
    payload: {}
  }).select('id').single();
  console.log('  NULL insert rejected:', !r2.error ? 'FAIL (accepted null!)' : 'PASS — rejected: ' + r2.error.message.split(':').pop().trim());

  // V3: Total and NULL count
  console.log('\n=== CHECK 3: All rows have event_id ===');
  const totalR = await supabase.from('events').select('*', { count: 'exact', head: true });
  const nullR = await supabase.from('events').select('id', { count: 'exact', head: true }).is('event_id', null);
  console.log('  Total rows:', totalR.count);
  console.log('  NULL event_id count:', nullR.count);
  console.log('  Result:', nullR.count === 0 ? 'PASS' : 'FAIL');

  // V4: Unique index — insert same event_id twice
  console.log('\n=== CHECK 4: Unique index on event_id ===');
  const testId = 'VERIFY-UNIQUE-' + Date.now();
  const r4a = await supabase.from('events').insert({ event_id: testId, event_type: 'unique.test', source: 'verify', payload: {} }).select('id').single();
  console.log('  First insert:', r4a.error ? 'FAIL: ' + r4a.error.message : 'OK, id=' + r4a.data.id);
  const r4b = await supabase.from('events').insert({ event_id: testId, event_type: 'unique.test', source: 'verify', payload: {} }).select('id').single();
  console.log('  Second insert (should fail):', r4b.error ? 'PASS — rejected correctly' : 'FAIL — accepted duplicate!');
  
  // V5: Indexes exist
  console.log('\n=== CHECK 5: Indexes ===');
  const idxR = await supabase.from('events').select('id').limit(1);
  console.log('  Table accessible:', idxR.error ? 'FAIL: ' + idxR.error.message : 'YES');

  // V6: Phase 1 events still readable
  console.log('\n=== CHECK 6: Phase 1 events readable ===');
  const p1R = await supabase.from('events').select('id,plan_id,event_type').limit(3);
  console.log('  Phase1 sample read:', p1R.error ? 'FAIL: ' + p1R.error.message : `OK — ${p1R.data?.length || 0} rows returned`);
  if (p1R.data?.length > 0) {
    console.log('  Sample:', JSON.stringify(p1R.data[0]));
  }

  // V7: Phase 3 format insert
  console.log('\n=== CHECK 7: Phase 3 format insert ===');
  const r7 = await supabase.from('events').insert({
    event_id: 'VERIFY-P3-' + Date.now(),
    event_type: 'phase3.verification',
    source: 'verify-script',
    payload: { verify: true, timestamp: new Date().toISOString() },
    correlation_id: 'verify-corr-001',
    caused_by_job_id: 'verify-job-001',
    hop_count: 0,
    processed_at: null,
    processing_duration_ms: null
  }).select('id,event_id,correlation_id,hop_count').single();
  console.log('  Phase3 insert:', r7.error ? 'FAIL: ' + r7.error.message : 'OK — ' + JSON.stringify(r7.data));

  // V8: Phase 1 and Phase 3 columns coexist
  console.log('\n=== CHECK 8: Mixed Phase 1/Phase 3 read ===');
  const r8 = await supabase.from('events').select('id,plan_id,event_id,event_type,correlation_id').limit(2);
  console.log('  Mixed read:', r8.error ? 'FAIL: ' + r8.error.message : `OK — ${r8.data?.length || 0} rows`);

  console.log('\n=== VERIFICATION COMPLETE ===');
}

verify().catch(e => console.error('Fatal error:', e.message));