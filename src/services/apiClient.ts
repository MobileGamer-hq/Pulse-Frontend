const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface RequestOptions extends RequestInit {
  orgSlug?: string;
  token?: string;
}

export const getAuthToken = (): string => {
  return localStorage.getItem('pulse_auth_token') || 'mock-admin';
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('pulse_auth_token', token);
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { orgSlug, token, headers, ...customConfig } = options;

  const authToken = token || getAuthToken();
  const userEmail = localStorage.getItem('pulse_user_email');
  const userId = localStorage.getItem('pulse_user_id');

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(orgSlug ? { 'x-org-slug': orgSlug } : {}),
    ...(userEmail ? { 'x-user-email': userEmail } : {}),
    ...(userId ? { 'x-user-id': userId } : {}),
    ...(headers as Record<string, string>),
  };

  const config: RequestInit = {
    method: options.method || 'GET',
    ...customConfig,
    headers: reqHeaders,
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData?.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // json parse failed
    }
    throw new Error(errorMessage);
  }

  // Check for 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
