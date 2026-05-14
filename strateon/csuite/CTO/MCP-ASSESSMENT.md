# MCP Assessment — Qiyadon Followup Engine
**Date:** 2026-05-14
**Role:** CTO
**Status:** DRAFT — For Ahmad Salim review

---

## 1. Current Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FOLLOWUP ENGINE                          │
│  (PM2 cron: every hour — followup-engine.js)               │
│                                                             │
│  Reads leads → Applies cadence → Sends emails              │
│  Logs activities → Escalates stalled leads                  │
└─────────────┬───────────────┬───────────────────┬────────────┘
              │               │                   │
        ┌─────▼─────┐   ┌─────▼─────┐    ┌──────▼──────┐
        │  HubSpot  │   │   Email   │    │  WhatsApp   │
        │  (v2 OAuth)│   │(nodemailer)│   │  (HTTP API) │
        │  REST API  │   │   SMTP    │    │ 5.9.81.5:3001│
        └─────┬─────┘   └─────┬─────┘    └──────┬──────┘
              │               │                  │
        ┌─────▼───────────────▼──────────────────▼─────┐
        │              SUPABASE DB                    │
        │  Tables: hubspot_connections, followup_leads│
        │  followup_activities, followup_threads      │
        └───────────────────────────────────────────┘
```

### HubSpot OAuth Server (hub-oauth-v2.js)
- **Auth:** OAuth 2.0 + REST API (HTTPS/JSON)
- **Token Storage:** Supabase (`hubspot_connections` table)
- **Scopes:** `crm.objects.contacts.read/write`, `crm.objects.owners.read`, `crm.schemas.contacts.read`
- **Credentials:** Loaded from env vars or `/home/node/.openclaw/secrets/hubspot-oauth.json`
- **Port:** 3002 (standalone HTTPS/HTTP server)

### Email Integration
- **Transport:** nodemailer via SMTP
- **Safety Gates:** 4-layer safety system (GLOBAL_ENABLED + SEND_EMAILS + DRY_RUN + LIVE_TEST)

### WhatsApp Integration
- **Method:** HTTP proxy through `5.9.81.5:3001/submit-signature`
- **Existing signature submit endpoint** in hub-oauth-v2.js

### Existing MCP Pattern?
**No.** There is zero MCP usage anywhere in the codebase. All integrations are custom hardcoded API calls. This is a greenfield opportunity.

---

## 2. Integrations as MCP Tools

### HubSpot MCP Tools
| Tool | Description |
|------|-------------|
| `hubspot_get_contact` | Fetch contact by email/ID |
| `hubspot_create_contact` | Create new contact |
| `hubspot_update_contact` | Update contact fields |
| `hubspot_list_owners` | List CRM owners |
| `hubspot_search_contacts` | Search contacts by criteria |

### Email MCP Tools
| Tool | Description |
|------|-------------|
| `email_send` | Send templated follow-up email |
| `email_check_inbox` | Check for replies (reply detection = lead alive) |
| `email_get_thread` | Get full email thread for a lead |

### WhatsApp MCP Tools
| Tool | Description |
|------|-------------|
| `whatsapp_send_message` | Send WhatsApp message |
| `whatsapp_check_conversations` | Check for incoming messages |

---

## 3. Migration Complexity

### HubSpot → MCP Server
| Factor | Assessment |
|--------|------------|
| **Complexity** | **MEDIUM** |
| **Reasoning** | OAuth infrastructure already exists in `hub-oauth-v2.js`. Token management via Supabase is in place. The MCP server wraps the existing HubSpot REST API calls as tools. The main work is: (1) refactoring existing API call code into tool handlers, (2) implementing MCP server protocol with `@modelcontextprotocol/sdk`, (3) handling auth (tokens already in Supabase — tool calls use stored tokens). No new API surface needed. |

### Email → MCP Server
| Factor | Assessment |
|--------|------------|
| **Complexity** | **MEDIUM** |
| **Reasoning** | nodemailer SMTP is well-abstracted. The main complexity is email template management and reply detection logic (checking inbox for matching message IDs). The followup engine already has all this — it just needs to be exposed as tools. Reply detection (marking lead as "alive") is the trickiest part and requires IMAP or a webhook from the SMTP provider. |

### WhatsApp → MCP Server
| Factor | Assessment |
|--------|------------|
| **Complexity** | **LOW-MEDIUM** |
| **Reasoning** | There's already an HTTP API proxy in `hub-oauth-v2.js` for WhatsApp. The main work is wrapping that HTTP interface as MCP tools. However, the WhatsApp integration appears to be the thinnest — `submit-signature` endpoint suggests a specific use case rather than a full messaging API. Needs investigation into what WhatsApp API is actually in use (Twilio? Meta Business API? Custom?). |

---

## 4. Recommended MCP Server to Build First

### Recommendation: **HubSpot MCP Server** (first priority)

**Rationale:**

1. **Richest API surface with clearest tool definitions** — HubSpot has well-documented CRUD operations on contacts, deals, owners. These map directly to MCP tools with clean input/output schemas.

2. **OAuth already battle-tested** — `hub-oauth-v2.js` has complete OAuth 2.0 flow, token storage, and refresh logic. The MCP server can reuse the Supabase token store directly.

3. **Existing data model to build against** — The followup engine already knows how to query HubSpot. Wrapping that as MCP tools is refactoring, not new API design.

4. **Highest enterprise value** — CRM data (contacts, deals, pipeline) is the core sales intelligence. Exposing this as MCP tools makes Qiyadon's lead intelligence accessible to any MCP-compatible AI agent.

5. **Lowest risk** — No new third-party credentials or API agreements needed. HubSpot credentials are already provisioned.

**Estimated build order:**
1. **HubSpot MCP server** ← first (medium complexity, highest strategic value)
2. **Email MCP server** ← second (medium complexity, depends on reply detection solution)
3. **WhatsApp MCP server** ← third (low-medium, requires API scope investigation first)

---

## 5. "MCP-Native Qiyadon" — Sales Pitch

> **"Qiyadon is now MCP-native — your sales AI talks to HubSpot, email, and WhatsApp the same way it talks to everything else."**

### The Problem We Solve
Enterprise AI teams are adopting MCP at breakneck speed (78% already in production). But their AI agents hit a wall when they need to:
- Check a lead's CRM record before drafting a reply
- Send a follow-up email at the right moment in the cadence
- Escalate a stalled deal via WhatsApp

Each integration requires custom code. Qiyadon's followup engine has solved this manually — with hardcoded API calls, custom OAuth flows, and brittle routing logic.

### The MCP-Native Solution
Qiyadon exposes its entire integration surface as **MCP tools** — a universal, vendor-neutral interface any AI agent can consume:

```
AI Agent ("Any MCP Client")
         │
         ▼
  ┌──────────────────┐
  │ Qiyadon MCP Hub  │  ← Single protocol, any AI can connect
  └────────┬─────────┘
           │
     ┌─────┼─────┬────────────┐
     ▼     ▼     ▼            ▼
  HubSpot Email WhatsApp   (future)
   Tools   Tools   Tools
```

### What This Enables
- **Plug-and-play AI integrations** — Any MCP-compatible AI client (Claude Desktop, VS Code Copilot, custom agents) can interact with Qiyadon's toolset without custom integration code
- **Universal follow-up engine access** — An AI agent can trigger a follow-up email, check for replies, and escalate to WhatsApp — all through natural language
- **Ecosystem leverage** — Qiyadon's tools become composable with other MCP servers in the enterprise stack
- **Enterprise sales unlocked** — "MCP-native" is a procurement checkbox. Qiyadon checks it.

### The Pitch Deck One-Liner
> *"While your competitors are still writing custom API integrations, Qiyadon connects to any AI agent out of the box — via the Model Context Protocol."*

---

## Appendix: MCP Protocol Basics (for team reference)

MCP servers expose **3 capability types**:
1. **Resources** — Read-only data (like API responses, file contents)
2. **Tools** — Functions the LLM can call (with user approval)
3. **Prompts** — Pre-written templates for specific tasks

Qiyadon's integration should focus on **Tools**:
- Each integration (HubSpot, email, WhatsApp) becomes one MCP server
- Each API operation (send email, get contact, send WhatsApp) becomes one MCP tool
- Auth is handled per-server (Qiyadon's MCP server manages HubSpot OAuth tokens stored in Supabase)

**Transport:** STDIO (for local servers) or HTTP/SSE (for remote deployment). Node.js SDK: `@modelcontextprotocol/sdk`.

---

*Generated by: CTO subagent | Date: 2026-05-14*