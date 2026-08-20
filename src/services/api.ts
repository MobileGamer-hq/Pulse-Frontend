/**
 * Pulse API Service Layer
 * Connects React frontend to Spring Boot backend REST endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('pulse_auth_token');
  const tenantSlug = localStorage.getItem('pulse_tenant_slug') || 'epicordia';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-Slug': tenantSlug,
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error (${response.status}): ${response.statusText}`);
  }

  const data = await response.json();
  return data.data !== undefined ? data.data : data;
}

export const api = {
  // Tasks
  getTasks: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchAPI<any>(`/tasks${query}`);
  },
  createTask: (data: any) => fetchAPI<any>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, updates: any) => fetchAPI<any>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
  deleteTask: (id: string) => fetchAPI<any>(`/tasks/${id}`, { method: 'DELETE' }),
  reorderTasks: (taskIds: string[]) => fetchAPI<any>('/tasks/reorder', { method: 'PUT', body: JSON.stringify({ orderedTaskIds: taskIds }) }),
  addSubtask: (taskId: string, title: string) => fetchAPI<any>(`/tasks/${taskId}/subtasks`, { method: 'POST', body: JSON.stringify({ title }) }),
  toggleSubtask: (taskId: string, subtaskId: string) => fetchAPI<any>(`/tasks/${taskId}/subtasks/${subtaskId}`, { method: 'PATCH' }),
  addComment: (taskId: string, text: string, authorId: string, authorName: string) => 
    fetchAPI<any>(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ text, authorId, authorName }) }),

  // Projects
  getProjects: () => fetchAPI<any>('/projects'),
  createProject: (data: any) => fetchAPI<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: string, updates: any) => fetchAPI<any>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
  deleteProject: (id: string) => fetchAPI<any>(`/projects/${id}`, { method: 'DELETE' }),

  // Goals
  getGoals: () => fetchAPI<any>('/goals'),
  createGoal: (data: any) => fetchAPI<any>('/goals', { method: 'POST', body: JSON.stringify(data) }),
  updateGoal: (id: string, updates: any) => fetchAPI<any>(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),

  // Daily Pulse / EOD
  getPulseEntries: () => fetchAPI<any>('/pulse'),
  submitPulse: (data: any) => fetchAPI<any>('/pulse', { method: 'POST', body: JSON.stringify(data) }),

  // Tags
  getTags: () => fetchAPI<any>('/tags'),
  createTag: (data: any) => fetchAPI<any>('/tags', { method: 'POST', body: JSON.stringify(data) }),
  updateTag: (id: string, updates: any) => fetchAPI<any>(`/tags/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),

  // Teams & Users
  getTeams: () => fetchAPI<any>('/teams'),
  getUsers: () => fetchAPI<any>('/users'),

  // Reports
  getReports: () => fetchAPI<any>('/reports'),

  // Auth
  login: (credentials: { email: string; password: string }) => fetchAPI<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (payload: any) => fetchAPI<any>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
};
