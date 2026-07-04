import React, { useState } from 'react';
import { ShieldAlert, Key, Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface PinGuardProps {
  onSuccess: () => void;
}

export default function PinGuard({ onSuccess }: PinGuardProps) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Read environment variable if set, otherwise fallback to "7973"
  const CORRECT_PIN = (import.meta as any).env?.VITE_APP_PIN || '7973';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      setError('');
      setIsSuccess(true);
      // Let success transition run for 800ms for premium audio-visual response
      setTimeout(() => {
        localStorage.setItem('codeproof_pin_verified', 'true');
        onSuccess();
      }, 750);
    } else {
      setError('Incorrect verification PIN sequence. Access denied.');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-300 flex flex-col justify-center items-center p-6 relative overflow-hidden select-none font-sans">
      {/* Premium ambient decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-1/3 w-60 h-60 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-[#0D0D0E]/80 border border-white/5 rounded-2xl p-8 shadow-[0_16px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl relative"
      >
        <div className="flex flex-col items-center text-center">
          {/* Logo Badge */}
          <motion.div 
            animate={isSuccess ? { scale: [1, 1.2, 1], rotate: [0, 360, 360] } : {}}
            transition={{ duration: 0.6 }}
            className={`p-3.5 rounded-2xl mb-5 border transition-all ${
              isSuccess 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : error 
                  ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                  : 'bg-indigo-500/10 border-white/5 text-indigo-400'
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <Lock className="h-6 w-6" />
            )}
          </motion.div>

          <h1 className="text-xl font-extrabold text-white tracking-tight mb-2">
            Security Access Required
          </h1>
          <p className="text-slate-400 text-xs max-w-xs mb-6">
            Enter the secure instructor verification PIN to access the CodeProof AI platform.
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                Verification PIN
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="••••"
                  className={`w-full bg-[#050506] border text-center font-mono text-lg py-3 px-10 rounded-xl text-white tracking-[0.25em] transition-all focus:outline-none focus:ring-1 ${
                    error 
                      ? 'border-red-500/40 focus:ring-red-500/40' 
                      : 'border-white/5 focus:border-indigo-500/40 focus:ring-indigo-500/30'
                  }`}
                  disabled={isSuccess}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 justify-center text-xs text-red-400 bg-red-500/5 border border-red-500/10 py-2.5 px-3 rounded-lg"
              >
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span className="font-medium text-[11px]">{error}</span>
              </motion.div>
            )}



            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSuccess || !pin}
              className={`w-full py-3 px-5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                isSuccess
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
                  : !pin
                    ? 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                    : 'bg-white hover:bg-neutral-200 text-black shadow-md'
              }`}
            >
              {isSuccess ? 'Access Granted ✓' : 'Unlock Portal'}
            </button>
          </form>
        </div>
      </motion.div>

      <div className="absolute bottom-6 text-[10px] text-slate-600 font-mono">
        CodeProof AI • Educational Integrity Auditing
      </div>
    </div>
  );
}
