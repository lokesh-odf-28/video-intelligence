import { consoleMailer } from './console';
import { smtpMailer } from './smtp';
import type { Mailer } from './types';

/**
 * SMTP_HOST unset → console mailer (codes land in the server log)
 * SMTP_HOST set   → real SMTP send
 */
export const useRealMail = Boolean(process.env.SMTP_HOST);
export const mailer: Mailer = useRealMail ? smtpMailer : consoleMailer;

export * from './types';
