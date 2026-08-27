import nodemailer from 'nodemailer';
import type { Mailer, Mail } from './types';

/**
 * Real mailer. Server-side only.
 *
 * Generic SMTP transport (not tied to one provider) so it works with Gmail
 * SMTP, Office 365, Amazon SES's SMTP interface, or any other provider's
 * standard SMTP endpoint — whatever SMTP_HOST points at.
 */
let transport: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransport() {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587/STARTTLS
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transport;
}

export const smtpMailer: Mailer = {
  async send(mail: Mail) {
    try {
      const info = (await getTransport().sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
      })) as { messageId?: string };
      console.log(`[mail] sent to ${mail.to} — messageId=${info.messageId}`);
    } catch (err) {
      console.error(`[mail] FAILED to send to ${mail.to}:`, err);
      throw err;
    }
  },
};
