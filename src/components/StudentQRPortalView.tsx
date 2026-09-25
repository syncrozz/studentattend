import React, { useState, useEffect, useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Student,
  AttendanceSession,
  AttendanceActivity,
  AttendanceRecord,
  OFFICIAL_STUDENT_ATTEND_ICON
} from '../types';
import {
  getClassBadgeColor,
  getInitials,
  getStudentColor,
  getStudentDisplayName
} from '../utils/studentUtils';
import {
  Search,
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Mail,
  Phone,
  ArrowRight,
  Info,
  Camera,
  Edit3,
  X,
  Smartphone,
  ShieldCheck,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface StudentQRPortalViewProps {
  students: Student[];
  sessions: AttendanceSession[];
  activities: AttendanceActivity[];
  attendanceRecords: AttendanceRecord[];
  onUpdateStudent?: (student: Student) => void;
  onGoToAdmin?: () => void;
}

export const StudentQRPortalView: React.FC<StudentQRPortalViewProps> = ({
  students,
  sessions,
  activities,
  attendanceRecords,
  onUpdateStudent,
  onGoToAdmin
}) => {
  const [searchInput, setSearchInput] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isScreenshotMode, setIsScreenshotMode] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Helper to normalize alphanumeric characters (strips hyphens, spaces, symbols)
  const normalizeAlphanumeric = (str: string): string => {
    return (str || '').replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase();
  };

  // Check URL query param (e.g. ?id=PDA2403002 or #/qr?id=PDA2403002)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let idParam = urlParams.get('id') || urlParams.get('search') || urlParams.get('no_pelajar');

    if (!idParam && window.location.hash.includes('?')) {
      const hashQuery = window.location.hash.split('?')[1];
      const hashParams = new URLSearchParams(hashQuery);
      idParam = hashParams.get('id') || hashParams.get('search') || hashParams.get('no_pelajar');
    }

    // Support /qr/PDA2403002 directly
    if (!idParam) {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts[0]?.toLowerCase() === 'qr' && pathParts[1]) {
        idParam = decodeURIComponent(pathParts[1]);
      }
    }

    // Support #/qr/PDA2403002
    if (!idParam && window.location.hash) {
      const hashParts = window.location.hash.replace(/^#\/?/, '').split('/');
      if (hashParts[0]?.toLowerCase() === 'qr' && hashParts[1]) {
        idParam = decodeURIComponent(hashParts[1]);
      }
    }

    if (idParam && students.length > 0) {
      setSearchInput(idParam);
      const cleanParam = normalizeAlphanumeric(idParam);
      const matched = students.find(
        (s) =>
          normalizeAlphanumeric(s.studentId) === cleanParam ||
          normalizeAlphanumeric(s.id) === cleanParam
      );
      if (matched) {
        setSelectedStudent(matched);
      }
    } else if (!selectedStudent && students.length > 0) {
      // Default initial view: match PDA-2403-002 or first student
      const sample =
        students.find((s) => normalizeAlphanumeric(s.studentId) === 'PDA2403002') ||
        students.find((s) => normalizeAlphanumeric(s.studentId) === 'PDA2502005') ||
        students[0];
      if (sample) {
        setSelectedStudent(sample);
      }
    }
  }, [students]);

  // Sync name input when selected student changes
  useEffect(() => {
    if (selectedStudent) {
      const isPlaceholder =
        !selectedStudent.name ||
        selectedStudent.name.trim().toUpperCase() === selectedStudent.className.trim().toUpperCase() ||
        selectedStudent.name.trim().toUpperCase() === selectedStudent.studentId.trim().toUpperCase();
      setNameInput(isPlaceholder ? '' : selectedStudent.name);
    }
  }, [selectedStudent]);

  // Search execution
  const searchResults = useMemo(() => {
    const cleanQuery = normalizeAlphanumeric(searchInput);
    if (!cleanQuery) return [];

    // 1. Exact normalized match (e.g. PDA2403002 matches PDA-2403-002)
    const exactMatches = students.filter(
      (s) =>
        normalizeAlphanumeric(s.studentId) === cleanQuery ||
        normalizeAlphanumeric(s.id) === cleanQuery
    );

    if (exactMatches.length > 0) {
      return exactMatches;
    }

    // 2. Partial normalized ID match (e.g. "2403002" or "002")
    const partialIdMatches = students.filter(
      (s) =>
        normalizeAlphanumeric(s.studentId).includes(cleanQuery) ||
        normalizeAlphanumeric(s.id).includes(cleanQuery)
    );

    // 3. Name or class match
    const lowerQuery = searchInput.toLowerCase().trim();
    const nameMatches = students.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.className.toLowerCase().includes(lowerQuery)
    );

    // Combine & deduplicate
    const combinedMap = new Map<string, Student>();
    partialIdMatches.forEach((s) => combinedMap.set(s.id, s));
    nameMatches.forEach((s) => combinedMap.set(s.id, s));

    return Array.from(combinedMap.values()).slice(0, 8);
  }, [searchInput, students]);

  // Auto-select when there's an exact match
  useEffect(() => {
    const cleanQuery = normalizeAlphanumeric(searchInput);
    if (cleanQuery.length >= 4) {
      const exact = students.find(
        (s) =>
          normalizeAlphanumeric(s.studentId) === cleanQuery ||
          normalizeAlphanumeric(s.id) === cleanQuery
      );
      if (exact) {
        setSelectedStudent(exact);
      }
    }
  }, [searchInput, students]);

  const handleSelectStudent = (st: Student) => {
    setSelectedStudent(st);
    setSearchInput(st.studentId);
  };

  // Student stats
  const studentStats = useMemo(() => {
    if (!selectedStudent) return { present: 0, total: 0, rate: 0, records: [] };

    const applicableSessions = sessions.filter(
      (s) => !s.className || s.className === selectedStudent.className
    );
    const attended = attendanceRecords.filter(
      (r) => r.studentId === selectedStudent.id && r.status === 'PRESENT'
    );

    const total = applicableSessions.length;
    const present = attended.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      present,
      total,
      rate,
      records: attended
    };
  }, [selectedStudent, sessions, attendanceRecords]);

  // Save updated full name
  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !nameInput.trim()) return;

    const updated: Student = {
      ...selectedStudent,
      name: nameInput.trim().toUpperCase()
    };

    setSelectedStudent(updated);
    if (onUpdateStudent) {
      onUpdateStudent(updated);
    }
    setIsEditingName(false);
  };

  // Download High-Definition Mobile Pass Card (PNG) ready for Gallery / Offline / AJK Scan
  const handleDownloadFullPassPNG = async () => {
    if (!selectedStudent || !qrRef.current) return;
    setIsDownloading(true);

    try {
      const svgElement = qrRef.current.querySelector('svg');
      if (!svgElement) return;

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const qrImg = new Image();

      const qrPromise = new Promise<HTMLImageElement>((resolve, reject) => {
        qrImg.onload = () => resolve(qrImg);
        qrImg.onerror = reject;
        qrImg.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      });

      const loadedQr = await qrPromise;

      // Draw high-resolution mobile pass (900 x 1350)
      const canvas = document.createElement('canvas');
      const width = 900;
      const height = 1350;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // 1. Dark Modern Gradient Background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#0a0f1d');
        bgGrad.addColorStop(0.5, '#0f172a');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Subtle accent lighting
        const glow = ctx.createRadialGradient(width / 2, 200, 50, width / 2, 200, 450);
        glow.addColorStop(0, 'rgba(79, 70, 229, 0.25)');
        glow.addColorStop(1, 'rgba(79, 70, 229, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);

        // 2. Card Container Border
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 4;
        ctx.strokeRect(30, 30, width - 60, height - 60);

        // 3. College & App Header
        ctx.textAlign = 'center';
        ctx.fillStyle = '#818cf8';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.fillText('KOLEJ PROFESIONAL MARA BANDAR PENAWAR', width / 2, 90);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 34px system-ui, sans-serif';
        ctx.fillText('PAS KOD QR KEHADIRAN DIGITAL', width / 2, 135);

        // Status Pill
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.fillRect(width / 2 - 170, 155, 340, 38);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(width / 2 - 170, 155, 340, 38);

        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 18px system-ui, sans-serif';
        ctx.fillText('● DISAHKAN UNTUK IMBASAN AJK', width / 2, 180);

        // 4. White QR Container
        const qrBoxSize = 460;
        const qrX = (width - qrBoxSize) / 2;
        const qrY = 225;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(qrX, qrY, qrBoxSize, qrBoxSize, 24);
        ctx.fill();

        // Draw QR code with quiet zone padding
        ctx.drawImage(loadedQr, qrX + 30, qrY + 30, qrBoxSize - 60, qrBoxSize - 60);

        // Text below QR
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 18px monospace';
        ctx.fillText(`STUDENT|${selectedStudent.studentId}`, width / 2, qrY + qrBoxSize + 32);

        // 5. Student Information Box
        const infoY = 745;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.beginPath();
        ctx.roundRect(50, infoY, width - 100, 480, 20);
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Class & ID Badges
        ctx.fillStyle = '#4f46e5';
        ctx.beginPath();
        ctx.roundRect(80, infoY + 30, 200, 45, 12);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.fillText(`Kelas: ${selectedStudent.className}`, 180, infoY + 60);

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(width - 280, infoY + 30, 200, 45, 12);
        ctx.fill();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#93c5fd';
        ctx.font = 'bold 22px monospace';
        ctx.fillText(selectedStudent.studentId, width - 180, infoY + 60);

        // NAMA PENUH Section
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 18px system-ui, sans-serif';
        ctx.fillText('NAMA PENUH PELAJAR:', width / 2, infoY + 125);

        const displayName = getStudentDisplayName(selectedStudent);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 36px system-ui, sans-serif';

        // Word wrap for long names
        const words = displayName.split(' ');
        let line = '';
        let lineY = infoY + 175;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > width - 140 && n > 0) {
            ctx.fillText(line.trim(), width / 2, lineY);
            line = words[n] + ' ';
            lineY += 45;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line.trim(), width / 2, lineY);

        // Programme & College details
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.fillText(selectedStudent.department || 'Diploma Perakaunan', width / 2, lineY + 60);

        ctx.fillStyle = '#64748b';
        ctx.font = '18px system-ui, sans-serif';
        ctx.fillText('Sesi Akademik 2026/2027 • Pelajar Sepenuh Masa', width / 2, lineY + 95);

        // Security Stripe / Stamp at bottom
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(50, height - 100, width - 100, 60);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.fillText('🛡️ STUDENTATTEND VERIFIED DIGITAL BADGE • KOD SAH KOLEJ', width / 2, height - 65);

        // Download as PNG
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `Pas_Kehadiran_${selectedStudent.studentId}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    } catch (err) {
      console.error('Error generating pass PNG:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Copy shareable QR URL
  const handleCopyLink = () => {
    if (!selectedStudent) return;
    const cleanId = normalizeAlphanumeric(selectedStudent.studentId);
    const shareUrl = `${window.location.origin}/qr?id=${encodeURIComponent(cleanId)}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const hasEmail = Boolean(selectedStudent?.email && selectedStudent.email.trim().length > 0);
  const hasPhone = Boolean(selectedStudent?.phone && selectedStudent.phone.trim().length > 0);
  const hasContactInfo = hasEmail || hasPhone;

  const isNameMissingOrId =
    !selectedStudent?.name ||
    selectedStudent.name.trim().toUpperCase() === selectedStudent.className.trim().toUpperCase() ||
    selectedStudent.name.trim().toUpperCase() === selectedStudent.studentId.trim().toUpperCase();

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* ============================================================ */}
      {/* 1. TOP CONTROLS & SEARCH (HIDDEN IN SCREENSHOT MODE)         */}
      {/* ============================================================ */}
      {!isScreenshotMode && (
        <div className="rounded-3xl bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-950 border border-indigo-500/30 p-5 sm:p-7 shadow-2xl space-y-5 no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Carian Kad QR Pelajar
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  /qr
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Masukkan <strong>No. ID Pelajar</strong> sahaja (tanpa sempang &quot;-&quot;) untuk paparkan dan simpan Kad QR ke telefon anda.
              </p>
            </div>

            {/* Switch to Fullscreen Screenshot View Button */}
            {selectedStudent && (
              <button
                onClick={() => setIsScreenshotMode(true)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer shrink-0 active:scale-95"
                title="Buka mod paparan skrin penuh untuk tangkap layar (screenshot)"
              >
                <Camera className="w-4 h-4" />
                <span>📸 Mod Tangkap Skrin (Screenshot)</span>
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
              <input
                type="text"
                id="student-qr-search-input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Taip No. ID Pelajar (cth: PDA2403002 atau PDA-2403-002)..."
                className="w-full pl-12 pr-24 py-3.5 rounded-2xl bg-slate-950/90 border-2 border-indigo-500/40 focus:border-indigo-400 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none shadow-inner"
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput('');
                    setSelectedStudent(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer transition-all"
                >
                  Padam
                </button>
              )}
            </div>

            {/* Quick Suggestions based on query */}
            {searchInput.trim() && searchResults.length > 0 && !selectedStudent && (
              <div className="p-2 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 shadow-xl">
                <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1">
                  Padanan Ditemui ({searchResults.length}):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {searchResults.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => handleSelectStudent(st)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 text-left transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${getStudentColor(st.id)}`}>
                          {getInitials(st.name)}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                            {getStudentDisplayName(st)}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {st.studentId} • {st.className}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sample ID Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-400">
              <span className="text-[11px] font-semibold text-slate-500">Pantas:</span>
              {['PDA2403001', 'PDA2403002', 'PDA2403003', 'PDA2502005', 'DCAT2402016'].map((sampleId) => (
                <button
                  key={sampleId}
                  onClick={() => setSearchInput(sampleId)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-indigo-600/30 hover:text-indigo-300 border border-slate-800 text-[11px] font-mono transition-all cursor-pointer"
                >
                  {sampleId}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. SCREENSHOT MODE BANNER (WHEN ACTIVE)                      */}
      {/* ============================================================ */}
      {isScreenshotMode && (
        <div className="sticky top-2 z-50 p-3 sm:p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 backdrop-blur-md shadow-2xl flex items-center justify-between gap-3 text-emerald-200 text-xs sm:text-sm no-print">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400 animate-pulse shrink-0" />
            <div>
              <strong>Mod Tangkap Skrin Aktif:</strong> Sila ambil screenshot pada telefon anda sekarang.
            </div>
          </div>
          <button
            onClick={() => setIsScreenshotMode(false)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 cursor-pointer transition-all flex items-center gap-1 shrink-0"
          >
            <X className="w-4 h-4" />
            <span>Tutup Mod</span>
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. OFFICIAL MOBILE DIGITAL PASS CARD (SCREENSHOT FRIENDLY)    */}
      {/* ============================================================ */}
      {selectedStudent ? (
        <div className="space-y-4">
          {/* THE CARD CONTAINER - Optimized Aspect Ratio for Mobile Screenshotting */}
          <div
            ref={cardRef}
            className="w-full max-w-sm sm:max-w-md mx-auto rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-2 border-indigo-500/40 p-5 sm:p-7 shadow-2xl space-y-4 text-center printable-id-card relative overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-indigo-500/20 blur-3xl pointer-events-none rounded-full"></div>

            {/* Card Header with College Identity */}
            <div className="relative border-b border-slate-800/80 pb-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-left">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-900 ring-1 ring-indigo-500/30 flex items-center justify-center shrink-0">
                    <img
                      src={OFFICIAL_STUDENT_ATTEND_ICON}
                      alt="StudentAttend Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-white block uppercase tracking-tight leading-tight">
                      KPM BANDAR PENAWAR
                    </span>
                    <span className="text-[9px] font-bold text-indigo-400 block tracking-wider">
                      STUDENTATTEND ID
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>AKTIF KOLEJ</span>
                </span>
              </div>
            </div>

            {/* High-Resolution QR Code with Pure White Quiet Zone */}
            <div className="py-1">
              <div
                ref={qrRef}
                className="p-4 sm:p-5 rounded-2xl bg-white shadow-2xl border-4 border-slate-800 inline-block qr-code-wrapper mx-auto"
              >
                <QRCodeSVG
                  value={`STUDENT|${selectedStudent.studentId}`}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="mt-2 font-mono text-[11px] font-bold text-slate-400 flex items-center justify-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                <span>STUDENT|{selectedStudent.studentId}</span>
              </div>
            </div>

            {/* Badges: Class & Student ID */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className={`text-xs font-black px-3 py-1 rounded-xl border ${getClassBadgeColor(selectedStudent.className)}`}>
                Kelas {selectedStudent.className}
              </span>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-slate-800 text-indigo-300 border border-slate-700">
                {selectedStudent.studentId}
              </span>
            </div>

            {/* DETAIL NAMA PENUH PELAJAR (PROMINENT FOR AJK SCANNER VERIFICATION) */}
            <div className="rounded-2xl bg-slate-950/90 border border-slate-800/90 p-3.5 space-y-1.5 shadow-inner">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>Nama Penuh Pelajar:</span>
                {!isScreenshotMode && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Masukkan atau kemaskini nama penuh sebenar pelajar"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isNameMissingOrId ? 'Masukkan Nama' : 'Tukar Nama'}</span>
                  </button>
                )}
              </div>

              {/* Name Display */}
              <div className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
                {getStudentDisplayName(selectedStudent)}
              </div>

              {/* Notice if name hasn't been set yet */}
              {isNameMissingOrId && !isScreenshotMode && (
                <div
                  onClick={() => setIsEditingName(true)}
                  className="cursor-pointer p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold text-center hover:bg-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Nama Penuh belum didaftarkan. Klik di sini untuk masukkan nama sebenar anda!</span>
                </div>
              )}

              {/* Programme Details */}
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                {selectedStudent.department || 'Diploma Perakaunan'} • Kolej Profesional MARA
              </div>

              {/* Contact Information (Hidden if absent) */}
              {hasContactInfo && (
                <div className="text-[10px] text-slate-400 pt-1 space-y-0.5 border-t border-slate-800/60">
                  {hasEmail && (
                    <div className="flex items-center justify-center gap-1.5 truncate">
                      <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{selectedStudent.email}</span>
                    </div>
                  )}
                  {hasPhone && (
                    <div className="flex items-center justify-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{selectedStudent.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Security Badge Footer */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sah Diimbas AJK</span>
              </span>
              <span className="font-mono text-[9px] text-slate-400">
                KPM-BP • SESI 2026
              </span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 4. ACTIONS TOOLBAR (HIDDEN IN SCREENSHOT MODE)               */}
          {/* ============================================================ */}
          {!isScreenshotMode && (
            <div className="max-w-sm sm:max-w-md mx-auto space-y-3 no-print">
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Full Screen Screenshot Mode */}
                <button
                  onClick={() => setIsScreenshotMode(true)}
                  className="py-3 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
                  title="Paparkan skrin penuh tanpa gangguan untuk screenshot"
                >
                  <Camera className="w-4 h-4" />
                  <span>Mod Screenshot</span>
                </button>

                {/* 2. Download Full Pass PNG */}
                <button
                  onClick={handleDownloadFullPassPNG}
                  disabled={isDownloading}
                  className="py-3 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
                  title="Simpan gambar pas digital lengkap ke galeri telefon"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloading ? 'Menjana Imej...' : 'Muat Turun Pas'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* 3. Print PDF */}
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-all border border-slate-800 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Kad (PDF)</span>
                </button>

                {/* 4. Copy Direct Link */}
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-all border border-slate-800 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Pautan Disalin!' : 'Salin Pautan'}</span>
                </button>
              </div>

              {/* Student Instructions Alert */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Arahan untuk Pelajar:</strong> Klik <strong>&quot;Mod Screenshot&quot;</strong> atau <strong>&quot;Muat Turun Pas&quot;</strong>. Simpan imej dalam galeri telefon anda supaya boleh ditunjukkan dan diimbas oleh AJK bertugas di pintu masuk dewan/kuliah walaupun tiada internet.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800 p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Sila Masukkan No. Pelajar Anda</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Gunakan kotak carian di atas untuk memasukkan No. Matrik (contoh: <span className="font-mono text-indigo-300">PDA2403002</span>) untuk memaparkan Kad QR peribadi anda.
          </p>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. MODAL: MASUKKAN / KEMASKINI NAMA PENUH PELAJAR            */}
      {/* ============================================================ */}
      {isEditingName && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Masukkan Nama Penuh Pelajar</h3>
                <p className="text-xs text-slate-400">
                  Untuk dipaparkan secara rasmi pada Kad QR ({selectedStudent.studentId})
                </p>
              </div>
              <button
                onClick={() => setIsEditingName(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveName} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Nama Penuh Sebenar (seperti dalam kad pengenalan / rekod kolej):
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Contoh: MUHAMMAD SYAHMI BIN ZULKEFLI"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-semibold text-white uppercase placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  autoFocus
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Nama ini akan dipaparkan di bawah kod QR untuk rujukan dan pengesahan AJK bertugas.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Nama Penuh</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
