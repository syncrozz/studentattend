import React, { useState, useEffect } from 'react';
import {
  Student,
  Event,
  AttendanceSession,
  AttendanceActivity,
  AttendanceRecord
} from '../types';
import {
  getClassBadgeColor,
  getCategoryBadgeColor,
  getCategoryLabel,
  getStudentDisplayName
} from '../utils/studentUtils';
import {
  exportEventAttendanceToCSV,
  exportSessionAttendanceToCSV,
  exportStudentsToCSV,
  downloadCSV
} from '../utils/csvHelper';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  TrendingUp,
  GraduationCap,
  MapPin,
  Clock
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
  events?: Event[];
  sessions?: AttendanceSession[];
  activities?: AttendanceActivity[];
  attendanceRecords: AttendanceRecord[];
  initialSelectedEventId?: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  students,
  events = [],
  sessions = [],
  attendanceRecords,
  initialSelectedEventId
}) => {
  const [reportPerspective, setReportPerspective] = useState<'EVENT' | 'STUDENT'>('EVENT');
  const [selectedEventId, setSelectedEventId] = useState<string>(
    initialSelectedEventId || events[0]?.id || ''
  );
  const [filterSet, setFilterSet] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Keep selected event synced if initialSelectedEventId changes
  useEffect(() => {
    if (initialSelectedEventId) {
      setSelectedEventId(initialSelectedEventId);
      setReportPerspective('EVENT');
    }
  }, [initialSelectedEventId]);

  // If no event selected but events exist, select the first
  useEffect(() => {
    if (!selectedEventId && events.length > 0) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0] || null;

  // Records for current event
  const currentEventRecords = currentEvent
    ? attendanceRecords.filter(
        (r) =>
          (r.eventId === currentEvent.id || r.sessionId === currentEvent.id) &&
          r.status === 'PRESENT'
      )
    : [];

  const recordMap = new Map<string, AttendanceRecord>();
  currentEventRecords.forEach((r) => recordMap.set(r.studentId, r));

  // Determine target students for current event
  let targetStudents = students;
  if (
    currentEvent?.rosterType === 'CLASS_SET' &&
    currentEvent.targetClasses &&
    currentEvent.targetClasses.length > 0
  ) {
    targetStudents = students.filter((s) => currentEvent.targetClasses!.includes(s.className));
  }

  // Filtered by set & status & search
  const filteredEventStudents = targetStudents.filter((student) => {
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
  const presentCount = targetStudents.filter(
    (s) => recordMap.has(s.id) && recordMap.get(s.id)?.status === 'PRESENT'
  ).length;
  const absentCount = Math.max(0, totalTargetCount - presentCount);
  const eventPercent =
    totalTargetCount > 0 ? Math.round((presentCount / totalTargetCount) * 100) : 0;

  // Dynamically extract all available classes for Set comparison
  const uniqueClassNames = Array.from(
    new Set(students.map((s) => s.className).filter(Boolean))
  ).sort();
  const classesForChart = uniqueClassNames.length > 0 ? uniqueClassNames : ['DIA_4A', 'DIA_4B', 'DIA_4C', 'DIA_4D'];

  const setPerformanceData = classesForChart.map((setName) => {
    const classTotal = targetStudents.filter((s) => s.className === setName).length;
    const classPresent = targetStudents.filter(
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

  // Handle Export CSV
  const handleExportCSV = () => {
    if (reportPerspective === 'EVENT' && currentEvent) {
      const csvContent = exportEventAttendanceToCSV(currentEvent, students, attendanceRecords);
      downloadCSV(csvContent, `Laporan_Kehadiran_${currentEvent.title.replace(/\s+/g, '_')}.csv`);
    } else {
      const csvContent = exportStudentsToCSV(students);
      downloadCSV(csvContent, `Laporan_Ringkasan_Pelajar_StudentAttend.csv`);
    }
  };

  // Student-Centric cumulative calculations across all Events
  const studentReportsList = students
    .filter((st) => {
      const matchesSet = filterSet === 'ALL' || st.className === filterSet;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        st.name.toLowerCase().includes(q) || st.studentId.toLowerCase().includes(q);
      return matchesSet && matchesSearch;
    })
    .map((st) => {
      // Find events targeted for this student
      const applicableEvents = events.filter(
        (e) =>
          e.rosterType === 'ALL' ||
          !e.targetClasses ||
          e.targetClasses.length === 0 ||
          e.targetClasses.includes(st.className)
      );

      const studentRecs = attendanceRecords.filter(
        (r) =>
          r.studentId === st.id &&
          r.status === 'PRESENT' &&
          applicableEvents.some((e) => e.id === r.eventId || e.id === r.sessionId)
      );

      const rate =
        applicableEvents.length > 0
          ? Math.round((studentRecs.length / applicableEvents.length) * 100)
          : 0;

      // Assembly events rate
      const asmEvents = applicableEvents.filter((e) => e.type === 'ASSEMBLY');
      const asmRecs = asmEvents.filter((e) =>
        studentRecs.some((r) => r.eventId === e.id || r.sessionId === e.id)
      ).length;
      const asmRate =
        asmEvents.length > 0 ? Math.round((asmRecs / asmEvents.length) * 100) : 0;

      // Other official programme events rate
      const prgEvents = applicableEvents.filter((e) => e.type !== 'ASSEMBLY');
      const prgRecs = prgEvents.filter((e) =>
        studentRecs.some((r) => r.eventId === e.id || r.sessionId === e.id)
      ).length;
      const prgRate =
        prgEvents.length > 0 ? Math.round((prgRecs / prgEvents.length) * 100) : 0;

      return {
        student: st,
        total: applicableEvents.length,
        present: studentRecs.length,
        rate,
        asmRate,
        prgRate
      };
    });

  const formatTime = (iso?: string) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('ms-MY', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 printable-report-container">
      {/* Top Header & Perspective Switcher */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 no-print shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                Laporan & Analitik Kehadiran
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Analisis rekod kehadiran berasaskan acara rasmi dan ringkasan kumulatif pelajar
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Perspective Toggle (MYAU-05: Berasaskan Acara & Berasaskan Pelajar) */}
            <div className="p-1 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-1">
              <button
                id="btn-report-perspective-event"
                onClick={() => setReportPerspective('EVENT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  reportPerspective === 'EVENT'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Berasaskan Acara
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
            {reportPerspective === 'EVENT' && (
              <select
                id="report-select-event"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer max-w-xs truncate"
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} [{e.status}]
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
              <option value="ALL">Semua Set</option>
              {classesForChart.map((cls) => (
                <option key={cls} value={cls}>
                  Set {cls}
                </option>
              ))}
            </select>

            {reportPerspective === 'EVENT' && (
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
              onClick={handleExportCSV}
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
              <span className="hidden sm:inline">Cetak</span>
            </button>
          </div>
        </div>
      </div>

      {/* PERSPECTIVE 1: EVENT-CENTRIC */}
      {reportPerspective === 'EVENT' && currentEvent && (
        <div className="space-y-6 printable-report-container">
          {/* Summary KPIs & Set Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* KPI Box */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCategoryBadgeColor(
                      currentEvent.type
                    )}`}
                  >
                    {getCategoryLabel(currentEvent.type)}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">
                    {currentEvent.title}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-400">
                    {eventPercent}%
                  </div>
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
                {currentEvent.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Lokasi: <strong className="text-slate-300">{currentEvent.location}</strong></span>
                  </div>
                )}
                {currentEvent.activatedAt && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Masa Diaktifkan: <strong className="text-slate-300">{formatTime(currentEvent.activatedAt)}</strong></span>
                  </div>
                )}
                {currentEvent.closedAt && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Masa Ditamatkan: <strong className="text-slate-300">{formatTime(currentEvent.closedAt)}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Set Comparison Bar Chart */}
            <div className="lg:col-span-2 rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-2 shadow-lg">
              <h3 className="text-sm font-bold text-white">
                Analitik Kehadiran Mengikut Set Kelas (%)
              </h3>
              <div className="h-44 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={setPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="Peratus" radius={[6, 6, 0, 0]}>
                      {setPerformanceData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.Peratus >= 80
                              ? '#10b981'
                              : entry.Peratus >= 50
                              ? '#6366f1'
                              : '#f59e0b'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* TABLE OF STUDENTS FOR THIS EVENT */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-lg">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="text-xs font-bold text-white">
                Lembaran Kehadiran Rasmi ({filteredEventStudents.length} Pelajar)
              </div>
              <span className="text-[11px] text-slate-400">Format Rasmi Kolej</span>
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
                  {filteredEventStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Tiada pelajar ditemui mengikut tapisan semasa.
                      </td>
                    </tr>
                  ) : (
                    filteredEventStudents.map((st, idx) => {
                      const rec = recordMap.get(st.id);
                      const isPresent = rec?.status === 'PRESENT';

                      return (
                        <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 text-slate-500 font-mono">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                            {st.studentId}
                          </td>
                          <td className="py-3 px-4 font-semibold text-white">
                            {getStudentDisplayName(st)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getClassBadgeColor(
                                st.className
                              )}`}
                            >
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
                            {rec ? formatTime(rec.scannedAt || rec.timestamp) : '-'}
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
                    <th className="py-3 px-4 text-center">Program / Aktiviti %</th>
                    <th className="py-3 px-4">Acara Hadir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {studentReportsList.map((item) => (
                    <tr key={item.student.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                        {item.student.studentId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {getStudentDisplayName(item.student)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getClassBadgeColor(
                            item.student.className
                          )}`}
                        >
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
                      <td className="py-3 px-4 text-center font-semibold text-slate-300">
                        {item.asmRate}%
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-300">
                        {item.prgRate}%
                      </td>
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
