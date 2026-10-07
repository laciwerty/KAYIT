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
  HelpCircle,
  Play,
  Square
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
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const textToSpeak = siriData?.speechText || 'Bugün yemekhane menüsü kontrol ediliyor.';
    window.speechSynthesis.cancel();

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
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 200, opacity: 0 }}
        className="bg-[#121929] border border-white/15 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto flex flex-col"
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
                Siri Servisi & Sesli Yanıt API (2. Aşama)
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

            <div className="p-3 bg-black/40 border border-white/10 rounded-xl text-sm font-medium text-white leading-relaxed">
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
              💡 Yukarıdaki bağlantıya tıklandığında sadece o günün menüsü düz Türkçe metin olarak döner. Siri doğrudan bu metni okur.
            </p>
          </div>

          {/* Road to Stage 3 Info Card */}
          <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-200/90 leading-relaxed flex items-start gap-2.5">
            <Smartphone className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-white">Sırada Ne Var? (3. Aşama)</div>
              <div>
                Bu servisi iPhone'unuzdaki yerleşik <strong>Kestirmeler (Shortcuts)</strong> uygulamasına bağlayacağız. Sadece 2 basit blok ekleyeceğiz ve "Hey Siri, bugün ne yemek var?" dediğiniz an bu servisten veriyi sesli okuyacak.
              </div>
            </div>
          </div>
        </div>

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
