/**
 * Qiyadon — HubSpot MCP Server
 *
 * Production-ready Model Context Protocol server for HubSpot CRM.
 * Exposes 5 tools: contacts, deals, owners, lead upsert, contact update.
 *
 * Auth: reuses HubSpot OAuth tokens stored in Supabase (hub-oauth-v2.js pattern).
 * Transport: STDIO (MCP standard).
 *
 * Usage: npx tsx mcp/hubspot-server.ts
 * The server speaks MCP over stdio — connect an MCP client to interact.
 */

import { McpServer } from '@modelcontextprotocol/sdk/dist/cjs/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/dist/cjs/server/stdio.js';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// ─── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://btrbczqjwzuybgcxckvm.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const HUBSPOT_API_BASE = 'https://api.hubapi.com';

// ─── Validate env ──────────────────────────────────────────────────────────────

if (!SUPABASE_SERVICE_KEY) {
  console.error('[HubSpotMCP] FATAL: SUPABASE_SERVICE_KEY environment variable is not set');
  process.exit(1);
}

// ─── Supabase client ───────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── HubSpot secrets (env vars preferred, fallback to secrets file) ────────────

function loadHubSpotSecrets(): { clientId: string; clientSecret: string } {
  if (process.env.HUBSPOT_CLIENT_ID && process.env.HUBSPOT_CLIENT_SECRET) {
    return { clientId: process.env.HUBSPOT_CLIENT_ID, clientSecret: process.env.HUBSPOT_CLIENT_SECRET };
  }
  const fs = require('fs');
  const secretsPath = '/home/node/.openclaw/secrets/hubspot-oauth.json';
  if (fs.existsSync(secretsPath)) {
    const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
    if (secrets.clientId && secrets.clientSecret) {
      return { clientId: secrets.clientId, clientSecret: secrets.clientSecret };
    }
  }
  throw new Error('HUBSPOT_CLIENT_ID and HUBSPOT_CLIENT_SECRET must be set via environment variables or /home/node/.openclaw/secrets/hubspot-oauth.json');
}

// ─── Token management ─────────────────────────────────────────────────────────

interface HubSpotConnection {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  hub_id: string;
}

async function getActiveConnection(): Promise<HubSpotConnection> {
  const { data, error } = await supabase
    .from('hubspot_connections')
    .select('access_token, refresh_token, expires_at, hub_id')
    .eq('status', 'active')
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error('HubSpot not connected. Complete the OAuth flow at https://qiyadon.com first.');
  }
  return data as HubSpotConnection;
}

async function getValidAccessToken(): Promise<string> {
  const conn = await getActiveConnection();
  const expiresAt = new Date(conn.expires_at).getTime();
  const now = Date.now();
  const bufferMs = 60_000; // refresh 60 seconds before expiry

  if (expiresAt - now < bufferMs) {
    console.log('[HubSpotMCP] Token expiring soon, refreshing...');
    await refreshAccessToken(conn.refresh_token, conn.hub_id);
    const refreshed = await getActiveConnection();
    return refreshed.access_token;
  }
  return conn.access_token;
}

async function refreshAccessToken(refreshToken: string, hubId: string): Promise<void> {
  const secrets = loadHubSpotSecrets();
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: secrets.clientId,
    client_secret: secrets.clientSecret,
    refresh_token: refreshToken,
  });

  const response = await fetch(`${HUBSPOT_API_BASE}/oauth/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HubSpot token refresh failed (${response.status}): ${err}`);
  }

  const tokens = await response.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabase.from('hubspot_connections').update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: newExpiresAt,
  }).eq('hub_id', hubId);

  console.log('[HubSpotMCP] Token refreshed and persisted to Supabase');
}

// ─── HubSpot API helper ────────────────────────────────────────────────────────

async function hubspotRequest<T = unknown>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const accessToken = await getValidAccessToken();
  const response = await fetch(`${HUBSPOT_API_BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HubSpot API ${method} ${path} failed (${response.status}): ${errorText}`);
  }
  return response.json() as Promise<T>;
}

// ─── MCP Server ────────────────────────────────────────────────────────────────

const mcpServer = new McpServer(
  { name: 'qiyadon-hubspot', version: '1.0.0' },
  {
    capabilities: {
      tools: {
        listChanged: false,
      },
    },
    instructions: 'Qiyadon HubSpot MCP server. Provides CRM tools for contacts, deals, and owners. Authenticate via HubSpot OAuth before use.',
  }
);

// ── Tool: hubspot_get_contacts ────────────────────────────────────────────────
mcpServer.registerTool(
  'hubspot_get_contacts',
  {
    title: 'Get HubSpot Contacts',
    description: 'Fetch contacts from HubSpot CRM. Supports filtering by email, owner, and pagination.',
    inputSchema: z.object({
      limit: z.number().optional().default(10).describe('Maximum contacts to return (default: 10, max: 100)'),
      after: z.string().optional().describe('Pagination cursor from a previous response'),
      email: z.string().optional().describe('Filter contacts by exact email address'),
      ownerId: z.string().optional().describe('Filter contacts by owner ID'),
      properties: z.array(z.string()).optional().describe('Specific contact properties to return'),
    }),
  },
  async (args) => {
    try {
      const props = args.properties || ['firstname', 'lastname', 'email', 'phone', 'company', 'hubspot_owner_id', 'createdate', 'hs_lead_status'];
      const filterGroups = args.email ? [{
        filters: [{ propertyName: 'email', operator: 'EQ', value: args.email }],
      }] : [];

      const data = await hubspotRequest<{
        results: Record<string, unknown>[];
        paging?: { next?: { after: string } };
      }>('/crm/v3/objects/contacts/search', 'POST', {
        filterGroups,
        properties: props,
        limit: Math.min(args.limit ?? 10, 100),
        ...(args.after ? { after: args.after } : {}),
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ contacts: data.results, nextCursor: data.paging?.next?.after }, null, 2),
        }],
      };
    } catch (err) {
      return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
    }
  }
);

// ── Tool: hubspot_update_contact ──────────────────────────────────────────────
mcpServer.registerTool(
  'hubspot_update_contact',
  {
    title: 'Update HubSpot Contact',
    description: 'Update one or more properties on an existing HubSpot contact. Requires the HubSpot contact ID (not email).',
    inputSchema: z.object({
      contactId: z.string().describe('HubSpot contact ID (find it using hubspot_get_contacts)'),
      properties: z.record(z.string()).describe('Key-value pairs of HubSpot contact properties to update'),
    }),
  },
  async (args) => {
    try {
      const data = await hubspotRequest<Record<string, unknown>>(
        `/crm/v3/objects/contacts/${args.contactId}`,
        'PATCH',
        { properties: args.properties }
      );
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ success: true, contact: data }, null, 2),
        }],
      };
    } catch (err) {
      return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
    }
  }
);

// ── Tool: hubspot_create_or_update_lead ───────────────────────────────────────
mcpServer.registerTool(
  'hubspot_create_or_update_lead',
  {
    title: 'Create or Update HubSpot Lead',
    description: 'Upsert a lead — searches by email, creates if not found, updates if found. Used by Qiyadon followup engine.',
    inputSchema: z.object({
      email: z.string().describe('Lead email (used as unique search key)'),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      leadStatus: z.string().optional().describe('HubSpot lifecycle stage: NEW, OPEN, IN_PROGRESS, UNQUALIFIED, QUALIFIED'),
      ownerId: z.string().optional().describe('HubSpot owner ID to assign the lead to'),
      notes: z.string().optional(),
    }),
  },
  async (args) => {
    try {
      const searchResult = await hubspotRequest<{ results: { id: string }[] }>(
        '/crm/v3/objects/contacts/search', 'POST', {
          filterGroups: [{
            filters: [{ propertyName: 'email', operator: 'EQ', value: args.email }],
          }],
          properties: ['email', 'firstname', 'lastname'],
          limit: 1,
        }
      );

      const props: Record<string, string> = {};
      if (args.firstName) props['firstname'] = args.firstName;
      if (args.lastName) props['lastname'] = args.lastName;
      if (args.phone) props['phone'] = args.phone;
      if (args.company) props['company'] = args.company;
      if (args.leadStatus) props['hs_lead_status'] = args.leadStatus;
      if (args.ownerId) props['hubspot_owner_id'] = args.ownerId;
      if (args.notes) props['notes_last_updated'] = args.notes;

      if (searchResult.results.length > 0) {
        const contactId = searchResult.results[0].id;
        const updated = await hubspotRequest<Record<string, unknown>>(
          `/crm/v3/objects/contacts/${contactId}`, 'PATCH', { properties: props }
        );
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ action: 'updated', contactId, contact: updated }, null, 2),
          }],
        };
      } else {
        const created = await hubspotRequest<{ id: string; properties: Record<string, unknown> }>(
          '/crm/v3/objects/contacts', 'POST', { properties: { email: args.email, ...props } }
        );
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ action: 'created', contactId: created.id, contact: created }, null, 2),
          }],
        };
      }
    } catch (err) {
      return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
    }
  }
);

// ── Tool: hubspot_get_deals ───────────────────────────────────────────────────
mcpServer.registerTool(
  'hubspot_get_deals',
  {
    title: 'Get HubSpot Deals Pipeline',
    description: 'Fetch deals from HubSpot CRM, optionally scoped to a specific pipeline and stage.',
    inputSchema: z.object({
      limit: z.number().optional().default(50).describe('Maximum deals to return (default: 50, max: 200)'),
      pipelineId: z.string().optional().describe('Filter to a specific pipeline ID'),
      stageId: z.string().optional().describe('Filter to a specific deal stage ID'),
      ownerId: z.string().optional().describe('Filter deals assigned to a specific owner'),
      properties: z.array(z.string()).optional().describe('Deal properties to include'),
    }),
  },
  async (args) => {
    try {
      const props = args.properties || ['dealname', 'amount', 'dealstage', 'pipeline', 'hubspot_owner_id', 'closedate', 'createdate', 'hs_deal_stage_probability'];
      const filterGroups = [
        ...(args.pipelineId ? [{ filters: [{ propertyName: 'pipeline', operator: 'EQ', value: args.pipelineId }] }] : []),
        ...(args.stageId ? [{ filters: [{ propertyName: 'dealstage', operator: 'EQ', value: args.stageId }] }] : []),
      ];

      const data = await hubspotRequest<{
        results: Record<string, unknown>[];
        paging?: { next?: { after: string } };
      }>('/crm/v3/objects/deals/search', 'POST', {
        filterGroups,
        properties: props,
        limit: Math.min(args.limit ?? 50, 200),
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ deals: data.results, nextCursor: data.paging?.next?.after }, null, 2),
        }],
      };
    } catch (err) {
      return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
    }
  }
);

// ── Tool: hubspot_get_owners ───────────────────────────────────────────────────
mcpServer.registerTool(
  'hubspot_get_owners',
  {
    title: 'Get HubSpot Sales Owners',
    description: 'Fetch the list of HubSpot CRM owners (sales reps). Used to assign leads and deals.',
    inputSchema: z.object({
      email: z.string().optional().describe('Filter to a specific owner by email'),
    }),
  },
  async (args) => {
    try {
      const query = args.email ? `?email=${encodeURIComponent(args.email)}` : '';
      const data = await hubspotRequest<{ results: Record<string, unknown>[] }>(
        `/crm/v3/owners${query}`, 'GET'
      );
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ owners: data.results }, null, 2),
        }],
      };
    } catch (err) {
      return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
    }
  }
);

// ─── Startup ───────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
mcpServer.connect(transport).catch((err) => {
  console.error('[HubSpotMCP] Fatal: transport connection failed:', err);
  process.exit(1);
});

console.log('[HubSpotMCP] HubSpot MCP Server initialised. Listening on stdio...');