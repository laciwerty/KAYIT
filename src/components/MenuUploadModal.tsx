import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Upload, 
  Camera, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Trash2, 
  FileText,
  Utensils,
  KeyRound,
  ClipboardPaste,
  Plus,
  Layers
} from 'lucide-react';
import { CalendarEntry } from '../types.ts';

interface ParsedDayItem {
  date: string; // YYYY-MM-DD
  dayNumber?: number;
  dayName?: string;
  dishes?: string[];
  menuText: string;
  isHoliday?: boolean;
}

interface ImagePage {
  id: string;
  dataUrl: string;
  mimeType: string;
}

interface MenuUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetYear: number;
  targetMonth: number; // 0-11
  onApplyMenu: (menuEntries: Record<string, Partial<CalendarEntry>>) => void;
}

const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export default function MenuUploadModal({
  isOpen,
  onClose,
  targetYear,
  targetMonth,
  onApplyMenu,
}: MenuUploadModalProps) {
  const [pages, setPages] = useState<ImagePage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isApiKeyError, setIsApiKeyError] = useState<boolean>(false);
  const [parsedDays, setParsedDays] = useState<ParsedDayItem[]>([]);
  const [activeTab, setActiveTab] = useState<'photo' | 'paste' | 'sample'>('photo');
  const [activeStep, setActiveStep] = useState<'upload' | 'review'>('upload');
  const [pastedText, setPastedText] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Read files and append to pages
  const handleFiles = (files: FileList | File[]) => {
    setErrorMessage(null);
    setIsApiKeyError(false);

    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setPages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              dataUrl: result,
              mimeType: file.type || 'image/jpeg',
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
    // Reset input so same file can be re-selected if needed
    e.target.value = '';
  };

  const handleRemovePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  // Quick sample menu for instant testing
  const handleLoadSampleMenu = () => {
    const year = targetYear;
    const month = String(targetMonth + 1).padStart(2, '0');
    
    const sampleItems: ParsedDayItem[] = [
      {
        date: `${year}-${month}-05`,
        dayName: 'Pazartesi',
        menuText: 'Mercimek Çorbası, Orman Kebabı, Pirinç Pilavı, Ayran',
        dishes: ['Mercimek Çorbası', 'Orman Kebabı', 'Pirinç Pilavı', 'Ayran'],
        isHoliday: false,
      },
      {
        date: `${year}-${month}-06`,
        dayName: 'Salı',
        menuText: 'Ezogelin Çorbası, Tavuk Sote, Bulgur Pilavı, Mevsim Salata',
        dishes: ['Ezogelin Çorbası', 'Tavuk Sote', 'Bulgur Pilavı', 'Mevsim Salata'],
        isHoliday: false,
      },
      {
        date: `${year}-${month}-07`,
        dayName: 'Çarşamba',
        menuText: 'Yayla Çorbası, Kuru Fasulye, Şehriyeli Pilav, Cacık',
        dishes: ['Yayla Çorbası', 'Kuru Fasulye', 'Şehriyeli Pilav', 'Cacık'],
        isHoliday: false,
      },
      {
        date: `${year}-${month}-08`,
        dayName: 'Perşembe',
        menuText: 'Tarhana Çorbası, İzmir Köfte, Fırın Makarna, Yoğurt',
        dishes: ['Tarhana Çorbası', 'İzmir Köfte', 'Fırın Makarna', 'Yoğurt'],
        isHoliday: false,
      },
      {
        date: `${year}-${month}-09`,
        dayName: 'Cuma',
        menuText: 'Domates Çorbası, Tas Kebabı, Arpa Şehriye Pilavı, Kemalpaşa Tatlısı',
        dishes: ['Domates Çorbası', 'Tas Kebabı', 'Arpa Şehriye Pilavı', 'Kemalpaşa Tatlısı'],
        isHoliday: false,
      },
      {
        date: `${year}-${month}-12`,
        dayName: 'Pazartesi',
        menuText: 'Mercimek Çorbası, Etli Güveç, Bulgur Pilavı, Komposto',
        dishes: ['Mercimek Çorbası', 'Etli Güveç', 'Bulgur Pilavı', 'Komposto'],
        isHoliday: false,
      },
      {
        date: `${year}-${month}-13`,
        dayName: 'Salı',
        menuText: 'Şehriye Çorbası, Piliç Rosto, Patates Püresi, Meyve',
        dishes: ['Şehriye Çorbası', 'Piliç Rosto', 'Patates Püresi', 'Meyve'],
        isHoliday: false,
      },
      {
        date: `${year}-${month}-14`,
        dayName: 'Çarşamba',
        menuText: 'Mercimek Çorbası, Karnıyarık, Pirinç Pilavı, Cacık',
        dishes: ['Mercimek Çorbası', 'Karnıyarık', 'Pirinç Pilavı', 'Cacık'],
        isHoliday: false,
      },
      {
        date: `${year}-${month}-15`,
        dayName: 'Perşembe',
        menuText: 'Düğün Çorbası, Hasanpaşa Köfte, Soslu Makarna, Tatlı',
        dishes: ['Düğün Çorbası', 'Hasanpaşa Köfte', 'Soslu Makarna', 'Tatlı'],
        isHoliday: false,
      },
      {
        date: `${year}-${month}-16`,
        dayName: 'Cuma',
        menuText: 'Ezogelin Çorbası, Tavuk Şinitzel, Patates Salatası, Ayran',
        dishes: ['Ezogelin Çorbası', 'Tavuk Şinitzel', 'Patates Salatası', 'Ayran'],
        isHoliday: false,
      },
    ];

    setParsedDays(sampleItems);
    setActiveStep('review');
  };

  // Call Gemini API with all uploaded pages
  const handleParseWithGemini = async () => {
    if (pages.length === 0) return;

    setIsLoading(true);
    setErrorMessage(null);
    setIsApiKeyError(false);

    try {
      const response = await fetch('/api/parse-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: pages.map((p) => ({
            imageBase64: p.dataUrl,
            mimeType: p.mimeType,
          })),
          targetYear,
          targetMonth: targetMonth + 1,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (result.isApiKeyInvalid || (result.error && result.error.includes('API key'))) {
          setIsApiKeyError(true);
        }
        throw new Error(result.error || 'Menü ayrıştırılamadı.');
      }

      const daysList: ParsedDayItem[] = result.data?.days || [];
      if (daysList.length === 0) {
        throw new Error('Görsellerde tablo veya menü satırı tespit edilemedi. Lütfen daha net bir fotoğraf deneyin.');
      }

      setParsedDays(daysList);
      setActiveStep('review');
    } catch (err: any) {
      console.error('Menu parse error:', err);
      const msg = err.message || 'Yapay zeka görselleri okurken bir hata oluştu.';
      if (msg.includes('API key') || msg.includes('API_KEY_INVALID')) {
        setIsApiKeyError(true);
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Parse pasted text into days
  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;

    const lines = pastedText.split('\n').filter((l) => l.trim().length > 0);
    const year = targetYear;
    const month = String(targetMonth + 1).padStart(2, '0');
    const parsed: ParsedDayItem[] = [];

    lines.forEach((line, idx) => {
      const match = line.match(/^(\d{1,2})[\.\s:\/\-]/);
      let dayNum = idx + 1;
      let text = line.trim();

      if (match) {
        dayNum = parseInt(match[1], 10);
        text = line.substring(match[0].length).replace(/^[:\-\s]+/, '').trim();
      }

      const dayStr = String(dayNum).padStart(2, '0');
      const date = `${year}-${month}-${dayStr}`;

      if (text) {
        const dishes = text.split(',').map((d) => d.trim()).filter(Boolean);
        parsed.push({
          date,
          dayNumber: dayNum,
          menuText: text,
          dishes,
          isHoliday: text.toLowerCase().includes('tatil'),
        });
      }
    });

    if (parsed.length === 0) {
      setErrorMessage('Metinden gün ve menü ayrıştırılamadı. Lütfen her satıra bir gün yazarak deneyin.');
      return;
    }

    setParsedDays(parsed);
    setActiveStep('review');
  };

  // Edit a parsed day in review step
  const handleUpdateDayText = (index: number, newText: string) => {
    setParsedDays((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        menuText: newText,
        dishes: newText.split(',').map((s) => s.trim()).filter(Boolean),
      };
      return updated;
    });
  };

  // Remove a day from review list
  const handleRemoveDay = (index: number) => {
    setParsedDays((prev) => prev.filter((_, i) => i !== index));
  };

  // Confirm and apply parsed menu to calendar
  const handleConfirmAndApply = () => {
    const entriesToApply: Record<string, Partial<CalendarEntry>> = {};
    const syncMap: Record<string, string> = {};

    parsedDays.forEach((day) => {
      if (!day.date) return;
      entriesToApply[day.date] = {
        date: day.date,
        menuText: day.menuText,
        dishes: day.dishes || day.menuText.split(',').map((s) => s.trim()),
        note: '',
        status: day.isHoliday ? 'holiday' : 'none',
      };
      syncMap[day.date] = day.menuText;
    });

    // Sync with server cache for Siri endpoint
    fetch('/api/sync-menu-cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuMap: syncMap }),
    }).catch(console.warn);

    onApplyMenu(entriesToApply);
    confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 200, opacity: 0 }}
        className="bg-[#121929] border border-white/15 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-xl shadow-2xl max-h-[92vh] overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Aylık Menü Yükle (Çoklu Sayfa Desteği)
              </h3>
              <p className="text-xs text-white/50">
                {MONTH_NAMES_TR[targetMonth]} {targetYear} Yemekhane Takvimi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: INPUT OPTIONS */}
        {activeStep === 'upload' && (
          <div className="space-y-4 flex-1">
            {/* Tabs */}
            <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => { setActiveTab('photo'); setErrorMessage(null); }}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'photo'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Fotoğraf & Çoklu Sayfa</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('paste'); setErrorMessage(null); }}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'paste'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Metin Yapıştır</span>
              </button>

              <button
                type="button"
                onClick={handleLoadSampleMenu}
                className="px-3 py-2 text-xs font-medium rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-white/5 transition-all flex items-center justify-center gap-1"
                title="Hemen Test Et"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Örnek Menü</span>
              </button>
            </div>

            {/* TAB: PHOTO (MULTI-PAGE) */}
            {activeTab === 'photo' && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-200/90 leading-relaxed flex items-start gap-2.5">
                  <Layers className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div>
                      Menünüz <strong>2 veya 3 sayfadan</strong> oluşuyorsa sırayla tüm sayfaları çekebilir ya da galeriden birden fazla fotoğraf seçebilirsiniz.
                    </div>
                    <div className="text-[11px] text-amber-300 font-medium flex items-center gap-1 pt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      <span>Kural: Akşam yemeği atlanır, tüm sayfalardaki yalnızca öğle yemekleri birleştirilir.</span>
                    </div>
                  </div>
                </div>

                {/* Hidden inputs */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleInputChange}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleInputChange}
                  className="hidden"
                />

                {/* Page Gallery / Thumbnails */}
                {pages.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-white/70">
                      <span className="font-medium flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-400" />
                        <span>Yüklenen Sayfalar ({pages.length} Sayfa)</span>
                      </span>
                      <button
                        onClick={() => setPages([])}
                        className="text-rose-400 hover:underline text-[11px]"
                      >
                        Tümünü Temizle
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {pages.map((page, index) => (
                        <div
                          key={page.id}
                          className="relative rounded-2xl overflow-hidden border border-white/20 bg-black/40 group aspect-[4/3] flex items-center justify-center"
                        >
                          <img
                            src={page.dataUrl}
                            alt={`Sayfa ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-semibold text-white border border-white/20">
                            Sayfa {index + 1}
                          </div>
                          <button
                            onClick={() => handleRemovePage(page.id)}
                            className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white transition-colors"
                            title="Bu sayfayı sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Add more page card */}
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="rounded-2xl border-2 border-dashed border-white/20 hover:border-blue-400 bg-white/[0.03] hover:bg-blue-500/10 transition-all aspect-[4/3] flex flex-col items-center justify-center gap-1 text-white/70 hover:text-white group active:scale-95"
                      >
                        <Plus className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-medium">+ Sayfa Çek</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* If no pages yet, show large upload buttons */}
                {pages.length === 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-6 rounded-3xl border-2 border-dashed border-blue-500/40 hover:border-blue-400 bg-blue-500/5 hover:bg-blue-500/10 transition-all flex flex-col items-center justify-center text-center gap-2 group active:scale-98"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-semibold text-white">Fotoğraf Çek</div>
                      <div className="text-[11px] text-white/50">Sayfa 1'i kamerayla çek</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-6 rounded-3xl border-2 border-dashed border-white/20 hover:border-white/40 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex flex-col items-center justify-center text-center gap-2 group active:scale-98"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white/10 text-white/70 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-semibold text-white">Galeriden Seç</div>
                      <div className="text-[11px] text-white/50">1 veya birden fazla sayfa</div>
                    </button>
                  </div>
                )}

                {/* Additional Page Add buttons when at least 1 page uploaded */}
                {pages.length > 0 && (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-blue-400" />
                      <span>+ Kamera ile Yeni Sayfa Çek</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                      <span>+ Galeriden Sayfa Ekle</span>
                    </button>
                  </div>
                )}

                {/* API Key Warning / Explanatory box */}
                {isApiKeyError && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span>Google Gemini API Bağlantı Uyarısı</span>
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed">
                      API çağrısında bir sorun tespit edildi. Bu sırada takvim kayıtlarınızı aksatmadan devam etmek için:
                    </p>
                    <div className="pt-1 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleLoadSampleMenu}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Örnek Menü Verilerini Yükle</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setActiveTab('paste'); setErrorMessage(null); }}
                        className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-medium flex items-center gap-1 transition-all"
                      >
                        <ClipboardPaste className="w-3.5 h-3.5" />
                        <span>Menüyü Metin Olarak Yapıştır</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* General Error Message */}
                {errorMessage && !isApiKeyError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={pages.length === 0 || isLoading}
                    onClick={handleParseWithGemini}
                    className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold rounded-2xl text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>{pages.length > 1 ? `${pages.length} Sayfa Taranıyor & Birleştiriliyor...` : 'Menü Okunuyor & Ayrıştırılıyor...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>
                          {pages.length > 1
                            ? `${pages.length} Sayfayı Birlikte Oku (Gemini)`
                            : 'Yapay Zeka İle Oku (Gemini Vision)'}
                        </span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-3.5 bg-white/10 hover:bg-white/15 text-white/70 rounded-2xl text-sm font-medium transition-colors"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            )}

            {/* TAB: PASTE TEXT */}
            {activeTab === 'paste' && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-200/90 leading-relaxed">
                  Yemekhane menüsünü WhatsApp'tan, e-postadan veya panodan kopyalayıp buraya yapıştırın. Her satır bir günü temsil eder (Örn: <code>5: Mercimek Çorbası, Orman Kebabı, Pilav</code>).
                </div>

                <div>
                  <textarea
                    rows={7}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`5: Mercimek Çorbası, Orman Kebabı, Pirinç Pilavı, Ayran\n6: Ezogelin Çorbası, Tavuk Sote, Bulgur Pilavı, Salata\n7: Yayla Çorbası, Kuru Fasulye, Pilav, Cacık\n8: Tarhana Çorbası, İzmir Köfte, Makarna, Yoğurt\n9: Domates Çorbası, Tas Kebabı, Pilav, Tatlı`}
                    className="w-full p-3.5 rounded-2xl bg-white/5 border border-white/15 text-xs text-white placeholder-white/25 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!pastedText.trim()}
                    onClick={handleParsePastedText}
                    className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold rounded-2xl text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Metni Ayrıştır & Önizle</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('photo')}
                    className="px-4 py-3.5 bg-white/10 hover:bg-white/15 text-white/70 rounded-2xl text-sm font-medium transition-colors"
                  >
                    Geri
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: REVIEW & CONFIRM */}
        {activeStep === 'review' && (
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="text-xs text-white/70">
                Ayrıştırılan Günler (<strong className="text-emerald-400">{parsedDays.length} gün</strong>)
              </div>
              <button
                onClick={() => setActiveStep('upload')}
                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Yeniden Sayfa Yükle</span>
              </button>
            </div>

            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-xs text-white/60">
              💡 Aşağıdaki yemek listesini kontrol edebilir, gerekirse üzerine tıklayıp tek tek düzenleyebilirsiniz.
            </div>

            {/* Editable Days List */}
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[45vh] pr-1 divide-y divide-white/5">
              {parsedDays.map((day, idx) => (
                <div key={day.date || idx} className="pt-2 flex items-start gap-2.5 group">
                  <div className="w-14 shrink-0 text-center py-1.5 px-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300">
                    <div className="text-xs font-bold font-mono">
                      {day.date.split('-')[2] || day.dayNumber}
                    </div>
                    <div className="text-[10px] text-white/50 truncate">
                      {day.dayName || 'Gün'}
                    </div>
                  </div>

                  <div className="flex-1">
                    <input
                      type="text"
                      value={day.menuText}
                      onChange={(e) => handleUpdateDayText(idx, e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    onClick={() => handleRemoveDay(idx)}
                    className="p-1.5 rounded-lg text-white/20 hover:text-rose-400 transition-colors"
                    title="Bu günü çıkar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Confirm button */}
            <div className="pt-3 border-t border-white/10 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={handleConfirmAndApply}
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-2xl text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Takvime İşle & Kaydet ({parsedDays.length} Gün)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStep('upload')}
                className="px-4 py-3.5 bg-white/10 hover:bg-white/15 text-white/70 rounded-2xl text-sm font-medium transition-colors"
              >
                Geri
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
