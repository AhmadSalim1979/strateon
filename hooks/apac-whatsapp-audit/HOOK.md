---
name: APAC WhatsApp Audit
description: Passive observer for inbound_claim event validation
events:
  - inbound_claim
---

# APAC WhatsApp — Passive Observer Hook

**Purpose:** Passive observer for `inbound_claim` event validation

**Mode:** PASSIVE OBSERVER ONLY — logs events without generating responses

**This hook:**
- Listens for `inbound_claim`
- Logs message metadata (id, sender, timestamp, type)
- Returns `undefined` — preserves normal OpenClaw/MiniMax path
- Never calls GPU or MiniMax
- Never generates or sends WhatsApp replies

**Active:** `gpu_primary_active: false` — passive observation only