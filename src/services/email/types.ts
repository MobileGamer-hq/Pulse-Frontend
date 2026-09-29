export type EmailProviderType = 'backend' | 'mock';

export interface WelcomeEmailParams {
  toEmail: string;
  toName: string;
  appUrl?: string;
  companyName?: string;
  extraParams?: Record<string, any>;
}

export interface InviteEmailParams {
  toEmail: string;
  fromName: string;
  orgName: string;
  token: string;
  inviteLink?: string;
  role?: string;
  extraParams?: Record<string, any>;
}

export interface SendEmailParams {
  toEmail: string;
  toName?: string;
  subject?: string;
  templateId?: string;
  templateParams?: Record<string, any>;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

export interface EmailServiceConfig {
  provider: EmailProviderType;
  backend: {
    apiUrl: string;
  };
}

export interface EmailService {
  /**
   * Sends a welcome email to a newly signed up user via the backend service.
   */
  sendWelcomeEmail(params: WelcomeEmailParams): Promise<EmailSendResult>;

  /**
   * Sends an invitation email to a user invited to join an organization.
   */
  sendInviteEmail(params: InviteEmailParams): Promise<EmailSendResult>;

  /**
   * Sends a generic email using the active provider.
   */
  sendEmail(params: SendEmailParams): Promise<EmailSendResult>;
}
