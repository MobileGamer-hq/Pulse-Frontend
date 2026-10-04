import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Bot, X, Send, CheckCircle2, RotateCcw, Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { aiService, type DryRunDiff, type ActionCall } from '../../services/aiService';
import { executeOpsTool } from '../../services/opsToolExecutor';
import { DiffPreviewModal } from './DiffPreviewModal';

interface Message {
  id: string;
  sender: 'user' | 'ops';
  text: string;
  actions?: ActionCall[];
  dryRunDiff?: DryRunDiff;
  undoToken?: string;
  timestamp: string;
}

interface OpsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OpsDrawer: React.FC<OpsDrawerProps> = ({ isOpen, onClose }) => {
  const appContext = useApp();
  const { currentUser, currentOrgSlug, tasks } = appContext;
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ops',
      text: "Ops operational manager ready. Deadlines, dependencies, blockers, and workloads monitored. How can I unblock the team?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeDiff, setActiveDiff] = useState<DryRunDiff | null>(null);
  const [activeUndoToken, setActiveUndoToken] = useState<string | null>(null);
  const [undoStatus, setUndoStatus] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Global keyboard shortcut Cmd+J / Ctrl+J
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSend = async (customText?: string) => {
    const messageText = (customText || input).trim();
    if (!messageText || isStreaming) return;

    const userMsgId = `user_${Date.now()}`;
    const opsMsgId = `ops_${Date.now()}`;

    setMessages(prev => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: messageText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: opsMsgId,
        sender: 'ops',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    if (!customText) setInput('');
    setIsStreaming(true);

    const contextPayload = {
      orgSlug: currentOrgSlug,
      userName: currentUser.name,
      userRole: currentUser.role,
      activeBlockerCount: tasks.filter(t => t.status === 'Blocked').length,
      activeTasks: tasks.slice(0, 10).map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        dueDate: t.dueDate,
        estimatedHours: t.estimatedHours,
      })),
    };

    let accumulatedText = '';
    const stagedActions: ActionCall[] = [];

    await aiService.streamChatMessage(
      {
        message: messageText,
        context: contextPayload,
        userRole: currentUser.role,
        orgSlug: currentOrgSlug,
      },
      {
        onToken: (token: string) => {
          accumulatedText += token;
          setMessages(prev =>
            prev.map(m => (m.id === opsMsgId ? { ...m, text: accumulatedText } : m))
          );
        },
        onAction: (act: ActionCall) => {
          stagedActions.push(act);
          setMessages(prev =>
            prev.map(m => (m.id === opsMsgId ? { ...m, actions: [...stagedActions] } : m))
          );
        },
        onDryRun: (diff: DryRunDiff) => {
          setActiveDiff(diff);
          setMessages(prev =>
            prev.map(m => (m.id === opsMsgId ? { ...m, dryRunDiff: diff } : m))
          );
        },
        onDone: async (meta) => {
          if (meta.status === 'requires_tools' && stagedActions.length > 0) {
            // Execute staged tool calls client-side against AppContext!
            const toolResults = [];
            for (const act of stagedActions) {
              const res = await executeOpsTool(act, appContext);
              toolResults.push(res);
            }

            // Immediately send tool execution results back to the backend for final grounded confirmation
            let secondLegText = '';
            await aiService.streamChatMessage(
              {
                sessionId: meta.sessionId,
                toolResults,
                userRole: currentUser.role,
                orgSlug: currentOrgSlug,
                context: contextPayload,
              },
              {
                onToken: (token: string) => {
                  secondLegText += token;
                  setMessages(prev =>
                    prev.map(m => (m.id === opsMsgId ? { ...m, text: secondLegText } : m))
                  );
                },
                onDone: (secondMeta) => {
                  if (secondMeta.undoToken) {
                    setActiveUndoToken(secondMeta.undoToken);
                  }
                  setIsStreaming(false);
                },
                onError: () => {
                  setIsStreaming(false);
                },
              }
            );
            return;
          }

          if (meta.undoToken) {
            setActiveUndoToken(meta.undoToken);
          }
          setMessages(prev =>
            prev.map(m => (m.id === opsMsgId ? { ...m, undoToken: meta.undoToken } : m))
          );
          setIsStreaming(false);
        },
        onError: (err) => {
          console.error('Stream error:', err);
          setMessages(prev =>
            prev.map(m =>
              m.id === opsMsgId
                ? { ...m, text: accumulatedText || "Connection interrupted. Please retry in a moment." }
                : m
            )
          );
          setIsStreaming(false);
        },
      }
    );
  };

  const handleUndo = async (token: string) => {
    try {
      await aiService.undoAction({ undoToken: token });
      setUndoStatus('Action reverted successfully.');
      setActiveUndoToken(null);
      setTimeout(() => setUndoStatus(null), 4000);
    } catch {
      setUndoStatus('Failed to undo action.');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-2xs" onClick={onClose} />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[460px] bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl z-50 flex flex-col font-sans select-none"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Ops
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Operational Manager
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 font-mono">
                Role: {currentUser.role} • Google GenAI Cascade
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Undo Floating Banner */}
        {activeUndoToken && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs font-mono">
            <span className="text-amber-800 dark:text-amber-300 font-bold">Action applied.</span>
            <button
              onClick={() => handleUndo(activeUndoToken)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 hover:bg-amber-300 transition-colors font-bold text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              Undo Action
            </button>
          </div>
        )}

        {undoStatus && (
          <div className="p-2.5 bg-neutral-900 text-white text-center text-xs font-mono">
            {undoStatus}
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] p-3 rounded-2xl ${
                  m.sender === 'user'
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-tr-xs'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-tl-xs border border-neutral-200/60 dark:border-neutral-700/60'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>

                {/* Staged Actions Badges */}
                {m.actions && m.actions.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-neutral-200 dark:border-neutral-700 space-y-1">
                    {m.actions.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Executed: {act.tool}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dry Run Preview Trigger Card */}
                {m.dryRunDiff && (
                  <div className="mt-3 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-neutral-100">
                      <Layers className="w-4 h-4 text-neutral-500" />
                      <span>{m.dryRunDiff.summary}</span>
                    </div>
                    <button
                      onClick={() => setActiveDiff(m.dryRunDiff!)}
                      className="w-full py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-[11px] hover:bg-neutral-800 transition-colors"
                    >
                      Review Diff Preview ({m.dryRunDiff.affectedCount} items) →
                    </button>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-mono text-neutral-400 mt-1 px-1">
                {m.timestamp}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
          <button
            onClick={() => handleSend("Who's overbooked this week?")}
            className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors shrink-0"
          >
            Workload Check
          </button>
          <button
            onClick={() => handleSend("What's blocking the team right now?")}
            className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors shrink-0"
          >
            Active Blockers
          </button>
          <button
            onClick={() => handleSend("Analyze Spider Web dependencies for delays")}
            className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors shrink-0"
          >
            Dependencies
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Ops or enter an action (Cmd+J)..."
              disabled={isStreaming}
              className="flex-1 px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="p-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-white disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </motion.aside>

      {/* Render Diff Preview Modal if active */}
      {activeDiff && (
        <DiffPreviewModal
          diff={activeDiff}
          userRole={currentUser.role}
          onConfirmed={(undoToken) => {
            setActiveUndoToken(undoToken);
            setActiveDiff(null);
            setMessages(prev => [
              ...prev,
              {
                id: `ops_confirmed_${Date.now()}`,
                sender: 'ops',
                text: `Dry-run changes confirmed and applied successfully. 1-click Undo is active for the next 30 seconds.`,
                undoToken,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }}
          onCancelled={() => setActiveDiff(null)}
        />
      )}
    </>
  );
};
