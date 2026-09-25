import { SecuritySettings, Tracker, CalendarEntry } from '../types.ts';

const TRACKERS_STORAGE_KEY = 'user_trackers_v1';
const SECURITY_STORAGE_KEY = 'user_security_v1';
const LAST_ACTIVE_KEY = 'user_last_active_v1';

// Generate current month YYYY-MM-DD helper
function getSampleDateString(dayOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dayOffset);
  return d.toISOString().split('T')[0];
}

const DEFAULT_TRACKERS: Tracker[] = [
  {
    id: 'tracker-yemekhane',
    title: 'Yemekhane Takvimi',
    description: 'Yemekhanede yediğim günleri ve öğünleri takip etme',
    icon: 'utensils',
    color: 'emerald',
    type: 'calendar',
    unitName: 'Öğün',
    unitCost: 45,
    isPinned: true,
    createdAt: new Date().toISOString(),
    calendarData: {
      [getSampleDateString(0)]: {
        date: getSampleDateString(0),
        status: 'attended',
        mealType: 'lunch',
        cost: 45,
        note: 'Öğle yemeği yendi',
        updatedAt: Date.now(),
      },
      [getSampleDateString(1)]: {
        date: getSampleDateString(1),
        status: 'attended',
        mealType: 'lunch',
        cost: 45,
        note: 'Tavuk sote ve pilav',
        updatedAt: Date.now() - 86400000,
      },
      [getSampleDateString(2)]: {
        date: getSampleDateString(2),
        status: 'attended_both',
        mealType: 'both',
        cost: 90,
        note: 'Öğle ve akşam nöbet yemeği',
        updatedAt: Date.now() - 86400000 * 2,
      },
      [getSampleDateString(3)]: {
        date: getSampleDateString(3),
        status: 'attended',
        mealType: 'lunch',
        cost: 45,
        updatedAt: Date.now() - 86400000 * 3,
      },
      [getSampleDateString(6)]: {
        date: getSampleDateString(6),
        status: 'holiday',
        cost: 0,
        note: 'Hafta sonu / Tatil',
        updatedAt: Date.now() - 86400000 * 6,
      },
      [getSampleDateString(7)]: {
        date: getSampleDateString(7),
        status: 'holiday',
        cost: 0,
        note: 'Hafta sonu',
        updatedAt: Date.now() - 86400000 * 7,
      },
      [getSampleDateString(8)]: {
        date: getSampleDateString(8),
        status: 'attended',
        mealType: 'lunch',
        cost: 45,
        updatedAt: Date.now() - 86400000 * 8,
      },
      [getSampleDateString(9)]: {
        date: getSampleDateString(9),
        status: 'attended',
        mealType: 'lunch',
        cost: 45,
        updatedAt: Date.now() - 86400000 * 9,
      },
    },
  },
  {
    id: 'tracker-spor',
    title: 'Spor & Egzersiz',
    description: 'Haftalık spor ve yürüyüş günleri',
    icon: 'dumbbell',
    color: 'blue',
    type: 'calendar',
    unitName: 'Gün',
    isPinned: false,
    createdAt: new Date().toISOString(),
    calendarData: {
      [getSampleDateString(1)]: {
        date: getSampleDateString(1),
        status: 'attended',
        note: '45 dk kardiyo ve ağırlık',
        updatedAt: Date.now() - 86400000,
      },
      [getSampleDateString(3)]: {
        date: getSampleDateString(3),
        status: 'attended',
        note: 'Tempolu yürüyüş 6 km',
        updatedAt: Date.now() - 86400000 * 3,
      },
    },
  },
  {
    id: 'tracker-kahve',
    title: 'Kahve & İçecek',
    description: 'Günlük içilen kahve adedi sayacı',
    icon: 'coffee',
    color: 'amber',
    type: 'counter',
    counterValue: 2,
    unitName: 'Fincan',
    isPinned: false,
    createdAt: new Date().toISOString(),
    calendarData: {},
  },
];

const DEFAULT_SECURITY: SecuritySettings = {
  isPinSet: true,
  pinCode: '1234', // Default easy PIN for initial onboarding, user can change anytime
  faceIdEnabled: true,
  hasPasskey: false,
  autoLockMinutes: 5,
  userName: 'Erdem',
};

export function loadTrackers(): Tracker[] {
  try {
    const raw = localStorage.getItem(TRACKERS_STORAGE_KEY);
    if (!raw) {
      saveTrackers(DEFAULT_TRACKERS);
      return DEFAULT_TRACKERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading trackers:', e);
    return DEFAULT_TRACKERS;
  }
}

export function saveTrackers(trackers: Tracker[]): void {
  try {
    localStorage.setItem(TRACKERS_STORAGE_KEY, JSON.stringify(trackers));
  } catch (e) {
    console.error('Error saving trackers:', e);
  }
}

export function loadSecuritySettings(): SecuritySettings {
  try {
    const raw = localStorage.getItem(SECURITY_STORAGE_KEY);
    if (!raw) {
      saveSecuritySettings(DEFAULT_SECURITY);
      return DEFAULT_SECURITY;
    }
    return { ...DEFAULT_SECURITY, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error loading security settings:', e);
    return DEFAULT_SECURITY;
  }
}

export function saveSecuritySettings(settings: SecuritySettings): void {
  try {
    localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving security settings:', e);
  }
}

export function recordActivity(): void {
  localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
}

export function shouldAutoLock(autoLockMinutes: number): boolean {
  if (autoLockMinutes === -1) return false;
  if (autoLockMinutes === 0) return true;
  const lastActiveStr = localStorage.getItem(LAST_ACTIVE_KEY);
  if (!lastActiveStr) return true;
  const lastActive = parseInt(lastActiveStr, 10);
  const diffMinutes = (Date.now() - lastActive) / (1000 * 60);
  return diffMinutes >= autoLockMinutes;
}

export function exportBackupData(): string {
  const data = {
    trackers: loadTrackers(),
    security: {
      ...loadSecuritySettings(),
      // Export with faceId and PIN flag preserved
    },
    exportDate: new Date().toISOString(),
    version: '1.0',
  };
  return JSON.stringify(data, null, 2);
}

export function importBackupData(jsonString: string): { success: boolean; message: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.trackers || !Array.isArray(parsed.trackers)) {
      return { success: false, message: 'Geçersiz yedek dosyası formatı.' };
    }
    saveTrackers(parsed.trackers);
    if (parsed.security) {
      const current = loadSecuritySettings();
      saveSecuritySettings({
        ...current,
        ...parsed.security,
      });
    }
    return { success: true, message: 'Yedek başarıyla geri yüklendi!' };
  } catch (e) {
    return { success: false, message: 'Dosya okunamadı: ' + (e as Error).message };
  }
}
