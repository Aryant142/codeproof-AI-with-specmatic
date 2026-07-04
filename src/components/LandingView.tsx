import React from 'react';
import { 
  ShieldCheck, 
  Terminal, 
  FileSpreadsheet, 
  Sparkles, 
  Flame, 
  CheckCircle,
  GitBranch,
  Search,
  BookOpen
} from 'lucide-react';
import { motion } from 'motion/react';

interface LandingViewProps {
  onStart: () => void;
}

export default function LandingView({ onStart }: LandingViewProps) {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-300 overflow-x-hidden relative">
      {/* Decorative Elegant Blur Background Gradients */}
      <div className="absolute top-0 left-[-10%] w-[40%] h-[40%] bg-indigo-900/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-1/3 right-[-10%] w-[45%] h-[45%] bg-purple-900/5 blur-[130px] rounded-full pointer-events-none -z-10" />

      {/* Top Navigation */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-sans font-extrabold text-lg tracking-tight text-white">
            CodeProof AI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onStart}
            className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs py-2 px-4 rounded-md transition-all cursor-pointer shadow-sm"
          >
            Instructor Portal
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center z-10 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold tracking-wide mb-8">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          Hybrid Gemini Reasoning & Git Auditing
        </div>

        <h2 className="font-sans font-extrabold text-4xl md:text-5xl tracking-tight text-white mb-6 max-w-3xl mx-auto leading-tight">
          Detect AI-Generated Coding Assignments with Integrity
        </h2>

        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto mb-10 leading-relaxed">
          Ensure structural integrity in Computer Science classes. Analyze student repository structures, commit timelines, and syntax consistencies leveraging deep hybrid reasoning insights.
        </p>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <button
            onClick={onStart}
            className="w-full sm:w-auto bg-white hover:bg-neutral-200 text-[#0A0A0B] font-semibold py-2.5 px-6 rounded-lg text-xs cursor-pointer transition-all shadow-md font-sans"
          >
            Enter Instructor Portal
          </button>
        </div>

        {/* Elegant Dashboard Preview Mockup */}
        <div className="relative mx-auto max-w-4xl rounded-xl border border-white/5 bg-[#0D0D0E]/80 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white/10 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10 inline-block" />
            </div>
            <div className="bg-[#0A0A0B] border border-white/5 px-4 py-1 rounded-md text-[10px] font-mono text-slate-500 w-1/3 truncate">
              https://codeproof.ai/dashboard
            </div>
            <span className="w-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="bg-[#0A0A0B]/60 p-4 rounded-lg border border-white/5">
              <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider mb-1">AI Suspicious Solves</p>
              <h4 className="text-2xl font-extrabold text-red-400 font-sans tracking-tight">41.2%</h4>
              <p className="text-[10px] text-slate-400 mt-1">14 Repos flagged for review</p>
            </div>
            <div className="bg-[#0A0A0B]/60 p-4 rounded-lg border border-white/5">
              <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider mb-1">Scanned Repositories</p>
              <h4 className="text-2xl font-extrabold text-indigo-400 font-sans tracking-tight">34 Solutions</h4>
              <p className="text-[10px] text-slate-400 mt-1">Python, Java, C++, JS matched</p>
            </div>
            <div className="bg-[#0A0A0B]/60 p-4 rounded-lg border border-white/5">
              <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider mb-1">Code Quality Average</p>
              <h4 className="text-2xl font-extrabold text-emerald-400 font-sans tracking-tight">Excellent</h4>
              <p className="text-[10px] text-slate-400 mt-1">12 Natural progress pathways</p>
            </div>
          </div>

          <div className="mt-4 bg-[#0A0A0B]/90 rounded-lg p-4 border border-white/5 text-left font-mono text-xs text-slate-400 overflow-x-auto select-none">
            <div className="flex justify-between border-b border-white/5 pb-2 mb-2">
              <span className="text-white font-sans font-semibold text-[11px]">Active AI Detector Model</span>
              <span className="text-indigo-400 text-[10px] font-semibold">STATE: ACTIVE</span>
            </div>
            <div className="text-[11px] leading-relaxed">[INFO] Scanning student_repo_91.git... Matches: day1/fibonacci.py</div>
            <div className="text-yellow-500/80 text-[11px] leading-relaxed">[WARN] Single giant initial commit detected (71cb3d). No historical work lines.</div>
            <div className="text-red-400 text-[11px] leading-relaxed">[DETECTION] Gemini suspicion score generated: 86%. Formatting has 0 typographical issues.</div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="bg-[#0D0D0E]/30 border-t border-white/5 py-20 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-2xl font-extrabold text-white tracking-tight mb-3">
              Advanced Hybrid Detection Engine
            </h3>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Our analyzer evaluates student repositories through a unique multi-dimensional fingerprint framework.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0C0C0D] p-6 rounded-xl border border-white/5 hover:border-white/10 transition-all">
              <div className="bg-indigo-500/10 p-2.5 rounded-lg text-indigo-400 w-max mb-4 border border-indigo-500/10">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">Excel/CSV Batch Imports</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Upload class rosters directly. The portal reads names and student repository links immediately without manual copying.
              </p>
            </div>

            <div className="bg-[#0C0C0D] p-6 rounded-xl border border-white/5 hover:border-white/10 transition-all">
              <div className="bg-indigo-500/10 p-2.5 rounded-lg text-indigo-400 w-max mb-4 border border-indigo-500/10">
                <GitBranch className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">Commit Timeline Auditing</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Flags single giant dump uploads, suspicious upload frequencies, and unnatural coding timelines that bypass normal iterations.
              </p>
            </div>

            <div className="bg-[#0C0C0D] p-6 rounded-xl border border-white/5 hover:border-white/10 transition-all">
              <div className="bg-indigo-500/10 p-2.5 rounded-lg text-indigo-400 w-max mb-4 border border-indigo-500/10">
                <Terminal className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">Automated Oral Exam Questions</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Gemini reviews the student code logic and generates custom oral examination viva questions to challenge student conceptual competency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 max-w-6xl mx-auto px-6 text-center text-slate-500 text-xs">
        <p>© 2026 CodeProof AI. Secure Educational Integrity Systems.</p>
        <p className="mt-1 text-[10px] text-slate-600">Built securely in sandboxed developer environment.</p>
      </footer>
    </div>
  );
}
