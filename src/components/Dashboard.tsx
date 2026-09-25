import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Lock, 
  Settings, 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  Utensils, 
  Dumbbell, 
  Coffee, 
  Heart, 
  Wallet, 
  Bookmark, 
  CheckSquare, 
  Sparkles, 
  FileText, 
  ChevronRight,
  ShieldCheck,
  Check,
  Smartphone,
  TrendingUp
} from 'lucide-react';
import { Tracker, SecuritySettings } from '../types.ts';

interface DashboardProps {
  trackers: Tracker[];
  securitySettings: SecuritySettings;
  onSelectTracker: (trackerId: string) => void;
  onOpenCreateModal: () => void;
  onOpenSettingsModal: () => void;
  onLockApp: () => void;
  onQuickToggleLunch: () => void;
}

// Icon mapper
function getTrackerIcon(iconName: string) {
  switch (iconName) {
    case 'utensils':
      return Utensils;
    case 'dumbbell':
      return Dumbbell;
    case 'coffee':
      return Coffee;
    case 'heart':
      return Heart;
    case 'wallet':
      return Wallet;
    case 'check-square':
      return CheckSquare;
    case 'book-open':
      return Bookmark;
    case 'sparkles':
      return Sparkles;
    case 'notes':
      return FileText;
    default:
      return CalendarIcon;
  }
}

// Color mapper
function getColorStyles(colorName: string) {
  switch (colorName) {
    case 'emerald':
      return {
        badgeBg: 'bg-emerald-500/20',
        badgeText: 'text-emerald-400',
        border: 'border-emerald-500/30',
        glow: 'shadow-emerald-500/10',
        accent: 'text-emerald-400',
      };
    case 'blue':
      return {
        badgeBg: 'bg-blue-500/20',
        badgeText: 'text-blue-400',
        border: 'border-blue-500/30',
        glow: 'shadow-blue-500/10',
        accent: 'text-blue-400',
      };
    case 'amber':
      return {
        badgeBg: 'bg-amber-500/20',
        badgeText: 'text-amber-400',
        border: 'border-amber-500/30',
        glow: 'shadow-amber-500/10',
        accent: 'text-amber-400',
      };
    case 'purple':
      return {
        badgeBg: 'bg-purple-500/20',
        badgeText: 'text-purple-400',
        border: 'border-purple-500/30',
        glow: 'shadow-purple-500/10',
        accent: 'text-purple-400',
      };
    case 'rose':
      return {
        badgeBg: 'bg-rose-500/20',
        badgeText: 'text-rose-400',
        border: 'border-rose-500/30',
        glow: 'shadow-rose-500/10',
        accent: 'text-rose-400',
      };
    default:
      return {
        badgeBg: 'bg-indigo-500/20',
        badgeText: 'text-indigo-400',
        border: 'border-indigo-500/30',
        glow: 'shadow-indigo-500/10',
        accent: 'text-indigo-400',
      };
  }
}

export default function Dashboard({
  trackers,
  securitySettings,
  onSelectTracker,
  onOpenCreateModal,
  onOpenSettingsModal,
  onLockApp,
  onQuickToggleLunch,
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const currentMonthPrefix = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Filter trackers
  const filteredTrackers = useMemo(() => {
    if (!searchQuery.trim()) return trackers;
    const q = searchQuery.toLowerCase();
    return trackers.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }, [trackers, searchQuery]);

  // Find lunch tracker for top banner
  const lunchTracker = useMemo(() => {
    return trackers.find((t) => t.id === 'tracker-yemekhane' || t.icon === 'utensils');
  }, [trackers]);

  const isLunchMarkedToday = useMemo(() => {
    if (!lunchTracker) return false;
    const entry = lunchTracker.calendarData[todayStr];
    return entry && (entry.status === 'attended' || entry.status === 'attended_both');
  }, [lunchTracker, todayStr]);

  const lunchMonthCount = useMemo(() => {
    if (!lunchTracker) return 0;
    return Object.entries(lunchTracker.calendarData).filter(
      ([d, entry]) =>
        d.startsWith(currentMonthPrefix) &&
        (entry.status === 'attended' || entry.status === 'attended_both')
    ).length;
  }, [lunchTracker, currentMonthPrefix]);

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#090d16]/85 backdrop-blur-xl border-b border-white/10 px-4 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-semibold text-base leading-tight">Kayıtlarım</h1>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-white/50">
                {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenSettingsModal}
              className="p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
              title="Ayarlar & Güvenlik"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={onLockApp}
              className="p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center gap-1"
              title="Uygulamayı Kilitle"
            >
              <Lock className="w-5 h-5 text-amber-400/90" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full px-4 pt-5 space-y-5 flex-1">
        {/* Featured Lunch Banner */}
        {lunchTracker && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-emerald-950/30 border border-emerald-500/30 p-5 shadow-xl shadow-emerald-950/30 backdrop-blur-xl"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3 relative z-10">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-medium border border-emerald-500/30 mb-2">
                  <Utensils className="w-3 h-3" />
                  <span>Öne Çıkan Takip</span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {lunchTracker.title}
                </h2>
                <p className="text-xs text-white/60 mt-0.5">
                  Bu ay yemekhanede yenen:{' '}
                  <strong className="text-white font-semibold">{lunchMonthCount} gün</strong>
                  {lunchTracker.unitCost ? ` (₺${lunchMonthCount * lunchTracker.unitCost})` : ''}
                </p>
              </div>

              <button
                onClick={() => onSelectTracker(lunchTracker.id)}
                className="p-2 rounded-2xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-colors"
                title="Takvimi Aç"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Quick 1-tap attendance toggle for today */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-white/70">
                Bugün yemekhanede yemek yediniz mi?
              </span>

              <button
                onClick={onQuickToggleLunch}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                  isLunchMarkedToday
                    ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                    : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{isLunchMarkedToday ? 'Bugün Yendi (İptal Et)' : 'Yedim Olarak İşaretle'}</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Search & Actions Bar */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kayıt veya sayfa ara..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-600/25 active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Kayıt</span>
          </button>
        </div>

        {/* Trackers List Header */}
        <div className="flex items-center justify-between px-1 text-xs text-white/50">
          <span>Kayıt Sayfaları ({filteredTrackers.length})</span>
          <span className="text-[11px] text-white/40">Detay için dokunun</span>
        </div>

        {/* Trackers Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredTrackers.map((item) => {
            const IconComponent = getTrackerIcon(item.icon);
            const style = getColorStyles(item.color);

            // Compute summary
            let summaryText = '';
            if (item.type === 'calendar') {
              const count = Object.values(item.calendarData).filter(
                (e) => e.status === 'attended' || e.status === 'attended_both'
              ).length;
              summaryText = `${count} gün işaretlendi`;
            } else if (item.type === 'counter') {
              summaryText = `${item.counterValue || 0} ${item.unitName || 'Adet'}`;
            } else if (item.type === 'checklist') {
              const total = item.checklistItems?.length || 0;
              const done = item.checklistItems?.filter((i) => i.completed).length || 0;
              summaryText = `${done}/${total} tamamlandı`;
            } else if (item.type === 'notes') {
              summaryText = item.notesContent ? 'Not kaydedildi' : 'Boş not';
            }

            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectTracker(item.id)}
                className={`p-4 rounded-3xl bg-white/[0.04] hover:bg-white/[0.07] border ${style.border} cursor-pointer transition-all flex flex-col justify-between shadow-lg ${style.glow}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-2xl ${style.badgeBg} border ${style.border} flex items-center justify-center ${style.badgeText}`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white leading-tight">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-white/40 line-clamp-1 mt-0.5">
                          {item.description || (item.type === 'calendar' ? 'Takvim kaydı' : 'Takip kaydı')}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-white/30 shrink-0 mt-1" />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className={`font-medium ${style.accent}`}>
                    {summaryText}
                  </span>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                    {item.type === 'calendar'
                      ? 'Takvim'
                      : item.type === 'counter'
                      ? 'Sayaç'
                      : item.type === 'checklist'
                      ? 'Liste'
                      : 'Not'}
                  </span>
                </div>
              </motion.div>
            );
          })}

          {/* Create New Tracker Card */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={onOpenCreateModal}
            className="p-6 rounded-3xl border-2 border-dashed border-white/15 hover:border-blue-500/50 hover:bg-white/[0.02] cursor-pointer transition-all flex flex-col items-center justify-center text-center group min-h-[120px]"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/5 group-hover:bg-blue-600/20 text-white/60 group-hover:text-blue-400 flex items-center justify-center transition-colors mb-2">
              <Plus className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-white/80 group-hover:text-white">
              Yeni Takip Sayfası Ekle
            </div>
            <div className="text-[10px] text-white/40 mt-0.5">
              İstediğiniz isimde yeni bir modül açın
            </div>
          </motion.div>
        </div>

        {/* iPhone PWA Promotion Card */}
        <div className="mt-8 p-4 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">
                iPhone Ana Ekrana Ekleme
              </div>
              <div className="text-[11px] text-white/50">
                Face ID ile şifresiz giriş için Safari üzerinden ana ekrana ekleyin.
              </div>
            </div>
          </div>
          <button
            onClick={onOpenSettingsModal}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-xs font-medium shrink-0 transition-colors"
          >
            Nasıl Yapılır?
          </button>
        </div>
      </div>
    </div>
  );
}
