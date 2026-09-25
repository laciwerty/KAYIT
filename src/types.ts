export type TrackerType = 'calendar' | 'counter' | 'checklist' | 'notes';

export type DayStatus = 'attended' | 'attended_both' | 'attended_dinner' | 'holiday' | 'none';

export interface CalendarEntry {
  date: string; // YYYY-MM-DD
  status: DayStatus;
  mealType?: 'lunch' | 'dinner' | 'both';
  cost?: number;
  note?: string;
  updatedAt: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface Tracker {
  id: string;
  title: string;
  description?: string;
  icon: string;
  color: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'indigo' | 'cyan' | 'orange';
  type: TrackerType;
  unitName?: string; // e.g. "Öğün", "Gün", "TL", "Bardak"
  unitCost?: number; // e.g. 45 (TL/öğün)
  calendarData: Record<string, CalendarEntry>; // YYYY-MM-DD -> CalendarEntry
  counterValue?: number;
  checklistItems?: ChecklistItem[];
  notesContent?: string;
  createdAt: string;
  isPinned?: boolean;
}

export interface SecuritySettings {
  isPinSet: boolean;
  pinCode: string; // 4 or 6 digit PIN
  faceIdEnabled: boolean;
  hasPasskey: boolean;
  passkeyCredentialId?: string;
  autoLockMinutes: number; // 0: hemen, 1: 1 dk, 5: 5 dk, 15: 15 dk, -1: hiçbir zaman
  userName: string;
}
