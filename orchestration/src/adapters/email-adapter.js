/**
 * Email Adapter
 * Wraps nodemailer for sending emails.
 * Used by sendWithErrorTracking() in governance/error-reports.js
 */
import nodemailer from 'nodemailer';

const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.privateemail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587', 10);
const EMAIL_USER = process.env.EMAIL_USER || 'contact@qiyadon.com';
const EMAIL_PASS = process.env.EMAIL_PASS || '';

let _transporter = null;

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      tls: { rejectUnauthorized: false },
    });
  }
  return _transporter;
}

/**
 * Send an email.
 * @param {Object} params - { to: string, subject?: string, text?: string, html?: string }
 * @returns {Promise<{messageId: string, accepted: string[]}>}
 */
export async function sendEmail({ to, subject = '', text = '', html = '' }) {
  const transporter = getTransporter();

  const result = await transporter.sendMail({
    from: 'Qiyadon <contact@qiyadon.com>',
    to,
    subject,
    text,
    html: html || text.replace(/\n/g, '<br>'),
  });

  return {
    messageId: result.messageId,
    accepted: result.accepted,
  };
}
