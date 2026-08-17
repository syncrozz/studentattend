import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  AttendanceActivity,
  AttendanceSession,
  AttendanceRecord,
  ActivityCategory,
  EventStatus
} from '../types';
import { getCategoryBadgeColor, getCategoryLabel } from '../utils/studentUtils';
import {
  CalendarCheck,
  Plus,
  QrCode,
  Clock,
  MapPin,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Play,
  Square,
  Search,
  Filter,
  Eye,
  X,
  Sparkles,
  ShieldCheck,
  Maximize2,
  Trash2,
  GraduationCap
} from 'lucide-react';

interface EventManagementViewProps {
  activities: AttendanceActivity[];
  sessions: AttendanceSession[];
  attendanceRecords: AttendanceRecord[];
  isAdmin: boolean;
  onSetSessionStatus: (sessionId: string, newStatus: EventStatus) => void;
  onCreateActivity: (activity: AttendanceActivity) => void;
  onCreateSession: (session: AttendanceSession) => void;
  onDeleteSession?: (sessionId: string) => void;
  onDeleteActivity?: (activityId: string) => void;
  onOpenScannerForSession: (sessionId: string) => void;
  onRequestAdminAccess: (actionName?: string) => void;
}

export const EventManagementView: React.FC<EventManagementViewProps> = ({
  activities,
  sessions,
  attendanceRecords,
  isAdmin,
  onSetSessionStatus,
  onCreateActivity,
  onCreateSession,
  onDeleteSession,
  onDeleteActivity,
  onOpenScannerForSession,
  onRequestAdminAccess
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal States
  const [isCreateActivityOpen, setIsCreateActivityOpen] = useState<boolean>(false);
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState<boolean>(false);
  const [sessionForActivityId, setSessionForActivityId] = useState<string>('');
  const [projectorSession, setProjectorSession] = useState<AttendanceSession | null>(null);

  // New Activity Form State
  const [newActivityName, setNewActivityName] = useState<string>('');
  const [newActivityCat, setNewActivityCat] = useState<ActivityCategory>('ASSEMBLY');
  const [newActivityOrganizer, setNewActivityOrganizer] = useState<string>('Hal Ehwal Pelajar (HEP)');
  const [newActivityLocation, setNewActivityLocation] = useState<string>('Dewan Besar Kolej');
  const [newActivityDesc, setNewActivityDesc] = useState<string>('');

  // New Session Form State
  const [newSessionName, setNewSessionName] = useState<string>('');
  const [newSessionDate, setNewSessionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newSessionStartTime, setNewSessionStartTime] = useState<string>('08:00');
  const [newSessionEndTime, setNewSessionEndTime] = useState<string>('09:30');
  const [newSessionClass, setNewSessionClass] = useState<string>('');
  const [newSessionSubject, setNewSessionSubject] = useState<string>('');
  const [newSessionLecturer, setNewSessionLecturer] = useState<string>('');

  // Category change handler to smartly adapt defaults
  const handleCategoryChange = (cat: ActivityCategory) => {
    setNewActivityCat(cat);
    if (cat === 'CLASS') {
      if (newActivityOrganizer === 'Hal Ehwal Pelajar (HEP)' || !newActivityOrganizer) {
        setNewActivityOrganizer('');
      }
      if (newActivityLocation === 'Dewan Besar Kolej') {
        setNewActivityLocation('Bilik Kuliah / Makmal');
      }
    } else if (cat === 'ASSEMBLY') {
      if (!newActivityOrganizer) {
        setNewActivityOrganizer('Hal Ehwal Pelajar (HEP)');
      }
      if (!newActivityLocation || newActivityLocation === 'Bilik Kuliah / Makmal') {
        setNewActivityLocation('Dewan Besar Kolej');
      }
    }
  };

  // Filtered Activities
  const filteredActivities = activities.filter((act) => {
    const matchesCat = selectedCategory === 'ALL' || act.category === selectedCategory;
    const matchesSearch =
      act.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (act.description && act.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const categories: { id: string; label: string }[] = [
    { id: 'ALL', label: 'Semua Kategori' },
    { id: 'ASSEMBLY', label: 'Perhimpunan Pelajar' },
    { id: 'CLASS', label: 'Kuliah / Kelas' },
    { id: 'OFFICIAL_PROGRAMME', label: 'Program Rasmi Kolej' },
    { id: 'WORKSHOP', label: 'Bengkel / Seminar' },
    { id: 'CO_CURRICULAR', label: 'Kokurikulum' },
    { id: 'CLUB_ACTIVITY', label: 'Kelab / Persatuan' }
  ];

  // Handle Submit New Activity
  const handleSubmitActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityName.trim()) return;

    const newAct: AttendanceActivity = {
      id: `ACT-${Date.now().toString(36).toUpperCase()}`,
      name: newActivityName.trim(),
      category: newActivityCat,
      organizer: newActivityOrganizer.trim() || 'Penganjur Kolej',
      location: newActivityLocation.trim() || 'Kolej',
      description: newActivityDesc.trim(),
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    onCreateActivity(newAct);
    setIsCreateActivityOpen(false);
    setNewActivityName('');
    setNewActivityDesc('');
  };

  // Open Create Session modal for specific activity
  const handleOpenAddSession = (actId: string) => {
    const act = activities.find((a) => a.id === actId);
    setSessionForActivityId(actId);
    if (act) {
      if (act.category === 'CLASS') {
        setNewSessionName(`Kuliah Minggu ${sessions.filter((s) => s.activityId === actId).length + 1}`);
        setNewSessionSubject(act.name);
      } else if (act.category === 'ASSEMBLY') {
        setNewSessionName(`Perhimpunan Bulan ${new Date().toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })}`);
      } else {
        setNewSessionName(`Sesi ${act.name}`);
      }
    }
    setIsCreateSessionOpen(true);
  };

  // Handle Submit New Session
  const handleSubmitSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim() || !sessionForActivityId) return;

    const parentAct = activities.find((a) => a.id === sessionForActivityId);

    const newSes: AttendanceSession = {
      id: `SES-${Date.now().toString(36).toUpperCase()}`,
      activityId: sessionForActivityId,
      activityName: parentAct?.name || 'Aktiviti',
      category: parentAct?.category || 'OTHER',
      sessionName: newSessionName.trim(),
      date: newSessionDate,
      startTime: newSessionStartTime,
      endTime: newSessionEndTime,
      status: 'OPEN', // Default to open so it is immediately active
      attendanceMethod: 'QR',
      location: parentAct?.location || 'Kolej',
      organizer: parentAct?.organizer || 'Penganjur Kolej',
      ...(newSessionClass ? { className: newSessionClass } : {}),
      ...(newSessionSubject ? { subjectName: newSessionSubject.trim() } : {}),
      ...(newSessionLecturer ? { lecturerName: newSessionLecturer.trim() } : {}),
      createdAt: new Date().toISOString()
    };

    onCreateSession(newSes);
    setIsCreateSessionOpen(false);
  };

  // Handle Delete Session (e.g. if created redundantly)
  const handleDeleteSessionClick = (session: AttendanceSession) => {
    if (!isAdmin) {
      onRequestAdminAccess(`Padam Sesi (${session.sessionName})`);
      return;
    }
    const confirmed = window.confirm(
      `Adakah anda pasti untuk MEMADAM sesi "${session.sessionName}"?\n\nSesi ini akan dipadam daripada senarai kehadiran sekiranya ia dicipta secara tersilap / redundan.`
    );
    if (confirmed && onDeleteSession) {
      onDeleteSession(session.id);
    }
  };

  // Handle Delete Activity
  const handleDeleteActivityClick = (activity: AttendanceActivity) => {
    if (!isAdmin) {
      onRequestAdminAccess(`Padam Aktiviti (${activity.name})`);
      return;
    }
    const confirmed = window.confirm(
      `Adakah anda pasti untuk MEMADAM aktiviti induk "${activity.name}" dan semua sesinya?`
    );
    if (confirmed && onDeleteActivity) {
      onDeleteActivity(activity.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Pengurusan Aktiviti & Sesi Kehadiran</h2>
            <p className="text-xs text-slate-400">
              Konsep Universal: Satu Aktiviti Induk &rarr; Pelbagai Sesi Berkala &rarr; Rekod Kehadiran Pelajar
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-create-new-activity"
              onClick={() => setIsCreateActivityOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cipta Aktiviti Induk</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center gap-3 pt-2">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 no-scrollbar">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari aktiviti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* ACTIVITIES LIST WITH NESTED SESSIONS */}
      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/60 rounded-2xl border border-slate-800 p-6 text-slate-500 text-xs">
            Tiada aktiviti ditemui bagi kriteria carian atau kategori yang dipilih.
          </div>
        ) : (
          filteredActivities.map((activity) => {
            const activitySessions = sessions.filter((s) => s.activityId === activity.id);

            return (
              <div
                key={activity.id}
                className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-lg"
              >
                {/* Activity Parent Header */}
                <div className="p-4 sm:p-5 bg-slate-900 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${getCategoryBadgeColor(activity.category)}`}>
                        {getCategoryLabel(activity.category)}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">ID: {activity.id}</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {activity.name}
                    </h3>

                    {activity.description && (
                      <p className="text-xs text-slate-300 max-w-2xl">{activity.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        {activity.category === 'CLASS' ? (
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span>
                          {activity.category === 'CLASS' ? `Pensyarah: ${activity.organizer}` : activity.organizer}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{activity.location || 'Lokasi Terpilih'}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{activitySessions.length} Sesi Terjadual</span>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons for Activity */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      id={`btn-add-session-${activity.id}`}
                      onClick={() => handleOpenAddSession(activity.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Sesi</span>
                    </button>

                    <button
                      id={`btn-delete-activity-${activity.id}`}
                      onClick={() => handleDeleteActivityClick(activity)}
                      className="p-2 rounded-xl bg-slate-900/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer"
                      title="Padam Aktiviti Induk"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* SESSIONS SUB-LIST */}
                <div className="p-4 sm:p-5 bg-slate-950/40 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Senarai Sesi Kehadiran Bagi Aktiviti Ini:
                  </div>

                  {activitySessions.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-500">
                      Belum ada sesi dijadualkan. Klik "Tambah Sesi" untuk menjana sesi kehadiran baharu.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activitySessions.map((session) => {
                        const count = attendanceRecords.filter(
                          (r) => r.sessionId === session.id && r.status === 'PRESENT'
                        ).length;

                        const isOpen = session.status === 'OPEN';

                        return (
                          <div
                            key={session.id}
                            className={`p-4 rounded-xl border transition-all ${
                              isOpen
                                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-md shadow-emerald-500/10'
                                : 'bg-slate-950/80 border-slate-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                                      isOpen
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                                        : 'bg-blue-950/40 text-blue-300 border border-blue-800/40'
                                    }`}
                                  >
                                    {isOpen ? '🟢 DIBUKA (AKTIF)' : '🔵 SESI TERSEDIA'}
                                  </span>

                                  {session.className && (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                                      Set {session.className}
                                    </span>
                                  )}
                                </div>

                                <h4 className="text-sm font-bold text-white tracking-tight">
                                  {session.sessionName}
                                </h4>

                                <div className="text-xs text-slate-400 space-y-0.5 pt-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-slate-500" />
                                    <span>{session.date} • {session.startTime} – {session.endTime}</span>
                                  </div>
                                  {session.subjectName && (
                                    <div className="text-[11px] text-slate-300">
                                      Subjek: {session.subjectName} {session.lecturerName && `(${session.lecturerName})`}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Attendee Count Badge */}
                              <div className="text-right shrink-0">
                                <div className="text-lg font-extrabold text-white">{count}</div>
                                <div className="text-[10px] text-slate-400">Pelajar Hadir</div>
                              </div>
                            </div>

                            {/* Action Row for this Session */}
                            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                              {/* Left Controls: Open/Close & Delete */}
                              <div className="flex items-center gap-2">
                                {/* Open / Close Session Toggle */}
                                {isOpen ? (
                                  <button
                                    id={`btn-close-session-${session.id}`}
                                    onClick={() => onSetSessionStatus(session.id, 'CLOSED')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-rose-500/20 text-emerald-300 hover:text-rose-300 text-xs font-semibold border border-emerald-500/40 hover:border-rose-500/40 transition-all cursor-pointer group"
                                    title="Sesi sedang aktif (Hijau). Klik untuk tutup sesi."
                                  >
                                    <Square className="w-3.5 h-3.5 text-emerald-400 group-hover:text-rose-400" />
                                    <span>🟢 Aktif (Tutup Sesi)</span>
                                  </button>
                                ) : (
                                  <button
                                    id={`btn-open-session-${session.id}`}
                                    onClick={() => onSetSessionStatus(session.id, 'OPEN')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-semibold border border-blue-500/30 transition-all cursor-pointer"
                                    title="Buka sesi kehadiran ini untuk pengimbasan"
                                  >
                                    <Play className="w-3.5 h-3.5 text-blue-400" />
                                    <span>Buka Sesi Ini</span>
                                  </button>
                                )}

                                {/* Delete Redundant / Erroneous Session Button */}
                                <button
                                  id={`btn-delete-session-${session.id}`}
                                  onClick={() => handleDeleteSessionClick(session)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-semibold border border-slate-800 hover:border-rose-500/40 transition-all cursor-pointer"
                                  title="Padam sesi ini jika dibuat secara tersilap / redundan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Padam Sesi</span>
                                </button>
                              </div>

                              {/* Right Controls: Projector & Scanner */}
                              <div className="flex items-center gap-2">
                                {/* Projector / Big QR Screen */}
                                <button
                                  id={`btn-projector-${session.id}`}
                                  onClick={() => setProjectorSession(session)}
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-indigo-300 text-xs transition-all cursor-pointer"
                                  title="Papar QR Sesi (Projektor / Skrin Besar)"
                                >
                                  <Maximize2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Go to Scanner */}
                                <button
                                  id={`btn-scan-session-${session.id}`}
                                  onClick={() => onOpenScannerForSession(session.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                  <span>Imbas</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE ACTIVITY MODAL */}
      {isCreateActivityOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Cipta Aktiviti Induk Baharu</h3>
              <button
                onClick={() => setIsCreateActivityOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitActivity} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300">Nama Aktiviti Induk *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Perhimpunan Bulanan Pelajar / PM2 - Pengajian Malaysia 2"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Kategori Universal *</label>
                  <select
                    value={newActivityCat}
                    onChange={(e) => handleCategoryChange(e.target.value as ActivityCategory)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="ASSEMBLY">Perhimpunan Pelajar</option>
                    <option value="CLASS">Kuliah / Kelas</option>
                    <option value="OFFICIAL_PROGRAMME">Program Rasmi Kolej</option>
                    <option value="WORKSHOP">Bengkel</option>
                    <option value="SEMINAR">Seminar</option>
                    <option value="BRIEFING">Taklimat</option>
                    <option value="CO_CURRICULAR">Kokurikulum</option>
                    <option value="STUDENT_PROGRAMME">Program Pelajar</option>
                    <option value="CLUB_ACTIVITY">Kelab & Persatuan</option>
                    <option value="SPECIAL_EVENT">Acara Khas</option>
                    <option value="OTHER">Aktiviti Umum</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">
                    {newActivityCat === 'CLASS' ? 'Pensyarah Mengajar' : 'Penganjur / Jabatan'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      newActivityCat === 'CLASS'
                        ? 'Contoh: Pn. Siti Sarah / En. Ahmad Fauzi'
                        : 'Contoh: Hal Ehwal Pelajar (HEP)'
                    }
                    value={newActivityOrganizer}
                    onChange={(e) => setNewActivityOrganizer(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Lokasi Rasmi</label>
                <input
                  type="text"
                  placeholder="Contoh: Dewan Besar / Auditorium"
                  value={newActivityLocation}
                  onChange={(e) => setNewActivityLocation(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Penerangan Ringkas (Tak Wajib)</label>
                <textarea
                  rows={2}
                  placeholder="Catatan mengenai tujuan dan format kehadiran..."
                  value={newActivityDesc}
                  onChange={(e) => setNewActivityDesc(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateActivityOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Simpan Aktiviti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SESSION MODAL */}
      {isCreateSessionOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Cipta Sesi Kehadiran Baharu</h3>
                <p className="text-xs text-slate-400">
                  Untuk: {activities.find((a) => a.id === sessionForActivityId)?.name}
                </p>
              </div>
              <button
                onClick={() => setIsCreateSessionOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSession} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300">Nama Sesi *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Perhimpunan Bulan September 2026 atau Kuliah Minggu 2"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Tarikh *</label>
                  <input
                    type="date"
                    required
                    value={newSessionDate}
                    onChange={(e) => setNewSessionDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Masa Mula *</label>
                  <input
                    type="time"
                    required
                    value={newSessionStartTime}
                    onChange={(e) => setNewSessionStartTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Masa Tamat *</label>
                  <input
                    type="time"
                    required
                    value={newSessionEndTime}
                    onChange={(e) => setNewSessionEndTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Sasaran Set Kelas (Opsional)</label>
                  <select
                    value={newSessionClass}
                    onChange={(e) => setNewSessionClass(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">Semua Pelajar (Terbuka)</option>
                    <option value="DIA_4A">Set DIA_4A sahaja</option>
                    <option value="DIA_4B">Set DIA_4B sahaja</option>
                    <option value="DIA_4C">Set DIA_4C sahaja</option>
                    <option value="DIA_4D">Set DIA_4D sahaja</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Nama Pensyarah / Pegawai</label>
                  <input
                    type="text"
                    placeholder="Contoh: Dr. Zulkifli Rahman"
                    value={newSessionLecturer}
                    onChange={(e) => setNewSessionLecturer(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px]">
                💡 Sesi baharu akan dibuka secara automatik (OPEN) dan sedia untuk diimbas serta-merta oleh pelajar.
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateSessionOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  Buka Sesi Kehadiran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROJECTOR / BIG SCREEN QR MODAL */}
      {projectorSession && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl text-center space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => setProjectorSession(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <span className={`text-[11px] px-3 py-1 rounded-full border font-bold ${getCategoryBadgeColor(projectorSession.category)}`}>
                {getCategoryLabel(projectorSession.category)}
              </span>
              <h3 className="text-xl font-extrabold text-white tracking-tight mt-2">
                {projectorSession.sessionName}
              </h3>
              <p className="text-xs text-slate-400">
                {projectorSession.location} • {projectorSession.date}
              </p>
            </div>

            {/* BIG QR CODE */}
            <div className="p-6 rounded-2xl bg-white flex items-center justify-center inline-block shadow-2xl mx-auto">
              <QRCodeSVG
                value={`SESSION|${projectorSession.id}`}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Imbas Untuk Rekod Kehadiran
              </div>
              <p className="text-[11px] text-slate-400">
                Gunakan aplikasi StudentAttend untuk mengimbas kod sesi di atas.
              </p>
            </div>

            <button
              onClick={() => {
                onOpenScannerForSession(projectorSession.id);
                setProjectorSession(null);
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              Buka Kamera Pengimbas Sesi Ini
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
