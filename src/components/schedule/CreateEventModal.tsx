import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, 
  AlertTriangle, Check, Plus, Users
} from 'lucide-react';
import type { ScheduleEvent, DangerImportanceLevel, ScheduleEventType } from '../../types/schedule';
import type { User, Project } from '../../types';
import { UserAvatar } from '../common/UserAvatar';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  currentUser: User;
  users: User[];
  projects?: Project[];
  onCreateEvent: (event: Omit<ScheduleEvent, 'id' | 'createdAt'>) => Promise<void>;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
  currentUser,
  users,
  projects = [],
  onCreateEvent
}) => {
  const todayIso = defaultDate || new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<ScheduleEventType>('meeting');
  const [dangerLevel, setDangerLevel] = useState<DangerImportanceLevel>('medium');
  const [startDate, setStartDate] = useState(todayIso);
  const [startTime, setStartTime] = useState('09:30');
  const [endTime, setEndTime] = useState('10:30');
  const [isAllDay, setIsAllDay] = useState(false);
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<string[]>([currentUser.id]);
  const [meetingLink, setMeetingLink] = useState('');
  const [location, setLocation] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const toggleAttendee = (userId: string) => {
    setSelectedAttendeeIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleSelectAllAttendees = () => {
    setSelectedAttendeeIds(users.map(u => u.id));
  };

  const handleSelectJustMe = () => {
    setSelectedAttendeeIds([currentUser.id]);
  };

  // Quick preset template handler
  const applyPreset = (preset: 'standup' | 'sprint_review' | 'focus_time' | 'incident') => {
    switch (preset) {
      case 'standup':
        setTitle('Daily Engineering Standup');
        setEventType('standup');
        setDangerLevel('medium');
        setStartTime('09:30');
        setEndTime('10:00');
        setDescription('Quick status alignment, yesterday accomplishments, today goals, and blocker triage.');
        handleSelectAllAttendees();
        break;
      case 'sprint_review':
        setTitle('Sprint Review & Retrospective');
        setEventType('sprint_review');
        setDangerLevel('high');
        setStartTime('14:00');
        setEndTime('15:30');
        setDescription('Demo deliverables, evaluate sprint velocity, and document team action items.');
        handleSelectAllAttendees();
        break;
      case 'focus_time':
        setTitle('Deep Work: Uninterrupted Focus');
        setEventType('focus_time');
        setDangerLevel('medium');
        setStartTime('13:00');
        setEndTime('15:00');
        setDescription('Deep coding / design sprint session. No interruptions.');
        handleSelectJustMe();
        break;
      case 'incident':
        setTitle('CRITICAL: Production Incident Triage');
        setEventType('incident');
        setDangerLevel('critical');
        setStartTime('10:00');
        setEndTime('11:00');
        setDescription('Emergency investigation and blocker mitigation session.');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter an event title.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const selectedProject = projects.find(p => p.id === selectedProjectId);
      await onCreateEvent({
        orgId: currentUser.orgId || 'current',
        title: title.trim(),
        description: description.trim(),
        eventType,
        dangerLevel,
        startDate,
        endDate: startDate,
        startTime: isAllDay ? undefined : startTime,
        endTime: isAllDay ? undefined : endTime,
        isAllDay,
        organizerId: currentUser.id || 'user-current',
        organizerName: currentUser.name || 'You',
        attendeeIds: selectedAttendeeIds.length > 0 ? selectedAttendeeIds : [currentUser.id],
        projectId: selectedProjectId || undefined,
        projectName: selectedProject?.name,
        meetingLink: meetingLink.trim() || undefined,
        location: location.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden z-10 font-sans"
        >
          {/* Header */}
          <div className="p-5 pb-3 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Schedule Team Event
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Shared transparently with the team; highlights participants automatically.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Presets Bar */}
          <div className="px-5 py-2.5 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
            <span className="text-[10px] uppercase font-mono font-medium text-neutral-400 dark:text-neutral-500 shrink-0">
              Templates:
            </span>
            <button
              type="button"
              onClick={() => applyPreset('standup')}
              className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white text-xs shrink-0 cursor-pointer font-medium transition-colors"
            >
              Standup (30m)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('sprint_review')}
              className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white text-xs shrink-0 cursor-pointer font-medium transition-colors"
            >
              Sprint Review (1.5h)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('focus_time')}
              className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white text-xs shrink-0 cursor-pointer font-medium transition-colors"
            >
              Deep Work (2h)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('incident')}
              className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white text-xs shrink-0 cursor-pointer font-medium transition-colors"
            >
              Critical Blocker (1h)
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-neutral-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1">
              <label className="font-bold text-neutral-700 dark:text-neutral-300">
                Event Title <span className="text-neutral-400 dark:text-neutral-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Sprint Architecture Sync or Client Demo"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 text-sm"
                required
              />
            </div>

            {/* Danger & Importance Level Selector */}
            <div className="space-y-1.5">
              <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                <span>Importance &amp; Danger Tier</span>
                <span className="text-[11px] text-neutral-400 font-normal">Select priority tag</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    level: 'critical',
                    label: 'Critical',
                    desc: 'Blockers & deadlines'
                  },
                  {
                    level: 'high',
                    label: 'High',
                    desc: 'Key reviews & demos'
                  },
                  {
                    level: 'medium',
                    label: 'Standard',
                    desc: 'Syncs & deep work'
                  },
                  {
                    level: 'low',
                    label: 'Low',
                    desc: '1-on-1s & catchups'
                  },
                ].map(item => {
                  const isSelected = dangerLevel === item.level;
                  return (
                    <button
                      key={item.level}
                      type="button"
                      onClick={() => setDangerLevel(item.level as DangerImportanceLevel)}
                      className={`p-3 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-100 dark:bg-neutral-800 border border-neutral-400 dark:border-neutral-500'
                          : 'bg-neutral-50/40 dark:bg-neutral-800/20 border border-neutral-200/60 dark:border-neutral-800/60 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          {item.label}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-neutral-800 dark:text-neutral-200" />}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-normal font-normal">
                        {item.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Event Category & Project */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300">Category</label>
                <select
                  value={eventType}
                  onChange={e => setEventType(e.target.value as ScheduleEventType)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                >
                  <option value="meeting">Team Meeting</option>
                  <option value="standup">Daily Standup</option>
                  <option value="sprint_review">Sprint Review</option>
                  <option value="focus_time">Focus / Deep Work</option>
                  <option value="one_on_one">1-on-1 Check-in</option>
                  <option value="workshop">Workshop / Jam</option>
                  <option value="client_sync">Client Sync</option>
                  <option value="deadline">Hard Deadline</option>
                  <option value="incident">Incident / Blocker</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300">Associated Project (Optional)</label>
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                >
                  <option value="">None / General Workspace</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date and Time Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800">
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700 dark:text-neutral-300">Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                  required
                />
              </div>

              {!isAllDay ? (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300">Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300">End Time</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2 flex items-center justify-center text-neutral-500 font-medium text-xs">
                  Event spans the full day
                </div>
              )}

              <label
                htmlFor="allDayCheckbox"
                className="sm:col-span-3 flex items-center gap-2.5 pt-2 border-t border-neutral-200/50 dark:border-neutral-800/80 cursor-pointer select-none group"
              >
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    id="allDayCheckbox"
                    checked={isAllDay}
                    onChange={e => setIsAllDay(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                    isAllDay
                      ? 'bg-neutral-900 dark:bg-neutral-700 border border-neutral-900 dark:border-neutral-500 text-white dark:text-neutral-100 shadow-2xs'
                      : 'border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 group-hover:border-neutral-400 dark:group-hover:border-neutral-400'
                  }`}>
                    {isAllDay && <Check className="w-3 h-3 stroke-[2.5]" />}
                  </div>
                </div>
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors">
                  All-day event / Full-day deadline
                </span>
              </label>
            </div>

            {/* Attendees Multi-Select */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Teammates Attending ({selectedAttendeeIds.length})</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllAttendees}
                    className="text-[11px] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:underline font-medium cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-neutral-300 dark:text-neutral-700">|</span>
                  <button
                    type="button"
                    onClick={handleSelectJustMe}
                    className="text-[11px] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:underline font-medium cursor-pointer"
                  >
                    Just Me
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50/30 dark:bg-neutral-800/20">
                {users.map(u => {
                  const isSelected = selectedAttendeeIds.includes(u.id);
                  const isMe = u.id === currentUser.id;
                  return (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => toggleAttendee(u.id)}
                      className={`flex items-center gap-2 p-1.5 rounded-lg text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 shadow-2xs'
                          : 'bg-transparent border border-transparent hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <UserAvatar name={u.name} avatarUrl={u.avatarUrl} size="xs" color={u.avatarColor} />
                      <div className="min-w-0 flex-1 truncate">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 truncate flex items-center gap-1">
                          <span>{u.name}</span>
                          {isMe && <span className="text-[9px] text-neutral-500 font-medium">(You)</span>}
                        </div>
                      </div>
                      {isSelected && <Check className="w-3 h-3 text-neutral-700 dark:text-neutral-300 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Video Link and Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300">
                  Video Call Link (Optional)
                </label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={e => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/... or Zoom"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300">
                  Location / Room (Optional)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Conference Room A or Remote"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Description / Notes */}
            <div className="space-y-1">
              <label className="font-bold text-neutral-700 dark:text-neutral-300">
                Agenda &amp; Context Notes (Optional)
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Key topics, links to docs, prep requirements..."
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:border dark:border-neutral-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Scheduling...' : 'Save & Schedule Event'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
