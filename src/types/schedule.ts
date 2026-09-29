export type ScheduleEventType = 
  | 'meeting' 
  | 'standup' 
  | 'sprint_review' 
  | 'one_on_one' 
  | 'workshop' 
  | 'focus_time' 
  | 'client_sync' 
  | 'deadline'
  | 'incident';

export type DangerImportanceLevel = 
  | 'critical' // Red: high danger / critical blocker / emergency / hard cutoff
  | 'high'     // Amber: high importance / key executive review / milestone
  | 'medium'   // Indigo/Blue: regular team sync / collaborative discussion
  | 'low';     // Emerald/Slate: low stress / 1-on-1 / casual catchup

export interface ScheduleEvent {
  id: string;
  orgId: string;
  title: string;
  description?: string;
  eventType: ScheduleEventType;
  dangerLevel: DangerImportanceLevel;
  startDate: string; // ISO format: YYYY-MM-DD
  endDate?: string;   // ISO format: YYYY-MM-DD
  startTime?: string; // "HH:MM" e.g. "09:30"
  endTime?: string;   // "HH:MM" e.g. "10:30"
  isAllDay?: boolean;
  organizerId: string;
  organizerName: string;
  organizerAvatar?: string;
  attendeeIds: string[];
  projectId?: string;
  projectName?: string;
  meetingLink?: string;
  location?: string;
  createdAt: string;
  updatedAt?: string;
}

export type CalendarItemSource = 'event' | 'task';

export interface CalendarItem {
  id: string;
  source: CalendarItemSource;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  dangerLevel: DangerImportanceLevel;
  typeLabel: string;
  description?: string;
  organizerId?: string;
  organizerName?: string;
  attendeeIds: string[]; // user IDs (for tasks, assigneeIds)
  projectId?: string;
  projectName?: string;
  meetingLink?: string;
  rawEvent?: ScheduleEvent;
  rawTaskId?: string;
  taskStatus?: string;
  taskPriority?: string;
}
