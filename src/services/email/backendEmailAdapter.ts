import type { EmailService, WelcomeEmailParams, InviteEmailParams, SendEmailParams, EmailSendResult } from './types';
import { emailConfig } from './config';

/**
 * BackendEmailAdapter
 * Dispatches welcome and invitation emails directly to your backend API.
 * Base URL: https://pulse-d1kn.onrender.com
 */
export class BackendEmailAdapter implements EmailService {
  private apiUrl: string;

  constructor(options?: { apiUrl?: string }) {
    this.apiUrl = (options?.apiUrl || emailConfig.backend.apiUrl).replace(/\/+$/, '');
  }

  private getHeaders(): HeadersInit {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('pulse_auth_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Dispatches welcome email via:
   * POST /api/email/welcome
   * Payload: { recipientEmail, recipientName, loginUrl }
   */
  async sendWelcomeEmail(params: WelcomeEmailParams): Promise<EmailSendResult> {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const loginUrl = params.appUrl ? `${params.appUrl}/signin` : `${origin}/signin`;

    const payload = {
      recipientEmail: params.toEmail,
      recipientName: params.toName,
      loginUrl,
    };

    try {
      console.info(`[BackendEmailAdapter] Sending welcome email to ${params.toEmail} via ${this.apiUrl}/api/email/welcome`);
      const response = await fetch(`${this.apiUrl}/api/email/welcome`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `Backend returned HTTP ${response.status}`);
      }

      const data = await response.json().catch(() => ({}));
      console.info('[BackendEmailAdapter] Welcome email sent successfully:', data);

      return {
        success: true,
        messageId: data.messageId || data.id || 'welcome-sent',
        provider: 'backend',
      };
    } catch (error: any) {
      console.error('[BackendEmailAdapter] Failed to send welcome email:', error);
      return {
        success: false,
        error: error.message || 'Failed to dispatch welcome email via backend',
        provider: 'backend',
      };
    }
  }

  /**
   * Dispatches organization invitation email via:
   * POST /api/email/invite
   * Payload: { recipientEmail, fromName, orgName, inviteLink, token }
   */
  async sendInviteEmail(params: InviteEmailParams): Promise<EmailSendResult> {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const inviteLink = params.inviteLink || `${origin}/invite/${params.token}`;

    const payload = {
      recipientEmail: params.toEmail,
      fromName: params.fromName,
      orgName: params.orgName,
      inviteLink,
      token: params.token,
    };

    try {
      console.log(`[BackendEmailAdapter] 🚀 Preparing to send invite email to "${params.toEmail}" via ${this.apiUrl}/api/email/invite...`);
      console.log('[BackendEmailAdapter] 📦 Invite payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${this.apiUrl}/api/email/invite`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(`[BackendEmailAdapter] ❌ Backend rejected invite email (HTTP ${response.status}):`, errorText);
        throw new Error(errorText || `Backend returned HTTP ${response.status}`);
      }

      const data = await response.json().catch(() => ({}));
      console.log(`[BackendEmailAdapter] ✅ INVITATION EMAIL SENT SUCCESSFULLY to "${params.toEmail}"! Server response:`, data);

      return {
        success: true,
        messageId: data.messageId || data.id || 'invite-sent',
        provider: 'backend',
      };
    } catch (error: any) {
      console.error(`[BackendEmailAdapter] ❌ Failed to dispatch invitation email to "${params.toEmail}":`, error);
      return {
        success: false,
        error: error.message || 'Failed to dispatch invite email via backend',
        provider: 'backend',
      };
    }
  }

  /**
   * Generic send method forwarding to your backend API.
   */
  async sendEmail(params: SendEmailParams): Promise<EmailSendResult> {
    try {
      const response = await fetch(`${this.apiUrl}/api/email/send`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `Backend returned HTTP ${response.status}`);
      }

      const data = await response.json().catch(() => ({}));
      return {
        success: true,
        messageId: data.messageId || data.id,
        provider: 'backend',
      };
    } catch (error: any) {
      console.error('[BackendEmailAdapter] Failed to send email:', error);
      return {
        success: false,
        error: error.message || 'Failed to dispatch email via backend',
        provider: 'backend',
      };
    }
  }
}
