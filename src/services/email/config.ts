import type { EmailProviderType, EmailServiceConfig } from './types';

const provider = (import.meta.env.VITE_EMAIL_PROVIDER || 'backend') as EmailProviderType;

export const emailConfig: EmailServiceConfig = {
  provider,
  backend: {
    apiUrl: (import.meta.env.VITE_BACKEND_EMAIL_API_URL || 'https://pulse-d1kn.onrender.com').replace(/\/+$/, ''),
    backupApiUrl: (import.meta.env.VITE_BACKEND_EMAIL_BACKUP_API_URL || 'https://pulse-backend-p7hb.onrender.com').replace(/\/+$/, ''),
  },
};
