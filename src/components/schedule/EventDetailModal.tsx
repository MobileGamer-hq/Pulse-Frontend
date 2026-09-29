import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, Clock, Video, MapPin, 
  Check, UserMinus, UserPlus, 
  Trash2, ExternalLink, Tag, Users
} from 'lucide-react';
import type { ScheduleEvent, DangerImportanceLevel } from '../../types/schedule';
import type { User } from '../../types';
import { UserAvatar } from '../common/UserAvatar';

interface EventDetailModalProps {
  event: ScheduleEvent | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  onToggleAttendance: (eventId: string) => Promise<void>;
  onDeleteEvent: (eventId: string) => Promise<void>;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  currentUser,
  users,
  onToggleAttendance,
  onDeleteEvent
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  if (!isOpen || !event) return null;

  const isAttending = event.attendeeIds.includes(currentUser.id);
  const isOrganizer = event.organizerId === currentUser.id;

  const getDangerBadge = (level: DangerImportanceLevel) => {
    switch (level) {
      case 'critical':
        return {
          label: 'Critical',
          bg: 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-600',
          dot: 'bg-neutral-800 dark:bg-neutral-200'
        };
      case 'high':
        return {
          label: 'High',
          bg: 'bg-neutral-100/90 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700',
          dot: 'bg-neutral-600 dark:bg-neutral-400'
        };
      case 'medium':
        return {
          label: 'Standard',
          bg: 'bg-neutral-100/60 dark:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-800',
          dot: 'bg-neutral-500 dark:bg-neutral-400'
        };
      case 'low':
        return {
          label: 'Low',
          bg: 'bg-neutral-50 dark:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-800/60',
          dot: 'bg-neutral-400 dark:bg-neutral-500'
        };
    }
  };

  const dangerMeta = getDangerBadge(event.dangerLevel);

  const formatEventDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      }
      return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const attendeeUsers = event.attendeeIds.map(id => {
    const found = users.find(u => u.id === id);
    if (found) return found;
    if (id === currentUser.id) return currentUser;
    return {
      id,
      name: 'Team Member',
      email: '',
      role: 'Member',
      avatarColor: '#3B82F6'
    } as User;
  });

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this event from the team schedule?')) {
      setIsDeleting(true);
      try {
        await onDeleteEvent(event.id);
        onClose();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleToggleAttendance = async () => {
    setIsToggling(true);
    try {
      await onToggleAttendance(event.id);
    } finally {
      setIsToggling(false);
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
          className="relative w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden z-10 font-sans"
        >
          {/* Top Bar with Category & Close */}
          <div className="p-5 pb-3 flex items-start justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${dangerMeta.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${dangerMeta.dot}`} />
                  {dangerMeta.label}
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700 capitalize">
                  <Tag className="w-3 h-3" />
                  {event.eventType.replace('_', ' ')}
                </span>

                {isAttending && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
                    <Check className="w-3 h-3" />
                    You are attending
                  </span>
                )}

                {isOrganizer && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
                    Hosted by You
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight pt-1">
                {event.title}
              </h3>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Date & Time Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800 text-xs">
              <div className="flex items-center gap-2.5 text-neutral-700 dark:text-neutral-300">
                <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase font-mono text-neutral-400 font-semibold">Date</div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {formatEventDate(event.startDate)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-neutral-700 dark:text-neutral-300">
                <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase font-mono text-neutral-400 font-semibold">Time Window</div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {event.isAllDay 
                      ? 'All Day Event' 
                      : (event.startTime ? `${event.startTime} - ${event.endTime || 'End'}` : 'Scheduled')}
                  </div>
                </div>
              </div>
            </div>

            {/* Meeting Link & Location */}
            {(event.meetingLink || event.location) && (
              <div className="flex flex-wrap items-center gap-2">
                {event.meetingLink && (
                  <a
                    href={event.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-750 dark:border dark:border-neutral-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Video Call</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>
                )}

                {event.location && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium border border-neutral-200 dark:border-neutral-700">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase font-mono text-neutral-400 tracking-wider">
                  Agenda &amp; Context
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800 text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </div>
              </div>
            )}

            {/* Attendees Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase font-mono text-neutral-400 tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Team Attendees ({attendeeUsers.length})</span>
                </div>

                {/* Quick Toggle Attendance Button */}
                <button
                  onClick={handleToggleAttendance}
                  disabled={isToggling}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                    isAttending
                      ? 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white border-neutral-900 dark:border-neutral-700'
                  }`}
                >
                  {isAttending ? (
                    <>
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Leave Event</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>RSVP &amp; Attend</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attendeeUsers.map(user => {
                  const isMe = user.id === currentUser.id;
                  return (
                    <div 
                      key={user.id} 
                      className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                        isMe 
                          ? 'bg-neutral-100 dark:bg-neutral-800/80 border-neutral-300 dark:border-neutral-700 shadow-2xs' 
                          : 'bg-neutral-50/50 dark:bg-neutral-800/30 border-neutral-200/60 dark:border-neutral-800'
                      }`}
                    >
                      <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="sm" color={user.avatarColor} />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 truncate">
                          <span>{user.name}</span>
                          {isMe && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold">
                              You
                            </span>
                          )}
                          {user.id === event.organizerId && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold">
                              Host
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                          {user.title || user.role || 'Teammate'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Organizer Info */}
            <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <span>Organized by: <strong className="text-neutral-800 dark:text-neutral-200 font-medium">{event.organizerName}</strong></span>
              <span className="font-mono text-[10px]">ID: {event.id.slice(0, 12)}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-900/80 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Event</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
