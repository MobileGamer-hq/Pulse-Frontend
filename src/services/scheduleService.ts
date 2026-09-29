import type { ScheduleEvent } from '../types/schedule';
import { supabase, getOrgIdBySlug } from './supabaseClient';

const STORAGE_KEY_PREFIX = 'pulse_schedules_';

export const scheduleService = {
  // Purges any obsolete mock/seed events from localStorage
  clearMockData: () => {
    try {
      if (typeof window === 'undefined') return;
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
          const val = localStorage.getItem(key);
          if (val && val.includes('evt-seed-')) {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {
      // Ignore storage errors
    }
  },

  getEvents: async (orgSlug: string): Promise<ScheduleEvent[]> => {
    const cleanSlug = orgSlug.toLowerCase();
    const storageKey = `${STORAGE_KEY_PREFIX}${cleanSlug}`;

    // Clean up any residual seed events
    scheduleService.clearMockData();

    // 1. Try fetching from Supabase table if it exists
    try {
      const orgId = await getOrgIdBySlug(cleanSlug);
      if (orgId) {
        const { data, error } = await supabase
          .from('schedules')
          .select('*')
          .eq('org_id', orgId)
          .order('start_date', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: ScheduleEvent[] = data.map((item: any) => ({
            id: item.id,
            orgId: cleanSlug,
            title: item.title,
            description: item.description,
            eventType: item.event_type || 'meeting',
            dangerLevel: item.danger_level || 'medium',
            startDate: item.start_date,
            endDate: item.end_date,
            startTime: item.start_time,
            endTime: item.end_time,
            isAllDay: Boolean(item.is_all_day),
            organizerId: item.organizer_id,
            organizerName: item.organizer_name || 'Team Member',
            attendeeIds: item.attendee_ids || [],
            projectId: item.project_id,
            projectName: item.project_name,
            meetingLink: item.meeting_link,
            location: item.location,
            createdAt: item.created_at || new Date().toISOString(),
            updatedAt: item.updated_at
          }));
          localStorage.setItem(storageKey, JSON.stringify(mapped));
          return mapped;
        }
      }
    } catch {
      // Table may not exist yet in schema
    }

    // 2. Check localStorage for user-created events (filtering out any mock/seed events)
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const realEvents = parsed.filter((e: any) => e?.id && !String(e.id).startsWith('evt-seed-'));
          return realEvents;
        }
      } catch {
        // Fallback to empty
      }
    }

    // No mock data: return empty array
    return [];
  },

  createEvent: async (
    orgSlug: string, 
    eventPayload: Omit<ScheduleEvent, 'id' | 'createdAt'>
  ): Promise<ScheduleEvent> => {
    const cleanSlug = orgSlug.toLowerCase();
    const storageKey = `${STORAGE_KEY_PREFIX}${cleanSlug}`;

    const newEvent: ScheduleEvent = {
      ...eventPayload,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };

    // Save to local cache
    const existing = await scheduleService.getEvents(cleanSlug);
    const updated = [newEvent, ...existing];
    localStorage.setItem(storageKey, JSON.stringify(updated));

    // Try Supabase in background
    try {
      const orgId = await getOrgIdBySlug(cleanSlug);
      if (orgId) {
        await supabase.from('schedules').insert({
          id: newEvent.id,
          org_id: orgId,
          title: newEvent.title,
          description: newEvent.description,
          event_type: newEvent.eventType,
          danger_level: newEvent.dangerLevel,
          start_date: newEvent.startDate,
          end_date: newEvent.endDate,
          start_time: newEvent.startTime,
          end_time: newEvent.endTime,
          is_all_day: newEvent.isAllDay,
          organizer_id: newEvent.organizerId,
          organizer_name: newEvent.organizerName,
          attendee_ids: newEvent.attendeeIds,
          project_id: newEvent.projectId,
          meeting_link: newEvent.meetingLink,
          location: newEvent.location
        });
      }
    } catch {
      // Silent catch
    }

    return newEvent;
  },

  updateEvent: async (
    orgSlug: string, 
    eventId: string, 
    updates: Partial<ScheduleEvent>
  ): Promise<ScheduleEvent> => {
    const cleanSlug = orgSlug.toLowerCase();
    const storageKey = `${STORAGE_KEY_PREFIX}${cleanSlug}`;

    const existing = await scheduleService.getEvents(cleanSlug);
    let updatedEvent: ScheduleEvent | null = null;

    const updatedList = existing.map(e => {
      if (e.id === eventId) {
        updatedEvent = { ...e, ...updates, updatedAt: new Date().toISOString() };
        return updatedEvent;
      }
      return e;
    });

    if (!updatedEvent) {
      throw new Error(`Event ${eventId} not found`);
    }

    localStorage.setItem(storageKey, JSON.stringify(updatedList));

    // Try Supabase in background
    try {
      await supabase.from('schedules').update({
        title: updates.title,
        description: updates.description,
        event_type: updates.eventType,
        danger_level: updates.dangerLevel,
        start_date: updates.startDate,
        end_date: updates.endDate,
        start_time: updates.startTime,
        end_time: updates.endTime,
        is_all_day: updates.isAllDay,
        attendee_ids: updates.attendeeIds,
        meeting_link: updates.meetingLink,
        location: updates.location,
        updated_at: new Date().toISOString()
      }).eq('id', eventId);
    } catch {
      // Silent catch
    }

    return updatedEvent;
  },

  deleteEvent: async (orgSlug: string, eventId: string): Promise<void> => {
    const cleanSlug = orgSlug.toLowerCase();
    const storageKey = `${STORAGE_KEY_PREFIX}${cleanSlug}`;

    const existing = await scheduleService.getEvents(cleanSlug);
    const filtered = existing.filter(e => e.id !== eventId);
    localStorage.setItem(storageKey, JSON.stringify(filtered));

    try {
      await supabase.from('schedules').delete().eq('id', eventId);
    } catch {
      // Silent catch
    }
  },

  toggleAttendance: async (
    orgSlug: string, 
    eventId: string, 
    userId: string
  ): Promise<ScheduleEvent> => {
    const cleanSlug = orgSlug.toLowerCase();
    const existing = await scheduleService.getEvents(cleanSlug);
    const target = existing.find(e => e.id === eventId);
    if (!target) throw new Error(`Event ${eventId} not found`);

    const isAttending = target.attendeeIds.includes(userId);
    const newAttendees = isAttending 
      ? target.attendeeIds.filter(id => id !== userId)
      : [...target.attendeeIds, userId];

    return scheduleService.updateEvent(cleanSlug, eventId, {
      attendeeIds: newAttendees
    });
  }
};
