import { apiRequest } from './apiClient';

export interface CreateTaskPayload {
  projectId: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  estimatedHours?: number;
  startDate?: string;
  dueDate?: string;
  linkedGoalId?: string;
  assigneeIds?: string[];
  tagIds?: string[];
  subtasks?: Array<{ title: string; done?: boolean } | string>;
  dependsOnTaskIds?: string[];
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  actualHours?: number;
  blockedReason?: string;
  assigneeIds?: string[];
  tagIds?: string[];
}

export const taskService = {
  getTasks: async (orgSlug: string) => {
    return apiRequest(`/organizations/${orgSlug}/tasks`);
  },

  createTask: async (orgSlug: string, payload: CreateTaskPayload) => {
    return apiRequest(`/organizations/${orgSlug}/tasks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateTask: async (orgSlug: string, taskId: string, payload: UpdateTaskPayload) => {
    return apiRequest(`/organizations/${orgSlug}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  addComment: async (orgSlug: string, taskId: string, text: string) => {
    return apiRequest(`/organizations/${orgSlug}/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  deleteComment: async (orgSlug: string, taskId: string, commentId: string) => {
    return apiRequest(`/organizations/${orgSlug}/tasks/${taskId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  },

  createSubtask: async (orgSlug: string, taskId: string, title: string) => {
    return apiRequest(`/organizations/${orgSlug}/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  updateSubtask: async (orgSlug: string, taskId: string, subtaskId: string, payload: { title?: string; done?: boolean }) => {
    return apiRequest(`/organizations/${orgSlug}/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteSubtask: async (orgSlug: string, taskId: string, subtaskId: string) => {
    return apiRequest(`/organizations/${orgSlug}/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: 'DELETE',
    });
  },

  addDependency: async (orgSlug: string, taskId: string, dependsOnTaskId: string) => {
    return apiRequest(`/organizations/${orgSlug}/tasks/${taskId}/dependencies`, {
      method: 'POST',
      body: JSON.stringify({ dependsOnTaskId }),
    });
  },

  removeDependency: async (orgSlug: string, taskId: string, dependsOnTaskId: string) => {
    return apiRequest(`/organizations/${orgSlug}/tasks/${taskId}/dependencies/${dependsOnTaskId}`, {
      method: 'DELETE',
    });
  },

  deleteTask: async (orgSlug: string, taskId: string) => {
    return apiRequest(`/organizations/${orgSlug}/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },
};
