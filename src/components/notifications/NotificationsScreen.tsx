import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { 
  AlertTriangle, UserCheck, AtSign, FileText, 
  Check, ArrowLeft, FolderKanban, MessageSquare, ExternalLink, Network, Bell, CheckCheck
} from 'lucide-react';

export const NotificationsScreen: React.FC = () => {
  const { 
    notifications, 
    tasks, 
    projects, 
    eodEntries, 
    currentUser, 
    pushPanel, 
    updateTask,
    markNotificationAsRead, 
    markAllNotificationsAsRead 
  } = useApp();

  const [viewState, setViewState] = useState<'center' | 'blocker_detail'>('center');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'ASSIGNMENTS' | 'BLOCKERS' | 'MENTIONS'>('ALL');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Comment state for blocker detail
  const [commentText, setCommentText] = useState('');
  const [activityLogs, setActivityLogs] = useState<{ id: string; user: string; time: string; text: string }[]>([]);

  // Format relative timestamp
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Recently';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  // Build unified list of real items from database
  interface UnifiedItem {
    id: string;
    itemType: 'DB_NOTIFICATION' | 'TASK_BLOCKER' | 'EOD_BLOCKER' | 'TASK_ASSIGNMENT';
    category: 'BLOCKERS' | 'ASSIGNMENTS' | 'MENTIONS' | 'SYSTEM' | 'REPORTS';
    title: string;
    subtitle?: string;
    tag?: string;
    time: string;
    unread: boolean;
    senderName?: string;
    senderAvatar?: string;
    rawTask?: any;
    rawNotif?: any;
    rawEod?: any;
  }

  const unifiedItems: UnifiedItem[] = [];

  // 1. Real Notifications from DB
  (notifications || []).forEach(n => {
    let cat: UnifiedItem['category'] = 'SYSTEM';
    if (n.type === 'blocker_flagged') cat = 'BLOCKERS';
    else if (n.type === 'task_assignment') cat = 'ASSIGNMENTS';
    else if (n.type === 'mention') cat = 'MENTIONS';
    else if (n.type === 'report_ready') cat = 'REPORTS';

    unifiedItems.push({
      id: `notif-${n.id}`,
      itemType: 'DB_NOTIFICATION',
      category: cat,
      title: n.title,
      subtitle: n.body,
      tag: n.organization?.name || 'Workspace',
      time: formatTime(n.createdAt),
      unread: !n.isRead,
      senderName: n.sender?.fullName || 'System',
      senderAvatar: n.sender?.avatarUrl,
      rawNotif: n,
    });
  });

  // 2. Real Blocked / At Risk Tasks from current workspace
  tasks
    .filter(t => t.status === 'Blocked' || t.status === 'AtRisk')
    .forEach(t => {
      const proj = projects.find(p => p.id === t.projectId);
      unifiedItems.push({
        id: `task-block-${t.id}`,
        itemType: 'TASK_BLOCKER',
        category: 'BLOCKERS',
        title: `Task Blocked: "${t.title}"`,
        subtitle: t.blockedReason || t.description || 'Active blocker requires team lead / manager intervention.',
        tag: proj?.name || 'Project Task',
        time: formatTime(t.updatedAt || t.createdAt),
        unread: true,
        senderName: 'Assigned Lead',
        rawTask: t,
      });
    });

  // 3. Real Flagged EOD Submissions with blockers
  eodEntries
    .filter(e => e.flaggedToManager || (e.blockers && e.blockers.trim().length > 0))
    .forEach(e => {
      unifiedItems.push({
        id: `eod-${e.id}`,
        itemType: 'EOD_BLOCKER',
        category: 'BLOCKERS',
        title: `Daily Pulse Blocker by ${e.userName || 'Team Member'}`,
        subtitle: e.blockers,
        tag: e.teamName || 'Daily Check-in',
        time: e.date || 'Today',
        unread: true,
        senderName: e.userName,
        senderAvatar: e.userAvatar,
        rawEod: e,
      });
    });

  // 4. Real Assigned Tasks for current user
  tasks
    .filter(t => t.assigneeIds && t.assigneeIds.includes(currentUser.id))
    .forEach(t => {
      const proj = projects.find(p => p.id === t.projectId);
      unifiedItems.push({
        id: `task-assign-${t.id}`,
        itemType: 'TASK_ASSIGNMENT',
        category: 'ASSIGNMENTS',
        title: `Task Assigned: "${t.title}"`,
        subtitle: t.description || `Priority: ${t.priority} • Status: ${t.status}`,
        tag: proj?.name || 'Assigned Task',
        time: formatTime(t.createdAt),
        unread: t.status === 'Todo',
        senderName: 'Workspace',
        rawTask: t,
      });
    });

  // Filter items
  const filteredItems = unifiedItems.filter(item => {
    if (activeFilter === 'UNREAD') return item.unread;
    if (activeFilter === 'ASSIGNMENTS') return item.category === 'ASSIGNMENTS';
    if (activeFilter === 'BLOCKERS') return item.category === 'BLOCKERS';
    if (activeFilter === 'MENTIONS') return item.category === 'MENTIONS';
    return true;
  });

  // Selected item selection
  const currentSelected = filteredItems.find(i => i.id === selectedItemId) || filteredItems[0] || null;

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setActivityLogs(prev => [
      ...prev,
      { id: Date.now().toString(), user: currentUser.name, time: 'Just now', text: commentText.trim() }
    ]);
    setCommentText('');
  };

  const handleAcknowledgeAndAssign = () => {
    if (currentSelected?.rawTask) {
      updateTask(currentSelected.rawTask.id, {
        assigneeIds: [currentUser.id],
        status: 'InProgress'
      });
      alert(`Task "${currentSelected.rawTask.title}" has been assigned to you and set to In Progress.`);
    } else if (currentSelected?.rawNotif) {
      markNotificationAsRead(currentSelected.rawNotif.id);
      alert('Alert acknowledged and marked as read.');
    }
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* 1. NOTIFICATION CENTER VIEW */}
      {viewState === 'center' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Notifications</h1>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">Manage and triage system alerts from your live database.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono">
              {/* Filter Pills */}
              <div className="flex items-center gap-1">
                {(['ALL', 'UNREAD', 'ASSIGNMENTS', 'BLOCKERS', 'MENTIONS'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => {
                      setActiveFilter(f);
                      setSelectedItemId(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeFilter === f 
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs' 
                        : 'border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Mark All Read Button */}
              {unifiedItems.some(i => i.unread) && (
                <button
                  onClick={() => markAllNotificationsAsRead()}
                  className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark All Read</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Grid: Left Notification List + Right Detail Card */}
          {filteredItems.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mx-auto flex items-center justify-center">
                <Bell className="w-6 h-6 text-neutral-500" />
              </div>
              <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">All Caught Up!</div>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto font-mono">
                No active notifications or blockers found under the <span className="font-bold">{activeFilter}</span> filter. New assignments and blocker flags will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left Notification Cards List (2 Cols) */}
              <div className="lg:col-span-2 space-y-3 font-mono">
                {filteredItems.map(item => {
                  const isSelected = (currentSelected?.id === item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedItemId(item.id);
                        if (item.rawNotif && !item.rawNotif.isRead) {
                          markNotificationAsRead(item.rawNotif.id);
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative space-y-2 ${
                        isSelected 
                          ? 'border-2 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-sm' 
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 hover:border-neutral-400'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <div className="flex items-center gap-1.5">
                          {item.category === 'BLOCKERS' && (
                            <span className="font-bold text-red-600 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> CRITICAL BLOCKER
                            </span>
                          )}
                          {item.category === 'ASSIGNMENTS' && (
                            <span className="font-bold text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                              <UserCheck className="w-3 h-3" /> TASK ASSIGNMENT
                            </span>
                          )}
                          {item.category === 'MENTIONS' && (
                            <span className="font-bold text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                              <AtSign className="w-3 h-3" /> MENTION
                            </span>
                          )}
                          {item.category === 'REPORTS' && (
                            <span className="font-bold text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                              <FileText className="w-3 h-3" /> REPORT READY
                            </span>
                          )}
                          {item.category === 'SYSTEM' && (
                            <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <Bell className="w-3 h-3" /> SYSTEM ALERT
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-neutral-400">
                          <span>{item.time}</span>
                          {item.unread && <span className="w-2 h-2 rounded-full bg-red-600" />}
                        </div>
                      </div>

                      <h3 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans leading-snug">
                        {item.title}
                      </h3>

                      {item.subtitle && (
                        <p className="text-[11px] text-neutral-500 font-sans leading-relaxed line-clamp-2">
                          {item.subtitle}
                        </p>
                      )}

                      {item.tag && (
                        <div className="pt-1">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                            {item.tag}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Right Detailed Triage Card (3 Cols) */}
              {currentSelected && (
                <div className="lg:col-span-3 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start pb-3 border-b border-neutral-100 dark:border-neutral-800 font-mono">
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                          {currentSelected.category === 'BLOCKERS' ? <AlertTriangle className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                          {currentSelected.category}
                        </div>
                        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-sans tracking-tight">
                          {currentSelected.title}
                        </h2>
                        <p className="text-xs text-neutral-400">
                          From {currentSelected.senderName || 'Workspace'} • {currentSelected.time}
                        </p>
                      </div>
                    </div>

                    {/* Description Box */}
                    <div className="space-y-1.5 font-mono">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Description &amp; Details</span>
                      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 font-mono text-[11px] leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
                        {currentSelected.subtitle || 'No additional description provided.'}
                      </div>
                    </div>

                    {/* Impacted Entities */}
                    <div className="space-y-1.5 font-mono">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Context / Workspace Entity</span>
                      <div className="flex flex-wrap items-center gap-2">
                        {currentSelected.tag && (
                          <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold border border-neutral-200 dark:border-neutral-700 flex items-center gap-1.5">
                            <FolderKanban className="w-3 h-3 text-neutral-400" /> {currentSelected.tag}
                          </span>
                        )}
                        {currentSelected.rawTask && (
                          <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold border border-neutral-200 dark:border-neutral-700 flex items-center gap-1.5">
                            <FileText className="w-3 h-3 text-neutral-400" /> Priority: {currentSelected.rawTask.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-end gap-3 font-mono">
                    <button
                      onClick={handleAcknowledgeAndAssign}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      Acknowledge &amp; Assign to Self
                    </button>
                    {currentSelected.rawTask && (
                      <button
                        onClick={() => pushPanel({ type: 'task', id: currentSelected.rawTask.id })}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        View Ticket in Context
                      </button>
                    )}
                    {currentSelected.category === 'BLOCKERS' && (
                      <button
                        onClick={() => setViewState('blocker_detail')}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        Blocker Resolution Center
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. BLOCKER ALERT DETAIL RESOLUTION VIEW */}
      {viewState === 'blocker_detail' && (
        <div className="space-y-6">
          <div className="font-mono text-xs pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <button 
              onClick={() => setViewState('center')}
              className="text-xs text-neutral-500 hover:text-black dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Notification Center
            </button>
          </div>

          {/* Header Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-center gap-1 w-fit">
                  ! CRITICAL BLOCKER ALERT
                </span>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-sans tracking-tight">
                  {currentSelected?.title || 'Blocker Alert'}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    if (currentSelected?.rawTask) {
                      updateTask(currentSelected.rawTask.id, { status: 'InProgress', blockedReason: '' });
                    }
                    alert('Blocker marked as resolved!');
                    setViewState('center');
                  }} 
                  className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Mark as Resolved
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Source Entity</span>
                <div className="font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                  {currentSelected?.title || 'Workspace Entity'}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Context / Tag</span>
                <div className="font-bold text-neutral-900 dark:text-neutral-100 mt-0.5 flex items-center gap-1">
                  <FolderKanban className="w-3.5 h-3.5 text-neutral-400" /> {currentSelected?.tag || 'Workspace'}
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid: Blocker Reason + Recent Activity Log */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
            {/* Left Column (2 Cols): Red Dashed Blocker Box */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-dashed border-red-500 shadow-sm space-y-3 relative overflow-hidden">
                <div className="w-1.5 h-full bg-red-600 absolute left-0 top-0" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" /> Blocker Details
                </h3>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 font-sans leading-relaxed pl-1">
                  {currentSelected?.subtitle || 'No blocker details reported.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {currentSelected?.rawTask && (
                  <button 
                    onClick={() => pushPanel({ type: 'task', id: currentSelected.rawTask.id })}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View Task Detail
                  </button>
                )}
                {currentSelected?.rawTask?.projectId && (
                  <button 
                    onClick={() => pushPanel({ type: 'relationship-map', projectId: currentSelected.rawTask.projectId })}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Network className="w-3.5 h-3.5" /> Open Relationship Map
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Recent Activity Feed + Comment Form */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-neutral-500" /> Resolution Log
              </h3>

              <div className="space-y-3 font-sans border-b border-neutral-100 dark:border-neutral-800 pb-3">
                {activityLogs.length === 0 ? (
                  <div className="text-neutral-400 text-xs py-2 italic font-mono">
                    No resolution notes added yet.
                  </div>
                ) : (
                  activityLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-3">
                      <UserAvatar name={log.user} size="xs" className="mt-0.5" />
                      <div className="space-y-0.5 flex-1">
                        <div className="flex justify-between items-center text-xs font-bold text-neutral-900 dark:text-neutral-100">
                          <span>{log.user}</span>
                          <span className="text-[10px] font-mono text-neutral-400 font-normal">{log.time}</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 leading-relaxed">
                          {log.text}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handlePostComment} className="space-y-2 font-mono">
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add resolution notes..."
                  className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs focus:outline-none"
                />
                <div className="flex justify-end">
                  <button type="submit" className="px-4 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-sm cursor-pointer">
                    Post Note
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
