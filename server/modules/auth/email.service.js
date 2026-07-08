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
      subject: 'Reset your password',
      text: `Use this link to reset your password: ${resetUrl}`,
      html: `
        <p>Use the link below to reset your password.</p>
        <p><a href="${resetUrl}">Reset password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    });
  }

  async sendEmailVerificationEmail({ to, verificationUrl }) {
    return this.sendMail({
      to,
      subject: 'Verify your email address',
      text: `Use this link to verify your email address: ${verificationUrl}`,
      html: `
        <p>Use the link below to verify your email address.</p>
        <p><a href="${verificationUrl}">Verify email</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    });
  }
}

module.exports = new EmailService();
