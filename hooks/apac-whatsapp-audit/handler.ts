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
const DEFAULT_ENABLED = true;

interface MessageReceivedContext {
  from?: string;
  content?: string;
  timestamp?: number;
  channelId?: string;
  accountId?: string;
  conversationId?: string;
  messageId?: string;
  metadata?: {
    to?: string;
    provider?: string;
    surface?: string;
    threadId?: string | number;
    senderId?: string;
    senderName?: string;
    senderUsername?: string;
    senderE164?: string;
    guildId?: string;
    channelName?: string;
    [key: string]: unknown;
  };
}

/**
 * Determine if APAC observation is enabled.
 * Reads from process.env with a safe default.
 */
function isApacEnabled(): boolean {
  const flag = process.env[FEATURE_FLAG];
  if (flag === undefined || flag === '') {
    return DEFAULT_ENABLED;
  }
  return flag === 'true' || flag === '1';
}

/**
 * Map OpenClaw message:received context to APAC TemplateContext.
 */
function mapToTemplateContext(ctx: MessageReceivedContext): object {
  return {
    MessageSid: ctx.messageId || null,
    MessageSidFull: null, // Not available in message:received context
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
 *
 * @param context - OpenClaw message:received context
 */
export async function handler(context: MessageReceivedContext): Promise<void> {
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
    // Log and continue — original message flow is unaffected
    console.error('[apac-whatsapp-audit] Hook error (non-fatal):', err instanceof Error ? err.message : String(err));
  }
}

/**
 * Run APAC observation on the inbound message.
 * Writes audit entries only — no execution authority.
 */
async function observeMessage(ctx: MessageReceivedContext): Promise<void> {
  // Dynamic require to avoid loading heavy modules when APAC is disabled
  const { apacObserveMessage } = require('../../../strateon/eel/src/apac-whatsapp-hook.js');

  const mappedCtx = mapToTemplateContext(ctx);
  const body = ctx.content || '';

  // Write audit entries only — no return value is used for execution control
  await apacObserveMessage(mappedCtx, body, {
    session_id: ctx.conversationId || null,
    useSecretsFallback: true,
  });
}