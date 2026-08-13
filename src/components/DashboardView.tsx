import React, { useState } from 'react';
import {
  Student,
  AttendanceActivity,
  AttendanceSession,
  AttendanceRecord,
  ScanResult
} from '../types';
import { getCategoryBadgeColor, getCategoryLabel, getClassBadgeColor, getInitials, getStudentColor } from '../utils/studentUtils';
import {
  Users,
  QrCode,
  CalendarCheck,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Search
} from 'lucide-react';

interface DashboardViewProps {
  activeSession: AttendanceSession | null;
  activities: AttendanceActivity[];
  sessions: AttendanceSession[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onOpenScanner: () => void;
  onGoToActivities: () => void;
  onGoToStudents: () => void;
  onGoToReports: () => void;
  onCloseActiveSession: (sessionId: string) => void;
  onQuickSimulateScan: (studentId: string) => ScanResult;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeSession,
  activities,
  sessions,
  students,
  attendanceRecords,
  onOpenScanner,
  onGoToActivities,
  onGoToStudents,
  onGoToReports,
  onCloseActiveSession,
  onQuickSimulateScan
}) => {
  const [searchSimulate, setSearchSimulate] = useState('');
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);

  // Current session stats
  const activeSessionRecords = activeSession
    ? attendanceRecords.filter((r) => r.sessionId === activeSession.id && r.status === 'PRESENT')
    : [];

  const targetStudentsForActive = activeSession
    ? activeSession.className
      ? students.filter((s) => s.className === activeSession.className)
      : students
    : [];

  const activePercent =
    targetStudentsForActive.length > 0
      ? Math.round((activeSessionRecords.length / targetStudentsForActive.length) * 100)
      : 0;

  // Class Set Distribution
  const sets = ['DIA_4A', 'DIA_4B', 'DIA_4C', 'DIA_4D'];
  const setStats = sets.map((setName) => {
    const classStudents = students.filter((s) => s.className === setName);
    const presentInActive = activeSession
      ? classStudents.filter((s) =>
          activeSessionRecords.some((r) => r.studentId === s.id)
        ).length
      : 0;
    const rate = classStudents.length > 0 ? Math.round((presentInActive / classStudents.length) * 100) : 0;
    return {
      name: setName,
      total: classStudents.length,
      presentInActive,
      rate
    };
  });

  // Category counts
  const categorySummary = [
    { cat: 'ASSEMBLY', label: 'Perhimpunan', count: sessions.filter((s) => s.category === 'ASSEMBLY' || s.activityId === 'ACT-ASM-01').length },
    { cat: 'CLASS', label: 'Kuliah / Kelas', count: sessions.filter((s) => s.category === 'CLASS' || s.activityId === 'ACT-CLS-01').length },
    { cat: 'OFFICIAL_PROGRAMME', label: 'Program Rasmi', count: sessions.filter((s) => s.category === 'OFFICIAL_PROGRAMME' || s.activityId === 'ACT-PRG-01').length },
    { cat: 'WORKSHOP', label: 'Bengkel / Seminar', count: sessions.filter((s) => s.category === 'WORKSHOP' || s.activityId === 'ACT-WRK-01').length },
  ];

  // Recent 8 live scans
  const recentRecords = attendanceRecords
    .slice(0, 8)
    .map((record) => {
      const student = students.find((s) => s.id === record.studentId);
      const session = sessions.find((s) => s.id === record.sessionId);
      return { record, student, session };
    });

  // Filter students for quick simulate
  const filteredSimulateStudents = students
    .filter((s) => {
      const q = searchSimulate.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q)
      );
    })
    .slice(0, 6);

  const handleSimulate = (studentId: string) => {
    const res = onQuickSimulateScan(studentId);
    setLastScanResult(res);
  };

  return (
    <div className="space-y-6">
      {/* 1. HERO / ACTIVE SESSION ACTION BANNER */}
      {activeSession ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  SESI KEHADIRAN SEDANG DIBUKA
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${getCategoryBadgeColor(activeSession.category)}`}>
                  {getCategoryLabel(activeSession.category)}
                </span>
                {activeSession.className && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                    Set {activeSession.className}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {activeSession.sessionName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>📍 {activeSession.location || 'Dewan / Bilik Kuliah'}</span>
                <span>🕒 {activeSession.startTime} – {activeSession.endTime}</span>
                <span>🏢 {activeSession.organizer || 'Hal Ehwal Pelajar'}</span>
              </p>
            </div>

            {/* Quick Metrics & Actions */}
            <div className="flex flex-wrap items-center gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800 shrink-0">
              <div className="text-center px-3 border-r border-slate-800">
                <div className="text-2xl sm:text-3xl font-extrabold text-white">
                  {activeSessionRecords.length}
                  <span className="text-sm font-normal text-slate-400">/{targetStudentsForActive.length}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Hadir ({activePercent}%)</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="dashboard-btn-open-scanner"
                  onClick={onOpenScanner}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Buka Kamera QR</span>
                </button>
                <button
                  id="dashboard-btn-close-session"
                  onClick={() => onCloseActiveSession(activeSession.id)}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
                  title="Tutup Sesi Kehadiran Ini"
                >
                  Tutup Sesi
                </button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
              <span>Kemajuan Kehadiran Semasa</span>
              <span>{activeSessionRecords.length} daripada {targetStudentsForActive.length} Pelajar Direkodkan ({activePercent}%)</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${activePercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-white">Tiada Sesi Kehadiran Sedang Dibuka</h3>
            <p className="text-xs text-slate-400">
              Pilih satu aktiviti atau cipta sesi baharu untuk memulakan pengimbasan kehadiran pelajar.
            </p>
          </div>
          <button
            id="dashboard-btn-goto-activities"
            onClick={onGoToActivities}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Pilih & Buka Sesi</span>
          </button>
        </div>
      )}

      {/* 2. STATS CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={onGoToStudents}
          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Jumlah Pelajar</span>
            <Users className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">95</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>4 Set: DIA_4A - 4D</span>
            <ArrowUpRight className="w-3 h-3 text-indigo-400" />
          </div>
        </div>

        <div
          onClick={onGoToActivities}
          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Aktiviti Induk</span>
            <CalendarCheck className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{activities.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span>{sessions.length} Sesi Terjadual</span>
          </div>
        </div>

        <div
          onClick={onGoToReports}
          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Transaksi Imbasan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{attendanceRecords.length}</div>
          <div className="text-[11px] text-emerald-400 mt-1">
            <span>Rekod Disahkan</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Integriti Data</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">100%</div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span>Anti-Duplicate Aktif</span>
          </div>
        </div>
      </div>

      {/* 3. MIDDLE SECTION: CLASS SET BREAKDOWN & QUICK SIMULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Set Attendance */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Status Kehadiran Mengikut Set Kelas</h3>
              <p className="text-xs text-slate-400">Pecahan pelajar bagi sesi aktif semasa ({activeSession ? activeSession.sessionName : 'Semua Sesi'})</p>
            </div>
            <button
              onClick={onGoToReports}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Laporan Penuh</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {setStats.map((st) => (
              <div key={st.name} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getClassBadgeColor(st.name)}`}>
                    {st.name}
                  </span>
                  <span className="text-xs font-semibold text-white">
                    {st.presentInActive} / {st.total} ({st.rate}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${st.rate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Activity Category Highlights */}
          <div className="pt-3 border-t border-slate-800/80">
            <div className="text-xs font-semibold text-slate-400 mb-2">Liputan Kategori Aktiviti Universal:</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categorySummary.map((c) => (
                <div key={c.cat} className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 text-center">
                  <div className="text-xs text-slate-400 truncate">{c.label}</div>
                  <div className="text-sm font-bold text-white mt-0.5">{c.count} Sesi</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Simulator / Fast Scan Drawer for instant testing */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 mb-1 font-semibold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Simulasi Ujian Imbasan Pantas</span>
            </div>
            <h3 className="text-base font-bold text-white">Uji Imbas Pelajar</h3>
            <p className="text-xs text-slate-400 mt-1">
              Klik nama pelajar untuk simulasi imbasan QR tanpa memerlukan kamera.
            </p>

            <div className="mt-3 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Cari nama, ID, atau set..."
                value={searchSimulate}
                onChange={(e) => setSearchSimulate(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Student list */}
            <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {filteredSimulateStudents.map((st) => {
                const isAttended = activeSession
                  ? activeSessionRecords.some((r) => r.studentId === st.id)
                  : false;

                return (
                  <button
                    key={st.id}
                    id={`simulate-btn-${st.id}`}
                    onClick={() => handleSimulate(st.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all border cursor-pointer ${
                      isAttended
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-950/60 border-slate-800 hover:border-indigo-500/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${getStudentColor(st.id)}`}>
                        {getInitials(st.name)}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate">{st.name}</div>
                        <div className="text-[10px] text-slate-400">{st.studentId} • {st.className}</div>
                      </div>
                    </div>
                    <div className="shrink-0 text-[10px] font-bold">
                      {isAttended ? (
                        <span className="text-emerald-400">HADIR ✓</span>
                      ) : (
                        <span className="text-indigo-400">Imbas +</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback result */}
          {lastScanResult && (
            <div
              className={`p-2.5 rounded-lg text-xs border ${
                lastScanResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : lastScanResult.isDuplicate
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                {lastScanResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{lastScanResult.code}</span>
              </div>
              <p className="text-[11px] mt-0.5 text-slate-300">{lastScanResult.message}</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. RECENT LIVE SCANS STREAM */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Log Transaksi Kehadiran Terkini</h3>
          </div>
          <button
            onClick={onGoToReports}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat Semua ({attendanceRecords.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentRecords.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Belum ada rekod imbasan pada hari ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentRecords.map(({ record, student, session }) => (
              <div
                key={record.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3"
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
                      {student?.className} • {session?.sessionName || record.sessionId}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    HADIR
                  </span>
                  <div className="text-[9px] text-slate-500 mt-1">
                    {new Date(record.timestamp).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
