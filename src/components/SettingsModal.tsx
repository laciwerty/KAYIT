import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Shield, 
  ScanFace, 
  KeyRound, 
  Clock, 
  Download, 
  Upload, 
  Smartphone, 
  Check, 
  Share2, 
  PlusSquare, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { SecuritySettings } from '../types.ts';
import { registerBiometrics } from '../utils/biometrics.ts';
import { exportBackupData, importBackupData } from '../utils/storage.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  securitySettings: SecuritySettings;
  onUpdateSecurity: (newSettings: SecuritySettings) => void;
  onReloadData: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  securitySettings,
  onUpdateSecurity,
  onReloadData,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'security' | 'iphone' | 'backup'>('security');
  const [pinInput, setPinInput] = useState<string>(securitySettings.pinCode);
  const [pinChangeSuccess, setPinChangeSuccess] = useState<boolean>(false);
  const [faceIdRegistering, setFaceIdRegistering] = useState<boolean>(false);
  const [faceIdSuccess, setFaceIdSuccess] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<{ text: string; error?: boolean } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle PIN change
  const handleSavePin = () => {
    if (pinInput.length !== 4) return;
    onUpdateSecurity({
      ...securitySettings,
      pinCode: pinInput,
      isPinSet: true,
    });
    setPinChangeSuccess(true);
    setTimeout(() => setPinChangeSuccess(false), 2500);
  };

  // Register Face ID on device
  const handleRegisterFaceId = async () => {
    setFaceIdRegistering(true);
    setFaceIdSuccess(null);
    try {
      const res = await registerBiometrics(securitySettings.userName || 'Kullanıcı');
      if (res.success) {
        onUpdateSecurity({
          ...securitySettings,
          faceIdEnabled: true,
          hasPasskey: true,
          passkeyCredentialId: res.credentialId,
        });
        setFaceIdSuccess('Face ID cihazınızda başarıyla tanımlandı!');
      } else {
        setFaceIdSuccess('Kayıt yapılamadı: ' + (res.error || 'İptal edildi'));
      }
    } catch {
      setFaceIdSuccess('Doğrulama esnasında bir hata oluştu.');
    } finally {
      setFaceIdRegistering(false);
    }
  };

  // Export JSON backup
  const handleDownloadBackup = () => {
    const jsonStr = exportBackupData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kayitlarim-yedek-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBackupMessage({ text: 'Yedek dosyası cihazınıza indirildi.' });
  };

  // Import JSON backup
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importBackupData(content);
      if (res.success) {
        setBackupMessage({ text: res.message });
        onReloadData();
      } else {
        setBackupMessage({ text: res.message, error: true });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 200, opacity: 0 }}
        className="bg-[#121929] border border-white/15 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Ayarlar & Güvenlik</h3>
            <p className="text-xs text-white/50">Face ID, PIN, iPhone kurulumu ve veri yönetimi</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-2xl mb-5 border border-white/10">
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'security'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Kilit & Face ID</span>
          </button>

          <button
            onClick={() => setActiveTab('iphone')}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'iphone'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>iPhone Kurulum</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'backup'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Yedekleme</span>
          </button>
        </div>

        {/* TAB 1: SECURITY */}
        {activeTab === 'security' && (
          <div className="space-y-5">
            {/* Face ID Box */}
            <div className="p-4 bg-gradient-to-br from-blue-950/40 to-indigo-950/20 rounded-2xl border border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <ScanFace className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">iPhone Face ID ile Giriş</h4>
                    <p className="text-[11px] text-white/50">Cihazınızın yüz tanıma sensörü ile şifresiz açın</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings.faceIdEnabled}
                    onChange={(e) =>
                      onUpdateSecurity({
                        ...securitySettings,
                        faceIdEnabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-white/70">Cihaz Doğrulama Anahtarı</span>
                <button
                  onClick={handleRegisterFaceId}
                  disabled={faceIdRegistering}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 border border-blue-400/30 text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{faceIdRegistering ? 'Tanımlanıyor...' : 'Face ID Eşleştir'}</span>
                </button>
              </div>

              {faceIdSuccess && (
                <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{faceIdSuccess}</span>
                </p>
              )}
            </div>

            {/* PIN Code Box */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/80">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">4 Haneli Giriş PIN Kodu</h4>
                  <p className="text-[11px] text-white/50">Face ID kullanılmadığında bu kod geçerlidir</p>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234"
                  className="w-32 px-3 py-2 text-center tracking-widest font-mono text-base rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleSavePin}
                  disabled={pinInput.length !== 4}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>PIN Güncelle</span>
                </button>
              </div>

              {pinChangeSuccess && (
                <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Yeni PIN kodunuz kaydedildi!</span>
                </p>
              )}
            </div>

            {/* Auto Lock Timer */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/80">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Otomatik Kilit Süresi</h4>
                  <p className="text-[11px] text-white/50">Uygulama arka plana geçtiğinde kilitlenme süresi</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Hemen', val: 0 },
                  { label: '1 Dakika', val: 1 },
                  { label: '5 Dakika', val: 5 },
                  { label: 'Kapat', val: -1 },
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() =>
                      onUpdateSecurity({
                        ...securitySettings,
                        autoLockMinutes: item.val,
                      })
                    }
                    className={`py-2 text-xs rounded-xl border transition-all ${
                      securitySettings.autoLockMinutes === item.val
                        ? 'bg-blue-600 text-white border-blue-400 font-semibold shadow-sm'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: iPHONE SETUP GUIDE */}
        {activeTab === 'iphone' && (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-indigo-950/40 to-blue-950/20 rounded-2xl border border-indigo-500/25 text-left">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span>iPhone&apos;da Uygulama Olarak Kullanma</span>
              </h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Bu web sitesini iPhone telefonunuzda tarayıcı çubuğu olmadan, tıpkı App Store&apos;dan indirilmiş gerçek bir uygulama gibi kullanmak çok kolaydır:
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Safari İle Açın</div>
                  <div className="text-[11px] text-white/50">
                    Sitenin bağlantısını iPhone&apos;unuzdaki <strong>Safari</strong> tarayıcısında açın.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>Paylaş Butonuna Basın</span>
                    <Share2 className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="text-[11px] text-white/50">
                    Safari ekranının en altındaki kare içinden yukarı ok çıkan <strong>Paylaş</strong> simgesine dokunun.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>&quot;Ana Ekrana Ekle&quot; Seçin</span>
                    <PlusSquare className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-[11px] text-white/50">
                    Aşağı kaydırıp <strong>Ana Ekrana Ekle (Add to Home Screen)</strong> seçeneğine ve sağ üstteki <strong>Ekle</strong>&apos;ye basın.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>Face ID ile Açın!</span>
                    <ScanFace className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="text-[11px] text-white/50">
                    Artık ana ekranınızdaki simgeye her dokunduğunuzda uygulama tam ekran açılır ve Face ID ile kilit anında açılır.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BACKUP & RESTORE */}
        {activeTab === 'backup' && (
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <h4 className="text-sm font-semibold text-white mb-1">Veri Yedekleme</h4>
              <p className="text-xs text-white/60 mb-4">
                Tüm kayıtlarınızı, yemekhane takviminizi ve ayarlarınızı güvenle bir dosya olarak indirebilirsiniz.
              </p>
              <button
                onClick={handleDownloadBackup}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Yedek Dosyasını İndir (.json)</span>
              </button>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <h4 className="text-sm font-semibold text-white mb-1">Yedekten Geri Yükle</h4>
              <p className="text-xs text-white/60 mb-4">
                Daha önce indirdiğiniz bir yedek dosyasını yükleyerek kayıtlarınızı geri getirebilirsiniz.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Yedek Dosyası Seç & Yükle</span>
              </button>
            </div>

            {backupMessage && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  backupMessage.error
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                {backupMessage.error ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <Check className="w-4 h-4 shrink-0" />
                )}
                <span>{backupMessage.text}</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-xl transition-colors"
          >
            Tamam
          </button>
        </div>
      </motion.div>
    </div>
  );
}
