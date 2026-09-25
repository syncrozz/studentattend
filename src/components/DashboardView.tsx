import React from 'react';
import { Event, Student, AttendanceRecord } from '../types';
import {
  QrCode,
  CalendarCheck,
  Users,
  CheckCircle2,
  ArrowRight,
  Clock,
  MapPin
} from 'lucide-react';

interface DashboardViewProps {
  activeEvent: Event | null;
  events: Event[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onOpenScanner: () => void;
  onGoToEvents: () => void;
  onGoToStudents: () => void;
  onGoToReports: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeEvent,
  events,
  students,
  attendanceRecords,
  onOpenScanner,
  onGoToEvents,
  onGoToStudents,
  onGoToReports
}) => {
  // Compute active event metrics
  const activeRecords = activeEvent
    ? attendanceRecords.filter((r) => (r.eventId === activeEvent.id || r.sessionId === activeEvent.id) && r.status === 'PRESENT')
    : [];

  const targetStudentsForActive = activeEvent
    ? activeEvent.rosterType === 'CLASS_SET' && activeEvent.targetClasses && activeEvent.targetClasses.length > 0
      ? students.filter((s) => activeEvent.targetClasses!.includes(s.className))
      : students
    : [];

  const activePercent =
    targetStudentsForActive.length > 0
      ? Math.round((activeRecords.length / targetStudentsForActive.length) * 100)
      : 0;

  // Recent 6 operational events
  const recentEvents = [...events].slice(0, 6);

  // Helper for category label
  const getCategoryLabel = (type?: string) => {
    switch (type) {
      case 'ASSEMBLY': return 'Perhimpunan';
      case 'PROGRAMME': return 'Program Rasmi';
      case 'SEMINAR': return 'Seminar';
      case 'BRIEFING': return 'Taklimat';
      case 'CEREMONY': return 'Majlis Rasmi';
      case 'STUDENT_ACTIVITY': return 'Aktiviti Pelajar';
      default: return 'Acara';
    }
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. ACTIVE EVENT OPERATIONAL HERO */}
      {activeEvent ? (
        <div className="rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Kehadiran Sedang Berlangsung
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-300 font-medium">
                  {getCategoryLabel(activeEvent.type)}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {activeEvent.title}
              </h2>

              <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                {activeEvent.location && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{activeEvent.location}</span>
                  </span>
                )}
                {activeEvent.activatedAt && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Diaktifkan: {formatTime(activeEvent.activatedAt)}</span>
                  </span>
                )}
                {activeEvent.targetClasses && activeEvent.targetClasses.length > 0 && (
                  <span className="text-slate-400">
                    Peserta: Set {activeEvent.targetClasses.join(', ')}
                  </span>
                )}
              </div>
            </div>

            {/* Attendance Count & Primary Action */}
            <div className="flex items-center gap-4 shrink-0 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="text-right">
                <div className="text-2xl font-extrabold text-white tracking-tight">
                  {activeRecords.length}
                  <span className="text-sm font-normal text-slate-400"> / {targetStudentsForActive.length}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {activePercent}% Kehadiran
                </div>
              </div>

              <button
                id="dashboard-btn-scan-primary"
                type="button"
                onClick={onOpenScanner}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Imbas Kehadiran</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800/80 rounded-full h-2 mt-5 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, activePercent)}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Tiada Acara Aktif Pada Masa Ini
            </h2>
            <p className="text-xs text-slate-400">
              Pilih mana-mana acara daripada senarai untuk memulakan sesi imbasan kehadiran pelajar.
            </p>
          </div>
          <button
            id="dashboard-btn-view-events"
            type="button"
            onClick={onGoToEvents}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer shrink-0"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Buka Senarai Acara</span>
          </button>
        </div>
      )}

      {/* 2. THREE KEY OPERATIONAL KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={onGoToEvents}
          className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Acara Berdaftar</span>
            <CalendarCheck className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {events.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {events.filter((e) => e.status === 'ACTIVE').length} sedang aktif
          </div>
        </div>

        <div
          onClick={onGoToStudents}
          className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Pelajar Berdaftar</span>
            <Users className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {students.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Direktori induk pelajar kolej
          </div>
        </div>

        <div
          onClick={onGoToReports}
          className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Rekod Kehadiran</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {attendanceRecords.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Jumlah pengesahan imbasan
          </div>
        </div>
      </div>

      {/* 3. SENARAI ACARA TERKINI (HORIZONTAL OVERVIEW) */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Acara Terkini
            </h3>
            <p className="text-xs text-slate-400">
              Ringkasan acara dan status kehadiran
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToEvents}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
          >
            <span>Semua Acara</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/80">
          {recentEvents.map((event) => {
            const eventRecords = attendanceRecords.filter(
              (r) => (r.eventId === event.id || r.sessionId === event.id) && r.status === 'PRESENT'
            );

            return (
              <div
                key={event.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        event.status === 'ACTIVE'
                          ? 'bg-emerald-400 animate-pulse'
                          : event.status === 'COMPLETED'
                          ? 'bg-blue-400'
                          : 'bg-slate-500'
                      }`}
                    />
                    <span className="font-semibold text-white text-sm">
                      {event.title}
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400 font-medium">
                      {getCategoryLabel(event.type)}
                    </span>
                  </div>
                  <div className="text-slate-400 flex items-center gap-3">
                    {event.location && <span>📍 {event.location}</span>}
                    {event.organizer && <span>🏢 {event.organizer}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="font-bold text-slate-200">
                      {event.status === 'DRAFT' ? '—' : `${eventRecords.length} Hadir`}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      event.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : event.status === 'COMPLETED'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
