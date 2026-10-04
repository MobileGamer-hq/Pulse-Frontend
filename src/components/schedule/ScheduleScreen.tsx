import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, 
  CheckSquare, Clock, Video, 
  RotateCw, Search, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ScheduleEvent, DangerImportanceLevel, CalendarItem } from '../../types/schedule';
import { scheduleService } from '../../services/scheduleService';
import { EventDetailModal } from './EventDetailModal';
import { CreateEventModal } from './CreateEventModal';
import { UserAvatar } from '../common/UserAvatar';

type CalendarViewMode = 'month' | 'week' | 'day';

export const ScheduleScreen: React.FC = () => {
  const { 
    currentOrgSlug, currentUser, activeRole, users, tasks, projects, 
    pushPanel, refreshWorkspaceData, isFocusMode, setIsFocusMode, addTask 
  } = useApp();

  // Navigation date state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayDate, setSelectedDayDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Events & Service State
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDefaultDate, setCreateDefaultDate] = useState<string | undefined>(undefined);

  // Filters state
  const [selectedTeammateId, setSelectedTeammateId] = useState<string>('all');
  const [itemTypeFilter, setItemTypeFilter] = useState<'all' | 'events' | 'tasks'>('all');
  const [dangerFilter, setDangerFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load schedule events
  const loadEvents = async () => {
    try {
      const data = await scheduleService.getEvents(currentOrgSlug || 'current');
      setEvents(data);
    } catch {
      // Graceful catch
    }
  };

  useEffect(() => {
    // Purge any obsolete mock/seed events from cache
    scheduleService.clearMockData();
    loadEvents();
  }, [currentOrgSlug]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshWorkspaceData(false);
      await loadEvents();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Convert real database tasks into calendar items
  const taskCalendarItems = useMemo<CalendarItem[]>(() => {
    return tasks
      .filter(t => {
        if (t.isPrivate) {
          const isPrivileged = ['Admin', 'Executive', 'Manager'].includes(activeRole || currentUser?.role || '');
          const isAssigned = Boolean(currentUser?.id && t.assigneeIds && t.assigneeIds.includes(currentUser.id));
          const isCreator = Boolean(currentUser?.id && t.createdBy && t.createdBy === currentUser.id);
          if (!isPrivileged && !isAssigned && !isCreator) return false;
        }
        return Boolean(t.dueDate || t.startDate);
      })
      .map(t => {
        let dangerLevel: DangerImportanceLevel = 'medium';
        if (t.status === 'Blocked' || t.status === 'AtRisk' || t.priority === 'Urgent') {
          dangerLevel = 'critical';
        } else if (t.priority === 'High') {
          dangerLevel = 'high';
        } else if (t.status === 'Done') {
          dangerLevel = 'low';
        }

        // Clean ISO date if contains timestamp (prefer dueDate, fallback to startDate)
        const rawDate = t.dueDate || t.startDate || '';
        const cleanDate = rawDate.split('T')[0];

        return {
          id: `task-${t.id}`,
          source: 'task',
          title: t.title,
          date: cleanDate,
          isAllDay: true,
          dangerLevel,
          typeLabel: 'Task Deadline',
          description: t.description,
          attendeeIds: t.assigneeIds || [],
          projectId: t.projectId,
          projectName: t.projectName,
          rawTaskId: t.id,
          taskStatus: t.status,
          taskPriority: t.priority
        };
      });
  }, [tasks]);

  // Convert schedule events into calendar items
  const eventCalendarItems = useMemo<CalendarItem[]>(() => {
    return events.map(e => ({
      id: `event-${e.id}`,
      source: 'event',
      title: e.title,
      date: e.startDate,
      startTime: e.startTime,
      endTime: e.endTime,
      isAllDay: e.isAllDay,
      dangerLevel: e.dangerLevel,
      typeLabel: e.eventType.replace('_', ' '),
      description: e.description,
      organizerId: e.organizerId,
      organizerName: e.organizerName,
      attendeeIds: e.attendeeIds || [],
      projectId: e.projectId,
      projectName: e.projectName,
      meetingLink: e.meetingLink,
      rawEvent: e
    }));
  }, [events]);

  // Combine and filter items based on focus mode, user selection, and filters
  const allFilteredItems = useMemo<CalendarItem[]>(() => {
    let list: CalendarItem[] = [];
    if (itemTypeFilter === 'all') {
      list = [...eventCalendarItems, ...taskCalendarItems];
    } else if (itemTypeFilter === 'events') {
      list = [...eventCalendarItems];
    } else {
      list = [...taskCalendarItems];
    }

    return list.filter(item => {
      // 1. Focus Mode Filter (Show only logged-in user's events or tasks)
      if (isFocusMode) {
        const isOrganizer = item.organizerId === currentUser.id;
        const isAttendee = item.attendeeIds.includes(currentUser.id);
        if (!isOrganizer && !isAttendee) return false;
      }

      // 2. Specific Teammate Filter
      if (selectedTeammateId !== 'all') {
        const isSelectedTeammate = item.organizerId === selectedTeammateId || item.attendeeIds.includes(selectedTeammateId);
        if (!isSelectedTeammate) return false;
      }

      // 3. Danger / Importance Filter
      if (dangerFilter !== 'all' && item.dangerLevel !== dangerFilter) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        const matchesProject = item.projectName?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesProject) return false;
      }

      return true;
    });
  }, [
    eventCalendarItems, 
    taskCalendarItems, 
    itemTypeFilter, 
    isFocusMode, 
    currentUser.id, 
    selectedTeammateId, 
    dangerFilter, 
    searchQuery
  ]);

  // Map items by date "YYYY-MM-DD" for fast lookup
  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of allFilteredItems) {
      const existing = map.get(item.date) || [];
      existing.push(item);
      map.set(item.date, existing);
    }
    return map;
  }, [allFilteredItems]);

  // Quick stats calculations
  const stats = useMemo(() => {
    const criticalCount = allFilteredItems.filter(i => i.dangerLevel === 'critical').length;
    const myItemsCount = allFilteredItems.filter(i => 
      i.organizerId === currentUser.id || i.attendeeIds.includes(currentUser.id)
    ).length;
    const totalEventsCount = allFilteredItems.filter(i => i.source === 'event').length;
    const totalTasksDue = allFilteredItems.filter(i => i.source === 'task').length;

    return { criticalCount, myItemsCount, totalEventsCount, totalTasksDue };
  }, [allFilteredItems, currentUser.id]);

  // Navigation handlers
  const handlePrev = () => {
    const newD = new Date(currentDate);
    if (viewMode === 'month') {
      newD.setMonth(newD.getMonth() - 1);
    } else if (viewMode === 'week') {
      newD.setDate(newD.getDate() - 7);
    } else {
      newD.setDate(newD.getDate() - 1);
    }
    setCurrentDate(newD);
  };

  const handleNext = () => {
    const newD = new Date(currentDate);
    if (viewMode === 'month') {
      newD.setMonth(newD.getMonth() + 1);
    } else if (viewMode === 'week') {
      newD.setDate(newD.getDate() + 7);
    } else {
      newD.setDate(newD.getDate() + 1);
    }
    setCurrentDate(newD);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDayDate(today.toISOString().split('T')[0]);
  };

  // Click on item
  const handleItemClick = (item: CalendarItem) => {
    if (item.source === 'task' && item.rawTaskId) {
      pushPanel({ type: 'task', id: item.rawTaskId });
    } else if (item.source === 'event' && item.rawEvent) {
      setSelectedEvent(item.rawEvent);
      setIsDetailOpen(true);
    }
  };

  // Event actions
  const handleToggleAttendance = async (eventId: string) => {
    const updated = await scheduleService.toggleAttendance(currentOrgSlug || 'current', eventId, currentUser.id);
    setEvents(prev => prev.map(e => e.id === eventId ? updated : e));
    setSelectedEvent(updated);
  };

  const handleDeleteEvent = async (eventId: string) => {
    await scheduleService.deleteEvent(currentOrgSlug || 'current', eventId);
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  const handleCreateEvent = async (payload: Omit<ScheduleEvent, 'id' | 'createdAt'>) => {
    // Map danger level to task priority
    let priority: 'Urgent' | 'High' | 'Medium' | 'Low' = 'Medium';
    if (payload.dangerLevel === 'critical') priority = 'Urgent';
    else if (payload.dangerLevel === 'high') priority = 'High';
    else if (payload.dangerLevel === 'low') priority = 'Low';

    // Save directly to the database tasks table
    try {
      await addTask({
        orgId: currentOrgSlug || 'current',
        title: payload.title,
        description: payload.description || '',
        dueDate: payload.startDate,
        startDate: payload.startDate,
        priority,
        status: 'Todo',
        projectId: payload.projectId || (projects[0]?.id || ''),
        projectName: payload.projectName || (projects[0]?.name || 'Workspace Schedule'),
        assigneeIds: payload.attendeeIds || [],
        tagIds: [],
        estimatedHours: payload.isAllDay ? 8 : 1,
        actualHours: 0,
        subtasks: [],
        comments: [],
        dependencyTaskIds: []
      });
    } catch (e) {
      console.warn('[ScheduleScreen] Notice creating task in DB:', e);
    }

    const newEvent = await scheduleService.createEvent(currentOrgSlug || 'current', payload);
    setEvents(prev => [newEvent, ...prev]);
  };

  // Open Create Event Modal for a specific date
  const handleOpenCreateForDate = (dateIso: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCreateDefaultDate(dateIso);
    setIsCreateOpen(true);
  };

  // Date formatting helpers
  const monthYearLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayIso = new Date().toISOString().split('T')[0];

  // Priority styling helper - clean, modern monochrome SaaS styling
  const getDangerBadgeStyles = (level: DangerImportanceLevel, isMyItem: boolean) => {
    const myRing = isMyItem ? 'ring-1 ring-neutral-400 dark:ring-neutral-500 font-semibold' : '';

    switch (level) {
      case 'critical':
        return {
          chip: `bg-neutral-200/90 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 border-l-2 border-l-neutral-900 dark:border-l-neutral-300 text-neutral-900 dark:text-neutral-100 font-semibold ${myRing}`,
          dot: 'bg-neutral-900 dark:bg-neutral-100',
          badge: 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900'
        };
      case 'high':
        return {
          chip: `bg-neutral-100/90 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 border-l-2 border-l-neutral-600 dark:border-l-neutral-400 text-neutral-800 dark:text-neutral-200 ${myRing}`,
          dot: 'bg-neutral-600 dark:bg-neutral-400',
          badge: 'bg-neutral-700 text-white dark:bg-neutral-300 dark:text-neutral-900'
        };
      case 'medium':
        return {
          chip: `bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-800 border-l-2 border-l-neutral-400 dark:border-l-neutral-500 text-neutral-700 dark:text-neutral-300 ${myRing}`,
          dot: 'bg-neutral-400 dark:bg-neutral-500',
          badge: 'bg-neutral-500 text-white'
        };
      case 'low':
        return {
          chip: `bg-neutral-50/50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/80 border-l-2 border-l-neutral-300 dark:border-l-neutral-600 text-neutral-700 dark:text-neutral-300 ${myRing}`,
          dot: 'bg-neutral-300 dark:bg-neutral-600',
          badge: 'bg-neutral-300 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200'
        };
    }
  };

  // Month grid generation
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Get day index: Monday=0, Sunday=6
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: Array<{
      date: Date;
      dateIso: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      dayNumber: number;
    }> = [];

    // Previous month padding days
    for (let i = startDayOfWeek; i > 0; i--) {
      const prevDate = new Date(year, month, 1 - i);
      const iso = prevDate.toISOString().split('T')[0];
      days.push({
        date: prevDate,
        dateIso: iso,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        dayNumber: prevDate.getDate()
      });
    }

    // Days of current month
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const thisDate = new Date(year, month, d);
      const iso = thisDate.toISOString().split('T')[0];
      days.push({
        date: thisDate,
        dateIso: iso,
        isCurrentMonth: true,
        isToday: iso === todayIso,
        dayNumber: d
      });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const iso = nextDate.toISOString().split('T')[0];
      days.push({
        date: nextDate,
        dateIso: iso,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        dayNumber: i
      });
    }

    return days;
  }, [currentDate, todayIso]);

  // Week days generation
  const weekDays = useMemo(() => {
    const current = new Date(currentDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(current.setDate(diff));

    const days: Array<{
      date: Date;
      dateIso: string;
      dayName: string;
      dayNumber: number;
      isToday: boolean;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      const iso = nextDay.toISOString().split('T')[0];
      days.push({
        date: nextDay,
        dateIso: iso,
        dayName: nextDay.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: nextDay.getDate(),
        isToday: iso === todayIso
      });
    }

    return days;
  }, [currentDate, todayIso]);

  return (
    <div className="space-y-4 pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Schedule
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Team calendar, upcoming deadlines, and milestone syncs
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Focus Mode Toggle Button */}
          <button
            onClick={() => setIsFocusMode(prev => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              isFocusMode
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-neutral-400 dark:border-neutral-600 shadow-2xs'
                : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
            title="Toggle between showing everyone's schedule and only your personal schedule"
          >
            {isFocusMode ? 'Showing My Items' : 'Filter My Items'}
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            title="Refresh schedule"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Schedule Event Button */}
          <button
            onClick={() => {
              setCreateDefaultDate(todayIso);
              setIsCreateOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:border dark:border-neutral-700 text-white text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            + New Event
          </button>
        </div>
      </div>

      {/* Focus Mode Notification Banner */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 text-neutral-700 dark:text-neutral-300 text-xs flex items-center justify-between gap-3">
              <span className="font-medium truncate">
                Showing scheduled items for <strong>{currentUser.name || 'You'}</strong> only.
              </span>
              <button
                onClick={() => setIsFocusMode(false)}
                className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 hover:underline shrink-0 cursor-pointer"
              >
                Clear Filter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Stats Cards (Minimalist Lunor-inspired) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">My Items</div>
            <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-1">
              {stats.myItemsCount}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500">
            <CalendarIcon className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Urgent &amp; Blockers</div>
            <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-1">
              {stats.criticalCount}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Team Events</div>
            <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-1">
              {stats.totalEventsCount}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Tasks Due</div>
            <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-1">
              {stats.totalTasksDue}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500">
            <CheckSquare className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Calendar Navigation & Filters Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-3 sm:p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Month/Year and Nav buttons */}
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight min-w-[140px]">
              {monthYearLabel}
            </h2>

            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-0.5 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60">
              <button
                onClick={handlePrev}
                className="p-1 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleToday}
                className="px-2 py-0.5 rounded-md text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                Today
              </button>

              <button
                onClick={handleNext}
                className="p-1 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                title="Next"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right: View Mode Selector (Month / Week / Day) */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800/80 p-0.5 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 text-xs font-medium self-start sm:self-auto">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-semibold shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-semibold shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-semibold shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Day
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
          {/* Search query */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by title, project, or keyword..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 text-xs focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600"
            />
          </div>

          {/* Item Type: All vs Events vs Tasks */}
          <select
            value={itemTypeFilter}
            onChange={e => setItemTypeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">All items</option>
            <option value="events">Events only</option>
            <option value="tasks">Tasks only</option>
          </select>

          {/* Filter by Teammate */}
          <select
            value={selectedTeammateId}
            onChange={e => setSelectedTeammateId(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">All teammates</option>
            <option value={currentUser.id}>Assigned to me</option>
            {users.filter(u => u.id !== currentUser.id).map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          {/* Filter by Danger / Importance (Clean SaaS labels, no childish emojis) */}
          <select
            value={dangerFilter}
            onChange={e => setDangerFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">All priorities</option>
            <option value="critical">Critical &amp; Blockers</option>
            <option value="high">High priority</option>
            <option value="medium">Standard sync</option>
            <option value="low">Low priority</option>
          </select>
        </div>
      </div>

      {/* Main Calendar View Area */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl shadow-2xs overflow-hidden">
          {/* Day of week column headers */}
          <div className="grid grid-cols-7 border-b border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 text-center text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider py-2">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          {/* Month Day Cells Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-neutral-200/70 dark:divide-neutral-800/70">
            {monthDays.map(day => {
              const dayItems = itemsByDate.get(day.dateIso) || [];
              const hasMyItems = dayItems.some(i => 
                i.organizerId === currentUser.id || i.attendeeIds.includes(currentUser.id)
              );

              return (
                <div
                  key={day.dateIso}
                  onClick={() => {
                    setSelectedDayDate(day.dateIso);
                    setViewMode('day');
                  }}
                  className={`min-h-[110px] sm:min-h-[125px] p-2 transition-colors relative group cursor-pointer ${
                    day.isCurrentMonth
                      ? 'bg-white dark:bg-neutral-900 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/30'
                      : 'bg-neutral-50/30 dark:bg-neutral-950/20 text-neutral-400 dark:text-neutral-600'
                  }`}
                >
                  {/* Day Header with Number and + Button */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {day.isToday ? (
                        <span className="text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full bg-neutral-900 dark:bg-neutral-200 text-white dark:text-neutral-900 shadow-2xs">
                          {day.dayNumber}
                        </span>
                      ) : (
                        <span className={`text-xs ${
                          day.isCurrentMonth ? 'font-medium text-neutral-700 dark:text-neutral-300' : 'text-neutral-400 dark:text-neutral-600'
                        }`}>
                          {day.dayNumber}
                        </span>
                      )}

                      {/* Personal indicator dot if today has items involving logged-in user */}
                      {hasMyItems && !day.isToday && (
                        <span 
                          className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:text-neutral-500" 
                          title="You have scheduled items on this day" 
                        />
                      )}
                    </div>

                    {/* Quick "+" button on hover to schedule on this date */}
                    <button
                      onClick={(e) => handleOpenCreateForDate(day.dateIso, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-neutral-400 hover:text-black dark:hover:text-white transition-opacity"
                      title="Schedule on this day"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Day Event / Task Chips */}
                  <div className="space-y-1 overflow-hidden">
                    {dayItems.slice(0, 3).map(item => {
                      const isMyItem = item.organizerId === currentUser.id || item.attendeeIds.includes(currentUser.id);
                      const style = getDangerBadgeStyles(item.dangerLevel, isMyItem);

                      return (
                        <div
                          key={item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemClick(item);
                          }}
                          className={`px-2 py-1 rounded text-[11px] truncate flex items-center justify-between gap-1.5 transition-colors cursor-pointer ${style.chip}`}
                          title={`${item.title} (${item.typeLabel})`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                            <span className={`truncate text-xs ${isMyItem ? 'font-semibold text-neutral-900 dark:text-neutral-100' : 'font-normal text-neutral-700 dark:text-neutral-300'}`}>
                              {item.title}
                            </span>
                          </div>

                          {item.startTime && !item.isAllDay && (
                            <span className="text-[10px] text-neutral-400 font-mono shrink-0 hidden sm:inline">
                              {item.startTime}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {/* "+N more" indicator if day has many items */}
                    {dayItems.length > 3 && (
                      <div className="text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 font-medium px-1">
                        +{dayItems.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View Area */}
      {viewMode === 'week' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl shadow-2xs overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-neutral-200/70 dark:divide-neutral-800/70 min-h-[460px]">
            {weekDays.map(day => {
              const dayItems = itemsByDate.get(day.dateIso) || [];

              return (
                <div key={day.dateIso} className="p-3 space-y-2 flex flex-col">
                  {/* Day Header */}
                  <div className={`p-2 rounded-lg flex items-center justify-between border ${
                    day.isToday 
                      ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700' 
                      : 'bg-neutral-50/50 dark:bg-neutral-800/30 border-neutral-200/60 dark:border-neutral-800'
                  }`}>
                    <div>
                      <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                        {day.dayName}
                      </div>
                      <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {day.dayNumber}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleOpenCreateForDate(day.dateIso, e)}
                      className="p-1 rounded text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                      title="Add event"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Day Items List */}
                  <div className="space-y-1.5 flex-1 overflow-y-auto">
                    {dayItems.length === 0 ? (
                      <div className="h-20 flex items-center justify-center text-[11px] text-neutral-400 italic">
                        No events
                      </div>
                    ) : (
                      dayItems.map(item => {
                        const isMyItem = item.organizerId === currentUser.id || item.attendeeIds.includes(currentUser.id);
                        const style = getDangerBadgeStyles(item.dangerLevel, isMyItem);

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className={`p-2.5 rounded-lg transition-colors cursor-pointer space-y-1.5 shadow-2xs ${style.chip}`}
                          >
                            <div className="flex items-center justify-between gap-1 text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                              <span>{item.isAllDay ? 'All Day' : (item.startTime || 'Scheduled')}</span>
                              {isMyItem && (
                                <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-neutral-300" title="Involving you" />
                              )}
                            </div>

                            <div className="font-medium text-xs text-neutral-900 dark:text-neutral-100 line-clamp-2">
                              {item.title}
                            </div>

                            {/* Attendees / Organizer Avatars */}
                            <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/5">
                              <span className="text-[9px] uppercase tracking-wider text-neutral-400 truncate">
                                {item.typeLabel}
                              </span>

                              {item.attendeeIds.length > 0 && (
                                <div className="flex -space-x-1.5 overflow-hidden">
                                  {item.attendeeIds.slice(0, 3).map(uid => {
                                    const u = users.find(usr => usr.id === uid) || (uid === currentUser.id ? currentUser : null);
                                    return (
                                      <UserAvatar 
                                        key={uid} 
                                        name={u?.name || 'User'} 
                                        avatarUrl={u?.avatarUrl} 
                                        size="xs" 
                                        color={u?.avatarColor} 
                                      />
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day / Agenda View Area */}
      {viewMode === 'day' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-neutral-400">Day Agenda</div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                {new Date(selectedDayDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDayDate}
                onChange={e => setSelectedDayDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none"
              />

              <button
                onClick={(e) => handleOpenCreateForDate(selectedDayDate, e)}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:border dark:border-neutral-700 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                + Schedule on this Day
              </button>
            </div>
          </div>

          {/* Agenda Items Timeline */}
          <div className="space-y-2.5">
            {(!itemsByDate.get(selectedDayDate) || itemsByDate.get(selectedDayDate)!.length === 0) ? (
              <div className="py-12 text-center space-y-2">
                <div className="font-medium text-sm text-neutral-700 dark:text-neutral-300">
                  No events or deadlines scheduled for this day
                </div>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Keep the team aligned by scheduling a standup, review, or focus block.
                </p>
                <button
                  onClick={(e) => handleOpenCreateForDate(selectedDayDate, e)}
                  className="mt-2 px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:border dark:border-neutral-700 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Schedule Event Now
                </button>
              </div>
            ) : (
              itemsByDate.get(selectedDayDate)!.map(item => {
                const isMyItem = item.organizerId === currentUser.id || item.attendeeIds.includes(currentUser.id);
                const style = getDangerBadgeStyles(item.dangerLevel, isMyItem);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3.5 rounded-xl transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${style.chip}`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                          {item.isAllDay ? 'All Day' : `${item.startTime || 'Scheduled'} - ${item.endTime || ''}`}
                        </span>

                        <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
                          {item.typeLabel}
                        </span>

                        {isMyItem && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                            You
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {item.title}
                      </h4>

                      {item.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 max-w-2xl">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Right Info: Attendees and Video/Location */}
                    <div className="flex items-center gap-3 shrink-0">
                      {item.meetingLink && (
                        <a
                          href={item.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:border dark:border-neutral-700 text-xs font-medium shadow-2xs transition-colors"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Call</span>
                        </a>
                      )}

                      {item.attendeeIds.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="flex -space-x-2 overflow-hidden">
                            {item.attendeeIds.slice(0, 4).map(uid => {
                              const u = users.find(usr => usr.id === uid) || (uid === currentUser.id ? currentUser : null);
                              return (
                                <UserAvatar 
                                  key={uid} 
                                  name={u?.name || 'User'} 
                                  avatarUrl={u?.avatarUrl} 
                                  size="sm" 
                                  color={u?.avatarColor} 
                                />
                              );
                            })}
                          </div>
                          {item.attendeeIds.length > 4 && (
                            <span className="text-[10px] font-mono text-neutral-400 font-medium">
                              +{item.attendeeIds.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Discreet Priority Color Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1 text-xs text-neutral-400">
        <div className="flex items-center gap-4 text-[11px]">
          <span className="font-medium text-neutral-500 dark:text-neutral-400">Priority:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-neutral-900 dark:bg-neutral-100" />
            <span className="text-neutral-600 dark:text-neutral-400">Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-neutral-600 dark:bg-neutral-400" />
            <span className="text-neutral-600 dark:text-neutral-400">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500" />
            <span className="text-neutral-600 dark:text-neutral-400">Standard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            <span className="text-neutral-600 dark:text-neutral-400">Low</span>
          </div>
        </div>

        <div className="text-[11px] text-neutral-400">
          Click any event or task to view details
        </div>
      </div>

      {/* Event Details Inspection Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedEvent(null);
        }}
        currentUser={currentUser}
        users={users}
        onToggleAttendance={handleToggleAttendance}
        onDeleteEvent={handleDeleteEvent}
      />

      {/* Schedule / Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultDate={createDefaultDate}
        currentUser={currentUser}
        users={users}
        projects={projects}
        onCreateEvent={handleCreateEvent}
      />
    </div>
  );
};
