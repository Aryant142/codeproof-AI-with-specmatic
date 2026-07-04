import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  FileText,
  Trash2, 
  Play, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Eye,
  Key
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ExcelScan } from '../types';

interface UploadViewProps {
  scans: ExcelScan[];
  onStartAnalysis: (fileName: string, students: Array<{ studentName: string; githubUrl: string; rollNo?: string }>, githubToken?: string) => void;
  onSelectScan: (scanId: string) => void;
  onDeleteScan: (scanId: string) => void;
  onClearAllHistory: () => void;
}

export interface StudentRecord {
  studentName: string;
  githubUrl: string;
  isValidUrl: boolean;
  rollNo?: string;
}

export default function UploadView({ scans, onStartAnalysis, onSelectScan, onDeleteScan, onClearAllHistory }: UploadViewProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedStudents, setParsedStudents] = useState<StudentRecord[]>([]);
  const [githubToken, setGithubToken] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse excel, CSV, or PDF rosters
  const processFileData = (file: File) => {
    setErrorMsg(null);
    setUploading(true);

    if (file.name.toLowerCase().endsWith('.pdf')) {
      fetch('/api/parse-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/pdf'
        },
        body: file
      })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to parse PDF file.");
        }
        return res.json();
      })
      .then((data) => {
        if (data.students && Array.isArray(data.students)) {
          setSelectedFile(file);
          setParsedStudents(data.students);
        } else {
          throw new Error("No student records returned from server.");
        }
      })
      .catch((err: any) => {
        setErrorMsg(err?.message || "PDF parsing error.");
      })
      .finally(() => {
        setUploading(false);
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("Could not parse file data.");

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert table to JSON structure
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        if (rows.length < 2) {
          throw new Error("Target file spreadsheet seems empty or lacks column headers. Must contain headers: e.g. Student Name, GitHub Link.");
        }

        // Find relevant column indexes
        const headers = rows[0].map(h => String(h).toLowerCase().trim());
        const nameIdx = headers.findIndex(h => h.includes("student") || h.includes("name") || h.includes("user"));
        const linksIdx = headers.findIndex(h => h.includes("github") || h.includes("link") || h.includes("url") || h.includes("repo"));
        const rollIdx = headers.findIndex(h => h.includes("roll") || h.includes("reg") || h.includes("symbol") || h === "no" || h === "serial" || h === "sl" || h.includes("rollno"));

        if (nameIdx === -1 || linksIdx === -1) {
          throw new Error("Could not automatically locate 'Student Name' and 'GitHub Link' columns in sheet header row. Please re-adjust column named headers.");
        }

        const studentRecords: StudentRecord[] = [];
        for (let idx = 1; idx < rows.length; idx++) {
          const row = rows[idx];
          const name = String(row[nameIdx] || "").trim();
          const githubLink = String(row[linksIdx] || "").trim();
          const roll = rollIdx !== -1 ? String(row[rollIdx] || "").trim() : "";

          if (name && githubLink) {
            const isValid = githubLink.includes("github.com/");
            studentRecords.push({
              studentName: name,
              githubUrl: githubLink,
              isValidUrl: isValid,
              rollNo: roll || undefined
            });
          }
        }

        if (studentRecords.length === 0) {
          throw new Error("No non-empty candidate student rows extracted from sheet rows.");
        }

        setSelectedFile(file);
        setParsedStudents(studentRecords);
      } catch (err: any) {
        setErrorMsg(err?.message || "Parsing error. Check template style configuration.");
      } finally {
        setUploading(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg("File reader loading failed.");
      setUploading(false);
    };

    reader.readAsBinaryString(file);
  };

  // Click on open picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFileData(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFileData(e.dataTransfer.files[0]);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setParsedStudents([]);
    setErrorMsg(null);
  };

  // Trigger scanning sequence
  const executeScan = () => {
    if (!selectedFile || parsedStudents.length === 0) return;
    const filterValid = parsedStudents.filter(s => s.isValidUrl);
    if (filterValid.length === 0) {
      setErrorMsg("No valid GitHub repository links found inside dataset.");
      return;
    }
    
    // Call parent handler
    onStartAnalysis(
      selectedFile.name, 
      filterValid.map(f => ({ studentName: f.studentName, githubUrl: f.githubUrl, rollNo: f.rollNo })),
      githubToken
    );
    
    // Clear state
    clearSelectedFile();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 font-sans">
      {/* Upper header */}
      <div className="border-b border-white/5 pb-6">
        <h2 className="text-2xl font-sans font-extrabold text-white tracking-tight leading-none mb-1.5">Upload Assignment Table</h2>
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Initiate AI analysis scanning for student source repositories</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left column file drop system */}
        <div className="lg:col-span-2 space-y-6">
          
          {errorMsg && (
            <div className="bg-red-950/20 border border-red-500/20 p-4 rounded-xl text-red-400 text-xs flex gap-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {!selectedFile ? (
            /* Upload area section */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-indigo-500/60 bg-indigo-500/5' 
                  : 'border-white/5 hover:border-white/10 bg-[#0D0D0E]/80 hover:bg-[#121214]/80'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".xlsx,.xls,.csv,.pdf" 
                className="hidden" 
              />
              <div className="bg-white/5 text-slate-300 p-4 rounded-xl w-max mx-auto mb-4 border border-white/5">
                <UploadCloud className="h-6 w-6 text-indigo-400" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-2 font-sans">Drag and drop file here</h4>
              <p className="text-slate-500 text-xs max-w-md mx-auto mb-6 leading-relaxed">
                Accepts Microsoft Excel (.xlsx, .xls), CSV lists, or PDF rosters containing student names and GitHub repository links.
              </p>
              <button className="bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 font-medium py-2 px-4 rounded-lg text-xs leading-none transition-colors cursor-pointer inline-flex items-center gap-1.5 font-sans">
                <FileText className="h-3.5 w-3.5 text-indigo-400" /> Choose roster file
              </button>
            </div>
          ) : (
            /* Preview of parsed details */
            <div className="bg-[#0D0D0E]/80 border border-white/5 rounded-xl p-6 shadow-md relative">
              <div className="flex justify-between items-start border-b border-white/5 pb-4 mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    {selectedFile.name.toLowerCase().endsWith('.pdf') ? (
                      <FileText className="h-4.5 w-4.5 text-indigo-400" />
                    ) : (
                      <FileSpreadsheet className="h-4.5 w-4.5 text-indigo-400" />
                    )} 
                    {selectedFile.name}
                  </h4>
                  <p className="text-xs text-slate-550">Found {parsedStudents.length} candidate records</p>
                </div>
                <button 
                  onClick={clearSelectedFile}
                  className="bg-white/5 hover:bg-[#1A1012] border border-white/5 hover:border-red-900/30 text-slate-400 hover:text-red-400 p-2 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Rows List */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {parsedStudents.map((stud, sidx) => (
                  <div key={sidx} className="flex justify-between items-center text-[11px] p-3 bg-black/40 rounded-lg border border-white/5 leading-none">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-white font-bold">{stud.studentName}</p>
                        {stud.rollNo && (
                          <span className="font-mono text-[9px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 py-0.5 px-1.5 rounded-md leading-none font-semibold">
                            Roll: {stud.rollNo}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 font-mono text-[10px]">{stud.githubUrl}</p>
                    </div>
                    {stud.isValidUrl ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/5 px-2.5 py-1 rounded-md border border-emerald-500/10 text-[10px]">
                        <CheckCircle2 className="h-3 w-3" /> Valid Repo Link
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-400 font-semibold bg-red-500/5 px-2.5 py-1 rounded-md border border-red-500/10 text-[10px]">
                        <AlertCircle className="h-3 w-3" /> Invalid Link
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Action buttons triggers */}
              <div className="mt-6 border-t border-white/5 pt-6 flex justify-end gap-3">
                <button 
                  onClick={clearSelectedFile} 
                  className="text-slate-400 hover:text-slate-200 text-xs font-medium py-2 px-4 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeScan}
                  className="bg-white hover:bg-neutral-200 text-black font-semibold py-2 px-4 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Play className="h-3.5 w-3.5 fill-black text-black" /> Trigger Analysis Scan
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right column settings: Github Token / instructions */}
        <div className="space-y-6">
          
          <div className="bg-[#0D0D0E]/80 border border-white/5 rounded-xl p-5 shadow-md relative">
            <h4 className="text-xs font-semibold text-white mb-1.5 flex items-center gap-2 uppercase tracking-wider">
              <Key className="h-3.5 w-3.5 text-indigo-450" /> GitHub Token (Optional)
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
              Enter your personal access token (PAT) to authorize deep scanning runs and prevent API rate-limit errors.
            </p>
            <input 
              type="password" 
              value={githubToken} 
              onChange={(e) => setGithubToken(e.target.value)} 
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxx" 
              className="w-full bg-black/40 border border-white/5 px-3 py-2 text-xs rounded-lg text-white font-mono placeholder-slate-800 focus:outline-none focus:border-white/10"
            />
          </div>

          <div className="bg-[#0D0D0E]/80 border border-white/5 rounded-xl p-5 shadow-md leading-relaxed">
            <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-2 uppercase tracking-wider">
              <HelpCircle className="h-3.5 w-3.5 text-indigo-450" /> Template Guidance
            </h4>
            <ol className="list-decimal pl-4 space-y-2 text-[11px] text-slate-500">
              <li>Open Excel or Google Sheets.</li>
              <li>Type <strong className="text-slate-400">Student Name</strong> in column A & <strong className="text-slate-400">GitHub Link</strong> in column B.</li>
              <li>Fill entries with public student repository path addresses.</li>
              <li>Export or download sheet as <strong className="text-slate-400">.xlsx</strong> or <strong className="text-slate-400">.csv</strong>.</li>
            </ol>
          </div>

        </div>

      </div>

      {/* Scans table: list of previous uploads */}
      <div className="bg-[#0D0D0E]/80 border border-white/5 rounded-xl p-6 shadow-md">
        <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4 flex-wrap gap-2">
          <h4 className="text-sm font-semibold text-white font-sans">Class spreadsheet upload log</h4>
          {scans.length > 0 && (
            <button
              onClick={onClearAllHistory}
              className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border border-red-500/10 hover:border-red-500/25 bg-red-500/5 px-3 py-1.5 rounded-lg font-sans"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear All History
            </button>
          )}
        </div>

        {scans.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No previous spreadsheets uploaded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-slate-500 border-b border-white/5 font-sans">
                  <th className="py-2.5 px-3 uppercase tracking-wider font-semibold">File Name</th>
                  <th className="py-2.5 px-3 uppercase tracking-wider font-semibold">Uploaded At</th>
                  <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-center">Student count</th>
                  <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-center">Scanner Status</th>
                  <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {scans.map((sc) => {
                  return (
                    <tr key={sc.id} className="hover:bg-white/5 transition-all leading-none group">
                      <td className="py-3 px-3 font-semibold text-white text-xs">{sc.fileName}</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(sc.uploadedAt).toLocaleString()}</td>
                      <td className="py-3 px-3 text-center text-slate-300 font-bold font-mono">{sc.studentCount}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sc.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                          sc.status === 'running' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 animate-pulse' :
                          sc.status === 'failed' ? 'bg-red-500/15 text-red-500 border border-red-500/15' :
                          'bg-neutral-800 text-slate-300'
                        }`}>
                          {sc.status === 'running' && <RefreshCw className="h-3 w-3 animate-spin text-indigo-400" />}
                          {sc.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                          {sc.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5">
                        <button 
                          disabled={sc.status !== 'completed'}
                          onClick={() => onSelectScan(sc.id)}
                          className="bg-white/5 hover:bg-white/10 disabled:opacity-40 text-slate-200 py-1.5 px-3 rounded-lg text-[11px] font-semibold border border-white/10 transition-colors cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5 text-indigo-400" /> View Report
                        </button>
                        <button 
                          onClick={() => onDeleteScan(sc.id)}
                          className="bg-[#0D0D0E] hover:bg-[#1A1012] hover:text-red-400 border border-white/5 hover:border-red-900/30 text-slate-500 p-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center"
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
        )}
      </div>

    </div>
  );
}
