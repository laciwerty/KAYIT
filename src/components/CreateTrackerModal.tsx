import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Plus, 
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
  Hash
} from 'lucide-react';
import { Tracker, TrackerType } from '../types.ts';

interface CreateTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newTracker: Tracker) => void;
}

const AVAILABLE_ICONS = [
  { id: 'utensils', label: 'Yemekhane / Yemek', icon: Utensils },
  { id: 'calendar', label: 'Takvim', icon: CalendarIcon },
  { id: 'dumbbell', label: 'Spor & Egzersiz', icon: Dumbbell },
  { id: 'coffee', label: 'Kahve & İçecek', icon: Coffee },
  { id: 'heart', label: 'Sağlık', icon: Heart },
  { id: 'wallet', label: 'Harcama / Finans', icon: Wallet },
  { id: 'check-square', label: 'Kontrol Listesi', icon: CheckSquare },
  { id: 'book-open', label: 'Okuma / Not', icon: Bookmark },
  { id: 'sparkles', label: 'Alışkanlık', icon: Sparkles },
];

const AVAILABLE_COLORS = [
  { id: 'emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-400' },
  { id: 'blue', bg: 'bg-blue-500', ring: 'ring-blue-400' },
  { id: 'amber', bg: 'bg-amber-500', ring: 'ring-amber-400' },
  { id: 'purple', bg: 'bg-purple-500', ring: 'ring-purple-400' },
  { id: 'rose', bg: 'bg-rose-500', ring: 'ring-rose-400' },
  { id: 'indigo', bg: 'bg-indigo-500', ring: 'ring-indigo-400' },
] as const;

export default function CreateTrackerModal({
  isOpen,
  onClose,
  onCreate,
}: CreateTrackerModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [trackerType, setTrackerType] = useState<TrackerType>('calendar');
  const [selectedIcon, setSelectedIcon] = useState('utensils');
  const [selectedColor, setSelectedColor] = useState<'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'indigo'>('emerald');
  const [unitCost, setUnitCost] = useState<number>(95);
  const [unitName, setUnitName] = useState<string>('Öğün');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTracker: Tracker = {
      id: 'tracker-' + Date.now(),
      title: title.trim(),
      description: description.trim() || undefined,
      type: trackerType,
      icon: selectedIcon,
      color: selectedColor,
      unitName: unitName.trim() || (trackerType === 'calendar' ? 'Öğün' : 'Adet'),
      unitCost: trackerType === 'calendar' ? unitCost : undefined,
      counterValue: trackerType === 'counter' ? 0 : undefined,
      checklistItems: trackerType === 'checklist' ? [] : undefined,
      notesContent: trackerType === 'notes' ? '' : undefined,
      calendarData: {},
      createdAt: new Date().toISOString(),
      isPinned: false,
    };

    onCreate(newTracker);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 200, opacity: 0 }}
        className="bg-[#121929] border border-white/15 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Yeni Kayıt / Takip Sayfası</h3>
            <p className="text-xs text-white/50">İstediğiniz isim ve türde yeni bir takip oluşturun</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tracker Name */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Sayfa / Kayıt Başlığı *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Yemekhane Takvimi, Fitness Günlüğü..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Kısa Açıklama (İsteğe bağlı)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Örn: Yediğim öğünleri ve yemekhane masraflarını takip et"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Tracker Type Selection */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-2">
              Takip Türü
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTrackerType('calendar')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                  trackerType === 'calendar'
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <CalendarIcon className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold">Takvim Takibi</div>
                  <div className="text-[10px] text-white/50 leading-tight">Yemekhane gibi gün gün işaretleme</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTrackerType('counter')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                  trackerType === 'counter'
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <Hash className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold">Sayaç / Adet</div>
                  <div className="text-[10px] text-white/50 leading-tight">Tek dokunuşla sayı arttırma (+1)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTrackerType('checklist')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                  trackerType === 'checklist'
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold">Kontrol Listesi</div>
                  <div className="text-[10px] text-white/50 leading-tight">Görevler ve tamamlandı kutuları</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTrackerType('notes')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                  trackerType === 'notes'
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <FileText className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold">Özel Notlar</div>
                  <div className="text-[10px] text-white/50 leading-tight">Serbest metin ve kayıtlar</div>
                </div>
              </button>
            </div>
          </div>

          {/* If calendar, show meal pricing option */}
          {trackerType === 'calendar' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
              <div>
                <label className="block text-[11px] font-medium text-white/70 mb-1">
                  Birim Türü
                </label>
                <input
                  type="text"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="Öğün"
                  className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-white/70 mb-1">
                  1 Öğün Ücreti (TL)
                </label>
                <input
                  type="number"
                  value={unitCost}
                  onChange={(e) => setUnitCost(Number(e.target.value))}
                  placeholder="95"
                  className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* Color palette */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-2">
              Renk Teması
            </label>
            <div className="flex items-center gap-3">
              {AVAILABLE_COLORS.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setSelectedColor(col.id)}
                  className={`w-7 h-7 rounded-full ${col.bg} transition-transform ${
                    selectedColor === col.id ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#121929]' : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-2">
              İkon
            </label>
            <div className="grid grid-cols-5 gap-2">
              {AVAILABLE_ICONS.map((item) => {
                const IconComp = item.icon;
                const isSelected = selectedIcon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedIcon(item.id)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-blue-600/30 border-blue-400 text-blue-300'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <IconComp className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Sayfayı Oluştur</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-white/10 hover:bg-white/15 text-white/80 rounded-xl text-sm font-medium transition-colors"
            >
              Vazgeç
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
