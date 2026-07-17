// server/utils/sendEmail.js
import nodemailer from 'nodemailer';

/**
 * Returns true when SMTP credentials are present in the environment.
 */
export const isEmailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let cachedTransporter = null;

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const port = Number(process.env.SMTP_PORT) || 587;
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // SSL for 465, STARTTLS for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return cachedTransporter;
};

/**
 * Send an email. If SMTP is not configured, the email is logged to the server
 * console instead of being sent — so the password-reset flow remains testable
 * in development without an email account.
 *
 * @param {Object} options
 * @param {string} options.to       Recipient address
 * @param {string} options.subject  Subject line
 * @param {string} options.text     Plain-text body
 * @param {string} [options.html]   Optional HTML body
 * @returns {Promise<{ sent: boolean }>}
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  if (!isEmailConfigured()) {
    console.log('\n📧 [DEV] Email not configured — would have sent:');
    console.log(`   To:      ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body:    ${text}\n`);
    return { sent: false };
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  await getTransporter().sendMail({ from, to, subject, text, html });
  return { sent: true };
};
