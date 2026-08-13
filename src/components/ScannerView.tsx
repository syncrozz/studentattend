import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import {
  Student,
  AttendanceSession,
  AttendanceRecord,
  ScanResult,
  AttendanceMethod
} from '../types';
import { soundService } from '../services/soundService';
import {
  getCategoryBadgeColor,
  getCategoryLabel,
  getClassBadgeColor,
  getInitials,
  getStudentColor
} from '../utils/studentUtils';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Volume2,
  VolumeX,
  Sparkles,
  Users,
  Search,
  Clock,
  ArrowRight,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';

interface ScannerViewProps {
  activeSession: AttendanceSession | null;
  allSessions: AttendanceSession[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  isAdmin: boolean;
  onRequestAdminAccess: (actionName?: string) => void;
  onProcessScan: (qrString: string, method: AttendanceMethod, targetSessionId?: string) => ScanResult;
  onGoToActivities: () => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  activeSession,
  allSessions,
  students,
  attendanceRecords,
  isAdmin,
  onRequestAdminAccess,
  onProcessScan,
  onGoToActivities,
  soundEnabled,
  onToggleSound
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string>(activeSession?.id || allSessions[0]?.id || '');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [cooldown, setCooldown] = useState<boolean>(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'qr-reader-studentattend';

  // Ensure selectedSessionId defaults to activeSession when changed
  useEffect(() => {
    if (activeSession) {
      setSelectedSessionId(activeSession.id);
    }
  }, [activeSession]);

  const currentSession = allSessions.find((s) => s.id === selectedSessionId) || activeSession;

  // Session attendance stats
  const sessionRecords = currentSession
    ? attendanceRecords.filter((r) => r.sessionId === currentSession.id && r.status === 'PRESENT')
    : [];

  const targetStudents = currentSession
    ? currentSession.className
      ? students.filter((s) => s.className === currentSession.className)
      : students
    : [];

  const percentage =
    targetStudents.length > 0 ? Math.round((sessionRecords.length / targetStudents.length) * 100) : 0;

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(qrRegionId);
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          handleScannedData(decodedText, 'CAMERA_SCAN');
        },
        () => {
          // Frame scan failure (benign, scanning in progress)
        }
      );

      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setCameraError('Gagal memulakan kamera. Sila pastikan kebenaran kamera telah diberikan pada pelayar anda.');
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = async () => {
    if (html5QrCodeRef.current && isCameraActive) {
      try {
        await html5QrCodeRef.current.stop();
        setIsCameraActive(false);
      } catch (err) {
        console.warn('Camera stop error:', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.warn);
      }
    };
  }, []);

  // Handle Scan Data with cooldown throttling
  const handleScannedData = (dataString: string, method: AttendanceMethod = 'CAMERA_SCAN') => {
    if (cooldown) return;

    setCooldown(true);
    setTimeout(() => setCooldown(false), 2200);

    const result = onProcessScan(dataString, method, currentSession?.id);
    setScanResult(result);

    if (result.success) {
      if (soundEnabled) soundService.playSuccess();
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#6366f1', '#10b981', '#38bdf8']
        });
      } catch (e) {}
    } else if (result.isDuplicate) {
      if (soundEnabled) soundService.playDuplicate();
    } else {
      if (soundEnabled) soundService.playError();
    }
  };

  // Manual code entry / student selection
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleScannedData(manualInput.trim(), 'MANUAL');
    setManualInput('');
  };

  // Filter students for manual fast check-in
  const filteredQuickList = students
    .filter((s) => {
      const q = manualInput.toLowerCase();
      if (!q) return false;
      return (
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q)
      );
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Session Context Bar & Target Selector */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              PENGIMBAS KEHADIRAN QR
            </span>
            {currentSession && (
              <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${getCategoryBadgeColor(currentSession.category)}`}>
                {getCategoryLabel(currentSession.category)}
              </span>
            )}
            {currentSession?.status === 'OPEN' ? (
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                SEDANG DIBUKA
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                SESI DITUTUP
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {currentSession ? currentSession.sessionName : 'Sila Pilih Sesi'}
          </h2>
          <p className="text-xs text-slate-400">
            {currentSession?.location} • {currentSession?.organizer}
          </p>
        </div>

        {/* Sesi Picker Dropdown */}
        <div className="flex items-center gap-2">
          <select
            id="scanner-session-select"
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 max-w-xs cursor-pointer"
          >
            {allSessions.map((ses) => (
              <option key={ses.id} value={ses.id}>
                {ses.status === 'OPEN' ? '🟢 [BUKA] ' : '⚪ '} {ses.sessionName}
              </option>
            ))}
          </select>

          <button
            onClick={() => onToggleSound(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs cursor-pointer ${
              soundEnabled ? 'bg-slate-800 border-slate-700 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title="Bunyi Maklum Balas"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: CAMERA & SCANNER (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Kamera Pengimbas QR</h3>
              </div>
              <div>
                {!isCameraActive ? (
                  <button
                    id="scanner-btn-start-camera"
                    onClick={startCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Aktifkan Kamera</span>
                  </button>
                ) : (
                  <button
                    id="scanner-btn-stop-camera"
                    onClick={stopCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>Hentikan Kamera</span>
                  </button>
                )}
              </div>
            </div>

            {/* Video Viewport Container */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[300px] flex items-center justify-center">
              <div id={qrRegionId} className="w-full max-w-sm"></div>

              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-3 text-indigo-400">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Kamera Belum Diaktifkan</h4>
                  <p className="text-xs text-slate-400 max-w-xs mb-4">
                    Halakan kamera peranti ke Kod QR Pelajar (contoh format: <code className="text-indigo-300">STUDENT|PDA-2502-005</code>) untuk merekod kehadiran secara automatik.
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
                  >
                    Buka Kamera Sekarang
                  </button>
                </div>
              )}

              {cooldown && (
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-indigo-500/90 text-white text-[10px] font-bold animate-pulse shadow-lg">
                  Memproses...
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Manual ID Search & Fast Verification */}
            <div className="pt-2 border-t border-slate-800">
              <form onSubmit={handleManualSubmit} className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                  <span>Carian No. Pelajar / Imbasan Manual:</span>
                  <span className="text-[10px] text-slate-500 font-normal">Contoh: PDA-2502-005 atau Aiman</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      id="scanner-manual-input"
                      type="text"
                      placeholder="Masukkan No. Pelajar atau Nama..."
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
                  >
                    Sahkan
                  </button>
                </div>
              </form>

              {/* Quick Auto-complete results */}
              {filteredQuickList.length > 0 && (
                <div className="mt-2 p-2 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  {filteredQuickList.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        handleScannedData(st.id, 'MANUAL_OVERRIDE');
                        setManualInput('');
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-900 text-left transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${getStudentColor(st.id)}`}>
                          {getInitials(st.name)}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">{st.name}</div>
                          <div className="text-[10px] text-slate-400">{st.studentId} • {st.className}</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-indigo-400">Rekod &rarr;</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* LATEST SCAN RESULT CARD */}
          {scanResult && (
            <div
              id="scanner-latest-result-card"
              className={`rounded-2xl border p-5 transition-all shadow-xl ${
                scanResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100'
                  : scanResult.isDuplicate
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-100'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-100'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl font-bold shadow-lg ${
                    scanResult.success
                      ? 'bg-emerald-500 text-slate-950'
                      : scanResult.isDuplicate
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-rose-500 text-slate-950'
                  }`}
                >
                  {scanResult.success ? (
                    <CheckCircle2 className="w-7 h-7 text-slate-950" />
                  ) : scanResult.isDuplicate ? (
                    <AlertTriangle className="w-7 h-7 text-slate-950" />
                  ) : (
                    <XCircle className="w-7 h-7 text-slate-950" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        scanResult.success
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : scanResult.isDuplicate
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {scanResult.code}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(scanResult.timestamp).toLocaleTimeString('ms-MY')}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white">
                    {scanResult.student ? scanResult.student.name : 'Maklumat Imbasan'}
                  </h4>

                  {scanResult.student && (
                    <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>No. Pelajar: <strong className="text-white">{scanResult.student.studentId}</strong></span>
                      <span>Set: <strong className="text-white">{scanResult.student.className}</strong></span>
                      <span>Program: <strong>{scanResult.student.department || 'Diploma Perakaunan'}</strong></span>
                    </div>
                  )}

                  <p className="text-xs text-slate-300 pt-1 font-medium">
                    {scanResult.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE SESSION ATTENDANCE STREAM (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 flex flex-col h-full">
            {/* Header with Stats */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Kehadiran Sesi Ini</h3>
                <p className="text-xs text-slate-400">
                  {sessionRecords.length} daripada {targetStudents.length} Pelajar Hadir
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold text-emerald-400">{percentage}%</div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Kadar Kehadiran</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>

            {/* List of checked in students for this session */}
            <div className="flex-1 overflow-y-auto max-h-[480px] space-y-2 pr-1">
              {sessionRecords.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Belum ada pelajar yang mengimbas kehadiran bagi sesi ini.
                </div>
              ) : (
                sessionRecords.map((record) => {
                  const student = students.find((s) => s.id === record.studentId);
                  return (
                    <div
                      key={record.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${student ? getStudentColor(student.id) : 'bg-slate-800'}`}>
                          {student ? getInitials(student.name) : 'ST'}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-white truncate">
                            {student ? student.name : record.studentId}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {student?.studentId} • <span className="font-bold text-slate-300">{student?.className}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[11px] font-bold text-emerald-400">
                          {new Date(record.timestamp).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <span className="text-[9px] text-slate-500 uppercase">{record.method}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
