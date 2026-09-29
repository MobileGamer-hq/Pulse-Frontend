import type { EmailService, WelcomeEmailParams, InviteEmailParams, SendEmailParams, EmailSendResult } from './types';

/**
 * MockEmailAdapter
 * Useful for local development and automated testing without consuming EmailJS quota.
 * Enabled when `VITE_EMAIL_PROVIDER=mock`.
 */
export class MockEmailAdapter implements EmailService {
  async sendWelcomeEmail(params: WelcomeEmailParams): Promise<EmailSendResult> {
    console.info('[MockEmailAdapter] Simulated Welcome Email sent:', {
      to: params.toEmail,
      name: params.toName,
      company: params.companyName || 'Pulse by Epicordia',
    });
    return {
      success: true,
      messageId: `mock-welcome-${Date.now()}`,
      provider: 'mock',
    };
  }

  async sendInviteEmail(params: InviteEmailParams): Promise<EmailSendResult> {
    console.info('[MockEmailAdapter] Simulated Invitation Email sent:', {
      to: params.toEmail,
      from: params.fromName,
      org: params.orgName,
      token: params.token,
      inviteLink: params.inviteLink,
    });
    return {
      success: true,
      messageId: `mock-invite-${Date.now()}`,
      provider: 'mock',
    };
  }

  async sendEmail(params: SendEmailParams): Promise<EmailSendResult> {
    console.info('[MockEmailAdapter] Simulated Email sent:', params);
    return {
      success: true,
      messageId: `mock-msg-${Date.now()}`,
      provider: 'mock',
    };
  }
}
