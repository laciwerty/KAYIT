import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mic, 
  Volume2, 
  Copy, 
  Check, 
  ExternalLink, 
  Smartphone, 
  Sparkles, 
  RefreshCw,
  Square,
  ArrowRight,
  Sliders,
  Layers,
  HelpCircle
} from 'lucide-react';

interface SiriIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SiriStatusData {
  todayDate: string;
  dayName: string;
  isWeekend: boolean;
  hasMenu: boolean;
  speechText: string;
  totalCachedDays: number;
}

export default function SiriIntegrationModal({
  isOpen,
  onClose,
}: SiriIntegrationModalProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'guide'>('status');
  const [copied, setCopied] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [siriData, setSiriData] = useState<SiriStatusData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Full endpoint URL based on current browser origin
  const siriUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/bugun-ne-var` : '/api/bugun-ne-var';

  // Fetch live siri status
  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/siri-status');
      if (res.ok) {
        const data = await res.json();
        setSiriData(data);
      }
    } catch (e) {
      console.warn('Failed to load siri status:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Copy link to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(siriUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Play natural speech with browser TTS in Turkish
  const handlePlayVoice = () => {
    if (isPlayingAudio) {
      window.speechSynthesis?.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const textToSpeak = siriData?.speechText || 'Bugün yemekhane menüsü kontrol ediliyor.';
    window.speechSynthesis?.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'tr-TR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsPlayingAudio(false);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
    };

    setIsPlayingAudio(true);
    window.speechSynthesis?.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 200, opacity: 0 }}
        className="bg-[#121929] border border-white/15 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-xl shadow-2xl max-h-[92vh] overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-blue-500 p-0.5 shadow-lg shadow-purple-600/30">
              <div className="w-full h-full bg-[#121929] rounded-[14px] flex items-center justify-center text-white">
                <Mic className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Siri Sesli Yanıt Servisi & Kestirme Kurulumu
              </h3>
              <p className="text-xs text-white/50">
                "Hey Siri, bugün ne yemek var?" için hızlı servis
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              window.speechSynthesis?.cancel();
              onClose();
            }}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'status'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Canlı Servis & Ses Testi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'guide'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>3. Aşama: iPhone Kurulum Rehberi</span>
          </button>
        </div>

        {activeTab === 'status' ? (
          <div className="space-y-4 flex-1">
            {/* Live Response Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Siri'nin Vereceği Canlı Yanıt:</span>
                </div>
                <button
                  onClick={fetchStatus}
                  disabled={isLoading}
                  className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  title="Yenile"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl text-sm font-medium text-white leading-relaxed">
                {isLoading ? (
                  <div className="text-white/40 text-xs italic">Veri servisi kontrol ediliyor...</div>
                ) : siriData?.speechText ? (
                  `"${siriData.speechText}"`
                ) : (
                  '"Bugün için yemekhane menüsü henüz sisteme yüklenmemiş."'
                )}
              </div>

              {/* Listen Button */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handlePlayVoice}
                  className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
                >
                  {isPlayingAudio ? (
                    <>
                      <Square className="w-3.5 h-3.5 text-rose-400 fill-current" />
                      <span>Durdur</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-purple-300" />
                      <span>Siri Sesini Önizle (Dinle)</span>
                    </>
                  )}
                </button>

                <span className="text-[11px] text-white/50">
                  {siriData?.totalCachedDays || 0} günlük menü hazır
                </span>
              </div>
            </div>

            {/* Endpoint URL Box */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/70 block">
                Siri İçin Özel Servis Linkiniz (Endpoint):
              </label>

              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-black/30 border border-white/15 rounded-xl font-mono text-xs text-blue-300 truncate select-all">
                  {siriUrl}
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className={`p-3 rounded-xl border font-medium text-xs flex items-center gap-1.5 transition-all active:scale-95 shrink-0 ${
                    copied
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                  }`}
                  title="Kopyala"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span className="hidden sm:inline">{copied ? 'Kopyalandı' : 'Kopyala'}</span>
                </button>

                <a
                  href="/api/bugun-ne-var"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors shrink-0"
                  title="Tarayıcıda Aç & Test Et"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <p className="text-[11px] text-white/40">
                💡 iPhone Kestirmeler uygulamasında bu adresi kullanacaksınız.
              </p>
            </div>

            {/* Go to Guide Card */}
            <div 
              onClick={() => setActiveTab('guide')}
              className="p-3.5 bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/20 rounded-2xl text-xs text-purple-200 cursor-pointer flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-400 shrink-0" />
                <span>iPhone'da Kestirme Kurulumu Nasıl Yapılır? (1 Dakika)</span>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-400" />
            </div>
          </div>
        ) : (
          /* TAB 2: STEP-BY-STEP IPHONE SHORTCUTS GUIDE */
          <div className="space-y-3.5 flex-1 text-xs">
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white/70 leading-relaxed">
              iPhone'unuzdaki yerleşik <strong>Kestirmeler (Shortcuts)</strong> uygulamasında sadece aşağıdaki <strong>3 adımı</strong> yapmanız yeterlidir:
            </div>

            {/* Step 1 */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-white">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-[11px]">1</span>
                <span>Kestirmeler Uygulamasını Açın</span>
              </div>
              <p className="text-white/60 pl-7 leading-relaxed">
                iPhone'unuzda <strong>Kestirmeler (Shortcuts)</strong> uygulamasını açın ve sağ üstteki <strong>"+" (Yeni Kestirme)</strong> butonuna dokunun. Kestirmenin adını en üstten <code>Bugün ne yemek var</code> yapın.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-white">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center text-[11px]">2</span>
                <span>2 Eylem Ekleyin</span>
              </div>
              <div className="pl-7 space-y-2 text-white/70">
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 space-y-1">
                  <div className="text-blue-300 font-medium font-mono text-[11px]">a) "URL" Eylemi:</div>
                  <div>Arama çubuğuna <strong>URL</strong> yazıp ekleyin ve aşağıdaki linki yapıştırın:</div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="font-mono text-[10px] text-blue-300 bg-black/40 px-2 py-1 rounded truncate flex-1">{siriUrl}</span>
                    <button
                      onClick={handleCopy}
                      className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold flex items-center gap-1 shrink-0"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 space-y-1">
                  <div className="text-purple-300 font-medium font-mono text-[11px]">b) "URL'nin İçeriğini Al" Eylemi:</div>
                  <div>Arama çubuğuna <strong>URL'nin İçeriğini Al</strong> yazıp hemen altına ekleyin (Yöntem: GET).</div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 space-y-1">
                  <div className="text-emerald-300 font-medium font-mono text-[11px]">c) "Metni Seslendir" Eylemi:</div>
                  <div>Arama çubuğuna <strong>Metni Seslendir</strong> (Speak Text) yazıp ekleyin. Otomatik olarak servisten gelen cevabı seslendirecektir.</div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-white">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[11px]">3</span>
                <span>Bitti'ye Basın ve Test Edin!</span>
              </div>
              <p className="text-white/60 pl-7 leading-relaxed">
                Sağ üstteki <strong>Bitti</strong> butonuna dokunun. Artık iPhone'unuzu elinize alıp:
                <br />
                👉 <strong className="text-white">"Hey Siri, bugün ne yemek var?"</strong> demeniz yeterlidir!
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 mt-4 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-2xl text-sm transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Siri Linki Kopyalandı!' : 'Siri Linkini Kopyala'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              window.speechSynthesis?.cancel();
              onClose();
            }}
            className="px-5 py-3 bg-white/10 hover:bg-white/15 text-white/70 rounded-2xl text-sm font-medium transition-colors"
          >
            Kapat
          </button>
        </div>
      </motion.div>
    </div>
  );
}
