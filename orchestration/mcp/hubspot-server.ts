/**
 * Qiyadon — HubSpot MCP Server
 * 
 * Production-ready Model Context Protocol server for HubSpot CRM.
 * Exposes 5 tools: contacts CRUD, deal pipeline, owners.
 * 
 * Auth: reuses HubSpot OAuth tokens stored in Supabase (hub-oauth-v2.js pattern).
 * Transport: STDIO (MCP standard).
 */

import { StdioServerTransport, McpServer } from '@modelcontextprotocol/sdk/server';
import { createClient } from '@supabase/supabase-js';

// ─── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://btrbczqjwzuybgcxckvm.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const HUBSPOT_API_BASE = 'https://api.hubapi.com';

// ─── Supabase client ───────────────────────────────────────────────────────────

if (!SUPABASE_SERVICE_KEY) {
  console.error('[HubSpotMCP] FATAL: SUPABASE_SERVICE_KEY not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Token management ─────────────────────────────────────────────────────────

interface HubSpotConnection {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  hub_id: string;
}

/**
 * Fetch active HubSpot connection from Supabase.
 * Throws if not connected.
 */
async function getActiveConnection(): Promise<HubSpotConnection> {
  const { data, error } = await supabase
    .from('hubspot_connections')
    .select('access_token, refresh_token, expires_at, hub_id')
    .eq('status', 'active')
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error('HubSpot not connected. Run the OAuth flow first.');
  }
  return data as HubSpotConnection;
}

/**
 * Refresh access token if within 60-second expiry window.
 * Mirrors the refresh logic from hub-oauth-v2.js.
 */
async function getValidAccessToken(): Promise<string> {
  const conn = await getActiveConnection();
  const expiresAt = new Date(conn.expires_at).getTime();
  const now = Date.now();
  const bufferMs = 60_000; // refresh 60s before expiry

  if (expiresAt - now < bufferMs) {
    // Token is stale — refresh it
    console.log('[HubSpotMCP] Token expiring soon, refreshing...');
    await refreshAccessToken(conn.refresh_token, conn.hub_id);
    // Re-fetch after refresh
    const refreshed = await getActiveConnection();
    return refreshed.access_token;
  }

  return conn.access_token;
}

/**
 * Exchange a refresh token for a new access token and persist to Supabase.
 */
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
    throw new Error(`Token refresh failed: ${err}`);
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

  console.log('[HubSpotMCP] Token refreshed successfully');
}

// ─── HubSpot secrets ───────────────────────────────────────────────────────────

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
  throw new Error('HUBSPOT_CLIENT_ID and HUBSPOT_CLIENT_SECRET must be set via env or secrets file');
}

// ─── HubSpot API helpers ───────────────────────────────────────────────────────

/**
 * Make an authenticated HubSpot API request with automatic token refresh.
 */
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

// ─── Tool Definitions & Handlers ───────────────────────────────────────────────

// Build the MCP server
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
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of contacts to return (default: 10, max: 100)',
          default: 10,
        },
        after: {
          type: 'string',
          description: 'Pagination cursor — pass the "after" token from a previous response',
        },
        email: {
          type: 'string',
          description: 'Filter contacts by exact email address',
        },
        ownerId: {
          type: 'string',
          description: 'Filter contacts by owner ID',
        },
        properties: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific contact properties to return (defaults to common fields)',
          default: ['firstname', 'lastname', 'email', 'phone', 'company', 'hubspot_owner_id', 'createdate', 'hs_lead_status'],
        },
      },
    },
  },
  async ({ limit = 10, after, email, ownerId, properties }) => {
    try {
      const props = properties || ['firstname', 'lastname', 'email', 'phone', 'company', 'hubspot_owner_id', 'createdate', 'hs_lead_status'];
      const query = new URLSearchParams({
        limit: String(Math.min(limit, 100)),
        properties: props.join(','),
      });
      if (after) query.set('after', after);
      if (email) query.set('email', email);
      if (ownerId) query.set('ownerId', ownerId);

      const data = await hubspotRequest<{
        results: Record<string, unknown>[];
        paging?: { next?: { after: string } };
      }>(`/crm/v3/objects/contacts/search`, 'POST', {
        filterGroups: email ? [{
          filters: [{ propertyName: 'email', operator: 'EQ', value: email }],
        }] : [],
        properties: props,
        limit,
        ...(after ? { after } : {}),
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
    description: 'Update one or more properties on an existing HubSpot contact. Requires contact ID.',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: {
          type: 'string',
          description: 'HubSpot contact ID (not email — use hubspot_get_contacts to find ID)',
        },
        properties: {
          type: 'object',
          description: 'Key-value pairs of HubSpot contact properties to update',
        },
      },
      required: ['contactId', 'properties'],
    },
  },
  async ({ contactId, properties }) => {
    try {
      const data = await hubspotRequest<Record<string, unknown>>(
        `/crm/v3/objects/contacts/${contactId}`,
        'PATCH',
        { properties }
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
    description: 'Upsert a lead — searches by email, creates if not found, updates if found. Used by the Qiyadon followup engine for lead intelligence.',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Lead email (used as unique search key)',
        },
        firstName: { type: 'string', description: 'First name' },
        lastName: { type: 'string', description: 'Last name' },
        phone: { type: 'string', description: 'Phone number' },
        company: { type: 'string', description: 'Company name' },
        leadStatus: {
          type: 'string',
          description: 'HubSpot lifecycle stage (e.g., "NEW", "OPEN", "IN_PROGRESS", "UNQUALIFIED", "QUALIFIED")',
        },
        ownerId: {
          type: 'string',
          description: 'HubSpot owner ID to assign the lead to',
        },
        notes: {
          type: 'string',
          description: 'Additional notes to store on the contact',
        },
      },
      required: ['email'],
    },
  },
  async ({ email, firstName, lastName, phone, company, leadStatus, ownerId, notes }) => {
    try {
      // Step 1: Search for existing contact by email
      const searchResult = await hubspotRequest<{
        results: { id: string }[];
        total: number;
      }>('/crm/v3/objects/contacts/search', 'POST', {
        filterGroups: [{
          filters: [{ propertyName: 'email', operator: 'EQ', value: email }],
        }],
        properties: ['email', 'firstname', 'lastname'],
        limit: 1,
      });

      const props: Record<string, string> = {};
      if (firstName) props['firstname'] = firstName;
      if (lastName) props['lastname'] = lastName;
      if (phone) props['phone'] = phone;
      if (company) props['company'] = company;
      if (leadStatus) props['hs_lead_status'] = leadStatus;
      if (ownerId) props['hubspot_owner_id'] = ownerId;
      if (notes) props['notes_last_updated'] = notes;

      if (searchResult.results.length > 0) {
        // Update existing contact
        const contactId = searchResult.results[0].id;
        const updated = await hubspotRequest<Record<string, unknown>>(
          `/crm/v3/objects/contacts/${contactId}`,
          'PATCH',
          { properties: props }
        );
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ action: 'updated', contactId, contact: updated }, null, 2),
          }],
        };
      } else {
        // Create new contact
        const created = await hubspotRequest<{ id: string; properties: Record<string, unknown> }>(
          '/crm/v3/objects/contacts',
          'POST',
          { properties: { email, ...props } }
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
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of deals to return (default: 50, max: 200)',
          default: 50,
        },
        pipelineId: {
          type: 'string',
          description: 'Filter to a specific pipeline ID',
        },
        stageId: {
          type: 'string',
          description: 'Filter to a specific deal stage ID',
        },
        ownerId: {
          type: 'string',
          description: 'Filter deals assigned to a specific owner',
        },
        properties: {
          type: 'array',
          items: { type: 'string' },
          description: 'Deal properties to include',
          default: ['dealname', 'amount', 'dealstage', 'pipeline', 'hubspot_owner_id', 'closedate', 'createdate', 'hs_deal_stage_probability'],
        },
      },
    },
  },
  async ({ limit = 50, pipelineId, stageId, ownerId, properties }) => {
    try {
      const props = properties || ['dealname', 'amount', 'dealstage', 'pipeline', 'hubspot_owner_id', 'closedate', 'createdate', 'hs_deal_stage_probability'];
      const query = new URLSearchParams({ limit: String(Math.min(limit, 200)), properties: props.join(',') });
      if (pipelineId) query.set('pipelineId', pipelineId);
      if (stageId) query.set('dealstage', stageId);
      if (ownerId) query.set('ownerId', ownerId);

      const data = await hubspotRequest<{
        results: Record<string, unknown>[];
        paging?: { next?: { after: string } };
      }>('/crm/v3/objects/deals/search', 'POST', {
        filterGroups: [
          ...(pipelineId ? [{ filters: [{ propertyName: 'pipeline', operator: 'EQ', value: pipelineId }] }] : []),
          ...(stageId ? [{ filters: [{ propertyName: 'dealstage', operator: 'EQ', value: stageId }] }] : []),
        ],
        properties: props,
        limit,
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
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Filter to a specific owner by email',
        },
      },
    },
  },
  async ({ email }) => {
    try {
      const query = email ? `?email=${encodeURIComponent(email)}` : '';
      const data = await hubspotRequest<{ results: Record<string, unknown>[] }>(
        `/crm/v3/owners${query}`,
        'GET'
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

// ─── Transport & Startup ────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
mcpServer.connect(transport).catch((err) => {
  console.error('[HubSpotMCP] Fatal: transport connection failed', err);
  process.exit(1);
});

console.log('[HubSpotMCP] HubSpot MCP Server initialised. Connected to stdio transport.');