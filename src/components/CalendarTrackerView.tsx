import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Utensils, 
  Check, 
  X, 
  Clock, 
  FileText, 
  Trash2, 
  Sparkles, 
  ArrowLeft,
  Settings2,
  TrendingUp,
  Moon,
  Sun,
  Coffee,
  List,
  Grid,
  Camera,
  RotateCcw,
  Mic
} from 'lucide-react';
import { Tracker, CalendarEntry, DayStatus } from '../types.ts';
import MenuUploadModal from './MenuUploadModal.tsx';
import SiriIntegrationModal from './SiriIntegrationModal.tsx';

interface CalendarTrackerViewProps {
  tracker: Tracker;
  onBack: () => void;
  onUpdateTracker: (updated: Tracker) => void;
  onDeleteTracker: (id: string) => void;
}

const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const WEEKDAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function CalendarTrackerView({
  tracker,
  onBack,
  onUpdateTracker,
  onDeleteTracker,
}: CalendarTrackerViewProps) {
  const today = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth()); // 0-11
  
  // Selected date modal for detailed editing
  const [activeDateModal, setActiveDateModal] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<string>('');
  const [menuInput, setMenuInput] = useState<string>('');
  const [isMenuUploadOpen, setIsMenuUploadOpen] = useState<boolean>(false);
  const [isSiriModalOpen, setIsSiriModalOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [unitCostInput, setUnitCostInput] = useState<number>(tracker.unitCost || 95);

  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  // Auto-sync calendar menu data to server cache for Siri
  useEffect(() => {
    const syncMap: Record<string, string> = {};
    if (tracker.calendarData) {
      Object.entries(tracker.calendarData).forEach(([dateStr, entry]) => {
        if (entry.menuText) {
          syncMap[dateStr] = entry.menuText;
        }
      });
    }

    if (Object.keys(syncMap).length > 0) {
      fetch('/api/sync-menu-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuMap: syncMap }),
      }).catch(console.warn);
    }
  }, [tracker.calendarData]);

  // Navigate months
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    
    // Day of week for 1st of month: 0 (Sun) to 6 (Sat)
    // Convert to Monday = 0, Sunday = 6
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const totalDays = lastDay.getDate();
    const days: Array<{
      dayNum: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      entry?: CalendarEntry;
    }> = [];

    // Previous month padding
    const prevMonthLastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const m = selectedMonth === 0 ? 12 : selectedMonth;
      const y = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        entry: tracker.calendarData[dateStr],
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        entry: tracker.calendarData[dateStr],
      });
    }

    // Next month padding to fill grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const m = selectedMonth === 11 ? 1 : selectedMonth + 2;
      const y = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dayNum: i,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        entry: tracker.calendarData[dateStr],
      });
    }

    return days;
  }, [selectedYear, selectedMonth, todayStr, tracker.calendarData]);

  // Statistics for selected month
  const monthStats = useMemo(() => {
    let attendedDaysCount = 0;
    let totalMealsCount = 0;
    let totalCost = 0;
    let holidayCount = 0;

    const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

    Object.entries(tracker.calendarData).forEach(([dateStr, entry]) => {
      if (dateStr.startsWith(monthPrefix)) {
        if (entry.status === 'attended') {
          attendedDaysCount += 1;
          totalMealsCount += 1;
          totalCost += entry.cost ?? tracker.unitCost ?? 0;
        } else if (entry.status === 'attended_both') {
          attendedDaysCount += 1;
          totalMealsCount += 2;
          totalCost += entry.cost ?? (tracker.unitCost ? tracker.unitCost * 2 : 0);
        } else if (entry.status === 'attended_dinner') {
          attendedDaysCount += 1;
          totalMealsCount += 1;
          totalCost += entry.cost ?? tracker.unitCost ?? 0;
        } else if (entry.status === 'holiday') {
          holidayCount += 1;
        }
      }
    });

    return {
      attendedDaysCount,
      totalMealsCount,
      totalCost,
      holidayCount,
    };
  }, [tracker.calendarData, tracker.unitCost, selectedMonth, selectedYear]);

  // Quick 1-tap toggle day
  const handleQuickToggleDay = (dateStr: string) => {
    const existing = tracker.calendarData[dateStr];
    let nextStatus: DayStatus = 'attended';
    let nextMealType: 'lunch' | 'dinner' | 'both' = 'lunch';

    if (!existing || existing.status === 'none') {
      nextStatus = 'attended';
      nextMealType = 'lunch';
      // Little confetti on marking today
      if (dateStr === todayStr) {
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
      }
    } else if (existing.status === 'attended') {
      nextStatus = 'attended_both';
      nextMealType = 'both';
    } else if (existing.status === 'attended_both') {
      nextStatus = 'holiday';
    } else {
      nextStatus = 'none';
    }

    const updatedData = { ...tracker.calendarData };
    if (nextStatus === 'none') {
      if (existing?.menuText) {
        updatedData[dateStr] = {
          ...existing,
          status: 'none',
          cost: 0,
          updatedAt: Date.now(),
        };
      } else {
        delete updatedData[dateStr];
      }
    } else {
      const defaultCost = tracker.unitCost || 0;
      const cost = nextStatus === 'attended_both' ? defaultCost * 2 : nextStatus === 'holiday' ? 0 : defaultCost;
      updatedData[dateStr] = {
        date: dateStr,
        status: nextStatus,
        mealType: nextMealType,
        cost,
        note: existing?.note || '',
        menuText: existing?.menuText,
        dishes: existing?.dishes,
        updatedAt: Date.now(),
      };
    }

    onUpdateTracker({
      ...tracker,
      calendarData: updatedData,
    });
  };

  // Detailed modal edit
  const openDayModal = (dateStr: string) => {
    setActiveDateModal(dateStr);
    const existing = tracker.calendarData[dateStr];
    setNoteInput(existing?.note || '');
    setMenuInput(existing?.menuText || '');
  };

  const handleApplyMenu = (menuEntries: Record<string, Partial<CalendarEntry>>) => {
    const updatedData = { ...tracker.calendarData };
    const syncMap: Record<string, string> = {};

    Object.entries(menuEntries).forEach(([dateStr, entry]) => {
      const existing = updatedData[dateStr];
      const menuText = entry.menuText || '';
      const dishes = entry.dishes || (menuText ? menuText.split(',').map((s) => s.trim()).filter(Boolean) : undefined);
      
      // Preserve existing attendance status ONLY IF user had explicitly marked it before.
      // If the day was unmarked or none, keep it as 'none' (or holiday if it's explicitly a holiday).
      // NEVER automatically mark as 'attended'!
      const finalStatus: DayStatus = existing && existing.status !== 'none'
        ? existing.status
        : entry.status === 'holiday'
        ? 'holiday'
        : 'none';

      updatedData[dateStr] = {
        date: dateStr,
        status: finalStatus,
        mealType: existing?.mealType || (finalStatus === 'attended' ? 'lunch' : undefined),
        cost: finalStatus === 'attended' ? (existing?.cost ?? tracker.unitCost ?? 95) : (finalStatus === 'attended_both' ? (tracker.unitCost || 95) * 2 : 0),
        note: existing?.note || '',
        menuText,
        dishes,
        updatedAt: Date.now(),
      };

      if (menuText) {
        syncMap[dateStr] = menuText;
      }
    });

    onUpdateTracker({
      ...tracker,
      calendarData: updatedData,
    });

    // Sync menu cache for Siri endpoint
    fetch('/api/sync-menu-cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuMap: syncMap }),
    }).catch(console.warn);
  };

  const handleSetDayStatus = (status: DayStatus, mealType: 'lunch' | 'dinner' | 'both' = 'lunch') => {
    if (!activeDateModal) return;
    const updatedData = { ...tracker.calendarData };
    
    if (status === 'none') {
      if (updatedData[activeDateModal]?.menuText) {
        updatedData[activeDateModal] = {
          ...updatedData[activeDateModal],
          status: 'none',
          cost: 0,
          updatedAt: Date.now(),
        };
      } else {
        delete updatedData[activeDateModal];
      }
    } else {
      const defaultCost = tracker.unitCost || 0;
      let cost = defaultCost;
      if (status === 'attended_both') cost = defaultCost * 2;
      if (status === 'holiday') cost = 0;

      const trimmedMenu = menuInput.trim();
      const dishesList = trimmedMenu ? trimmedMenu.split(',').map((s) => s.trim()).filter(Boolean) : undefined;

      updatedData[activeDateModal] = {
        date: activeDateModal,
        status,
        mealType,
        cost,
        note: noteInput.trim(),
        menuText: trimmedMenu || undefined,
        dishes: dishesList,
        updatedAt: Date.now(),
      };

      if (trimmedMenu) {
        fetch('/api/sync-menu-cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ menuMap: { [activeDateModal]: trimmedMenu } }),
        }).catch(console.warn);
      }

      if (activeDateModal === todayStr) {
        confetti({ particleCount: 40, spread: 70, origin: { y: 0.7 } });
      }
    }

    onUpdateTracker({
      ...tracker,
      calendarData: updatedData,
    });
    setActiveDateModal(null);
  };

  const handleSaveSettings = () => {
    onUpdateTracker({
      ...tracker,
      unitCost: unitCostInput,
    });
    setShowSettingsModal(false);
  };

  const handleResetMonthAttendance = () => {
    const currentMonthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    const updatedData = { ...tracker.calendarData };

    Object.keys(updatedData).forEach((dateStr) => {
      if (dateStr.startsWith(currentMonthPrefix)) {
        if (updatedData[dateStr].status !== 'none') {
          updatedData[dateStr] = {
            ...updatedData[dateStr],
            status: 'none',
            cost: 0,
            updatedAt: Date.now(),
          };
        }
      }
    });

    onUpdateTracker({
      ...tracker,
      calendarData: updatedData,
    });
    setShowSettingsModal(false);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col pb-12">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#090d16]/85 backdrop-blur-xl border-b border-white/10 px-4 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-semibold text-base leading-tight">{tracker.title}</h1>
                <p className="text-xs text-white/50">{tracker.description || 'Yemekhane takip takvimi'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsSiriModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-purple-600/25 hover:bg-purple-600/35 border border-purple-500/30 text-purple-200 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
              title="Siri Sesli Yanıt Servisi & Bağlantı Linki"
            >
              <Mic className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Siri Servisi</span>
              <span className="sm:hidden">Siri</span>
            </button>
            <button
              onClick={() => setIsMenuUploadOpen(true)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/30 active:scale-95 transition-all"
              title="Aylık Menü Fotoğrafı Yükle"
            >
              <Camera className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">Aylık Menü Yükle</span>
              <span className="sm:hidden">Menü Yükle</span>
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title={viewMode === 'calendar' ? 'Liste Görünümü' : 'Takvim Görünümü'}
            >
              {viewMode === 'calendar' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Takvim Ayarları"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 pt-4 flex-1">
        {/* Month Selector Bar */}
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-2 mb-4 backdrop-blur-md">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl hover:bg-white/10 active:scale-95 text-white/70 hover:text-white transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-white tracking-wide">
              {MONTH_NAMES_TR[selectedMonth]} {selectedYear}
            </span>
            <button
              onClick={handleGoToday}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
            >
              Bugün
            </button>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl hover:bg-white/10 active:scale-95 text-white/70 hover:text-white transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Month Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-gradient-to-br from-emerald-950/40 to-emerald-900/20 border border-emerald-500/20 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mb-1">
              <Utensils className="w-3.5 h-3.5" />
              <span>Yenen Öğün</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {monthStats.totalMealsCount}{' '}
              <span className="text-xs font-normal text-white/50">öğün</span>
            </div>
            <div className="text-[11px] text-emerald-300/70 mt-0.5">
              {monthStats.attendedDaysCount} günde yendi
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-950/40 to-blue-900/20 border border-blue-500/20 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium mb-1">
              <span className="w-3.5 h-3.5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center font-bold text-[10px] text-blue-300">₺</span>
              <span>Maliyet</span>
            </div>
            <div className="text-2xl font-bold text-white">
              ₺{monthStats.totalCost}
            </div>
            <div className="text-[11px] text-blue-300/70 mt-0.5">
              Birim: ₺{tracker.unitCost || 95} / öğün
            </div>
          </div>
        </div>

        {/* Legend / Info hints */}
        <div className="flex flex-wrap items-center justify-between text-xs text-white/60 mb-3 px-1 gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Öğle Yendi</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Öğle + Akşam</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Tatil</span>
            </div>
          </div>
          <span className="text-[11px] text-white/40 italic">
            *Dokunarak hızlıca işaretleyin
          </span>
        </div>

        {/* Main View: Calendar or List */}
        {viewMode === 'calendar' ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-3 sm:p-4 backdrop-blur-xl shadow-xl">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
              {WEEKDAYS_TR.map((wd, i) => (
                <div
                  key={wd}
                  className={`text-xs font-semibold py-1 ${
                    i >= 5 ? 'text-rose-400/80' : 'text-white/50'
                  }`}
                >
                  {wd}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarDays.map((item, idx) => {
                const entry = item.entry;
                const isAttended = entry?.status === 'attended';
                const isBoth = entry?.status === 'attended_both';
                const isDinnerOnly = entry?.status === 'attended_dinner';
                const isHoliday = entry?.status === 'holiday';

                let bgClass = 'bg-white/[0.03] text-white/70 hover:bg-white/[0.08]';
                let borderClass = 'border-white/5';

                if (isBoth) {
                  bgClass = 'bg-amber-500/25 text-amber-200 shadow-sm shadow-amber-500/20';
                  borderClass = 'border-amber-500/50';
                } else if (isAttended) {
                  bgClass = 'bg-emerald-500/25 text-emerald-200 shadow-sm shadow-emerald-500/20';
                  borderClass = 'border-emerald-500/50';
                } else if (isDinnerOnly) {
                  bgClass = 'bg-blue-500/25 text-blue-200 shadow-sm shadow-blue-500/20';
                  borderClass = 'border-blue-500/50';
                } else if (isHoliday) {
                  bgClass = 'bg-rose-500/15 text-rose-300';
                  borderClass = 'border-rose-500/30';
                }

                if (!item.isCurrentMonth) {
                  bgClass = 'opacity-30 pointer-events-none';
                }

                return (
                  <motion.div
                    key={idx}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => item.isCurrentMonth && handleQuickToggleDay(item.dateStr)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (item.isCurrentMonth) openDayModal(item.dateStr);
                    }}
                    className={`relative min-h-[58px] sm:min-h-[68px] p-1.5 rounded-2xl border flex flex-col justify-between cursor-pointer select-none transition-all ${bgClass} ${borderClass} ${
                      item.isToday ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-[#090d16]' : ''
                    }`}
                  >
                    {/* Day number & indicators */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold ${
                          item.isToday
                            ? 'w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center -ml-0.5 -mt-0.5 shadow-sm'
                            : ''
                        }`}
                      >
                        {item.dayNum}
                      </span>

                      {/* Detail button */}
                      {item.isCurrentMonth && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDayModal(item.dateStr);
                          }}
                          className="w-4 h-4 rounded-full flex items-center justify-center text-white/30 hover:text-white/80 hover:bg-white/10"
                          title="Detay & Not"
                        >
                          <FileText className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    {/* Badge / Status description */}
                    <div className="mt-1 flex flex-col gap-0.5">
                      {isAttended && (
                        <div className="text-[10px] font-medium text-emerald-300 flex items-center gap-0.5 leading-tight truncate">
                          <Check className="w-2.5 h-2.5 shrink-0" />
                          <span>Öğle</span>
                        </div>
                      )}
                      {isBoth && (
                        <div className="text-[10px] font-medium text-amber-300 flex items-center gap-0.5 leading-tight truncate">
                          <Sparkles className="w-2.5 h-2.5 shrink-0" />
                          <span>2 Öğün</span>
                        </div>
                      )}
                      {isHoliday && (
                        <div className="text-[10px] font-medium text-rose-300 flex items-center gap-0.5 leading-tight truncate">
                          <X className="w-2.5 h-2.5 shrink-0" />
                          <span>Tatil</span>
                        </div>
                      )}
                      {entry?.menuText && (
                        <div className="text-[9px] text-amber-300/90 truncate flex items-center gap-1 font-medium bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20" title={entry.menuText}>
                          <Utensils className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                          <span className="truncate">{entry.menuText}</span>
                        </div>
                      )}
                      {entry?.note && entry.note !== entry.menuText && (
                        <div className="text-[9px] text-white/50 truncate italic">
                          {entry.note}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          /* List View */
          <div className="bg-white/5 border border-white/10 rounded-3xl p-4 backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-white/80 mb-3">
              {MONTH_NAMES_TR[selectedMonth]} {selectedYear} Kayıtları
            </h3>
            <div className="divide-y divide-white/10">
              {Object.entries(tracker.calendarData)
                .filter(([dateStr]) =>
                  dateStr.startsWith(
                    `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`
                  )
                )
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([dateStr, entry]) => (
                  <div
                    key={dateStr}
                    onClick={() => openDayModal(dateStr)}
                    className="py-3 flex items-center justify-between hover:bg-white/5 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          entry.status === 'attended'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : entry.status === 'attended_both'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {entry.status === 'holiday' ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <Utensils className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {new Date(dateStr).toLocaleDateString('tr-TR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </div>
                        <div className="text-xs text-white/50">
                          {entry.status === 'attended'
                            ? 'Öğle Yemeği Yendi'
                            : entry.status === 'attended_both'
                            ? 'Öğle ve Akşam Yemeği Yendi'
                            : 'Tatil / İzin'}
                          {entry.note ? ` • ${entry.note}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-emerald-400">
                      {entry.cost ? `₺${entry.cost}` : '₺0'}
                    </div>
                  </div>
                ))}
              {Object.keys(tracker.calendarData).filter((d) =>
                d.startsWith(`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`)
              ).length === 0 && (
                <div className="py-8 text-center text-white/40 text-sm">
                  Bu ay için henüz işaretlenmiş kayıt bulunmuyor. Takvimden günlere dokunarak işaretleyebilirsiniz.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Today's Quick Bar at the bottom of the page */}
        <div className="mt-5 bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-blue-900/40 border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-blue-300 font-medium">Bugün İçin Hızlı Kayıt</div>
              <div className="text-sm font-semibold text-white">
                {tracker.calendarData[todayStr]?.status === 'attended'
                  ? '✓ Bugün Yemekhanede Yendi'
                  : tracker.calendarData[todayStr]?.status === 'attended_both'
                  ? '✓ Bugün 2 Öğün Yendi'
                  : tracker.calendarData[todayStr]?.status === 'holiday'
                  ? 'Bugün Tatil Olarak İşaretli'
                  : 'Bugün henüz işaretlenmedi'}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleQuickToggleDay(todayStr)}
            className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-medium text-xs shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{tracker.calendarData[todayStr] ? 'Değiştir' : 'Yedim Olarak İşaretle'}</span>
          </button>
        </div>
      </div>

      {/* Date Detail Modal */}
      <AnimatePresence>
        {activeDateModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="bg-[#121929] border border-white/15 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {new Date(activeDateModal).toLocaleDateString('tr-TR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </h3>
                  <p className="text-xs text-white/50">Günün durumunu seçin veya not ekleyin</p>
                </div>
                <button
                  onClick={() => setActiveDateModal(null)}
                  className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Selection Buttons */}
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <button
                  onClick={() => handleSetDayStatus('attended', 'lunch')}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                    tracker.calendarData[activeDateModal]?.status === 'attended'
                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                      : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Utensils className="w-4 h-4 text-emerald-400" />
                    {tracker.calendarData[activeDateModal]?.status === 'attended' && (
                      <Check className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <span className="text-sm font-semibold">Öğle Yemeği</span>
                  <span className="text-[11px] text-white/50">Standart öğün (₺{tracker.unitCost || 95})</span>
                </button>

                <button
                  onClick={() => handleSetDayStatus('attended_both', 'both')}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                    tracker.calendarData[activeDateModal]?.status === 'attended_both'
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                      : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    {tracker.calendarData[activeDateModal]?.status === 'attended_both' && (
                      <Check className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <span className="text-sm font-semibold">Öğle + Akşam</span>
                  <span className="text-[11px] text-white/50">2 Öğün (₺{(tracker.unitCost || 95) * 2})</span>
                </button>

                <button
                  onClick={() => handleSetDayStatus('holiday', 'lunch')}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                    tracker.calendarData[activeDateModal]?.status === 'holiday'
                      ? 'bg-rose-500/25 border-rose-400 text-rose-200'
                      : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <X className="w-4 h-4 text-rose-400" />
                    {tracker.calendarData[activeDateModal]?.status === 'holiday' && (
                      <Check className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                  <span className="text-sm font-semibold">Tatil / İzin</span>
                  <span className="text-[11px] text-white/50">Yemekhaneye gidilmedi</span>
                </button>

                <button
                  onClick={() => handleSetDayStatus('none')}
                  className="p-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 text-left flex flex-col gap-1 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <Trash2 className="w-4 h-4 text-white/40" />
                  </div>
                  <span className="text-sm font-medium">İşareti Kaldır</span>
                  <span className="text-[11px] text-white/40">Boş güne çevir</span>
                </button>
              </div>

              {/* Menu input */}
              <div className="mb-3.5 p-3.5 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-amber-400" />
                    <span>Günün Menüsü (Yemekler)</span>
                  </label>
                  {tracker.calendarData[activeDateModal]?.dishes && tracker.calendarData[activeDateModal]?.dishes!.length > 0 && (
                    <span className="text-[10px] text-amber-300/80 font-medium">
                      {tracker.calendarData[activeDateModal]?.dishes!.length} çeşit
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={menuInput}
                  onChange={(e) => setMenuInput(e.target.value)}
                  placeholder="Örn: Mercimek Çorbası, Orman Kebabı, Pirinç Pilavı, Ayran"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/20 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400/60 transition-colors"
                />
                {tracker.calendarData[activeDateModal]?.dishes && tracker.calendarData[activeDateModal]?.dishes!.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tracker.calendarData[activeDateModal]?.dishes!.map((dish, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 text-[10px] font-medium border border-amber-500/30"
                      >
                        {dish}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Note input */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-white/70 mb-1.5">
                  Kişisel Not (İsteğe bağlı)
                </label>
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Örn: Yemek çok lezzetliydi, tatlı ekstra alındı"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Save with Note Button */}
              <button
                onClick={() => {
                  const currentStatus = tracker.calendarData[activeDateModal]?.status || 'attended';
                  handleSetDayStatus(currentStatus);
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <Check className="w-4 h-4" />
                <span>Kaydet & Kapat</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tracker Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#121929] border border-white/15 rounded-3xl p-6 w-full max-w-sm text-left shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-white mb-1">
                Yemekhane Ayarları
              </h3>
              <p className="text-xs text-white/60 mb-4">
                Öğün başı yemekhane ücretini güncelleyerek toplam maliyet hesabını özelleştirin.
              </p>

              <div className="mb-4">
                <label className="block text-xs font-medium text-white/70 mb-1.5">
                  1 Öğün Yemek Ücreti (TL)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm text-white/50">₺</span>
                  <input
                    type="number"
                    value={unitCostInput}
                    onChange={(e) => setUnitCostInput(Number(e.target.value))}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveSettings}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Kaydet
                </button>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-3 bg-white/10 hover:bg-white/15 text-white/80 rounded-xl text-sm font-medium transition-colors"
                >
                  Vazgeç
                </button>
              </div>

              {/* Reset attendance marks button */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleResetMonthAttendance}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Bu Ayın "Yedim" İşaretlerini Sıfırla (Menüleri Koru)</span>
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    if (confirm('Bu takip kaydını ve tüm geçmişini silmek istediğinize emin misiniz?')) {
                      onDeleteTracker(tracker.id);
                      onBack();
                    }
                  }}
                  className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bu Takibi Sil</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Menu Photo Upload & AI Parse Modal */}
      <MenuUploadModal
        isOpen={isMenuUploadOpen}
        onClose={() => setIsMenuUploadOpen(false)}
        targetYear={selectedYear}
        targetMonth={selectedMonth}
        onApplyMenu={handleApplyMenu}
      />

      {/* Siri Integration & Test Modal */}
      <SiriIntegrationModal
        isOpen={isSiriModalOpen}
        onClose={() => setIsSiriModalOpen(false)}
      />
    </div>
  );
}
