import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Bot, X, Send, RotateCcw, Layers,
  ChevronDown, ChevronRight, Check, Loader2, Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { aiService, type DryRunDiff, type ActionCall } from '../../services/aiService';
import { executeOpsTool, type ToolExecutionResult } from '../../services/opsToolExecutor';
import { DiffPreviewModal } from './DiffPreviewModal';
import { UserAvatar } from './UserAvatar';

interface ActionStep {
  id: string;
  tool: string;
  label: string;
  status: 'running' | 'success' | 'failed';
  time: string;
}

interface ResultChip {
  id: string;
  title: string;
  status: string;
  dueDate?: string;
  priority?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'ops';
  text: string;
  actionSteps?: ActionStep[];
  resultChips?: ResultChip[];
  dryRunDiff?: DryRunDiff;
  undoToken?: string;
  timestamp: string;
  isStreaming?: boolean;
}

interface OpsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper to reveal words smoothly without breaking characters mid-word
const getNextSlice = (current: string, target: string, wordsCount: number = 1): string => {
  if (current.length >= target.length) return target;
  const remaining = target.slice(current.length);
  let wordsSeen = 0;
  let inWord = false;
  let splitIndex = remaining.length;

  for (let i = 0; i < remaining.length; i++) {
    const isSpace = /\s/.test(remaining[i]);
    if (!isSpace && !inWord) {
      inWord = true;
      wordsSeen++;
    } else if (isSpace && inWord) {
      inWord = false;
      if (wordsSeen >= wordsCount) {
        while (i + 1 < remaining.length && /\s/.test(remaining[i + 1])) {
          i++;
        }
        splitIndex = i + 1;
        break;
      }
    }
  }

  return current + remaining.slice(0, splitIndex);
};

// Helper to format non-technical, human-readable labels for actions in the timeline
const formatActionLabel = (act: ActionCall): string => {
  const p = act.parameters || {};
  switch (act.tool) {
    case 'query_team_state':
      return 'Checking team status and roster';
    case 'analyze_dependencies':
      return 'Analyzing task dependencies';
    case 'audit_sprint':
      return 'Auditing sprint progress';
    case 'google_search':
      return p.query ? `Searching Google for "${p.query}"` : 'Searching Google';
    case 'create_task':
      return p.title ? `Creating task "${p.title}"` : 'Creating new task';
    case 'update_task': {
      const target = p.title || p.task_id || '';
      return target ? `Updating task "${target}"` : 'Updating task';
    }
    case 'resolve_blocker': {
      const target = p.title || p.task_id || '';
      return target ? `Clearing blocker on "${target}"` : 'Clearing blocker';
    }
    case 'reschedule_tasks':
      return 'Adjusting project timeline';
    case 'batch_update_tasks':
      return 'Updating multiple tasks';
    case 'reassign_workload':
      return 'Rebalancing team workload';
    case 'archive_stale_entities':
      return 'Archiving stale items';
    case 'delete_project':
      return 'Archiving project';
    case 'delete_goal':
      return 'Archiving goal';
    default:
      return act.tool
        .replace(/_/g, ' ')
        .replace(/^(query|get|fetch) /i, 'Checking ')
        .replace(/^(create|add) /i, 'Creating ')
        .replace(/^(update|modify) /i, 'Updating ')
        .replace(/\b\w/g, l => l.toUpperCase());
  }
};

export const OpsDrawer: React.FC<OpsDrawerProps> = ({ isOpen, onClose }) => {
  const appContext = useApp();
  const {
    currentUser,
    currentOrgSlug,
    currentOrg,
    users,
    teams,
    projects,
    tasks,
    goals,
    eodEntries,
    pushPanel,
    updateTask,
  } = appContext;
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ops',
      text: "Ops operational partner ready. What can I help unblock, schedule, or organize for the team today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeDiff, setActiveDiff] = useState<DryRunDiff | null>(null);
  const [activeUndoToken, setActiveUndoToken] = useState<string | null>(null);
  const [undoStatus, setUndoStatus] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string>(() => 'sess_' + Math.random().toString(36).substring(2, 10));

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Typewriter animation queue
  const typewriterTargetRef = useRef<{
    msgId: string;
    text: string;
    done: boolean;
    undoToken?: string;
  } | null>(null);
  const typewriterCurrentRef = useRef<string>('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Smooth Typewriter Loop: reveals text word-by-word at ~28ms cadence
  useEffect(() => {
    const timer = setInterval(() => {
      const target = typewriterTargetRef.current;
      if (!target) return;

      const current = typewriterCurrentRef.current;
      if (current.length < target.text.length) {
        const remainingLen = target.text.length - current.length;
        // Paced typing: 1 word at a time for natural rhythm, catching up slightly if server sent a large paragraph
        const wordsToTake = remainingLen > 300 ? 3 : remainingLen > 120 ? 2 : 1;
        const nextText = getNextSlice(current, target.text, wordsToTake);
        typewriterCurrentRef.current = nextText;

        setMessages(prev =>
          prev.map(m =>
            m.id === target.msgId
              ? { ...m, text: nextText, isStreaming: true }
              : m
          )
        );
      } else if (target.done) {
        // Stream completed and typewriter caught up
        if (target.undoToken) {
          setActiveUndoToken(target.undoToken);
        }
        setMessages(prev =>
          prev.map(m =>
            m.id === target.msgId
              ? { ...m, text: target.text, isStreaming: false, undoToken: target.undoToken }
              : m
          )
        );
        setIsStreaming(false);
        typewriterTargetRef.current = null;
        typewriterCurrentRef.current = '';
      }
    }, 28);

    return () => clearInterval(timer);
  }, []);

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

  // Set-based deduplication for interactive result chips
  const extractResultChips = (
    actions: ActionCall[],
    results: ToolExecutionResult[]
  ): ResultChip[] => {
    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();
    const chips: ResultChip[] = [];

    for (let i = 0; i < actions.length; i++) {
      const act = actions[i];
      const res = results[i];

      // Only task-mutating actions (create, update, resolve_blocker) should produce result chips
      if (!['create_task', 'update_task', 'resolve_blocker'].includes(act.tool)) {
        continue;
      }

      if (res && res.status === 'success') {
        const title = res.data?.title || act.parameters?.title || '';
        const taskId = res.data?.taskId || act.parameters?.task_id || '';

        const matchedTask = tasks.find(
          t => (taskId && t.id === taskId) || (title && t.title.toLowerCase() === title.toLowerCase())
        );

        const finalId = matchedTask?.id || taskId;
        const finalTitle = matchedTask?.title || title;

        // Skip invalid, empty, or generic fallback titles like "Task"
        if (!finalTitle || !finalTitle.trim() || finalTitle.trim().toLowerCase() === 'task') {
          continue;
        }

        const normTitle = finalTitle.toLowerCase().trim();
        if (finalId && seenIds.has(finalId)) continue;
        if (seenTitles.has(normTitle)) continue;

        if (finalId) seenIds.add(finalId);
        seenTitles.add(normTitle);

        chips.push({
          id: finalId || `task_${Date.now()}`,
          title: finalTitle,
          status: matchedTask?.status || 'Todo',
          dueDate: matchedTask?.dueDate || res.data?.dueDate || act.parameters?.due_date,
          priority: matchedTask?.priority || act.parameters?.priority,
        });
      }
    }

    return chips;
  };

  const handleSend = async (customText?: string) => {
    const messageText = (customText || input).trim();
    if (!messageText || isStreaming) return;

    const userMsgId = `user_${Date.now()}`;
    const opsMsgId = `ops_${Date.now()}`;

    // Finalize any existing typewriter target before starting a new turn
    if (typewriterTargetRef.current) {
      const prevTarget = typewriterTargetRef.current;
      setMessages(prev =>
        prev.map(m =>
          m.id === prevTarget.msgId
            ? { ...m, text: prevTarget.text, isStreaming: false }
            : m
        )
      );
      typewriterTargetRef.current = null;
    }
    typewriterCurrentRef.current = '';

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
        isStreaming: true,
        actionSteps: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    if (!customText) setInput('');
    setIsStreaming(true);

    // Productivity metrics calculation across entire team
    const completedTasksByMember: Record<string, number> = {};
    const activeTasksByMember: Record<string, number> = {};
    const hoursByMember: Record<string, number> = {};
    (tasks || []).forEach(t => {
      (t.assigneeIds || []).forEach(uid => {
        if (t.status === 'Done') {
          completedTasksByMember[uid] = (completedTasksByMember[uid] || 0) + 1;
        } else {
          activeTasksByMember[uid] = (activeTasksByMember[uid] || 0) + 1;
        }
        hoursByMember[uid] = (hoursByMember[uid] || 0) + (t.estimatedHours || 0);
      });
    });

    const pulsesByMember: Record<string, number> = {};
    (eodEntries || []).forEach(e => {
      if (e.userId) {
        pulsesByMember[e.userId] = (pulsesByMember[e.userId] || 0) + 1;
      }
    });

    const memberProductivity = (users || []).map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      capacityHours: u.capacityHoursPerWeek || 40,
      activeHours: hoursByMember[u.id] || 0,
      completedTasks: completedTasksByMember[u.id] || 0,
      activeTasks: activeTasksByMember[u.id] || 0,
      dailyPulsesSubmitted: pulsesByMember[u.id] || 0,
    })).sort((a, b) => (b.completedTasks + b.dailyPulsesSubmitted) - (a.completedTasks + a.dailyPulsesSubmitted));

    const topProductiveMember = memberProductivity[0]?.name || 'N/A';

    // Time horizon groupings
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const endOfWeek = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const tasksToday = (tasks || []).filter(t => t.dueDate === todayStr);
    const tasksThisWeek = (tasks || []).filter(t => t.dueDate && t.dueDate <= endOfWeek && t.dueDate >= todayStr);
    const tasksThisMonth = (tasks || []).filter(t => t.dueDate && t.dueDate <= endOfMonth);
    const myTasks = (tasks || []).filter(t => (t.assigneeIds || []).includes(currentUser.id));
    const blockedTasks = (tasks || []).filter(t => t.status === 'Blocked' || !!t.blockedReason);

    const contextPayload = {
      orgSlug: currentOrgSlug,
      orgName: currentOrg?.name || currentOrgSlug,
      userName: currentUser.name,
      userRole: currentUser.role,
      todayDate: todayStr,
      
      // Complete Team Roster & Productivity Leaderboard
      teamRoster: (users || []).map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        capacityHours: u.capacityHoursPerWeek || 40,
      })),
      teams: (teams || []).map(tm => ({
        id: tm.id,
        name: tm.name,
        memberNames: (users || []).filter(u => tm.memberIds?.includes(u.id)).map(u => u.name),
      })),
      productivityRanking: memberProductivity,
      topProductiveMember,

      // Strategic Goals & Key Results
      goals: (goals || []).map(g => {
        const prog = g.keyResults?.length
          ? Math.round(
              g.keyResults.reduce(
                (acc, kr) => acc + (kr.targetValue ? (kr.currentValue / kr.targetValue) * 100 : 0),
                0
              ) / g.keyResults.length
            )
          : 0;
        return {
          id: g.id,
          title: g.title,
          status: g.status,
          progress: prog,
          keyResults: (g.keyResults || []).map(
            kr => `${kr.title} (${kr.currentValue}/${kr.targetValue} ${kr.unit || ''})`
          ),
        };
      }),

      // Projects
      projects: (projects || []).map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        targetDate: p.targetEndDate || p.startDate,
      })),

      // Recent Daily Pulses
      recentDailyPulses: (eodEntries || []).slice(0, 15).map(e => ({
        userName: e.userName,
        mood: e.energyIndex >= 4 ? 'High Energy' : e.energyIndex <= 2 ? 'Low Energy' : 'Good Energy',
        whatWentWell: (e.accomplishments || []).join('; '),
        blockers: e.blockers,
      })),

      // Task Summary Analytics
      taskSummary: {
        total: (tasks || []).length,
        todo: (tasks || []).filter(t => t.status === 'Todo').length,
        inProgress: (tasks || []).filter(t => t.status === 'InProgress').length,
        blocked: blockedTasks.length,
        done: (tasks || []).filter(t => t.status === 'Done').length,
        dueTodayCount: tasksToday.length,
        dueThisWeekCount: tasksThisWeek.length,
        dueThisMonthCount: tasksThisMonth.length,
        myTasksCount: myTasks.length,
      },

      // Active Blockers with details
      activeBlockers: blockedTasks.map(t => ({
        id: t.id,
        title: t.title,
        assignee: (users || []).find(u => (t.assigneeIds || []).includes(u.id))?.name || 'Unassigned',
        reason: t.blockedReason || 'Flagged as blocked',
      })),

      // Current User Tasks with subtasks
      myTasks: myTasks.slice(0, 15).map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        dueDate: t.dueDate,
        priority: t.priority,
        subtasks: (t.subtasks || []).map(s => `${s.title} [${s.done ? 'Done' : 'Pending'}]`),
      })),

      // Active Tasks in Scope
      activeTasks: (tasks || []).slice(0, 30).map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        assigneeName: (users || []).find(u => (t.assigneeIds || []).includes(u.id))?.name || 'Unassigned',
        dueDate: t.dueDate,
        priority: t.priority,
        subtasksCount: t.subtasks?.length || 0,
      })),
    };

    // Extract conversation history for multi-turn grounded context
    const conversationHistory = messages
      .filter(m => m.text && m.text.trim().length > 0)
      .slice(-8)
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        text: m.text,
      }));

    let accumulatedText = '';
    const stagedActions: ActionCall[] = [];
    const timelineSteps: ActionStep[] = [];

    await aiService.streamChatMessage(
      {
        message: messageText,
        context: contextPayload,
        userRole: currentUser.role,
        orgSlug: currentOrgSlug,
        sessionId: activeSessionId,
        history: conversationHistory,
      },
      {
        onToken: (token: string) => {
          accumulatedText += token;
          typewriterTargetRef.current = {
            msgId: opsMsgId,
            text: accumulatedText,
            done: false,
          };
        },
        onAction: (act: ActionCall) => {
          stagedActions.push(act);
          const stepLabel = formatActionLabel(act);

          timelineSteps.push({
            id: act.id,
            tool: act.tool,
            label: stepLabel,
            status: 'running',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });

          setMessages(prev =>
            prev.map(m =>
              m.id === opsMsgId ? { ...m, actionSteps: [...timelineSteps] } : m
            )
          );
        },
        onDryRun: (diff: DryRunDiff) => {
          setActiveDiff(diff);
          setMessages(prev =>
            prev.map(m => (m.id === opsMsgId ? { ...m, dryRunDiff: diff } : m))
          );
        },
        onDone: async (meta) => {
          if (meta.sessionId) {
            setActiveSessionId(meta.sessionId);
          }

          if (meta.status === 'requires_tools' && stagedActions.length > 0) {
            // Turn 1: Client Tool Execution Loop
            const toolResults: ToolExecutionResult[] = [];
            for (let i = 0; i < stagedActions.length; i++) {
              const act = stagedActions[i];
              const res = await executeOpsTool(act, appContext);
              toolResults.push(res);
              if (timelineSteps[i]) {
                timelineSteps[i].status = res.status === 'success' ? 'success' : 'failed';
              }
            }

            // Extract deduplicated interactive result cards
            const resultChips = extractResultChips(stagedActions, toolResults);

            setMessages(prev =>
              prev.map(m =>
                m.id === opsMsgId
                  ? { ...m, actionSteps: [...timelineSteps], resultChips }
                  : m
              )
            );

            // Turn 2: Grounded confirmation
            let secondLegText = '';
            typewriterCurrentRef.current = '';
            await aiService.streamChatMessage(
              {
                sessionId: meta.sessionId || activeSessionId,
                toolResults,
                userRole: currentUser.role,
                orgSlug: currentOrgSlug,
                context: contextPayload,
                history: conversationHistory,
              },
              {
                onToken: (token: string) => {
                  secondLegText += token;
                  typewriterTargetRef.current = {
                    msgId: opsMsgId,
                    text: secondLegText,
                    done: false,
                  };
                },
                onDone: (secondMeta) => {
                  if (secondMeta.sessionId) {
                    setActiveSessionId(secondMeta.sessionId);
                  }
                  typewriterTargetRef.current = {
                    msgId: opsMsgId,
                    text: secondLegText,
                    done: true,
                    undoToken: secondMeta.undoToken,
                  };
                },
                onError: () => {
                  typewriterTargetRef.current = null;
                  setMessages(prev =>
                    prev.map(m => (m.id === opsMsgId ? { ...m, isStreaming: false } : m))
                  );
                  setIsStreaming(false);
                },
              }
            );
            return;
          }

          // Direct message without tools
          typewriterTargetRef.current = {
            msgId: opsMsgId,
            text: accumulatedText,
            done: true,
            undoToken: meta.undoToken,
          };
        },
        onError: (err) => {
          console.error('Stream error:', err);
          typewriterTargetRef.current = null;
          setMessages(prev =>
            prev.map(m =>
              m.id === opsMsgId
                ? {
                    ...m,
                    isStreaming: false,
                    text: accumulatedText || "Connection interrupted. Please retry in a moment.",
                  }
                : m
            )
          );
          setIsStreaming(false);
        },
      }
    );
  };

  const handleToggleTask = (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Done' ? 'Todo' : 'Done';
    updateTask(taskId, { status: nextStatus as any });
    setMessages(prev =>
      prev.map(m => ({
        ...m,
        resultChips: m.resultChips?.map(c =>
          c.id === taskId ? { ...c, status: nextStatus } : c
        ),
      }))
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
                  Operational Partner
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 font-mono">
                Role: {currentUser.role} • Client-Staged Execution
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
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs font-sans">
          {messages.map((m) => {
            if (m.sender === 'user') {
              return (
                <div key={m.id} className="flex items-start justify-end gap-2.5">
                  <div className="flex flex-col items-end max-w-[80%]">
                    <div className="px-4 py-2.5 rounded-2xl rounded-tr-xs bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-2xs">
                      <p className="leading-relaxed whitespace-pre-wrap text-[13px]">
                        {m.text}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 mt-1 px-1">
                      {m.timestamp}
                    </span>
                  </div>
                  <div className="shrink-0 mt-0.5">
                    <UserAvatar
                      name={currentUser?.name || 'User'}
                      avatarUrl={currentUser?.avatarUrl}
                      size="sm"
                    />
                  </div>
                </div>
              );
            }

            // Ops Agent message (NO chat bubble, direct borderless text with AI profile avatar)
            return (
              <div key={m.id} className="flex items-start justify-start gap-3 w-full">
                {/* AI Profile Avatar */}
                <div className="w-7 h-7 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>

                {/* Agent Content Body */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Collapsible Action Timeline */}
                  {m.actionSteps && m.actionSteps.length > 0 && (
                    <CollapsibleActionTimeline
                      steps={m.actionSteps}
                      isWorking={m.isStreaming}
                    />
                  )}

                  {/* Thinking State when waiting for first token */}
                  {m.isStreaming && !m.text.trim() && (!m.actionSteps || m.actionSteps.length === 0) ? (
                    <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500 py-1">
                      <span className="flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce" />
                      </span>
                      <span className="italic font-mono text-[11px]">Ops is thinking...</span>
                    </div>
                  ) : m.text ? (
                    <div className="text-[13px] leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap font-sans">
                      {m.text}
                      {m.isStreaming && (
                        <span className="inline-block animate-pulse font-mono text-neutral-400 dark:text-neutral-500 font-bold ml-1">
                          ▊
                        </span>
                      )}
                    </div>
                  ) : null}

                  {/* Interactive Result Chips Under Message */}
                  {m.resultChips && m.resultChips.length > 0 && (
                    <div className="pt-1 space-y-1.5">
                      {m.resultChips.map(chip => (
                        <InteractiveResultChip
                          key={chip.id}
                          chip={chip}
                          onToggleStatus={handleToggleTask}
                          onOpenDetail={(id) => {
                            pushPanel({ type: 'task', id });
                            onClose();
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Dry Run Preview Trigger Card */}
                  {m.dryRunDiff && (
                    <div className="mt-2 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 space-y-2">
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

                  <div className="text-[10px] font-mono text-neutral-400 pt-0.5">
                    {m.timestamp}
                  </div>
                </div>
              </div>
            );
          })}
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

// Collapsible Action Timeline Component
const CollapsibleActionTimeline: React.FC<{
  steps: ActionStep[];
  isWorking?: boolean;
}> = ({ steps, isWorking }) => {
  const [isExpanded, setIsExpanded] = useState(isWorking ?? false);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="mb-2 font-mono text-[11px] bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/60 rounded-xl p-2.5">
      <button
        onClick={() => setIsExpanded(prev => !prev)}
        className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors cursor-pointer select-none w-full"
      >
        <span className="font-semibold">Actions ({steps.length})</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="mt-2 pl-2.5 border-l border-neutral-200 dark:border-neutral-700 space-y-2">
          {steps.map((step, idx) => (
            <div key={step.id || idx} className="relative flex items-start gap-2">
              <div className="mt-0.5 -ml-[15px] p-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800">
                {step.status === 'running' ? (
                  <Loader2 className="w-2.5 h-2.5 animate-spin text-neutral-600 dark:text-neutral-300" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </div>
              <div className="min-w-0 flex-1 flex items-baseline justify-between gap-2">
                <span className="text-neutral-700 dark:text-neutral-300 truncate">
                  {step.label}
                </span>
                <span className="text-[10px] text-neutral-400 shrink-0">{step.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Interactive Result Chip Component
const InteractiveResultChip: React.FC<{
  chip: ResultChip;
  onToggleStatus: (id: string, currentStatus: string) => void;
  onOpenDetail: (id: string) => void;
}> = ({ chip, onToggleStatus, onOpenDetail }) => {
  const isDone = chip.status === 'Done';

  return (
    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-2xs group">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleStatus(chip.id, chip.status);
        }}
        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
          isDone
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-500'
        }`}
        title={isDone ? 'Mark as Todo' : 'Mark as Done'}
      >
        {isDone && <Check className="w-2.5 h-2.5" />}
      </button>

      <div
        onClick={() => onOpenDetail(chip.id)}
        className="flex-1 min-w-0 flex items-center justify-between gap-2 cursor-pointer"
      >
        <span
          className={`text-xs font-semibold truncate ${
            isDone
              ? 'line-through text-neutral-400 dark:text-neutral-500'
              : 'text-neutral-800 dark:text-neutral-200'
          }`}
        >
          {chip.title}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {chip.dueDate && (
            <span className="text-[10px] font-mono text-neutral-400 px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
              {chip.dueDate}
            </span>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors" />
        </div>
      </div>
    </div>
  );
};
