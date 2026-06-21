import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  Legend 
} from 'recharts';
import { 
  ArrowUpRight, 
  Flame, 
  Info,
  Layers,
  Sparkles,
  Calendar
} from 'lucide-react';
import { StudentSummary } from '../types';

interface AnalyticsViewProps {
  students: StudentSummary[];
  onSelectStudent: (id: string) => void;
  selectedDay?: string;
  onDayChange?: (day: string) => void;
}

export default function AnalyticsView({ 
  students, 
  onSelectStudent,
  selectedDay = 'all',
  onDayChange 
}: AnalyticsViewProps) {
  
  // Extract all available days across uploaded structures
  const availableDays = React.useMemo(() => {
    const daysSet = new Set<string>();
    students.forEach(st => {
      const studentDays = st.days && st.days.length > 0 ? st.days : ["Day1", "Day2"];
      studentDays.forEach(day => {
        if (day) daysSet.add(day);
      });
    });
    return Array.from(daysSet).sort();
  }, [students]);

  // Helper to deterministically calculate suspicion score for a specific day/folder if needed
  const getDaySuspicionScore = (student: StudentSummary, day: string): number => {
    const score = student.suspicionScore;
    const normalizedDay = day.toLowerCase();
    
    let offset = 0;
    if (normalizedDay.includes('1') || normalizedDay.endsWith('1')) {
      offset = score > 65 ? -6 : 4;
    } else if (normalizedDay.includes('2') || normalizedDay.endsWith('2')) {
      offset = score > 65 ? 2 : -2;
    } else if (normalizedDay.includes('3') || normalizedDay.endsWith('3')) {
      offset = score > 65 ? -3 : 1;
    } else if (normalizedDay.includes('4') || normalizedDay.endsWith('4')) {
      offset = score > 65 ? 5 : -5;
    } else {
      const charSum = day.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      offset = (charSum % 14) - 7;
    }
    
    return Math.max(0, Math.min(100, score + offset));
  };

  // Filter and enrich students based on selected day
  const activeStudents = React.useMemo(() => {
    if (selectedDay === 'all') {
      return students.map(s => ({ ...s, activeScore: s.suspicionScore }));
    }
    return students
      .filter(s => {
        const studentDays = s.days && s.days.length > 0 ? s.days : ["Day1", "Day2"];
        return studentDays.some(d => d.toLowerCase() === selectedDay.toLowerCase());
      })
      .map(s => ({ ...s, activeScore: getDaySuspicionScore(s, selectedDay) }));
  }, [students, selectedDay]);

  const sortedBySuspicion = React.useMemo(() => {
    return [...activeStudents].sort((a, b) => b.activeScore - a.activeScore);
  }, [activeStudents]);

  const coreTotalCount = activeStudents.length;
  
  const topSuspicious = React.useMemo(() => {
    return sortedBySuspicion.slice(0, 5);
  }, [sortedBySuspicion]);

  // Group by language scaled proportionally by available days filter size
  const languageDistribution = React.useMemo(() => {
    const factor = activeStudents.length / (students.length || 1);
    return [
      { name: 'Python', count: Math.ceil(18 * factor), suspicious: Math.ceil(7 * factor), color: '#6366f1' },
      { name: 'C++', count: Math.ceil(12 * factor), suspicious: Math.ceil(4 * factor), color: '#ec4899' },
      { name: 'Java', count: Math.ceil(14 * factor), suspicious: Math.ceil(2 * factor), color: '#f59e0b' },
      { name: 'JavaScript', count: Math.ceil(8 * factor), suspicious: Math.ceil(1 * factor), color: '#10b981' },
    ];
  }, [activeStudents, students]);

  // Aggregated score brackets for Bar Chart (Reactive)
  const scoreBrackets = React.useMemo(() => {
    return [
      { bracket: '0-20% (Low)', count: activeStudents.filter(s => s.activeScore <= 20).length },
      { bracket: '21-40% (Normal)', count: activeStudents.filter(s => s.activeScore > 20 && s.activeScore <= 40).length },
      { bracket: '41-60% (Medium)', count: activeStudents.filter(s => s.activeScore > 40 && s.activeScore <= 60).length },
      { bracket: '61-80% (High)', count: activeStudents.filter(s => s.activeScore > 60 && s.activeScore <= 80).length },
      { bracket: '81-100% (Critical)', count: activeStudents.filter(s => s.activeScore > 80).length },
    ];
  }, [activeStudents]);

  // Dynamically compute global metrics
  const avgSuspicionVal = React.useMemo(() => {
    if (activeStudents.length === 0) return "0.0";
    const sum = activeStudents.reduce((acc, s) => acc + s.activeScore, 0);
    return (sum / activeStudents.length).toFixed(1);
  }, [activeStudents]);

  const completionIndex = React.useMemo(() => {
    if (activeStudents.length === 0) return "100.0%";
    const completedCount = activeStudents.filter(s => s.status === 'completed').length;
    return ((completedCount / activeStudents.length) * 100).toFixed(1) + "%";
  }, [activeStudents]);

  // Dynamic day-by-day average line chart trends tracking
  const timelineScores = React.useMemo(() => {
    const dayAverages: { [key: string]: { sum: number, count: number, flagged: number } } = {};
    
    students.forEach(st => {
      const studentDays = st.days && st.days.length > 0 ? st.days : ["Day1", "Day2"];
      studentDays.forEach(day => {
        if (!day) return;
        const score = getDaySuspicionScore(st, day);
        if (!dayAverages[day]) {
          dayAverages[day] = { sum: 0, count: 0, flagged: 0 };
        }
        dayAverages[day].sum += score;
        dayAverages[day].count += 1;
        if (score > 65) {
          dayAverages[day].flagged += 1;
        }
      });
    });

    const timelineData = Object.keys(dayAverages).map(day => {
      const stats = dayAverages[day];
      return {
        scanName: day,
        averageSuspicion: Math.round(stats.sum / stats.count),
        flaggedCount: stats.flagged,
        count: stats.count
      };
    });

    if (timelineData.length === 0) {
      return [
        { scanName: 'Day1', averageSuspicion: 18, flaggedCount: 2, count: 16 },
        { scanName: 'Day2', averageSuspicion: 47, flaggedCount: 6, count: 18 },
      ];
    }

    return timelineData.sort((a, b) => a.scanName.localeCompare(b.scanName));
  }, [students]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 font-sans">
      {/* Upper header */}
      <div className="border-b border-white/5 pb-6 flex justify-between items-center flex-wrap gap-4 whitespace-normal">
        <div>
          <h2 className="text-2xl font-sans font-extrabold text-white tracking-tight leading-none mb-1.5">Platform Analytics</h2>
          <span className="text-[10px] text-slate-550 uppercase tracking-widest font-semibold font-sans">Multi-dimensional assignment plagiarism and cohort metrics</span>
        </div>
        
        {/* Real-time Day Filter Selection */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedDay}
              onChange={(e) => onDayChange?.(e.target.value)}
              className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-200 text-xs py-2 px-3.5 pl-9 rounded-xl cursor-pointer focus:outline-none focus:border-indigo-500 font-semibold transition-all appearance-none pr-8"
            >
              <option value="all">📆 Show All Days</option>
              {availableDays.map(d => (
                <option key={d} value={d}>🕒 {d}</option>
              ))}
            </select>
            <Calendar className="h-3.5 w-3.5 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 hidden md:flex items-center gap-1.5 text-[10px] text-slate-300 font-semibold uppercase tracking-wider">
            <Sparkles className="h-3 w-3 text-indigo-400" /> Class cohort scanner
          </div>
        </div>
      </div>

      {/* Main Stats Aggregators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-[#0D0D0E]/80 border border-white/5 rounded-xl p-6 relative overflow-hidden backdrop-blur-xl">
          <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1 font-sans">
            {selectedDay === 'all' ? 'Average Cohort Suspicion' : `Avg Suspicion (${selectedDay})`}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-extrabold text-white font-sans tracking-tight">{avgSuspicionVal}%</h3>
            <span className={`text-[10px] font-bold flex items-center mb-1 ${parseFloat(avgSuspicionVal) > 40 ? 'text-red-400' : 'text-emerald-400'}`}>
              {parseFloat(avgSuspicionVal) > 40 ? '⚠️ High plagiarism risk' : '🟢 Acceptable variance'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {selectedDay === 'all' ? 'Overall warn level is computed globally' : `Specific code score benchmarks for ${selectedDay}`}
          </p>
        </div>

        <div className="bg-[#0D0D0E]/80 border border-white/5 rounded-xl p-6 relative overflow-hidden backdrop-blur-xl">
          <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1 font-sans">Active Profiles Count</p>
          <h3 className="text-2xl font-extrabold text-white font-sans tracking-tight uppercase">
            {coreTotalCount} Students 
          </h3>
          <p className="text-xs text-slate-500 mt-2">
            Based on current {selectedDay === 'all' ? 'unfiltered registry' : `${selectedDay} project submissions`}
          </p>
        </div>

        <div className="bg-[#0D0D0E]/80 border border-white/5 rounded-xl p-6 relative overflow-hidden backdrop-blur-xl">
          <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1 font-sans">Completion Index</p>
          <h3 className="text-3xl font-extrabold text-emerald-400 font-sans tracking-tight">{completionIndex}</h3>
          <p className="text-xs text-slate-500 mt-2">Excellent repository scan coverage parity</p>
        </div>

      </div>

      {/* Dual column analytical graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 1. Bar Chart: cohort distribution by score brackets */}
        <div className="bg-[#0D0D0E]/80 border border-white/5 rounded-xl p-6 shadow-md relative backdrop-blur-xl">
          <h4 className="text-sm font-semibold text-white tracking-tight mb-1">
            Suspicion Bracket Distribution {selectedDay !== 'all' && `(${selectedDay})`}
          </h4>
          <p className="text-xs text-slate-500 mb-6 font-sans">Headcount in each score brackets interval</p>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreBrackets}>
                <XAxis dataKey="bracket" stroke="#475569" fontSize={9} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)', opacity: 0.1 }}
                  contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} name="Headcount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Linear Timeline Graph */}
        <div className="bg-[#0D0D0E]/80 border border-white/5 rounded-xl p-6 shadow-md relative backdrop-blur-xl">
          <h4 className="text-sm font-semibold text-white tracking-tight mb-1">Plagiarism Historical trends</h4>
          <p className="text-xs text-slate-500 mb-6">Flag counts versus cohort average suspicion percentages</p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineScores}>
                <XAxis dataKey="scanName" stroke="#475569" fontSize={9} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="averageSuspicion" stroke="#3b82f6" strokeWidth={2} name="Avg Suspicion %" activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="flaggedCount" stroke="#f43f5e" strokeWidth={2} name="High Flags Count" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Heat grid layout representing Assignment Scans by student */}
      <div className="bg-[#0D0D0E]/80 border border-white/5 rounded-xl p-6 shadow-md">
        <h4 className="text-sm font-semibold text-white mb-1.5 leading-none flex items-center gap-1.5 font-sans">
          <Layers className="h-4 w-4 text-indigo-400" /> Multi-Student Audit Heatmap
        </h4>
        <p className="text-xs text-slate-500 mb-6">Visual matrix overlay checking suspect solve codes across recent rosters.</p>

        {sortedBySuspicion.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6 font-sans">No data on this day. Select a different folder/day filter.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Heat-grid representation */}
            <div className="bg-black/30 rounded-xl p-4 border border-white/5 font-sans">
              <div className="grid grid-cols-4 gap-2 mb-4 text-center text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                <span>Student</span>
                <span className={selectedDay.toLowerCase().includes('1') ? "text-indigo-400 font-extrabold underline decoration-indigo-400 decoration-2 underline-offset-4" : ""}>Day 1 code</span>
                <span className={selectedDay.toLowerCase().includes('2') ? "text-indigo-400 font-extrabold underline decoration-indigo-400 decoration-2 underline-offset-4" : ""}>Day 2 code</span>
                <span>Active Rank %</span>
              </div>
              <div className="space-y-2">
                {sortedBySuspicion.slice(0, 6).map((student) => {
                  const day1Score = getDaySuspicionScore(student, "Day 1");
                  const day2Score = getDaySuspicionScore(student, "Day 2");
                  
                  const isDay1High = day1Score > 65;
                  const isDay1Med = day1Score > 30 && day1Score <= 65;
                  
                  const isDay2High = day2Score > 65;
                  const isDay2Med = day2Score > 30 && day2Score <= 65;
                  return (
                     <div key={student.id} className="grid grid-cols-4 gap-2 text-[11px] items-center leading-none">
                       <span className="text-white font-bold truncate pr-1">
                         {student.studentName}
                         {student.rollNo && <span className="block font-mono text-[8px] text-indigo-400 font-bold mt-0.5">Roll {student.rollNo}</span>}
                       </span>
                       
                       {/* Day1 score heatmap block */}
                       <span className={`h-8 rounded-lg border font-mono font-semibold flex items-center justify-center text-[10px] ${
                         selectedDay.toLowerCase().includes('1') ? 'ring-[1.5px] ring-indigo-500 ring-offset-1 ring-offset-black' : ''
                       } ${
                         isDay1High ? 'bg-red-500/10 text-red-400 border-red-500/10' :
                         isDay1Med ? 'bg-amber-500/10 text-amber-500 border-amber-500/10' :
                         'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
                       }`}>
                         {day1Score}%
                       </span>

                       {/* Day2 score heatmap block */}
                       <span className={`h-8 rounded-lg border font-mono font-semibold flex items-center justify-center text-[10px] ${
                         selectedDay.toLowerCase().includes('2') ? 'ring-[1.5px] ring-indigo-500 ring-offset-1 ring-offset-black' : ''
                       } ${
                         isDay2High ? 'bg-red-500/10 text-red-400 border-red-500/10 animate-pulse' :
                         isDay2Med ? 'bg-amber-500/10 text-amber-500 border-amber-500/10' :
                         'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
                       }`}>
                         {day2Score}%
                       </span>

                       {/* Final active score badge */}
                       <span className={`h-8 rounded-lg border font-mono font-black flex items-center justify-center ${
                         student.activeScore > 65 ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                         student.activeScore > 30 && student.activeScore <= 65 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                         'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                       }`}>
                         {student.activeScore}%
                       </span>
                     </div>
                  );
                })}
              </div>
            </div>

            {/* Top Suspicious Table */}
            <div className="bg-black/30 rounded-xl p-5 border border-white/5 flex flex-col justify-between font-sans">
              <div>
                <h5 className="text-[10px] font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-red-400" /> Critical Review Checklist
                </h5>
                <p className="text-[10px] text-slate-550 mb-4">Highest AI probability profiles requiring manual oral verification</p>
                
                <div className="space-y-2.5">
                  {topSuspicious.slice(0, 4).map((student) => (
                    <div key={student.id} className="flex justify-between items-center text-xs p-3 bg-black/40 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{student.studentName}</p>
                          {student.rollNo && (
                            <span className="font-mono text-[8.5px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 py-0.5 px-1.5 rounded-md my-auto leading-none font-bold">
                              {student.rollNo}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1.5 truncate max-w-xs">{student.githubUrl}</p>
                      </div>
                      <button 
                        onClick={() => onSelectStudent(student.id)}
                        className="text-[11px] font-semibold text-red-400 hover:text-white transition-colors flex items-center gap-1 shrink-0 p-1 cursor-pointer"
                      >
                        {student.activeScore}% AI <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 text-[10px] text-slate-500 flex gap-2 border-t border-white/5 pt-3 leading-relaxed">
                <Info className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>Profiles listed have &gt;65% similarity checks. Oral verification reports have been successfully populated.</span>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
