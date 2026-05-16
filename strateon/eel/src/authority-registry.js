/**
 * EEL Authority Registry
 * Maps authoritative sources to the categories and fact types they can certify.
 * 
 * CRITICAL RULE: No file is self-authorizing. Every authority must be explicitly registered.
 * CRITICAL RULE: EMAIL-SIGNATURES.md is EVIDENCE ONLY — not authority for any operational category.
 */

const PATH = require('path');

// Authority registry entry shape:
// {
//   categories: string[],      // categories this source can authorize
//   fact_types: string[],      // specific fact types within those categories
//   temporal?: 'current' | 'bounded' | 'permanent',
//                             // 'current' = valid only at query time (runtime commands)
//                             // 'bounded' = valid until revoked (approvals)
//                             // 'permanent' = historically valid (files, DB records)
//   notes: string
// }

// NON-AUTHORITY sources (evidence only)
const NON_AUTHORITIES = new Set([
  'EMAIL-SIGNATURES.md',
  'CHANGELOG.md',
  'memory/*.md',
  '*.log',
  'strateon/business/EMAIL-SIGNATURES.md',
]);

/**
 * Check if a source path is a non-authority (evidence only)
 * @param {string} sourcePath
 * @returns {boolean}
 */
function isNonAuthority(sourcePath) {
  const basename = PATH.basename(sourcePath);
  if (NON_AUTHORITIES.has(basename)) return true;
  if (NON_AUTHORITIES.has(sourcePath)) return true;
  
  // Check glob patterns
  for (const pattern of NON_AUTHORITIES) {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(basename) || regex.test(sourcePath)) return true;
    }
  }
  return false;
}

/**
 * Check if a source path is an authority for a given category
 * @param {string} sourcePath
 * @param {string} category
 * @returns {{isAuthority: boolean, reason?: string, scope?: string[]}}
 */
function checkAuthority(sourcePath, category) {
  // Non-authorities are always evidence only
  if (isNonAuthority(sourcePath)) {
    return {
      isAuthority: false,
      reason: `Source "${sourcePath}" is EVIDENCE ONLY — not registered as authority for any operational category`,
      error_code: 'EEL_SOURCE_NOT_AUTHORITY',
      evidence_only: true,
    };
  }

  const entry = AUTHORITY_REGISTRY[sourcePath];
  if (!entry) {
    // Check if it matches patterns
    for (const [key, val] of Object.entries(AUTHORITY_REGISTRY)) {
      if (key.includes('*')) {
        const regex = new RegExp('^' + key.replace(/\*/g, '.*') + '$');
        if (regex.test(sourcePath)) {
          if (!val.categories.includes(category)) {
            return {
              isAuthority: false,
              reason: `Authority "${key}" does not cover category "${category}"`,
              error_code: 'EEL_CATEGORY_NOT_IN_SCOPE',
              allowed_categories: val.categories,
            };
          }
          return { isAuthority: true, scope: val.categories, notes: val.notes };
        }
      }
    }

    return {
      isAuthority: false,
      reason: `Source "${sourcePath}" is not in AUTHORITY_REGISTRY`,
      error_code: 'EEL_SOURCE_NOT_AUTHORITY',
      evidence_only: true,
    };
  }

  if (!entry.categories.includes(category)) {
    return {
      isAuthority: false,
      reason: `Authority "${sourcePath}" does not cover category "${category}"`,
      error_code: 'EEL_CATEGORY_NOT_IN_SCOPE',
      allowed_categories: entry.categories,
    };
  }

  return { isAuthority: true, scope: entry.categories, notes: entry.notes };
}

/**
 * Authority Registry — definitive list of authoritative sources
 * 
 * Rules:
 * - secrets/*.json → credential only
 * - ops/PROVIDER-REGISTRY.md → provider only
 * - ops/ALERT-DESTINATION-REGISTRY.md → alert_destination only (must be created first)
 * - runtime commands → process_state/infrastructure_state at query time ONLY
 * - workspace source files → infrastructure_state/process_state
 * - Supabase database → data_state at query time
 * - Ahmad explicit WhatsApp approval → approval/recovery_action/credential/alert_destination
 * - EMAIL-SIGNATURES.md → NOTHING (evidence only)
 */
const AUTHORITY_REGISTRY = {
  // File-based authorities
  'ops/PROVIDER-REGISTRY.md': {
    categories: ['provider'],
    fact_types: ['provider_name', 'provider_endpoint', 'provider_config', 'provider_capability'],
    notes: 'Maintains approved provider list only — does NOT cover alert_destinations or credentials'
  },

  // Alert destination registry — PENDING: file must be created with explicit Ahmad approval
  // Before creation: empty categories = cannot authorize any alert destination
  // After creation: add entries with explicit approved destinations per alert type
  // 'ops/ALERT-DESTINATION-REGISTRY.md': {
  //   categories: ['alert_destination'],
  //   fact_types: ['email_address', 'phone_number', 'webhook_url'],
  //   notes: 'Contains explicit alert target approvals per alert type — PENDING Ahmad creation'
  // },

  // Secrets — credential authority ONLY
  'secrets/supabase.json': {
    categories: ['credential', 'infrastructure_state'],
    fact_types: ['api_key', 'password', 'token', 'endpoint', 'url', 'database_url'],
    notes: 'Authoritative source for Supabase credentials and connection strings'
  },

  'secrets/qiyadon-email.json': {
    categories: ['credential'],
    fact_types: ['smtp_password', 'smtp_username', 'smtp_host', 'smtp_port', 'email_address'],
    notes: 'Authoritative source for Neo email/SMTP credentials'
  },

  'secrets/hubspot.json': {
    categories: ['credential'],
    fact_types: ['api_key', 'oauth_token', 'client_secret', 'client_id'],
    notes: 'Authoritative source for HubSpot credentials'
  },

  'secrets/cloudflare.json': {
    categories: ['credential'],
    fact_types: ['api_token', 'account_id', 'zone_id'],
    notes: 'Authoritative source for Cloudflare credentials'
  },

  'secrets/openclaw.json': {
    categories: ['credential'],
    fact_types: ['api_key', 'gateway_token', 'webhook_secret'],
    notes: 'Authoritative source for OpenClaw credentials'
  },

  // Fallback for any secrets file — credential authority only
  'secrets/*.json': {
    categories: ['credential'],
    fact_types: ['api_key', 'password', 'token', 'endpoint', 'url', 'secret'],
    notes: 'All files in secrets/ are credential authorities — other categories not permitted'
  },

  // Workspace config files — infrastructure state only, not credentials
  'workspace/ecosystem.config.js': {
    categories: ['infrastructure_state', 'process_state'],
    fact_types: ['ecosystem_config', 'pm2_apps', 'script_path'],
    notes: 'PM2 ecosystem configuration — defines which processes exist'
  },

  'workspace/pm2.config.js': {
    categories: ['infrastructure_state', 'process_state'],
    fact_types: ['ecosystem_config', 'pm2_apps'],
    notes: 'PM2 app configuration'
  },

  // State files — current process state at read time
  'state/heartbeats/moosa-worker.json': {
    categories: ['process_state'],
    fact_types: ['heartbeat_age', 'last_cycle', 'worker_status', 'pid'],
    notes: 'Current worker heartbeat state — fresh at read time'
  },

  'state/heartbeats/watchdog.json': {
    categories: ['process_state'],
    fact_types: ['heartbeat_age', 'last_cycle', 'watchdog_status'],
    notes: 'Current watchdog heartbeat state'
  },

  'state/operational-state.json': {
    categories: ['process_state', 'infrastructure_state'],
    fact_types: ['worker_status', 'active_tasks', 'recent_alerts'],
    notes: 'Operational state snapshot — fresh at read time'
  },

  // Workspace source files — infrastructure config only
  'workspace/*.js': {
    categories: ['infrastructure_state', 'process_state'],
    fact_types: ['ecosystem_config', 'handler_registration', 'command_structure', 'route_config'],
    notes: 'Workspace JS files for current system configuration — NOT credentials'
  },

  'workspace/server.js': {
    categories: ['infrastructure_state', 'process_state', 'command'],
    fact_types: ['server_config', 'port', 'route_config', 'route_handler'],
    notes: 'Main server configuration — route handlers, port, middleware'
  },

  'workspace/ops/PROCESS-SAFETY.md': {
    categories: ['command', 'recovery_action'],
    fact_types: ['protected_class', 'safe_command', 'doctrine_rule'],
    notes: 'Protected Process Doctrine — defines which commands are safe'
  },

  'workspace/ops/WATCHDOG-RECOVERY-APPROVAL-FLOW.md': {
    categories: ['recovery_action', 'approval'],
    fact_types: ['approved_command', 'approval_whitelist', 'recovery_flow'],
    notes: 'Watchdog recovery approval flow — approved command whitelist'
  },

  // Database — current data state only
  'supabase': {
    categories: ['data_state'],
    fact_types: ['task_status', 'dispatch_lifecycle', 'record_existence', 'client_state'],
    temporal: 'current',
    notes: 'Supabase queries — data state at query time only, not authorization'
  },

  // Runtime commands — current state ONLY, not future authorization
  'pm2_list': {
    categories: ['process_state', 'infrastructure_state'],
    fact_types: ['pid', 'status', 'uptime', 'memory', 'restart_count', 'process_name'],
    temporal: 'current',
    notes: 'pm2 list — process state at execution time only. Cannot authorize future actions.'
  },

  'pm2_desc': {
    categories: ['process_state'],
    fact_types: ['pid', 'status', 'pm_id', 'name', 'monit', 'script_path'],
    temporal: 'current',
    notes: 'pm2 desc <name> — detailed process info at execution time'
  },

  'ps_aux': {
    categories: ['process_state'],
    fact_types: ['pid', 'cpu', 'mem', 'command', 'status'],
    temporal: 'current',
    notes: 'ps aux — current process state only'
  },

  'curl_http': {
    categories: ['infrastructure_state', 'account_state'],
    fact_types: ['http_status', 'api_response', 'endpoint_health', 'response_body'],
    temporal: 'current',
    notes: 'HTTP API responses — state at request time only'
  },

  // Supabase (as a command source)
  'supabase_query': {
    categories: ['data_state'],
    fact_types: ['task_status', 'dispatch_lifecycle', 'record_existence', 'query_result'],
    temporal: 'current',
    notes: 'Supabase queries — data state at query time only'
  },

  // WhatsApp — explicit approval only
  'whatsapp_ahmad_approval': {
    categories: ['approval', 'recovery_action', 'credential', 'alert_destination'],
    fact_types: ['explicit_approval', 'command_authorization', 'credential_use', 'destination_use'],
    temporal: 'bounded',
    notes: 'Only WhatsApp messages explicitly containing approval phrases (approved/denied/proceed/etc.)'
  },

  // NON-AUTHORITIES — explicitly registered for clarity
  'EMAIL-SIGNATURES.md': {
    categories: [],
    fact_types: [],
    notes: 'EVIDENCE ONLY — contains email From addresses for customer communications. NOT authority for alert_destinations, credentials, providers, or approvals. Cannot authorize operational destinations.'
  },

  'strateon/business/EMAIL-SIGNATURES.md': {
    categories: [],
    fact_types: [],
    notes: 'EVIDENCE ONLY — email formatting preferences. NOT an authority for any operational category.'
  },

  'CHANGELOG.md': {
    categories: [],
    fact_types: [],
    notes: 'EVIDENCE ONLY — historical change log. Not authority for current state.'
  },

  'memory/*.md': {
    categories: [],
    fact_types: [],
    notes: 'EVIDENCE ONLY — historical session notes. Not authority for current facts.'
  },

  '*.log': {
    categories: [],
    fact_types: [],
    notes: 'EVIDENCE ONLY — historical log entries. Not authority for current state.'
  },
};

/**
 * Categories that are execution-sensitive and must be fail-closed
 * DERIVED is blocked for these categories
 */
const EXECUTION_SENSITIVE_CATEGORIES = new Set([
  'alert_destination',
  'credential',
  'approval',
  'recovery_action',
  'account_id',
  'billing',
  'command',        // commands must be VERIFIED
  'provider',       // providers must be VERIFIED
  'identity',       // identity must be VERIFIED
]);

/**
 * Categories that fail-closed on UNKNOWN
 * UNKNOWN blocks operation for these
 */
const FAIL_CLOSED_UNKNOWN_CATEGORIES = new Set([
  'alert_destination',
  'credential',
  'approval',
  'recovery_action',
  'account_id',
  'billing',
  'command',
  'provider',
  'security',
  'identity',
]);

/**
 * Categories where ASSUMED is blocked
 * ASSUMED cannot be used for these categories even with acknowledgment
 */
const BLOCK_ASSUMED_CATEGORIES = new Set([
  'alert_destination',
  'credential',
  'approval',
  'recovery_action',
  'account_id',
  'billing',
  'command',
  'provider',
  'security',
  'identity',
]);

module.exports = {
  AUTHORITY_REGISTRY,
  NON_AUTHORITIES,
  EXECUTION_SENSITIVE_CATEGORIES,
  FAIL_CLOSED_UNKNOWN_CATEGORIES,
  BLOCK_ASSUMED_CATEGORIES,
  isNonAuthority,
  checkAuthority,
};