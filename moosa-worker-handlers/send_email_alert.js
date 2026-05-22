/**
 * send_email_alert.js — Independent Email Alert Transport
 * 
 * Neo SMTP email alerting for watchdog fallback.
 * Used when WhatsApp transport is non-responsive.
 * 
 * Usage: import { sendEmailAlert } from './handlers/send_email_alert.js'
 */

import nodemailer from 'nodemailer';
import { readFileSync } from 'node:fs';

const CREDENTIALS_PATH = '/home/node/.openclaw/secrets/qiyadon-email.json';

// OPERATOR-REGISTRY — authoritative source for operator contact identifiers
// Do not generate, infer, or hardcode operational identifiers.
const ALLOWED_DESTINATIONS = ['ahmad.salim@qiyadon.com', 'contact@qiyadon.com'];

/**
 * Validate that destination email is in the OPERATOR-REGISTRY.
 * Throws if destination is not verified.
 * @param {string} toEmail 
 */
function validateDestination(toEmail) {
  if (!ALLOWED_DESTINATIONS.includes(toEmail)) {
    const err = new Error(`UNVERIFIED_EMAIL_DESTINATION: '${toEmail}' is not in OPERATOR-REGISTRY.md`);
    err.code = 'UNVERIFIED_EMAIL_DESTINATION';
    throw err;
  }
}

/**
 * Load Neo SMTP credentials from secrets file.
 * @returns {{ host: string, port: number, user: string, pass: string, toEmail: string }}
 */
function loadCredentials() {
  const raw = readFileSync(CREDENTIALS_PATH, 'utf8');
  const cred = JSON.parse(raw);
  return {
    host: cred.smtp.host,
    port: cred.smtp.port,
    user: cred.user,
    pass: cred.password,
    toEmail: 'ahmad.salim@qiyadon.com',  // from OPERATOR-REGISTRY.md — verified
  };
}

/**
 * Build a configured nodemailer transporter using Neo SMTP.
 * @returns {nodemailer.Transporter}
 */
function createTransporter() {
  const c = loadCredentials();
  return nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: false,
    requireTLS: true,
    auth: {
      user: c.user,
      pass: c.pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

/**
 * Send an email alert via Neo SMTP.
 * Validates destination against OPERATOR-REGISTRY before sending.
 * 
 * @param {{
 *   severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'TEST',
 *   message: string,
 *   toEmail?: string
 * }} opts
 * @returns {Promise<{sent: boolean, messageId: string, timestamp: string}>}
 */
export async function sendEmailAlert({ severity = 'HIGH', message, toEmail } = {}) {
  const c = loadCredentials();
  const timestamp = new Date().toISOString();
  const recipient = toEmail || c.toEmail;

  // VALIDATION GATE — reject unverified destinations
  validateDestination(recipient);

  const mailOptions = {
    from: '"Moosa Watchdog" <contact@qiyadon.com>',
    to: recipient,
    subject: `[WATCHDOG] ${severity} — Email fallback validation`,
    text: `[WATCHDOG] ${severity}\nTimestamp: ${timestamp}\nAlert: ${message}\n\nSent via Neo SMTP from Moosa worker.`,
    html: null,
  };

  const transporter = createTransporter();

  try {
    const info = await transporter.sendMail(mailOptions);
    return {
      sent: true,
      messageId: info.messageId,
      timestamp,
      recipient,
    };
  } catch (err) {
    const structured = {
      sent: false,
      error: err.message,
      code: err.code,
      command: err.command,
      timestamp,
    };
    const alt = new Error(`Email send failed: ${err.message}`);
    alt.code = err.code;
    alt.structured = structured;
    throw alt;
  }
}

// Allow direct node execution for manual test
const isMain = process.argv[1]?.endsWith('send_email_alert.js');
if (isMain) {
  console.log('[send_email_alert] Running manual test...');
  sendEmailAlert({
    severity: 'TEST',
    message: 'Email fallback validation test — RISI-P5.2 Phase 1A corrected',
  })
    .then(r => {
      console.log('[send_email_alert] ✓ Sent:', r.messageId, 'at', r.timestamp);
      process.exit(0);
    })
    .catch(err => {
      console.error('[send_email_alert] ✗ Failed:', err.message);
      process.exit(1);
    });
}