export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface ExcelScan {
  id: string;
  teacherId: string;
  fileName: string;
  uploadedAt: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  studentCount: number;
}

export interface StudentSummary {
  id: string;
  scanId: string;
  teacherId: string;
  studentName: string;
  githubUrl: string;
  suspicionScore: number;
  commitQuality: 'Excellent' | 'Good' | 'Suspicious' | 'Critical';
  similarityPercentage: number;
  status: 'completed' | 'analyzing' | 'failed';
  analyzedAt: string;
  rollNo?: string;
  days?: string[];
}

export interface CodeFileAnalysis {
  filePath: string;
  fileName: string;
  language: string;
  suspicionScore: number;
  reasoning: string[];
  codeSample: string;
  aiExplanation: string;
  summary: string;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  isSuspicious: boolean;
  suspicionReason?: string;
}

export interface VivaQuestion {
  question: string;
  expectedConcept: string;
  suggestedAnswer: string;
}

export interface StudentReport {
  studentId: string;
  scanId: string;
  teacherId: string;
  studentName: string;
  githubUrl: string;
  suspicionScore: number;
  reasoning: string[];
  vivaQuestions: VivaQuestion[];
  files: CodeFileAnalysis[];
  commits: CommitInfo[];
  similarityReasons?: string;
  rollNo?: string;
  days?: string[];
}

export type ViewState = 'landing' | 'auth' | 'dashboard' | 'upload' | 'students' | 'reports' | 'analytics' | 'settings';
