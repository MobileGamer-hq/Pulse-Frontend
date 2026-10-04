export interface FieldChange {
  entityType: string;
  entityId: string;
  label: string;
  field: string;
  fromValue: any;
  toValue: any;
}

export interface DryRunDiff {
  dryRunId: string;
  action: string;
  summary: string;
  affectedCount: number;
  affectedUserIds?: string[];
  affectedUserNames?: string[];
  changes: FieldChange[];
  warnings: string[];
  requiresConfirmation: boolean;
  expiresAt: string;
}

export interface ActionCall {
  id: string;
  tool: string;
  tier: string;
  parameters: Record<string, any>;
}

export interface ChatResponse {
  reply: string;
  actions: ActionCall[];
  executedActions: ActionCall[];
  dryRunDiff?: DryRunDiff | null;
  undoToken?: string | null;
  status: 'requires_tools' | 'requires_confirmation' | 'final_response';
  sessionId: string;
  modelUsed: string;
}

const AGENT_API_URL =
  import.meta.env.VITE_PULSE_AGENT_URL ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8001'
    : 'https://pulse-agent-brown.vercel.app');

export const aiService = {
  checkHealth: async () => {
    try {
      const res = await fetch(`${AGENT_API_URL}/api/health`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  sendChatMessage: async (params: {
    message?: string;
    context?: any;
    sessionId?: string;
    userRole?: string;
    orgSlug?: string;
    authJwt?: string;
    toolResults?: any[];
  }): Promise<ChatResponse> => {
    const res = await fetch(`${AGENT_API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: params.message || '',
        context: params.context,
        sessionId: params.sessionId,
        userRole: params.userRole || 'Member',
        orgSlug: params.orgSlug,
        authJwt: params.authJwt,
        toolResults: params.toolResults,
      }),
    });

    if (!res.ok) {
      throw new Error(`Agent request failed: ${res.statusText}`);
    }

    return await res.json();
  },

  streamChatMessage: async (
    params: {
      message?: string;
      context?: any;
      sessionId?: string;
      userRole?: string;
      orgSlug?: string;
      authJwt?: string;
      toolResults?: any[];
    },
    callbacks: {
      onToken: (token: string) => void;
      onAction?: (action: ActionCall) => void;
      onDryRun?: (diff: DryRunDiff) => void;
      onDone?: (meta: { sessionId: string; undoToken?: string; status?: string }) => void;
      onError?: (err: any) => void;
    }
  ) => {
    try {
      const response = await fetch(`${AGENT_API_URL}/api/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: params.message || '',
          context: params.context,
          sessionId: params.sessionId,
          userRole: params.userRole || 'Member',
          orgSlug: params.orgSlug,
          authJwt: params.authJwt,
          toolResults: params.toolResults,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Streaming failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          if (!evt.trim()) continue;
          const lines = evt.split('\n');
          let eventType = 'message';
          let dataStr = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.replace('event: ', '').trim();
            } else if (line.startsWith('data: ')) {
              dataStr = line.replace('data: ', '').trim();
            }
          }

          if (eventType === 'token' && dataStr) {
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.token) callbacks.onToken(parsed.token);
            } catch {
              callbacks.onToken(dataStr);
            }
          } else if (eventType === 'action' && dataStr && callbacks.onAction) {
            try {
              callbacks.onAction(JSON.parse(dataStr));
            } catch {}
          } else if (eventType === 'dry_run' && dataStr && callbacks.onDryRun) {
            try {
              callbacks.onDryRun(JSON.parse(dataStr));
            } catch {}
          } else if (eventType === 'done' && dataStr && callbacks.onDone) {
            try {
              callbacks.onDone(JSON.parse(dataStr));
            } catch {}
          }
        }
      }
    } catch (err) {
      if (callbacks.onError) callbacks.onError(err);
      else console.error('Ops stream error:', err);
    }
  },

  confirmDryRun: async (params: {
    dryRunId: string;
    userRole?: string;
    authJwt?: string;
  }) => {
    const res = await fetch(`${AGENT_API_URL}/api/dry-run/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to confirm dry run' }));
      throw new Error(err.detail || 'Confirmation failed');
    }

    return await res.json();
  },

  undoAction: async (params: { undoToken: string; authJwt?: string }) => {
    const res = await fetch(`${AGENT_API_URL}/api/undo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to revert action' }));
      throw new Error(err.detail || 'Undo failed');
    }

    return await res.json();
  },
};
