import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Student,
  AttendanceSession,
  AttendanceActivity,
  AttendanceRecord
} from '../types';
import {
  getClassBadgeColor,
  getCategoryBadgeColor,
  getCategoryLabel,
  getInitials,
  getStudentColor
} from '../utils/studentUtils';
import {
  GraduationCap,
  QrCode,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  Search,
  Filter,
  Sparkles,
  Printer,
  X
} from 'lucide-react';

interface MyAttendanceViewProps {
  students: Student[];
  sessions: AttendanceSession[];
  activities: AttendanceActivity[];
  attendanceRecords: AttendanceRecord[];
}

export const MyAttendanceView: React.FC<MyAttendanceViewProps> = ({
  students,
  sessions,
  activities,
  attendanceRecords
}) => {
  // Default to sample student Muhammad Aiman (PDA-2502-005) or first student
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students.find((s) => s.studentId === 'PDA-2502-005')?.id || students[0]?.id || ''
  );
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  if (!currentStudent) {
    return <div className="text-center py-12 text-slate-400">Tiada profil pelajar ditemui.</div>;
  }

  // Applicable sessions for this student
  const applicableSessions = sessions.filter((s) => !s.className || s.className === currentStudent.className);

  // Student's records
  const studentRecords = attendanceRecords.filter(
    (r) => r.studentId === currentStudent.id && r.status === 'PRESENT'
  );

  const totalSessions = applicableSessions.length;
  const presentCount = studentRecords.length;
  const absentCount = Math.max(0, totalSessions - presentCount);
  const overallPercentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

  // Category analytics computation
  const categoriesList = ['ASSEMBLY', 'CLASS', 'OFFICIAL_PROGRAMME', 'WORKSHOP'];
  const categoryStats = categoriesList.map((catKey) => {
    const catSessions = applicableSessions.filter((s) => s.category === catKey || activities.find(a => a.id === s.activityId)?.category === catKey);
    const catPresent = catSessions.filter((s) => studentRecords.some((r) => r.sessionId === s.id)).length;
    const rate = catSessions.length > 0 ? Math.round((catPresent / catSessions.length) * 100) : 0;
    return {
      category: catKey,
      label: getCategoryLabel(catKey),
      total: catSessions.length,
      present: catPresent,
      rate
    };
  }).filter((c) => c.total > 0);

  // Filtered session timeline
  const filteredTimeline = applicableSessions.filter((session) => {
    if (filterCategory === 'ALL') return true;
    return session.category === filterCategory;
  });

  return (
    <div className="space-y-6">
      {/* 1. STUDENT IDENTITY BANNER & SELECTOR */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 shadow-lg ${getStudentColor(currentStudent.id)}`}>
              {getInitials(currentStudent.name)}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  PORTAL KEHADIRAN PELAJAR
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getClassBadgeColor(currentStudent.className)}`}>
                  {currentStudent.className}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {currentStudent.name}
              </h2>

              <p className="text-xs text-slate-300 font-mono">
                No. Pelajar: <strong className="text-indigo-400">{currentStudent.studentId}</strong> • {currentStudent.department || 'Diploma Perakaunan'}
              </p>
            </div>
          </div>

          {/* Student Profile Switcher for Simulation & Demo */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 shrink-0 space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 block">
              Pilih Profil Pelajar (Demo/Pratonton):
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.studentId} — {st.name} ({st.className})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. STATS OVERVIEW & PERSONAL DIGITAL QR BADGE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Attendance KPI & Category breakdown */}
        <div className="lg:col-span-2 space-y-4">
          {/* Overall Percentage Card */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Kadar Kehadiran Keseluruhan
                </h3>
                <p className="text-xs text-slate-500">Merangkumi semua aktiviti rasmi yang dijadualkan</p>
              </div>
              <div className="text-right">
                <span className="text-3xl sm:text-4xl font-black text-emerald-400">
                  {overallPercentage}%
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="bg-gradient-to-r from-indigo-500 via-emerald-400 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallPercentage}%` }}
              ></div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-center">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-lg font-bold text-white">{presentCount}</div>
                <div className="text-[11px] text-emerald-400 font-semibold">Hadir</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-lg font-bold text-white">{absentCount}</div>
                <div className="text-[11px] text-rose-400 font-semibold">Tidak Hadir</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-lg font-bold text-white">{totalSessions}</div>
                <div className="text-[11px] text-slate-400 font-semibold">Jumlah Sesi</div>
              </div>
            </div>
          </div>

          {/* Category Analytics Breakdown */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Prestasi Mengikut Kategori Aktiviti</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {categoryStats.map((c) => (
                <div key={c.category} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">{c.label}</span>
                    <span className="text-xs font-bold text-white">{c.present}/{c.total} ({c.rate}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${c.rate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Personal QR Code for on-device scanning */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col items-center justify-between text-center space-y-4 shadow-xl">
          <div>
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
              <QrCode className="w-4 h-4" />
              <span>Kod QR Kehadiran Peribadi</span>
            </div>
            <h4 className="text-base font-bold text-white">Kad Pengenalan Digital</h4>
            <p className="text-xs text-slate-400 mt-1">
              Pamerkan kod ini kepada pegawai/pengimbas untuk mendaftar kehadiran anda.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white shadow-2xl inline-block">
            <QRCodeSVG
              value={`STUDENT|${currentStudent.studentId}`}
              size={170}
              level="H"
            />
          </div>

          <div className="space-y-0.5">
            <div className="text-sm font-bold text-white">{currentStudent.name}</div>
            <div className="text-xs font-mono font-bold text-indigo-400">{currentStudent.studentId}</div>
            <div className="text-[10px] text-slate-400">{currentStudent.className}</div>
          </div>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2 no-print"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Kad Pengenalan</span>
          </button>
        </div>
      </div>

      {/* 3. TIMELINE OF SESSIONS */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">Rekod & Jadual Kehadiran Aktiviti</h3>
            <p className="text-xs text-slate-400">Senarai semua sesi yang melibatkan pelajar ini</p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {['ALL', 'ASSEMBLY', 'CLASS', 'OFFICIAL_PROGRAMME', 'WORKSHOP'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat === 'ALL' ? 'Semua' : getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline List */}
        <div className="space-y-2.5">
          {filteredTimeline.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              Tiada sesi dijadualkan bagi kategori ini.
            </div>
          ) : (
            filteredTimeline.map((session) => {
              const rec = attendanceRecords.find(
                (r) => r.sessionId === session.id && r.studentId === currentStudent.id
              );
              const isAttended = rec?.status === 'PRESENT';

              return (
                <div
                  key={session.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    isAttended
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCategoryBadgeColor(session.category)}`}>
                        {getCategoryLabel(session.category)}
                      </span>
                      {session.status === 'OPEN' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                          🟢 SEDANG BERLANGSUNG
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white">
                      {session.sessionName}
                    </h4>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{session.date}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{session.startTime} – {session.endTime}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{session.location || 'Kolej'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Status Outcome */}
                  <div className="flex items-center gap-3 shrink-0">
                    {isAttended ? (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>HADIR</span>
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Direkod: {new Date(rec.timestamp).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })} ({rec.method})
                        </div>
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-700">
                          <XCircle className="w-3.5 h-3.5 text-slate-500" />
                          <span>TIDAK HADIR</span>
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {session.status === 'OPEN' ? 'Sesi sedang buka' : 'Sesi telah ditutup'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* STUDENT DIGITAL QR BADGE PRINT MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 printable-modal-wrapper">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-center space-y-5 printable-modal-content">
            <div className="flex justify-between items-center no-print">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Kad Pengenalan Digital Pelajar
              </span>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ID Card Front - Formatted for Screen & Crisp 1-Page Print */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 shadow-xl space-y-4 printable-id-card">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block">StudentAttend ID</span>
                    <span className="text-[9px] text-slate-400 block tracking-tight">KPM BANDAR PENAWAR</span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border badge-student-set ${getClassBadgeColor(currentStudent.className)}`}>
                  {currentStudent.className}
                </span>
              </div>

              {/* QR Code */}
              <div className="p-4 rounded-xl bg-white inline-block shadow-lg mx-auto qr-code-wrapper">
                <QRCodeSVG
                  value={`STUDENT|${currentStudent.studentId}`}
                  size={160}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-white">
                  {currentStudent.name}
                </h4>
                <div className="text-xs font-mono font-bold text-indigo-400 student-id-text">
                  {currentStudent.studentId}
                </div>
                <div className="text-[10px] text-slate-400">
                  {currentStudent.department || 'Diploma Perakaunan'}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 no-print">
              Pelajar boleh memaparkan QR ini pada telefon atau kad bercetak untuk sebarang sesi kehadiran rasmi kolej.
            </p>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center justify-center gap-2 no-print"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kad ID Pelajar (1 Halaman)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
