import type { EmailService, WelcomeEmailParams, InviteEmailParams, SendEmailParams, EmailSendResult } from './types';
import { emailConfig } from './config';

/**
 * BackendEmailAdapter
 * Dispatches welcome and invitation emails directly to your backend API.
 * Base URL: https://pulse-d1kn.onrender.com
 */
export class BackendEmailAdapter implements EmailService {
  private apiUrl: string;
  private backupApiUrl?: string;

  constructor(options?: { apiUrl?: string; backupApiUrl?: string }) {
    this.apiUrl = (options?.apiUrl || emailConfig.backend.apiUrl).replace(/\/+$/, '');
    this.backupApiUrl = (options?.backupApiUrl || emailConfig.backend.backupApiUrl)?.replace(/\/+$/, '');
  }

  private getHeaders(): HeadersInit {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('pulse_auth_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Dispatches a POST request with automatic failover to the backup API if primary fails.
   */
  private async postWithFailover(
    endpoint: string,
    payload: Record<string, any>,
    label: string
  ): Promise<{ data: any; usedUrl: string }> {
    const urlsToTry = [this.apiUrl];
    if (this.backupApiUrl && this.backupApiUrl !== this.apiUrl) {
      urlsToTry.push(this.backupApiUrl);
    }

    let lastError: Error | null = null;

    for (let i = 0; i < urlsToTry.length; i++) {
      const baseUrl = urlsToTry[i];
      const isBackup = i > 0;
      const targetUrl = `${baseUrl}${endpoint}`;

      try {
        console.log(
          `[BackendEmailAdapter] ${isBackup ? '[BACKUP FAILOVER]' : '[PRIMARY]'} Sending ${label} to "${payload.recipientEmail || payload.toEmail}" via ${targetUrl}...`
        );

        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(errorText || `HTTP ${response.status}`);
        }

        const data = await response.json().catch(() => ({}));
        console.log(
          `[BackendEmailAdapter] ${isBackup ? '[BACKUP]' : '[PRIMARY]'} ${label.toUpperCase()} SENT SUCCESSFULLY to "${payload.recipientEmail || payload.toEmail}"!`,
          data
        );

        return { data, usedUrl: baseUrl };
      } catch (err: any) {
        lastError = err;
        console.warn(
          `[BackendEmailAdapter] ${isBackup ? 'Backup' : 'Primary'} server (${targetUrl}) failed for ${label}:`,
          err.message || err
        );

        if (!isBackup && urlsToTry.length > 1) {
          console.warn(`[BackendEmailAdapter] Automatically failing over to backup endpoint: ${urlsToTry[1]}${endpoint}...`);
        }
      }
    }

    throw lastError || new Error(`Failed to send ${label} on both primary and backup servers.`);
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
      const { data, usedUrl } = await this.postWithFailover('/api/email/welcome', payload, 'welcome email');
      return {
        success: true,
        messageId: data.messageId || data.id || 'welcome-sent',
        provider: usedUrl === this.backupApiUrl ? 'backend-backup' : 'backend',
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
      console.log('[BackendEmailAdapter] Invite payload:', JSON.stringify(payload, null, 2));
      const { data, usedUrl } = await this.postWithFailover('/api/email/invite', payload, 'invite email');

      return {
        success: true,
        messageId: data.messageId || data.id || 'invite-sent',
        provider: usedUrl === this.backupApiUrl ? 'backend-backup' : 'backend',
      };
    } catch (error: any) {
      console.error(`[BackendEmailAdapter] Failed to dispatch invitation email to "${params.toEmail}":`, error);
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
      const { data, usedUrl } = await this.postWithFailover('/api/email/send', params, 'email');
      return {
        success: true,
        messageId: data.messageId || data.id,
        provider: usedUrl === this.backupApiUrl ? 'backend-backup' : 'backend',
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
