import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ScanFace, 
  Lock, 
  Delete, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Sparkles,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { SecuritySettings } from '../types.ts';
import { verifyBiometrics, isBiometricsAvailable } from '../utils/biometrics.ts';

interface LockScreenProps {
  securitySettings: SecuritySettings;
  onUnlock: () => void;
  onUpdateSecurity: (newSettings: SecuritySettings) => void;
}

export default function LockScreen({
  securitySettings,
  onUnlock,
  onUpdateSecurity,
}: LockScreenProps) {
  const [pinInput, setPinInput] = useState<string>('');
  const [errorShake, setErrorShake] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isAuthenticatingFaceId, setIsAuthenticatingFaceId] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [bioInfo, setBioInfo] = useState<{ available: boolean; platform: string }>({
    available: false,
    platform: 'Face ID',
  });

  // Digital clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString('tr-TR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check device biometrics availability
  useEffect(() => {
    isBiometricsAvailable().then((res) => {
      setBioInfo(res);
    });
  }, []);

  // Trigger Face ID verification
  const handleFaceIdAuth = useCallback(async () => {
    if (!securitySettings.faceIdEnabled) return;
    setIsAuthenticatingFaceId(true);
    setErrorMessage('');
    
    try {
      const result = await verifyBiometrics(securitySettings.passkeyCredentialId);
      if (result.success) {
        onUnlock();
      } else {
        setErrorMessage(result.error || 'Yüz tanıma başarısız. PIN ile deneyin.');
      }
    } catch {
      setErrorMessage('Biyometrik doğrulama başarısız.');
    } finally {
      setIsAuthenticatingFaceId(false);
    }
  }, [securitySettings, onUnlock]);

  // Attempt auto-trigger Face ID on mount if enabled
  useEffect(() => {
    const timer = setTimeout(() => {
      if (securitySettings.faceIdEnabled) {
        handleFaceIdAuth();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [handleFaceIdAuth, securitySettings.faceIdEnabled]);

  // Handle PIN digit press
  const handleKeyPress = (digit: string) => {
    if (pinInput.length >= 4) return;
    const newPin = pinInput + digit;
    setPinInput(newPin);
    setErrorMessage('');

    if (newPin.length === 4) {
      // Check PIN
      if (newPin === securitySettings.pinCode) {
        setTimeout(() => {
          onUnlock();
        }, 150);
      } else {
        setErrorShake(true);
        setErrorMessage('Hatalı PIN kodu girdiniz.');
        setTimeout(() => {
          setPinInput('');
          setErrorShake(false);
        }, 600);
      }
    }
  };

  const handleDelete = () => {
    if (pinInput.length > 0) {
      setPinInput(pinInput.slice(0, -1));
      setErrorMessage('');
    }
  };

  const keypadButtons = [
    { num: '1', letters: '' },
    { num: '2', letters: 'ABC' },
    { num: '3', letters: 'DEF' },
    { num: '4', letters: 'GHI' },
    { num: '5', letters: 'JKL' },
    { num: '6', letters: 'MNO' },
    { num: '7', letters: 'PQRS' },
    { num: '8', letters: 'TUV' },
    { num: '9', letters: 'WXYZ' },
    { num: 'face', letters: '' },
    { num: '0', letters: '+' },
    { num: 'del', letters: '' },
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center bg-[#090d16] text-white select-none px-4 py-8 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Section: iOS Clock & Status */}
      <div className="relative z-10 flex flex-col items-center text-center mt-4">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 mb-3 backdrop-blur-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Şifreli & Biyometrik Korumalı</span>
        </div>

        <h2 className="text-sm font-medium tracking-wide text-white/70 capitalize">
          {currentDate || 'Kayıt Takip'}
        </h2>
        <h1 className="text-6xl sm:text-7xl font-light tracking-tight text-white mt-1 font-mono">
          {currentTime || '12:00'}
        </h1>
      </div>

      {/* Center Section: Face ID Prompt & PIN dots */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-xs my-4">
        {/* Face ID Icon with animated radar */}
        <div className="relative mb-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleFaceIdAuth}
            disabled={isAuthenticatingFaceId}
            className={`relative flex items-center justify-center w-20 h-20 rounded-3xl backdrop-blur-xl border transition-all duration-300 shadow-xl ${
              isAuthenticatingFaceId
                ? 'bg-blue-600/30 border-blue-400 text-blue-300 shadow-blue-500/25'
                : 'bg-white/10 border-white/20 text-white hover:bg-white/15 hover:border-white/30'
            }`}
          >
            {isAuthenticatingFaceId ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full"
              />
            ) : (
              <ScanFace className="w-10 h-10 text-blue-400" />
            )}

            {/* Pulsing ring */}
            {isAuthenticatingFaceId && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="absolute inset-0 rounded-3xl border-2 border-blue-400 pointer-events-none"
              />
            )}
          </motion.button>
        </div>

        <button
          onClick={handleFaceIdAuth}
          className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1.5 mb-6 transition-colors"
        >
          <ScanFace className="w-4 h-4" />
          <span>Face ID ile Giriş Yap</span>
        </button>

        {/* PIN Dots */}
        <motion.div
          animate={errorShake ? { x: [-12, 12, -10, 10, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4 mb-2"
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pinInput.length > index;
            return (
              <motion.div
                key={index}
                animate={{
                  scale: isFilled ? 1.15 : 1,
                  backgroundColor: isFilled ? '#60a5fa' : 'rgba(255, 255, 255, 0.15)',
                  borderColor: isFilled ? '#93c5fd' : 'rgba(255, 255, 255, 0.25)',
                }}
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  isFilled ? 'shadow-[0_0_12px_rgba(96,165,250,0.8)]' : ''
                }`}
              />
            );
          })}
        </motion.div>

        {/* Error message */}
        <div className="h-6 flex items-center justify-center">
          {errorMessage && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-medium text-rose-400 flex items-center gap-1"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMessage}</span>
            </motion.p>
          )}
        </div>
      </div>

      {/* Bottom Section: Keypad */}
      <div className="relative z-10 w-full max-w-[280px]">
        <div className="grid grid-cols-3 gap-x-5 gap-y-3.5">
          {keypadButtons.map((btn, idx) => {
            if (btn.num === 'face') {
              return (
                <button
                  key={idx}
                  onClick={handleFaceIdAuth}
                  className="w-18 h-18 mx-auto rounded-full flex flex-col items-center justify-center text-blue-400 active:bg-white/10 transition-colors"
                  title="Face ID ile Giriş"
                >
                  <ScanFace className="w-7 h-7" />
                </button>
              );
            }
            if (btn.num === 'del') {
              return (
                <button
                  key={idx}
                  onClick={handleDelete}
                  disabled={pinInput.length === 0}
                  className={`w-18 h-18 mx-auto rounded-full flex flex-col items-center justify-center transition-colors ${
                    pinInput.length > 0
                      ? 'text-white/80 active:bg-white/10 hover:text-white'
                      : 'text-white/20'
                  }`}
                  title="Sil"
                >
                  <Delete className="w-6 h-6" />
                </button>
              );
            }

            return (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleKeyPress(btn.num)}
                className="w-18 h-18 mx-auto rounded-full bg-white/10 hover:bg-white/15 active:bg-white/25 border border-white/10 flex flex-col items-center justify-center backdrop-blur-md transition-all shadow-sm group"
              >
                <span className="text-2xl font-light text-white leading-none group-active:text-blue-300">
                  {btn.num}
                </span>
                {btn.letters && (
                  <span className="text-[9px] tracking-widest text-white/50 font-medium mt-0.5">
                    {btn.letters}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Footer actions: Quick hint & Reset */}
        <div className="flex items-center justify-between mt-6 text-xs text-white/50 px-2">
          <button
            onClick={() => setShowForgotModal(true)}
            className="hover:text-white/80 underline decoration-white/20 transition-colors"
          >
            PIN Yardım
          </button>

          <div className="flex items-center gap-1.5 text-white/40">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Varsayılan PIN: <strong className="text-white/70">1234</strong></span>
          </div>
        </div>
      </div>

      {/* Forgot PIN / Reset Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#131b2e] border border-white/15 rounded-3xl p-6 w-full max-w-sm text-left shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
                <KeyRound className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-semibold text-white mb-1">
                PIN Kodu Bilgisi
              </h3>
              <p className="text-sm text-white/70 mb-4 leading-relaxed">
                Uygulamanızın varsayılan koruma kodu <strong className="text-blue-400">1234</strong> olarak ayarlanmıştır.
                Uygulama içine girdikten sonra <strong>Ayarlar</strong> menüsünden istediğiniz zaman kendi özel PIN kodunuzu değiştirebilir veya Face ID&apos;yi güncelleyebilirsiniz.
              </p>

              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 mb-5 text-xs text-white/60 flex items-center gap-2.5">
                <ScanFace className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>iPhone&apos;unuzda Face ID ile şifre yazmadan tek dokunuşla açabilirsiniz.</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Quick fill 1234
                    setPinInput(securitySettings.pinCode);
                    setShowForgotModal(false);
                    setTimeout(() => onUnlock(), 200);
                  }}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kodu Kullan & Gir</span>
                </button>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-3 bg-white/10 hover:bg-white/15 text-white/80 rounded-xl text-sm font-medium transition-colors"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
