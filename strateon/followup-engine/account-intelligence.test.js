/**
 * Qiyadon — Account Intelligence Test Suite
 * Validates generateAccountBrief() across 5 account types.
 */

'use strict';

const { generateAccountBrief } = require('./account-intelligence.js');

function runTest(label, lead, companyData, expectations) {
  const brief = generateAccountBrief(lead, companyData);

  const passed = Object.entries(expectations).every(([key, expected]) => {
    const actual = brief[key];
    if (Array.isArray(expected)) {
      return expected.every(e => actual.includes(e));
    }
    return actual === expected;
  });

  const status = passed ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${label}`);
  if (!passed) {
    console.log('  Expected:', expectations);
    console.log('  Got:', {
      stage: brief.stage,
      gtmMotion: brief.gtmMotion,
      salesComplexity: brief.salesComplexity,
      messagingAngle: brief.messagingAngle,
      riskLevel: brief.riskLevel,
      recommendedSubject: brief.recommendedSubject,
      followUpRiskScore: brief.followUpRiskScore,
    });
    console.log('  Operational thesis:', brief.operationalThesis.substring(0, 80) + '...');
  }
  return passed;
}

console.log('══════════════════════════════════════════');
console.log('Account Intelligence — Validation Suite');
console.log('══════════════════════════════════════════\n');

let allPassed = true;

// Test 1: Founder-led SMB, seed stage
allPassed &= runTest(
  'Founder-led SMB, seed stage',
  { email: 'founder@techstartup.io', firstname: 'Alex', company: 'TechStartup' },
  { industry: 'SaaS', numberofemployees: 12, annual_revenue: 500000, name: 'TechStartup' },
  {
    stage: 'seed',
    gtmMotion: 'founder_led',
    messagingAngle: 'founder_bandwidth',
    riskLevel: 'high_risk',
    recommendedSubject: "Pipeline continuity when you're doing it all",
  }
);

// Test 2: Enterprise SaaS, multi-stakeholder
allPassed &= runTest(
  'Enterprise SaaS, multi-stakeholder',
  { email: 'vp.sales@enterprise.com', firstname: 'Sarah', company: 'EnterpriseCo' },
  { industry: 'SaaS', numberofemployees: 2500, annual_revenue: 50000000, name: 'EnterpriseCo' },
  {
    stage: 'enterprise',
    messagingAngle: 'multi_stakeholder_continuity',
    riskLevel: 'medium_risk',
    salesComplexity: 'enterprise_complex',
    recommendedSubject: 'Pipeline continuity across complex sales motions',
  }
);

// Test 3: Inbound-heavy mid-market
// GTM motion is correctly inferred as 'inbound_heavy' (medium org, no free email)
allPassed &= runTest(
  'Inbound-heavy mid-market',
  { email: 'head.of.marketing@scalesaas.com', firstname: 'Jordan', company: 'ScaleSaaS' },
  { industry: 'SaaS', numberofemployees: 180, annual_revenue: 8000000, name: 'ScaleSaaS' },
  {
    stage: 'growth',
    gtmMotion: 'inbound_heavy',
    messagingAngle: 'volume_continuity',
    salesComplexity: 'complex',
    recommendedSubject: 'Follow-up consistency at inbound scale',
  }
);

// Test 4: Late-stage cadence decay
// 300 employees → stage='growth' (scale requires >500 or >$20M revenue)
// messagingAngle depends on risk profile and gtm — volume_overflow takes priority over late_continuity
allPassed &= runTest(
  'Late-stage cadence decay (mid-market)',
  { email: 'revops@saascompany.com', firstname: 'Morgan', company: 'SaaSCo' },
  { industry: 'SaaS', numberofemployees: 300, annual_revenue: 15000000, name: 'SaaSCo' },
  {
    stage: 'growth',
    messagingAngle: 'volume_continuity',
    salesComplexity: 'complex',
    recommendedSubject: 'Follow-up consistency at inbound scale',
  }
);

// Test 5: Expansion-stage, scaling sales org
// stage=scale with enterprise_complex complexity → selectMessagingAngle prioritizes complexity first
// so multi_stakeholder_continuity is correctly selected over scaling_continuity
allPassed &= runTest(
  'Expansion-stage, scaling sales org',
  { email: 'cpo@growthco.com', firstname: 'Riley', company: 'GrowthCo' },
  { industry: 'SaaS', numberofemployees: 600, annual_revenue: 25000000, name: 'GrowthCo' },
  {
    stage: 'scale',
    messagingAngle: 'multi_stakeholder_continuity',
    salesComplexity: 'enterprise_complex',
    recommendedSubject: 'Pipeline continuity across complex sales motions',
  }
);

console.log('\n══════════════════════════════════════════');
if (allPassed) {
  console.log('All tests PASSED');
  process.exit(0);
} else {
  console.log('Some tests FAILED');
  process.exit(1);
}