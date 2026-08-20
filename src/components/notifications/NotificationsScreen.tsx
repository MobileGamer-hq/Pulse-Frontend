import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { 
  AlertTriangle, UserCheck, AtSign, FileText, 
  MoreVertical, Check, ArrowLeft, FolderKanban, Target, MessageSquare, ExternalLink, Network
} from 'lucide-react';

export const NotificationsScreen: React.FC = () => {
  const { pushPanel } = useApp();

  // Screen view state: 'center' | 'blocker_detail'
  const [viewState, setViewState] = useState<'center' | 'blocker_detail'>('center');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'ASSIGNMENTS' | 'BLOCKERS' | 'MENTIONS'>('ALL');
  const [selectedNotifId, setSelectedNotifId] = useState('notif-1');

  // Comment state for blocker detail
  const [commentText, setCommentText] = useState('');
  const [activityLogs, setActivityLogs] = useState([
    { id: '1', user: 'Sarah Jenkins', time: '10:42 AM', text: 'Flagged the task as blocked due to Node A capacity alerts from DataDog.' },
    { id: '2', user: 'System Notification', time: '10:45 AM', text: 'Automated escalation sent to DevOps queue.' }
  ]);

  const NOTIFICATIONS = [
    {
      id: 'notif-1',
      type: 'BLOCKER',
      unread: true,
      time: 'Just now',
      title: 'TSK-892 marked as Blocker by James Smith',
      subtitle: 'Database migration script failing on staging environment.',
      tag: 'Project Phoenix',
      codeError: `Error: duplicate key value violates unique constraint "users_email_key"\nDetail: Key (email)=(test@example.com) already exists.\nContext: SQL statement "INSERT INTO users (id, email) VALUES ($1, $2)"\n\nThe staging DB seems to have corrupt test data that was not cleared before the automated migration script ran. We need to manually purge the staging users table or adjust the migration to handle conflicts.`
    },
    {
      id: 'notif-2',
      type: 'ASSIGNMENT',
      unread: false,
      time: '15m ago',
      title: 'Sarah Jenkins assigned you to "Draft new schema architecture" in PRJ-2490',
      subtitle: '',
      tag: 'Core Infrastructure'
    },
    {
      id: 'notif-3',
      type: 'MENTION',
      unread: true,
      time: '2h ago',
      title: 'Elena Rodriguez mentioned you in "API Gateway V2" comments',
      subtitle: '"@alex can you verify the rate limiting params on this?"',
      tag: 'API Gateway V2'
    },
    {
      id: 'notif-4',
      type: 'REPORT',
      unread: false,
      time: 'Yesterday',
      title: 'Weekly Performance Brief (Oct 21-27) is ready for review',
      subtitle: '',
      tag: 'System Auto'
    }
  ];

  const selectedNotif = NOTIFICATIONS.find(n => n.id === selectedNotifId) || NOTIFICATIONS[0];

  const filteredNotifs = NOTIFICATIONS.filter(n => {
    if (activeFilter === 'UNREAD' && !n.unread) return false;
    if (activeFilter === 'ASSIGNMENTS' && n.type !== 'ASSIGNMENT') return false;
    if (activeFilter === 'BLOCKERS' && n.type !== 'BLOCKER') return false;
    if (activeFilter === 'MENTIONS' && n.type !== 'MENTION') return false;
    return true;
  });

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setActivityLogs(prev => [
      ...prev,
      { id: Date.now().toString(), user: 'Alex Rivers', time: 'Just now', text: commentText.trim() }
    ]);
    setCommentText('');
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* 1. NOTIFICATION CENTER VIEW matching Screenshot 1 */}
      {viewState === 'center' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Notifications</h1>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">Manage and triage system alerts.</p>
            </div>

            {/* Filter Pills matching Screenshot 1 */}
            <div className="flex items-center gap-1.5 font-mono">
              {(['ALL', 'UNREAD', 'ASSIGNMENTS', 'BLOCKERS', 'MENTIONS'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
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
          </div>

          {/* Main Grid: Left Notification List + Right Triage Detail Card matching Screenshot 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Notification Cards List (2 Cols) */}
            <div className="lg:col-span-2 space-y-3 font-mono">
              {filteredNotifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => setSelectedNotifId(n.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative space-y-2 ${
                    selectedNotifId === n.id 
                      ? 'border-2 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-sm' 
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 hover:border-neutral-400'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <div className="flex items-center gap-1.5">
                      {n.type === 'BLOCKER' && <span className="font-bold text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> CRITICAL BLOCKER</span>}
                      {n.type === 'ASSIGNMENT' && <span className="font-bold text-neutral-600 dark:text-neutral-400 flex items-center gap-1"><UserCheck className="w-3 h-3" /> TASK ASSIGNMENT</span>}
                      {n.type === 'MENTION' && <span className="font-bold text-neutral-600 dark:text-neutral-400 flex items-center gap-1"><AtSign className="w-3 h-3" /> MENTION</span>}
                      {n.type === 'REPORT' && <span className="font-bold text-neutral-600 dark:text-neutral-400 flex items-center gap-1"><FileText className="w-3 h-3" /> REPORT READY</span>}
                    </div>

                    <div className="flex items-center gap-1.5 text-neutral-400">
                      <span>{n.time}</span>
                      {n.unread && <span className="w-2 h-2 rounded-full bg-red-600" />}
                    </div>
                  </div>

                  <h3 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 font-sans leading-snug">
                    {n.title}
                  </h3>

                  {n.subtitle && (
                    <p className="text-[11px] text-neutral-500 font-sans leading-relaxed italic">
                      {n.subtitle}
                    </p>
                  )}

                  <div className="pt-1">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                      {n.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Detailed Triage Card (3 Cols) matching Screenshot 1 */}
            <div className="lg:col-span-3 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start pb-3 border-b border-neutral-100 dark:border-neutral-800 font-mono">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> CRITICAL BLOCKER
                    </div>
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-sans tracking-tight">
                      TSK-892 Database Migration Failure
                    </h2>
                    <p className="text-xs text-neutral-400">Logged by James Smith • Just now</p>
                  </div>
                  <MoreVertical className="w-4 h-4 text-neutral-400 cursor-pointer" />
                </div>

                {/* Description Code Box matching Screenshot 1 */}
                <div className="space-y-1.5 font-mono">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Description</span>
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 font-mono text-[11px] leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
                    {selectedNotif.codeError || 'Database migration script failing on staging environment.'}
                  </div>
                </div>

                {/* Impacted Entities */}
                <div className="space-y-1.5 font-mono">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Impacted Entities</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold border border-neutral-200 dark:border-neutral-700 flex items-center gap-1.5">
                      <FolderKanban className="w-3 h-3 text-neutral-400" /> Project Phoenix
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold border border-neutral-200 dark:border-neutral-700 flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-neutral-400" /> Staging DB
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Buttons matching Screenshot 1 */}
              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-end gap-3 font-mono">
                <button
                  onClick={() => alert('Assigned TSK-892 to your queue.')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-sm"
                >
                  Acknowledge &amp; Assign to Self
                </button>
                <button
                  onClick={() => setViewState('blocker_detail')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300"
                >
                  View Ticket in Context
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. BLOCKER ALERT DETAIL VIEW SCREEN matching Screenshot 2 */}
      {viewState === 'blocker_detail' && (
        <div className="space-y-6">
          <div className="font-mono text-xs pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <button 
              onClick={() => setViewState('center')}
              className="text-xs text-neutral-500 hover:text-black dark:hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Notification Center
            </button>
          </div>

          {/* Header Card matching Screenshot 2 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-red-600 border border-red-200 flex items-center gap-1 w-fit">
                  ! CRITICAL BLOCKER ALERT
                </span>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-sans tracking-tight">
                  Blocker Alert: TSK-892
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => alert('Blocker marked as resolved!')} className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs flex items-center gap-1.5 shadow-sm">
                  <Check className="w-3.5 h-3.5" /> Mark as Resolved
                </button>
                <button onClick={() => alert('Reassigning blocker alert...')} className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold">
                  Reassign
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Task Title</span>
                <div className="font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">Audit existing sync protocols</div>
              </div>

              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Project</span>
                <div className="font-bold text-neutral-900 dark:text-neutral-100 mt-0.5 flex items-center gap-1">
                  <FolderKanban className="w-3.5 h-3.5 text-neutral-400" /> Enterprise Data Sync Optimization
                </div>
              </div>

              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Linked OKR</span>
                <div className="font-bold text-neutral-900 dark:text-neutral-100 mt-0.5 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-neutral-400" /> Q3 Infrastructure Scaling
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid: Red Dashed Blocker Reason + Recent Activity Log matching Screenshot 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
            {/* Left Column (2 Cols): Red Dashed Blocker Box */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-dashed border-red-500 shadow-sm space-y-3 relative overflow-hidden">
                <div className="w-1.5 h-full bg-red-600 absolute left-0 top-0" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-sans flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" /> Blocker Reason
                </h3>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 font-sans leading-relaxed pl-1">
                  Node A is reaching <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-mono font-bold">95% capacity</span> ; cannot proceed with protocol audit until resource ceiling is lifted.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => pushPanel({ type: 'task', id: 'TSK-892' })}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Task Detail
                </button>
                <button 
                  onClick={() => pushPanel({ type: 'relationship-map', projectId: 'PRJ-092' })}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Network className="w-3.5 h-3.5" /> Open Relationship Map
                </button>
              </div>
            </div>

            {/* Right Column: Recent Activity Feed + Comment Form matching Screenshot 2 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-neutral-500" /> Recent Activity
              </h3>

              <div className="space-y-3 font-sans border-b border-neutral-100 dark:border-neutral-800 pb-3">
                {activityLogs.map(log => (
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
                ))}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handlePostComment} className="space-y-2 font-mono">
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs focus:outline-none"
                />
                <div className="flex justify-end">
                  <button type="submit" className="px-4 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-sm">
                    Post
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
