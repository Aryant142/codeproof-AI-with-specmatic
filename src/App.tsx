import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  FolderGit2, 
  ChevronRight, 
  FileCheck,
  Cpu, 
  Trash2, 
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  RefreshCw,
  GitCommit,
  UserCheck,
  Search
} from 'lucide-react';
import { db, auth, testConnection } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  orderBy,
  getDocs
} from 'firebase/firestore';

import { ViewState, ExcelScan, StudentSummary } from './types';
import Sidebar from './components/Sidebar';
import LandingView from './components/LandingView';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import UploadView from './components/UploadView';
import StudentReportView from './components/StudentReportView';
import AnalyticsView from './components/AnalyticsView';
import PinGuard from './components/PinGuard';
import ConfirmationModal from './components/ConfirmationModal';

export default function App() {
  const [isPinVerified, setIsPinVerified] = useState<boolean>(() => {
    return localStorage.getItem('codeproof_pin_verified') === 'true';
  });

  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [user, setUser] = useState<any>(null);
  
  // Real or mockup database states
  const [scans, setScans] = useState<ExcelScan[]>([]);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  
  // Active selected detail report card
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Status and scanning loops
  const [loading, setLoading] = useState(false);
  const [scanningStatus, setScanningStatus] = useState<string | null>(null);
  const [isGeminiQuotaExceeded, setIsGeminiQuotaExceeded] = useState<boolean>(false);
  const [isGroqQuotaExceeded, setIsGroqQuotaExceeded] = useState<boolean>(false);
  const [activeEngine, setActiveEngine] = useState<string>("Gemini 3.5");

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const checkHealthAndQuota = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setIsGeminiQuotaExceeded(!!data.isGeminiQuotaExceeded);
        setIsGroqQuotaExceeded(!!data.isGroqQuotaExceeded);
        if (data.activeEngine) {
          setActiveEngine(data.activeEngine);
        }
      }
    } catch (e) {
      console.warn("Could not check health state:", e);
    }
  };

  useEffect(() => {
    // Audit Firestore connectivity
    testConnection();

    // Check health and quota status initially
    checkHealthAndQuota();
    const intervalId = setInterval(checkHealthAndQuota, 15000);

    // Setup Firebase Authentication listener
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "Educator",
          photoURL: firebaseUser.photoURL
        });
        setCurrentView('dashboard');
      } else {
        setUser(null);
        if (currentView !== 'landing') {
          setCurrentView('landing');
        }
      }
    });

    return () => {
      unsubscribeAuth();
      clearInterval(intervalId);
    };
  }, []);

  // Fetch Firestore rosters when signed-in
  useEffect(() => {
    if (!user) {
      setScans([]);
      setStudents([]);
      return;
    }

    // Real Firebase listeners for scanned structures
    const scansQuery = query(
      collection(db, 'scans'),
      where('teacherId', '==', user.uid)
    );
    const unsubscribeScans = onSnapshot(scansQuery, (snapshot) => {
      const liveScans: ExcelScan[] = [];
      snapshot.forEach(doc => {
        liveScans.push(doc.data() as ExcelScan);
      });
      // Sort newest imports first
      setScans(liveScans.sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()));
    }, () => {});

    const studentsQuery = query(
      collection(db, 'students'),
      where('teacherId', '==', user.uid)
    );
    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      const liveStudents: StudentSummary[] = [];
      snapshot.forEach(doc => {
        liveStudents.push(doc.data() as StudentSummary);
      });
      setStudents(liveStudents);
    }, () => {});

    return () => {
      unsubscribeScans();
      unsubscribeStudents();
    };
  }, [user]);

  // Sign out handler
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setCurrentView('landing');
  };

  // Launch analysis scanning operation from parsed sheets rows
  const handleStartAnalysis = async (fileName: string, roster: Array<{ studentName: string; githubUrl: string; rollNo?: string }>, githubToken?: string) => {
    if (!user) {
      alert("Please sign in to execute analysis scans.");
      return;
    }

    setScanningStatus(`Parsing ${roster.length} student repositories... Commencing scanning sequences.`);
    try {
      const response = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          students: roster,
          teacherId: user.uid,
          githubToken
        })
      });

      if (response.ok) {
        setScanningStatus("AI Plagiarism scanner triggered successfully. Scanned summaries will update live.");
        setTimeout(() => {
          setScanningStatus(null);
          checkHealthAndQuota();
        }, 4000);
        setCurrentView('students');
      } else {
        alert("Failed to queue repositories checks. Try again shortly.");
      }
    } catch (e) {
      console.error(e);
      setScanningStatus(null);
    }
  };

  // Delete transaction log
  const handleDeleteScan = (scanId: string) => {
    const scan = scans.find(s => s.id === scanId);
    const name = scan ? scan.fileName : "this spreadsheet run";

    setConfirmModal({
      isOpen: true,
      title: "Delete Spreadsheet Run",
      message: `Are you sure you want to delete the spreadsheet run '${name}' and all affiliated student checks? This action cannot be undone.`,
      confirmText: "Delete Run",
      isDanger: true,
      onConfirm: async () => {
        // 1. Instantly update client UI state
        setScans(prev => prev.filter(s => s.id !== scanId));
        setStudents(prev => prev.filter(st => st.scanId !== scanId));

        if (user) {
          try {
            // 2. Clear from backend memory buffers first
            await fetch('/api/delete-scan', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ scanId })
            });

            // 3. Client-side Firestore delete queries with proper Promise serializing
            await deleteDoc(doc(db, 'scans', scanId));
            const studsSnap = await getDocs(query(collection(db, 'students'), where('scanId', '==', scanId)));
            
            const studsPromises = studsSnap.docs.map(d => deleteDoc(doc(db, 'students', d.id)));
            const reportsPromises = studsSnap.docs.map(d => deleteDoc(doc(db, 'student_reports', d.id)));
            await Promise.all([...studsPromises, ...reportsPromises]);
          } catch (err) {
            console.warn("Silent integration feedback ignore on scan delete sync:", err);
          }
        }
      }
    });
  };

  const handleDeleteStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    const name = student ? student.studentName : "this student";

    setConfirmModal({
      isOpen: true,
      title: "Delete Student Submission",
      message: `Are you sure you want to delete the report record for ${name}? This will permanently remove their repository results.`,
      confirmText: "Delete",
      isDanger: true,
      onConfirm: async () => {
        // 1. Instantly update client UI state
        setStudents(prev => prev.filter(s => s.id !== studentId));
        if (user) {
          try {
            // 2. Clear from backend memory buffers first
            await fetch('/api/delete-student', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ studentId })
            });

            // 3. Client-side Firestore delete queries
            await deleteDoc(doc(db, 'students', studentId));
            await deleteDoc(doc(db, 'student_reports', studentId));
          } catch (err) {
            console.warn("Silent integration feedback ignore on student delete sync:", err);
          }
        }
      }
    });
  };

  const handleClearAllHistory = () => {
    setConfirmModal({
      isOpen: true,
      title: "Clear All History",
      message: "Are you sure you want to clear all spreadsheet upload records and student analysis reports? This action cannot be undone.",
      confirmText: "Clear All",
      isDanger: true,
      onConfirm: async () => {
        setScans([]);
        setStudents([]);
        setSelectedStudentId(null);

        if (user) {
          try {
            // 1. Clear database caches on backend first so that memory collections and backend is fully reset
            await fetch('/api/clear-history', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ teacherId: user.uid })
            });

            // 2. Client-side Firestore delete queries with proper Promise serializing
            const scansSnap = await getDocs(query(collection(db, 'scans'), where('teacherId', '==', user.uid)));
            const scansPromises = scansSnap.docs.map(d => deleteDoc(doc(db, 'scans', d.id)));
            await Promise.all(scansPromises);

            const studsSnap = await getDocs(query(collection(db, 'students'), where('teacherId', '==', user.uid)));
            const studsPromises = studsSnap.docs.map(d => deleteDoc(doc(db, 'students', d.id)));
            const reportsPromises = studsSnap.docs.map(d => deleteDoc(doc(db, 'student_reports', d.id)));
            await Promise.all([...studsPromises, ...reportsPromises]);
          } catch (err) {
            console.warn("Silent ignore database sync warnings during purging:", err);
          }
        }
      }
    });
  };

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    setCurrentView('reports');
  };

  const activeStudentSummary = students.find(s => s.id === selectedStudentId) || null;
  const [selectedScanFilter, setSelectedScanFilter] = useState<string>('all');
  const [suspicionFilter, setSuspicionFilter] = useState<string>('all');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');

  const availableDaysList = useMemo(() => {
    const daysSet = new Set<string>();
    students.forEach(st => {
      const studentDays = st.days && st.days.length > 0 ? st.days : ["Day1", "Day2"];
      studentDays.forEach(day => {
        if (day) daysSet.add(day);
      });
    });
    return Array.from(daysSet).sort();
  }, [students]);

  if (!isPinVerified) {
    return <PinGuard onSuccess={() => setIsPinVerified(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans select-none antialiased text-slate-100">
      
      {/* Dynamic Nav Sidebar rendered only on active portals workspaces */}
      {currentView !== 'landing' && currentView !== 'auth' && (
        <Sidebar 
          currentView={currentView} 
          onNavigate={(view) => {
            setSelectedStudentId(null);
            setCurrentView(view);
          }}
          user={user}
          onLogout={handleLogout}
          activeEngine={activeEngine}
        />
      )}

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto max-h-screen bg-black relative">
        
        {/* Dynamic global analyzer status bar floating panel */}
        {scanningStatus && (
          <div className="m-6 bg-indigo-950/80 border border-indigo-500/30 py-3.5 px-5 rounded-2xl flex items-center justify-between text-xs text-indigo-200 animate-pulse font-medium shadow-2xl relative">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="h-4 w-4 text-indigo-400 animate-spin" />
              <span>{scanningStatus}</span>
            </div>
          </div>
        )}

        {/* Groq or Gemini API Limit Alert Banner */}
        {(isGroqQuotaExceeded || isGeminiQuotaExceeded) && (
          <div className="m-6 bg-amber-950/20 border border-amber-500/20 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-amber-200 shadow-xl font-sans">
            <div className="flex items-start md:items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-0.5 md:mt-0 shrink-0">
                <AlertCircle className="h-4 w-4 shrink-0" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-white text-sm leading-none flex items-center gap-2">
                  {isGroqQuotaExceeded && isGeminiQuotaExceeded ? (
                    <span>⚠️ AI Engines Quota Exhausted</span>
                  ) : isGroqQuotaExceeded ? (
                    <span>⏳ Groq API Token Rate Limit Exceeded (429)</span>
                  ) : (
                    <span>⚠️ Gemini API Key Daily Quota Exceeded</span>
                  )}
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed max-w-4xl">
                  {isGroqQuotaExceeded && isGeminiQuotaExceeded ? (
                    <span>
                      Both your active Groq TPM rate limits and backup Gemini free tier daily quotas have been exceeded. 
                      A premium <strong>high-fidelity offline static fallback parser</strong> has automatically activated in the background to ensure all uploads, analyses, and custom prompts continue working instantly with synthetic viva oral questions and authentic-style code reviews.
                    </span>
                  ) : isGroqQuotaExceeded ? (
                    <span>
                      Your configured <strong>Groq API Key</strong> has temporarily hit its tokens-per-minute (TPM) or requests-per-minute (RPM) limits (common on free tier Llama-3.3-70b-versatile keys). 
                      The analyzer has automatically redirected current queries to the <strong>Gemini backup engine</strong> (or offline static fallback parser) to guarantee uninterrupted audits for your student rosters.
                    </span>
                  ) : (
                    <span>
                      Your server's daily <strong>Gemini free tier requests quota</strong> (20 requests limit) has been reached. 
                      An offline static parsing module is successfully running to preserve the interface functionality and output high-fidelity style evaluations, viva inquiries, and reports instantaneously.
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-[10px] bg-slate-900 border border-slate-800 text-amber-400 font-extrabold uppercase tracking-wider py-2 px-3.5 rounded-xl md:self-center self-start leading-none shrink-0 font-mono">
              Failsafe Fallback Active
            </div>
          </div>
        )}

        {/* View switching logic */}
        {currentView === 'landing' && (
          <LandingView 
            onStart={() => setCurrentView('auth')}
          />
        )}

        {currentView === 'auth' && (
          <AuthView 
            onSignInSuccess={(usr) => {
              setUser(usr);
              setCurrentView('dashboard');
            }}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardView 
            scans={scans}
            students={students}
            onNavigateToUpload={() => setCurrentView('upload')}
            onNavigateToStudents={() => setCurrentView('students')}
            onSelectStudent={handleSelectStudent}
            onDeleteStudent={handleDeleteStudent}
            onClearAllHistory={handleClearAllHistory}
          />
        )}

        {currentView === 'upload' && (
          <UploadView 
            scans={scans}
            onStartAnalysis={handleStartAnalysis}
            onSelectScan={(id) => {
              // Filter student who belong to this scan and transition
              const scanStudents = students.filter(st => st.scanId === id);
              if (scanStudents.length > 0) {
                handleSelectStudent(scanStudents[0].id);
              } else {
                setCurrentView('students');
              }
            }}
            onDeleteScan={handleDeleteScan}
            onClearAllHistory={handleClearAllHistory}
          />
        )}

        {currentView === 'students' && (
          <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8">
            <div className="border-b border-slate-800 pb-6 flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-sans font-extrabold text-white tracking-tight leading-none mb-1.5">Classroom Student Rosters</h2>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold font-sans">Full analysis score audits of imported repositories</span>
              </div>
              <div className="flex gap-3 items-center flex-wrap">
                {scans.length > 0 && (
                  <select
                    value={selectedScanFilter}
                    onChange={(e) => setSelectedScanFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-slate-200 text-xs py-2.5 px-3.5 rounded-xl cursor-pointer focus:outline-none focus:border-slate-700 font-semibold"
                  >
                    <option value="all">📁 All Spreadsheets ({students.length} students)</option>
                    {scans.map(s => (
                      <option key={s.id} value={s.id}>
                        📄 {s.fileName} ({students.filter(stud => stud.scanId === s.id).length} records)
                      </option>
                    ))}
                  </select>
                )}
                <select
                  value={suspicionFilter}
                  onChange={(e) => setSuspicionFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs py-2.5 px-3.5 rounded-xl cursor-pointer focus:outline-none focus:border-slate-700 font-semibold"
                >
                  <option value="all">🔍 Show All</option>
                  <option value="high">🔥 High Suspicion Only (&gt;65%)</option>
                  <option value="low">🟢 Low Suspicion Only (&lt;30%)</option>
                </select>
                <select
                  value={selectedDayFilter}
                  onChange={(e) => setSelectedDayFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs py-2.5 px-3.5 rounded-xl cursor-pointer focus:outline-none focus:border-slate-700 font-semibold"
                >
                  <option value="all">📆 Filter by Day/Folder</option>
                  {availableDaysList.map(d => (
                    <option key={d} value={d}>🕒 {d}</option>
                  ))}
                </select>
                <button 
                  onClick={() => setCurrentView('upload')}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 py-2.5 px-4 rounded-xl text-xs font-semibold cursor-pointer z-10"
                >
                  Upload Spreadsheet
                </button>
                {students.length > 0 && (
                  <button 
                    onClick={handleClearAllHistory}
                    className="bg-red-950/20 hover:bg-red-950/40 border border-red-500/10 hover:border-red-500/25 text-red-400 py-2.5 px-4 rounded-xl text-xs font-semibold cursor-pointer z-10 flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Clear All History
                  </button>
                )}
              </div>
            </div>

            {/* Complete List table */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative backdrop-blur-sm">
              {(() => {
                let filtered = selectedScanFilter === 'all' 
                  ? students 
                  : students.filter(s => s.scanId === selectedScanFilter);

                if (suspicionFilter === 'high') {
                  filtered = filtered.filter(s => s.suspicionScore > 65);
                } else if (suspicionFilter === 'low') {
                  filtered = filtered.filter(s => s.suspicionScore < 30);
                }

                if (selectedDayFilter !== 'all') {
                  filtered = filtered.filter(s => {
                    const studentDays = s.days && s.days.length > 0 ? s.days : ["Day1", "Day2"];
                    return studentDays.some(d => d.toLowerCase() === selectedDayFilter.toLowerCase());
                  });
                }

                if (filtered.length === 0) {
                  return (
                    <div className="py-16 text-center text-slate-500 text-sm whitespace-normal space-y-4">
                      <p>No analyzed student records detected for this selection.</p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider bg-black">Student Name</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider bg-black">GitHub Repo URL</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center bg-black">AI Suspicion Level</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center bg-black">Commit Timeline progress</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center bg-black">Matched Parity</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right bg-black">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {filtered.map((student) => {
                          const isHigh = student.suspicionScore > 65;
                          const isMedium = student.suspicionScore > 30 && student.suspicionScore <= 65;
                          const associatedScan = scans.find(sc => sc.id === student.scanId);
                          return (
                            <tr key={student.id} className="hover:bg-slate-800/20 transition-all leading-none group">
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="font-bold text-white text-sm">{student.studentName}</div>
                                  {student.rollNo && (
                                    <span className="font-mono text-[9px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 py-0.5 px-1.5 rounded-md leading-none font-semibold">
                                      Roll: {student.rollNo}
                                    </span>
                                  )}
                                </div>
                                {associatedScan && (
                                  <div className="text-[10px] text-indigo-400 font-medium font-sans mt-1.5 opacity-80">
                                    Imported: {associatedScan.fileName}
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                  {((student.days && student.days.length > 0) ? student.days : ["Day1", "Day2"]).map((dayName, dIdx) => (
                                    <span key={dIdx} className="bg-slate-950 border border-slate-800 text-[8.5px] text-slate-400 font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1 select-none font-sans">
                                      <span className="w-1 h-1 rounded-full bg-indigo-505 bg-indigo-500" />
                                      {dayName}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-4 px-4 text-slate-400 font-mono truncate max-w-sm">{student.githubUrl}</td>
                              <td className="py-4 px-4 text-center">
                                <span className={`inline-block px-2 py-1.5 rounded-lg font-bold font-mono text-xs ${
                                  isHigh ? 'bg-red-500/10 text-red-400 border border-red-500/10' :
                                  isMedium ? 'bg-amber-500/10 text-amber-500 border border-amber-500/10' :
                                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                                }`}>
                                  {student.suspicionScore}%
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  student.commitQuality === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                  student.commitQuality === 'Suspicious' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {student.commitQuality}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center font-bold font-mono text-slate-300">{student.similarityPercentage}%</td>
                              <td className="py-4 px-4 text-right space-x-2">
                                <button
                                  onClick={() => handleSelectStudent(student.id)}
                                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 group-hover:text-white group-hover:border-indigo-505 font-bold py-1.5 px-3.5 rounded-lg border border-slate-700 transition-all text-xs cursor-pointer inline-flex items-center gap-1.5 justify-end"
                                >
                                  <FileCheck className="h-3.5 w-3.5 text-indigo-400" /> View Report
                                </button>
                                <button
                                  onClick={() => handleDeleteStudent(student.id)}
                                  className="bg-slate-950 border border-slate-800 hover:border-red-900/30 hover:bg-[#1A1012] text-slate-500 hover:text-red-400 p-2 rounded-lg transition-all cursor-pointer inline-flex items-center"
                                  title="Delete student report record"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {currentView === 'reports' && selectedStudentId && (
          <StudentReportView 
            studentId={selectedStudentId}
            studentSummary={activeStudentSummary}
            onBack={() => {
              setSelectedStudentId(null);
              setCurrentView('students');
            }}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView 
            students={students}
            onSelectStudent={handleSelectStudent}
            selectedDay={selectedDayFilter}
            onDayChange={setSelectedDayFilter}
          />
        )}

      </main>

      {/* Confirmation Modal overlay driven by React state (bypassing window.confirm iframe sandbox blockages) */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDanger={confirmModal.isDanger}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
