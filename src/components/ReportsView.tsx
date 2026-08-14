import React, { useState } from 'react';
import {
  Student,
  AttendanceSession,
  AttendanceActivity,
  AttendanceRecord
} from '../types';
import {
  getClassBadgeColor,
  getCategoryBadgeColor,
  getCategoryLabel
} from '../utils/studentUtils';
import {
  exportSessionAttendanceToCSV,
  exportStudentsToCSV,
  downloadCSV
} from '../utils/csvHelper';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Users,
  CalendarCheck,
  TrendingUp,
  GraduationCap
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';

interface ReportsViewProps {
  students: Student[];
  sessions: AttendanceSession[];
  activities: AttendanceActivity[];
  attendanceRecords: AttendanceRecord[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  students,
  sessions,
  activities,
  attendanceRecords
}) => {
  const [reportPerspective, setReportPerspective] = useState<'ACTIVITY' | 'STUDENT'>('ACTIVITY');
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id || '');
  const [filterSet, setFilterSet] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];
  const currentActivity = currentSession ? activities.find((a) => a.id === currentSession.activityId) : undefined;

  // Records for current session
  const sessionRecords = currentSession
    ? attendanceRecords.filter((r) => r.sessionId === currentSession.id)
    : [];

  const recordMap = new Map<string, AttendanceRecord>();
  sessionRecords.forEach((r) => recordMap.set(r.studentId, r));

  // Determine target students for current session
  let targetStudents = students;
  if (currentSession?.className) {
    targetStudents = students.filter((s) => s.className === currentSession.className);
  }

  // Filtered by set & status & search
  const filteredSessionStudents = targetStudents.filter((student) => {
    const matchesSet = filterSet === 'ALL' || student.className === filterSet;
    const isPresent = recordMap.has(student.id) && recordMap.get(student.id)?.status === 'PRESENT';
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'PRESENT' && isPresent) ||
      (filterStatus === 'ABSENT' && !isPresent);

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      student.name.toLowerCase().includes(q) ||
      student.studentId.toLowerCase().includes(q);

    return matchesSet && matchesStatus && matchesSearch;
  });

  const totalTargetCount = targetStudents.length;
  const presentCount = targetStudents.filter((s) => recordMap.has(s.id) && recordMap.get(s.id)?.status === 'PRESENT').length;
  const absentCount = Math.max(0, totalTargetCount - presentCount);
  const sessionPercent = totalTargetCount > 0 ? Math.round((presentCount / totalTargetCount) * 100) : 0;

  // Chart Data: Class Set Performance for current session
  const setPerformanceData = ['DIA_4A', 'DIA_4B', 'DIA_4C', 'DIA_4D'].map((setName) => {
    const classTotal = students.filter((s) => s.className === setName).length;
    const classPresent = students.filter(
      (s) => s.className === setName && recordMap.has(s.id) && recordMap.get(s.id)?.status === 'PRESENT'
    ).length;
    const rate = classTotal > 0 ? Math.round((classPresent / classTotal) * 100) : 0;
    return {
      name: setName,
      Hadir: classPresent,
      Jumlah: classTotal,
      Peratus: rate
    };
  });

  // Handle Export Activity CSV
  const handleExportActivityCSV = () => {
    if (!currentSession) return;
    const csvContent = exportSessionAttendanceToCSV(currentSession, students, attendanceRecords);
    downloadCSV(csvContent, `Laporan_Kehadiran_${currentSession.sessionName.replace(/\s+/g, '_')}.csv`);
  };

  // Student-Centric list calculations
  const studentReportsList = students
    .filter((st) => {
      const matchesSet = filterSet === 'ALL' || st.className === filterSet;
      const q = searchQuery.toLowerCase();
      const matchesSearch = st.name.toLowerCase().includes(q) || st.studentId.toLowerCase().includes(q);
      return matchesSet && matchesSearch;
    })
    .map((st) => {
      const applicableSessions = sessions.filter((s) => !s.className || s.className === st.className);
      const studentRecs = attendanceRecords.filter((r) => r.studentId === st.id && r.status === 'PRESENT');
      const rate = applicableSessions.length > 0 ? Math.round((studentRecs.length / applicableSessions.length) * 100) : 0;

      // Assembly rate
      const asmSessions = applicableSessions.filter((s) => s.category === 'ASSEMBLY');
      const asmRecs = asmSessions.filter((s) => studentRecs.some((r) => r.sessionId === s.id)).length;
      const asmRate = asmSessions.length > 0 ? Math.round((asmRecs / asmSessions.length) * 100) : 0;

      // Class rate
      const clsSessions = applicableSessions.filter((s) => s.category === 'CLASS');
      const clsRecs = clsSessions.filter((s) => studentRecs.some((r) => r.sessionId === s.id)).length;
      const clsRate = clsSessions.length > 0 ? Math.round((clsRecs / clsSessions.length) * 100) : 0;

      return {
        student: st,
        total: applicableSessions.length,
        present: studentRecs.length,
        rate,
        asmRate,
        clsRate
      };
    });

  return (
    <div className="space-y-6">
      {/* Top Header & Perspective Switcher */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Laporan & Analitik Kehadiran</h2>
            <p className="text-xs text-slate-400">
              Sokongan dwi-perspektif: Berasaskan Sesi Aktiviti & Berasaskan Rekod Pelajar
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Perspective Toggle */}
            <div className="p-1 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-1">
              <button
                id="btn-report-perspective-activity"
                onClick={() => setReportPerspective('ACTIVITY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  reportPerspective === 'ACTIVITY'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Berasaskan Aktiviti
              </button>
              <button
                id="btn-report-perspective-student"
                onClick={() => setReportPerspective('STUDENT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  reportPerspective === 'STUDENT'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Berasaskan Pelajar
              </button>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2.5">
            {reportPerspective === 'ACTIVITY' && (
              <select
                id="report-select-session"
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.sessionName} ({s.date})
                  </option>
                ))}
              </select>
            )}

            {/* Set Filter */}
            <select
              value={filterSet}
              onChange={(e) => setFilterSet(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">Semua Set (DIA_4A - 4D)</option>
              <option value="DIA_4A">Set DIA_4A</option>
              <option value="DIA_4B">Set DIA_4B</option>
              <option value="DIA_4C">Set DIA_4C</option>
              <option value="DIA_4D">Set DIA_4D</option>
            </select>

            {reportPerspective === 'ACTIVITY' && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="PRESENT">Hadir Sahaja</option>
                <option value="ABSENT">Tidak Hadir Sahaja</option>
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Cari nama atau No. Pelajar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-56"
              />
            </div>

            <button
              onClick={handleExportActivityCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              title="Eksport Fail CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Eksport CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              title="Cetak Lembaran Laporan"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak Laporan</span>
            </button>
          </div>
        </div>
      </div>

      {/* PERSPECTIVE 1: ACTIVITY-CENTRIC */}
      {reportPerspective === 'ACTIVITY' && currentSession && (
        <div className="space-y-6 printable-report-container">
          {/* Summary KPIs & Set Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* KPI Box */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCategoryBadgeColor(currentSession.category)}`}>
                    {getCategoryLabel(currentSession.category)}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">
                    {currentSession.sessionName}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-400">{sessionPercent}%</div>
                  <div className="text-[10px] text-slate-400">Kehadiran</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-base font-bold text-white">{presentCount}</div>
                  <div className="text-[10px] text-emerald-400 font-semibold">Hadir</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-base font-bold text-white">{absentCount}</div>
                  <div className="text-[10px] text-rose-400 font-semibold">Tidak Hadir</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-base font-bold text-white">{totalTargetCount}</div>
                  <div className="text-[10px] text-slate-400 font-semibold">Sasaran</div>
                </div>
              </div>

              <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800/80">
                <div>📍 Lokasi: <strong className="text-slate-300">{currentSession.location}</strong></div>
                <div>🕒 Masa: <strong className="text-slate-300">{currentSession.date} ({currentSession.startTime} – {currentSession.endTime})</strong></div>
              </div>
            </div>

            {/* Set Comparison Bar Chart */}
            <div className="lg:col-span-2 rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-2">
              <h3 className="text-sm font-bold text-white">Analitik Kehadiran Mengikut Set Kelas (%)</h3>
              <div className="h-44 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={setPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="Peratus" radius={[6, 6, 0, 0]}>
                      {setPerformanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.Peratus >= 80 ? '#10b981' : entry.Peratus >= 50 ? '#6366f1' : '#f59e0b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* TABLE OF STUDENTS FOR THIS SESSION */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-lg">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="text-xs font-bold text-white">
                Lembaran Kehadiran Rasmi ({filteredSessionStudents.length} Pelajar)
              </div>
              <span className="text-[11px] text-slate-400">
                Format Rasmi Kolej
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Bil</th>
                    <th className="py-3 px-4">No. Pelajar</th>
                    <th className="py-3 px-4">Nama Penuh Pelajar</th>
                    <th className="py-3 px-4">Set Kelas</th>
                    <th className="py-3 px-4">Status Kehadiran</th>
                    <th className="py-3 px-4">Masa Imbasan</th>
                    <th className="py-3 px-4">Kaedah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSessionStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Tiada pelajar ditemui mengikut tapisan semasa.
                      </td>
                    </tr>
                  ) : (
                    filteredSessionStudents.map((st, idx) => {
                      const rec = recordMap.get(st.id);
                      const isPresent = rec?.status === 'PRESENT';

                      return (
                        <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 text-slate-500 font-mono">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono font-bold text-indigo-400">{st.studentId}</td>
                          <td className="py-3 px-4 font-semibold text-white">{st.name}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getClassBadgeColor(st.className)}`}>
                              {st.className}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {isPresent ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>HADIR</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-semibold border border-rose-500/30">
                                <XCircle className="w-3 h-3" />
                                <span>TIDAK HADIR</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                            {rec ? new Date(rec.timestamp).toLocaleTimeString('ms-MY') : '-'}
                          </td>
                          <td className="py-3 px-4 text-[10px] uppercase text-slate-500">
                            {rec ? rec.method : '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PERSPECTIVE 2: STUDENT-CENTRIC */}
      {reportPerspective === 'STUDENT' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-lg">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="text-xs font-bold text-white">
                Ringkasan Prestasi Kumulatif Pelajar ({studentReportsList.length} Pelajar)
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">No. Pelajar</th>
                    <th className="py-3 px-4">Nama Pelajar</th>
                    <th className="py-3 px-4">Set</th>
                    <th className="py-3 px-4 text-center">Kehadiran Keseluruhan</th>
                    <th className="py-3 px-4 text-center">Perhimpunan %</th>
                    <th className="py-3 px-4 text-center">Kuliah / Kelas %</th>
                    <th className="py-3 px-4">Sesi Hadir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {studentReportsList.map((item) => (
                    <tr key={item.student.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400">{item.student.studentId}</td>
                      <td className="py-3 px-4 font-semibold text-white">{item.student.name}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getClassBadgeColor(item.student.className)}`}>
                          {item.student.className}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                            item.rate >= 80
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : item.rate >= 60
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {item.rate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-300">{item.asmRate}%</td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-300">{item.clsRate}%</td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {item.present} / {item.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
