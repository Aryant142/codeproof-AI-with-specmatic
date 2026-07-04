import React, { useState } from 'react';
import { ShieldAlert, LogIn, Sparkles, AlertCircle } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

interface AuthViewProps {
  onSignInSuccess: (user: any) => void;
}

export default function AuthView({ onSignInSuccess }: AuthViewProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Authenticate with Google
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onSignInSuccess(result.user);
    } catch (err: any) {
      console.error("Google Auth popup rejected:", err);
      setError(err.message || "Failed to finalize auth popup connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-6 text-slate-300 font-sans relative">
      {/* Absolute Decorative Blobs */}
      <div className="absolute top-1/4 w-[350px] h-[350px] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      <div className="w-full max-w-sm bg-[#0D0D0E]/80 border border-white/5 rounded-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative backdrop-blur-xl">
        
        {/* Sparkle banner */}
        <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-white/5 border border-white/10 text-slate-300 text-[10px] font-bold uppercase py-1 px-4 rounded-full tracking-wider shadow-sm flex items-center gap-1.5 whitespace-nowrap">
          <Sparkles className="h-3 w-3 text-indigo-400" /> Instructor Portal
        </div>

        {/* Logo and Headings */}
        <div className="text-center mt-3 mb-8">
          <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-lg w-max mx-auto mb-4 border border-indigo-500/10">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-sans font-extrabold text-white tracking-tight">Sign In to CodeProof AI</h2>
          <p className="text-slate-400 text-[11px] mt-1.5 px-2 leading-relaxed">
            Upload assignment tables and leverage Gemini AI to safe-guard computer science scores.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/10 p-3.5 rounded-lg text-red-400 text-[11px] flex gap-3 mb-6">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="leading-normal">{error}</div>
          </div>
        )}

        <div className="space-y-4">
          {/* Main Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-neutral-200 text-[#0A0A0B] font-semibold py-2.5 px-4 rounded-lg text-xs transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {/* Minimal google vector badge */}
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign In with Google Auth
          </button>
        </div>

        <div className="mt-8 text-center text-[10px] text-slate-600 font-medium">
          Protected educational portal. Authentic secure workflows configured dynamically.
        </div>
      </div>
    </div>
  );
}
