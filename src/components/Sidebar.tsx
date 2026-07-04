import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  ShieldAlert, 
  LogOut,
  UserCheck
} from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  user: any;
  onLogout: () => void;
  activeEngine?: string;
}

export default function Sidebar({ currentView, onNavigate, user, onLogout, activeEngine }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as ViewState, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload' as ViewState, label: 'Upload Excel', icon: UploadCloud },
    { id: 'students' as ViewState, label: 'Student Reports', icon: Users },
    { id: 'analytics' as ViewState, label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-[#0D0D0E]/80 backdrop-blur-xl border-r border-white/5 flex flex-col justify-between h-screen sticky top-0 text-slate-300 relative z-10">
      <div>
        {/* Core Logo Branding */}
        <div className="p-6 border-b border-white/5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg text-white">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-sans font-extrabold text-lg tracking-tight text-white leading-none">CodeProof AI</h1>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Integrity Portal</span>
            </div>
          </div>

          <div className="mt-1 bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-medium">Core AI Engine:</span>
            <span className="font-mono text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 py-0.5 px-1.5 rounded-md tracking-tight leading-none">
              {activeEngine || "Gemini 3.5"}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive 
                    ? 'bg-white/5 text-white border border-white/10 shadow-sm' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Teacher Profile / Identity */}
      <div className="p-4 border-t border-white/5">
        {user ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              {user.photoURL ? (
                <img 
                  referrerPolicy="no-referrer"
                  src={user.photoURL} 
                  alt={user.displayName || "Teacher"} 
                  className="w-8 h-8 rounded-full object-cover border border-white/10" 
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-medium text-xs">
                  {user.displayName?.charAt(0) || "T"}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{user.displayName || "Instructor"}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email || "teacher@codeproof.ai"}</p>
              </div>
            </div>
            
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 justify-center py-2 px-3 text-xs bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-slate-400 rounded-lg border border-white/10 hover:border-red-500/20 transition-all cursor-pointer"
            >
              <LogOut className="h-3 w-3" />
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => onNavigate('auth')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer"
          >
            <UserCheck className="h-4 w-4" />
            Teacher Login
          </button>
        )}
      </div>
    </aside>
  );
}
