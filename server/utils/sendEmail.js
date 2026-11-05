import logger from './logger.js';

// Sends email through the Resend HTTP API (no extra dependency: Node's
// built-in fetch). Reads only environment variable names, never values
// from code or commits:
//   RESEND_API_KEY - Resend API key, set in the hosting dashboard only.
//   EMAIL_FROM     - Verified sender address, e.g. a domain sender.
// If either is missing, sending is skipped and the caller must still
// return a generic response, so an attacker cannot tell whether an
// email address is registered.
export const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    logger.warn('Password reset email not sent: RESEND_API_KEY or EMAIL_FROM is not set');
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject: 'Reset your Verzo password',
        html: `<p>You asked to reset your Verzo password. Click the link below to set a new password. The link expires in 1 hour.</p><p><a href="${resetUrl}">Reset your password</a></p><p>If you did not ask for this, you can safely ignore this email.</p>`,
      }),
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, 'Password reset email was not accepted by the email service');
      return false;
    }
    return true;
  } catch (err) {
    logger.warn({ err: err.message }, 'Password reset email failed to send');
    return false;
  }
};

export default sendPasswordResetEmail;
