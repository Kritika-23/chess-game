const nodemailer = require('nodemailer');
const env = require('../../config/env');

class EmailService {
  constructor() {
    this.transporter = null;
  }

  isConfigured() {
    return Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
  }

  getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort,
        secure: env.smtpSecure,
        auth: {
          user: env.smtpUser,
          pass: env.smtpPass,
        },
      });
    }

    return this.transporter;
  }

  async sendMail({ to, subject, text, html }) {
    if (!this.isConfigured()) {
      throw new Error('SMTP is not configured');
    }

    return this.getTransporter().sendMail({
      from: env.smtpFrom,
      to,
      subject,
      text,
      html,
    });
  }

  async sendPasswordResetEmail({ to, resetUrl }) {
    return this.sendMail({
      to,
      subject: 'Reset your ChessLive password',
      text: `Use this link to reset your password: ${resetUrl}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2933">
          <h2>Reset your ChessLive password</h2>
          <p>Use the button below to choose a new password. This link expires in 1 hour.</p>
          <p>
            <a href="${resetUrl}" style="display:inline-block;background:#c9a86a;color:#1c1611;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">
              Reset Password
            </a>
          </p>
          <p>If you did not request this, you can ignore this email.</p>
        </div>
      `,
    });
  }

}

module.exports = new EmailService();
