import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import {
  Event,
  Student,
  AttendanceRecord,
  ScanResult,
  AttendanceMethod
} from '../types';
import { soundService } from '../services/soundService';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Search,
  Clock,
  CalendarCheck,
  Check,
  X,
  MapPin,
  ArrowRight
} from 'lucide-react';

interface ScannerViewProps {
  activeEvent: Event | null;
  allEvents: Event[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  isAdmin: boolean;
  onProcessScan: (qrString: string, method?: AttendanceMethod, targetEventId?: string) => ScanResult;
  onCloseEvent: (eventId: string) => void;
  onGoToEvents: () => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  onRequestAdminAccess?: (actionName?: string) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  activeEvent,
  allEvents,
  students,
  attendanceRecords,
  isAdmin,
  onProcessScan,
  onCloseEvent,
  onGoToEvents,
  soundEnabled,
  onToggleSound,
  onRequestAdminAccess
}) => {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [manualStudentId, setManualStudentId] = useState<string>('');
  const [isConfirmCloseModalOpen, setIsConfirmCloseModalOpen] = useState<boolean>(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const lastScanCodeRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);

  // Compute live event attendance records
  const currentEventRecords = activeEvent
    ? attendanceRecords.filter((r) => (r.eventId === activeEvent.id || r.sessionId === activeEvent.id) && r.status === 'PRESENT')
    : [];

  let targetStudents = students;
  if (activeEvent?.rosterType === 'CLASS_SET' && activeEvent.targetClasses && activeEvent.targetClasses.length > 0) {
    targetStudents = students.filter((s) => activeEvent.targetClasses!.includes(s.className));
  }

  const attendancePercent =
    targetStudents.length > 0
      ? Math.round((currentEventRecords.length / targetStudents.length) * 100)
      : 0;

  // Recent 5 scans for active event
  const recentEventScans = currentEventRecords.slice(0, 5);

  const formatTime = (iso?: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    } catch {
      return iso;
    }
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      const html5QrCode = new Html5Qrcode('qr-reader-container');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          handleCameraDecoded(decodedText);
        },
        () => {
          // ignore scan frame misses
        }
      );

      setIsCameraActive(true);
      isScanningRef.current = true;
    } catch (err: any) {
      console.error('Camera initialization error:', err);
      setCameraError(
        'Kamera tidak dapat diakses. Sila pastikan kebenaran kamera (Camera Permission) dibenarkan pada pelayar.'
      );
      setIsCameraActive(false);
      isScanningRef.current = false;
    }
  };

  // Stop Camera
  const stopCamera = async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    scannerRef.current = null;
    isScanningRef.current = false;
    setIsCameraActive(false);
  };

  // Auto-start camera if event is active
  useEffect(() => {
    if (activeEvent) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeEvent?.id]);

  // Handle Camera Decode with debounce
  const handleCameraDecoded = (decodedText: string) => {
    const now = Date.now();
    // Debounce 1.5 seconds for identical code
    if (decodedText === lastScanCodeRef.current && now - lastScanTimeRef.current < 1500) {
      return;
    }

    lastScanCodeRef.current = decodedText;
    lastScanTimeRef.current = now;

    const result = onProcessScan(decodedText, 'CAMERA_SCAN', activeEvent?.id);
    setLastResult(result);

    if (result.success) {
      soundService.playSuccess();
      try {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.8 },
          colors: ['#10B981', '#6366F1', '#3B82F6']
        });
      } catch {}
    } else if (result.isDuplicate) {
      soundService.playDuplicate();
    } else {
      soundService.playError();
    }
  };

  // Handle Manual Student ID Submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentId.trim() || !activeEvent) return;

    const clean = manualStudentId.trim().toUpperCase();
    const result = onProcessScan(`STUDENT|${clean}`, 'MANUAL', activeEvent.id);
    setLastResult(result);

    if (result.success) {
      soundService.playSuccess();
      setManualStudentId('');
    } else if (result.isDuplicate) {
      soundService.playDuplicate();
    } else {
      soundService.playError();
    }
  };

  // Handle Close Event Confirmation
  const handleConfirmClose = () => {
    if (!activeEvent) return;
    onCloseEvent(activeEvent.id);
    setIsConfirmCloseModalOpen(false);
    stopCamera();
  };

  // If no event is active, show clean operational state
  if (!activeEvent) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto shadow-inner">
          <CalendarCheck className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Tiada Acara Aktif Untuk Imbasan
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Untuk memulakan pengesahan kehadiran, sila pilih dan aktifkan acara daripada senarai Acara terlebih dahulu.
          </p>
        </div>
        <div>
          <button
            id="kehadiran-btn-go-events"
            type="button"
            onClick={onGoToEvents}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Buka Senarai Acara</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. ACTIVE EVENT OPERATIONAL HEADER */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Kehadiran Aktif
              </span>
              {activeEvent.activatedAt && (
                <>
                  <span className="text-slate-500">·</span>
                  <span className="text-xs text-slate-400">
                    Bermula: {formatTime(activeEvent.activatedAt)}
                  </span>
                </>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {activeEvent.title}
            </h2>

            <div className="text-xs text-slate-400 flex items-center gap-3">
              {activeEvent.location && <span>📍 {activeEvent.location}</span>}
              {activeEvent.organizer && <span>🏢 {activeEvent.organizer}</span>}
            </div>
          </div>

          {/* Attendee Count & Close Attendance Action */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="text-2xl font-extrabold text-white tracking-tight">
                {currentEventRecords.length}
                <span className="text-xs font-normal text-slate-400"> / {targetStudents.length}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {attendancePercent}% Hadir
              </div>
            </div>

            <button
              id="kehadiran-btn-tamatkan"
              type="button"
              onClick={() => setIsConfirmCloseModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 text-slate-200 border border-slate-700 hover:border-rose-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Tamatkan sesi kehadiran ini"
            >
              Tamatkan Kehadiran
            </button>
          </div>
        </div>
      </div>

      {/* 2. CAMERA QR SCANNER & LIVE SCAN RESULT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scanner Viewport (Dominant Column) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-xl overflow-hidden relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-300">
              <span className="font-semibold flex items-center gap-1.5 text-white">
                <Camera className="w-4 h-4 text-indigo-400" />
                <span>Pengimbas Kod QR Kamera</span>
              </span>

              <button
                type="button"
                onClick={isCameraActive ? stopCamera : startCamera}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isCameraActive
                    ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {isCameraActive ? 'Tutup Kamera' : 'Buka Kamera'}
              </button>
            </div>

            {/* Video Container */}
            <div className="mt-3 relative rounded-xl overflow-hidden bg-black aspect-square flex items-center justify-center border border-slate-800/80">
              <div id="qr-reader-container" className="w-full h-full" />

              {!isCameraActive && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center space-y-3">
                  <CameraOff className="w-10 h-10 text-slate-600" />
                  <p className="text-xs text-slate-400 max-w-xs">
                    Kamera dimatikan. Klik &quot;Buka Kamera&quot; di atas untuk memulakan imbasan.
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    Buka Kamera
                  </button>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>

          {/* Secondary Manual Search Fallback (Discreet below camera) */}
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3.5">
            <span className="text-xs text-slate-400 font-medium block mb-2">
              Atau cari No. Pelajar secara manual (Sandaran):
            </span>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: PDA-2502-005"
                value={manualStudentId}
                onChange={(e) => setManualStudentId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Sahkan
              </button>
            </form>
          </div>
        </div>

        {/* Live Feedback & Recent Scans (Right Column) */}
        <div className="lg:col-span-5 space-y-4">
          {/* IMMEDIATE SCAN FEEDBACK BANNER */}
          {lastResult && (
            <div
              className={`p-4 rounded-2xl border transition-all shadow-lg ${
                lastResult.success
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                  : lastResult.isDuplicate
                  ? 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {lastResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : lastResult.isDuplicate ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}

                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider">
                    {lastResult.success
                      ? '✓ Kehadiran Direkodkan'
                      : lastResult.isDuplicate
                      ? '! Sudah Direkodkan'
                      : lastResult.code === 'NOT_ELIGIBLE'
                      ? '! Bukan Peserta Acara'
                      : '! Imbasan Ditolak'}
                  </div>

                  {lastResult.student ? (
                    <div>
                      <div className="text-sm font-bold text-white">
                        {lastResult.student.name}
                      </div>
                      <div className="text-xs opacity-80">
                        {lastResult.student.id} · Set {lastResult.student.className}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs">{lastResult.message}</div>
                  )}

                  <div className="text-[10px] opacity-70 pt-1">
                    Waktu: {formatTime(lastResult.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STREAM OF RECENT ATTENDEES */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <span className="font-semibold text-white">Kehadiran Terkini</span>
              <span className="text-slate-400">{currentEventRecords.length} pelajar</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {recentEventScans.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  Belum ada imbasan kehadiran untuk acara ini.
                </div>
              ) : (
                recentEventScans.map((rec) => {
                  const student = students.find((s) => s.id === rec.studentId);
                  return (
                    <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">
                          {student?.name || rec.studentName || rec.studentId}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {rec.studentId} · Set {student?.className || rec.className}
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-slate-400 font-mono">
                        {formatTime(rec.scannedAt || rec.timestamp)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL FOR TAMATKAN KEHADIRAN */}
      {isConfirmCloseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Tamatkan Sesi Kehadiran?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Adakah anda pasti untuk menamatkan sesi kehadiran bagi &quot;{activeEvent.title}&quot;?
                Selepas ditamatkan, rekod akan dikunci ke status COMPLETED dan imbasan baharu tidak akan diterima.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              Jumlah Kehadiran Semasa: <span className="font-bold text-white">{currentEventRecords.length} orang</span>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmCloseModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                Sahkan & Tamatkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
