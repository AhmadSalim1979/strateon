/**
 * WhatsApp Adapter
 * Wraps the OpenClaw CLI for sending WhatsApp messages.
 * Used by sendWithErrorTracking() in governance/error-reports.js
 *
 * @param {string} phone - E.164 phone number
 * @param {string} message - Message text
 */
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const OPENCLAW_NODE = '/opt/node24/node-v24.13.1-linux-x64/bin/node';
const OPENCLAW_ENTRY = '/root/OpenClaw/openclaw.mjs';

/**
 * Send a WhatsApp message via OpenClaw CLI
 * @param {string} phone
 * @param {string} message
 * @returns {Promise<{messageId: string}>}
 */
export async function sendWhatsAppMessage(phone, message) {
  const args = [
    'message', 'send',
    '--target', phone,
    '--message', message,
    '--json'
  ];

  const { stdout, stderr } = await execFileAsync(
    OPENCLAW_NODE,
    [OPENCLAW_ENTRY, ...args],
    { timeout: 30000 }
  );

  if (stderr && stderr.trim() && !stderr.includes('warn')) {
    console.warn('[whatsapp-adapter] stderr:', stderr.trim());
  }

  const result = JSON.parse(stdout.trim());

  if (result.error) {
    throw new Error(result.error.message || result.error);
  }

  const messageId =
    result?.payload?.result?.messageId ||
    result?.messageId ||
    result?.id ||
    'unknown';

  return { messageId };
}
