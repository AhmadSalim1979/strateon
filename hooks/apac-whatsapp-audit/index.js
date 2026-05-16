/**
 * APAC WhatsApp Audit Hook — message:received handler
 *
 * AUDIT_ONLY observation point for inbound WhatsApp messages.
 * Classifies approval-like messages and writes audit entries.
 *
 * ZERO EXECUTION AUTHORITY:
 * - Cannot authorize, deny, or block execution
 * - Cannot mutate dispatches or alter MOOSA's response
 * - Cannot send automated messages
 * - All output is write-only telemetry
 *
 * Feature flag: APAC_ENABLED (default: true)
 * If APAC_ENABLED=false, hook is a no-op pass-through.
 *
 * Hook events: message:received
 */

const FEATURE_FLAG = 'APAC_ENABLED';
const DEFAULT_ENABLED = false; // AUDIT_ONLY — explicit opt-in required

/**
 * Determine if APAC observation is enabled.
 * Returns true ONLY when APAC_ENABLED is explicitly set to 'true' or '1'.
 * All other values (undefined, '', 'false', '0', etc.) return false.
 */
function isApacEnabled() {
  const flag = process.env[FEATURE_FLAG];
  if (flag === 'true' || flag === '1') {
    return true;
  }
  if (flag !== undefined && flag !== '') {
    console.warn(`[apac-whatsapp-audit] Invalid APAC_ENABLED value "${flag}" — expected "true" or "false". Bypassing.`);
  }
  return false;
}

/**
 * Map OpenClaw message:received context to APAC TemplateContext.
 */
function mapToTemplateContext(ctx) {
  return {
    MessageSid: ctx.messageId || null,
    MessageSidFull: null,
    SenderE164: ctx.metadata?.senderE164 || null,
    SenderId: ctx.metadata?.senderId || null,
    Timestamp: ctx.timestamp || null,
    ForwardedFrom: ctx.metadata?.forwardedFrom || null,
    SessionId: ctx.conversationId || null,
    Body: ctx.content || '',
  };
}

/**
 * The hook handler.
 * Called by OpenClaw on every message:received event.
 */
async function handler(context) {
  // Feature guard — no-op if disabled
  if (!isApacEnabled()) {
    return;
  }

  // Guard: must have a message to classify
  const body = context.content;
  if (!body || typeof body !== 'string') {
    return;
  }

  try {
    await observeMessage(context);
  } catch (err) {
    // NON-NEGOTIABLE: Hook failures must never propagate
    console.error('[apac-whatsapp-audit] Hook error (non-fatal):', err instanceof Error ? err.message : String(err));
  }
}

/**
 * Run APAC observation on the inbound message.
 */
async function observeMessage(ctx) {
  const { apacObserveMessage } = require('../../strateon/eel/src/apac-whatsapp-hook.js');

  const mappedCtx = mapToTemplateContext(ctx);
  const body = ctx.content || '';

  await apacObserveMessage(mappedCtx, body, {
    session_id: ctx.conversationId || null,
    useSecretsFallback: true,
  });
}

module.exports = { handler };