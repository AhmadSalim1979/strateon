# Strateon — Follow-Up Engine

**Version:** 1.0
**Owner:** CPO (Chief Product Development Officer)
**Status:** Built 2026-05-03. Requires testing with real HubSpot API key and contact data.

---

## What It Does

The Follow-Up Engine is the core automation product of Pipeline Execution Service. It:

1. **Fetches all open leads** from HubSpot CRM for the client
2. **Applies a follow-up cadence** (Day 1, 3, 7, 14, 21, 30) — sends the right email at the right time
3. **Tracks responses** — if a lead replies, they're marked as "alive" and removed from cadence
4. **Escalates stalled leads** — no reply after 14 days → flagged for human review
5. **Logs all activity** — daily logs for debugging, feeds into weekly report

---

## Architecture

```
HubSpot CRM (contacts)
    ↓
getClientLeads() — fetch all open contacts
    ↓
For each lead:
  ├── isStalled()? ──yes──→ flag strtn_escalated=yes, skip to next
  ├── hasResponded? ──yes──→ skip cadence
  ├── nextCadenceStep() ──returns {day, subject, bodyKey}
  ├── shouldSend()? ──age >= day AND days since last >= gap
  └── sendFollowupEmail() ── nodemailer → SMTP 587 STARTTLS
        ↓
  Update HubSpot: strtn_followup_cadence_day, strtn_last_followup_date, strtn_last_email_subject
```

---

## Cadence

Default cadence (6 steps, configurable per client):

| Day | Email | Purpose |
|---|---|---|
| 1 | Intro | Start conversation, offer value |
| 3 | Follow-up 1 | Quick ping, keep it light |
| 7 | Value-add | Share benchmark data, show insight |
| 14 | Check-in | Low-pressure touch |
| 21 | Pivot | New angle on the problem |
| 30 | Final | Last note, then step back |

---

## HubSpot Contact Properties (Custom)

These custom properties must be created in HubSpot for the engine to work:

| Property | Type | Description |
|---|---|---|
| `strtn_followup_cadence_day` | Number | Current cadence step (1, 3, 7, 14, 21, 30) |
| `strtn_last_followup_date` | Date | ISO date of last email sent |
| `strtn_last_email_subject` | Single-line text | Subject of last sent email |
| `strtn_response_received` | Single-line text | "yes" if lead replied (manual or webhook mark) |
| `strtn_escalated` | Single-line text | "yes" if flagged for human review |
| `strtn_lead_owner_email` | Single-line text | Client's email (sends from this address) |

**Note:** These properties must be created in HubSpot before first client can use the engine.

---

## Testing

```bash
# Test mode — runs engine once and exits
cd /home/node/.openclaw/workspace/strateon/followup-engine
node followup-engine.js

# Run with PM2 (hourly cron)
pm2 start ecosystem.followup.config.js

# View logs
pm2 logs strateon-followup-engine

# View today's log
cat /home/node/.openclaw/workspace/strateon/followup-engine/logs/2026-05-03.log
```

---

## Before First Client

1. **Create HubSpot custom properties** (listed above) — required
2. **Update HubSpot API key** in `/home/node/.openclaw/secrets/hubspot.json`
3. **Verify SMTP** works: `pm2 restart qiyadon-audit-form` (uses same SMTP)
4. **Test with a single contact** — manually set `strtn_followup_cadence_day: 0` on one contact, run engine, verify email sent
5. **Response tracking** — currently requires manual HubSpot update or email webhook. Design webhook endpoint for automatic response detection.

---

## TODO Before Production

- [ ] Create HubSpot custom properties (strtn_*)
- [ ] Test email delivery with real SMTP
- [ ] Build response webhook endpoint (POST /followup-response) to mark strtn_response_received=yes
- [ ] Add client-level cadence overrides (per-client cadence in a CLIENT_CADENCES map)
- [ ] Escalation notification: email client owner when strtn_escalated=yes
- [ ] Add to PM2 startup list: `pm2 save`
- [ ] Add to strateon-site ecosystem config as separate process

---

*Built by: CPO subagent, 2026-05-03*