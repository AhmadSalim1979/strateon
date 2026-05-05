# OPERATIONAL ASSETS — Do Not Lose This

> Updated: 2026-05-02
> This file is the single source of truth for all active systems, credentials, and integrations.
> READ THIS FILE BEFORE saying "I don't have access" or "I don't know that."

---

## EMAIL SYSTEM

**Provider:** Neo (iomete.com / neo.space)
**Contact inbox:** contact@qiyadon.com
**Personal inbox:** ahmad.salim@qiyadon.com

**IMAP (contact@qiyadon.com — for reading incoming lead emails):**
- Server: pop0001.neo.space
- Port: 993
- Encryption: SSL/TLS
- Username: contact@qiyadon.com
- Password: @iy@d0n.c0m

**IMAP (ahmad.salim@qiyadon.com — your personal inbox):**
- Server: imap0001.neo.space
- Port: 993
- Encryption: SSL/TLS
- Username: ahmad.salim@qiyadon.com
- Password: @iy@d0n.c0m

**SMTP (both accounts — for sending emails):**
- Server: smtp0001.neo.space
- Port: **587** (STARTTLS — port 465 SSL is blocked on this server)
- Encryption: SSL/TLS
- Username: contact@qiyadon.com or ahmad.salim@qiyadon.com
- Password: @iy@d0n.c0m

**Note:** Pop server is pop0001.neo.space, IMAP server is imap0001.neo.space — these are DIFFERENT servers.

**Form Email destination:** contact@qiyadon.com (confirmed working)

---

## HUBSPOT CRM

**Account:** ahmad.salim@qiyadon.com
**API Key:** HUBSPOT_KEY_PLACEHOLDER_REMOVED_GH_PROTECTION_ERROR
**API Base:** https://api.hubapi.com/crm/v3/objects/contacts

**Integration:** submit-audit.js creates a HubSpot contact on every form submission.
**Scope:** crm.objects.contacts.write + crm.objects.contacts.read
**Test contact created:** ID 480534562539 (test@example.com)

---

## WEBSITE + DEPLOYMENT

**Site URL:** qiyadon.com
**GitHub repo:** https://github.com/AhmadSalim1979/strateon
**Branch:** clean-public-site → Cloudflare Pages

**Pages:**
- / (index.html) — 372-line clean rebuild with pricing toggle
- /product (product.html) — old homepage preserved
- /pricing — pricing page
- /pipeline-leak-audit — lead capture form
- /sign-trial — trial signup
- /privacy-policy
- /terms-of-service
- /sign-csa — client service agreement
- /trial — redirect page

**Form Handler:** submit-audit.js (PM2 process: qiyadon-audit-form, port 3001)
**Form Email destination:** contact@qiyadon.com (not ahmad.salim@qiyadon.com — fixed)

---

## PM2 PROCESSES

- `qiyadon-audit-form` — running on port 3001 (PID 13979)
- Ecosystem config: /home/node/.openclaw/workspace/strateon-site/ecosystem.config.js
- Restart command: pm2 restart qiyadon-audit-form

---

## COMPLETED ASSETS (as of 2026-05-02)

| Asset | Status | Location |
|---|---|---|
| Website (qiyadon.com) | ✅ Live | Cloudflare Pages |
| Pricing page with billing toggle | ✅ Live | /pricing |
| Pipeline Leak Audit form | ✅ Live | /pipeline-leak-audit |
| Form handler (HubSpot + email) | ✅ Live | port 3001 |
| Sign-up flow (trial agreement) | ✅ Live | /sign-trial |
| Legal pages (Privacy, ToS, CSA) | ✅ Live | /privacy-policy etc. |
| HubSpot CRM integration | ✅ Live | API connected |
| LinkedIn posts (3 approved) | ✅ Posted | Ahmad's profile |
| PM2 form handler | ✅ Running | port 3001 |
| DKIM verified | ✅ | MailCow |

---

## CLOUDFLARE API

**Token:** `cfut_mtXoT2bBmFQX1iWyn6iNykQvGUbQGQXt9U1AcA3F23458adc`
**Expires:** 2027-05-31
**Reminder:** Set for 2027-04-30 — see `CTO Renewal Reminder` cron
**Status:** Token verified active but has ZERO permissions — needs to be recreated with Cloudflare Pages + Account Edit permissions before use
**Secret file:** `/home/node/.openclaw/secrets/cloudflare-api-token.json`
**Reminder cron:** `CTO Renewal Reminder` — fires 2027-04-30

---

## C-SUITE ACTIVE SESSION STATES

- CTO: latest session at /strateon/csuite/CTO/SESSION-STATES/2026-04-29-001.md
- CMO: latest session at /strateon/csuite/CMO/SESSION-STATES/2026-05-02-001.md
- CFO: latest session at /strateon/csuite/CFO/SESSION-STATES/2026-04-29.md
- COO: latest session at /strateon/csuite/COO/SESSION-STATES/2026-04-29.md
- CPO: latest session at /strateon/csuite/CPO/SESSION-STATES/2026-04-29.md
- CLA: latest session at /strateon/csuite/CLA/SESSION-STATES/2026-04-29-001.md

---

## KEY DECISIONS MADE (RESOLVED — DO NOT RE-ASK)

- 6 contract decisions confirmed (governing law → Delaware, liability cap → 6 months, data residency → EU only, indemnification → narrow, guarantees → best efforts, SLA credits → option A)
- Pricing: $300/$750/$1,500+ with per-lead overages ($6/$4/unlimited)
- Annual discount: 25%
- Trial policy: 14-day, ≤25 leads, no discovery call
- All product spec questions answered
- Pipeline Execution Flow + Onboarding Protocol ready
- LinkedIn posts approved and posted (3 posts)
- HubSpot API key confirmed and tested

---

## MEMORY FAILURE LOG

- 2026-05-02: IMAP/SMTP credentials forgotten — needed to be re-shared. Root cause: not written to file immediately. Fix: now in OPERATIONAL ASSETS.
- 2026-05-02: Form destination email (ahmad.salim@qiyadon.com) not updated to qiyadon.com on first attempt. Fixed immediately.
- 2026-05-02: May 1 decisions carry-forward failure — end-of-day section read correctly but early draft list pulled instead. Fix: AGENTS.md updated — read from bottom up.