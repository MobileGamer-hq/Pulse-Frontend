import type { EmailService, EmailProviderType } from './types';
import { emailConfig } from './config';
import { BackendEmailAdapter } from './backendEmailAdapter';
import { MockEmailAdapter } from './mockEmailAdapter';

export * from './types';
export * from './config';
export { BackendEmailAdapter } from './backendEmailAdapter';
export { MockEmailAdapter } from './mockEmailAdapter';

/**
 * Factory function to create an EmailService instance based on the chosen provider.
 */
export function createEmailService(providerType?: EmailProviderType): EmailService {
  const provider = providerType || emailConfig.provider;

  switch (provider) {
    case 'mock':
      return new MockEmailAdapter();
    case 'backend':
    default:
      return new BackendEmailAdapter();
  }
}

// Active singleton instance
let activeEmailService: EmailService = createEmailService();

/**
 * Active emailService instance used across the application.
 */
export const emailService: EmailService = {
  sendWelcomeEmail: (params) => activeEmailService.sendWelcomeEmail(params),
  sendInviteEmail: (params) => activeEmailService.sendInviteEmail(params),
  sendEmail: (params) => activeEmailService.sendEmail(params),
};

/**
 * Allows overriding or switching the active email service implementation at runtime.
 */
export function setEmailService(customService: EmailService): void {
  activeEmailService = customService;
}
