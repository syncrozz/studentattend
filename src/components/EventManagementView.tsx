import React, { useState } from 'react';
import { Event, EventCategory, EventStatus, Student, AttendanceRecord } from '../types';
import {
  CalendarCheck,
  Plus,
  QrCode,
  MapPin,
  Building2,
  Users,
  CheckCircle2,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  X,
  Play,
  Check
} from 'lucide-react';

interface EventManagementViewProps {
  events: Event[];
  attendanceRecords: AttendanceRecord[];
  students: Student[];
  isAdmin: boolean;
  onActivateEvent: (eventId: string) => void;
  onCloseEvent: (eventId: string) => void;
  onCreateEvent: (eventData: Omit<Event, 'id' | 'createdAt' | 'status'> & Partial<Event>) => void;
  onUpdateEvent?: (event: Event) => void;
  onDeleteEvent?: (eventId: string) => void;
  onOpenScannerForEvent: (eventId: string) => void;
  onRequestAdminAccess?: (actionName?: string) => void;
  onViewReportForEvent?: (eventId: string) => void;
}

export const EventManagementView: React.FC<EventManagementViewProps> = ({
  events,
  attendanceRecords,
  students,
  isAdmin,
  onActivateEvent,
  onCloseEvent,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  onOpenScannerForEvent,
  onRequestAdminAccess,
  onViewReportForEvent
}) => {
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [activeMenuEventId, setActiveMenuEventId] = useState<string | null>(null);

  // Form states for Create Event
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventCategory>('ASSEMBLY');
  const [rosterType, setRosterType] = useState<'ALL' | 'CLASS_SET'>('ALL');
  const [targetClasses, setTargetClasses] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [description, setDescription] = useState('');

  // Extract available classes dynamically from student master
  const availableClasses: string[] = Array.from(
    new Set<string>(students.map((s) => s.className).filter((c): c is string => Boolean(c)))
  ).sort();

  // Helper for Category Label
  const getCategoryLabel = (cat: EventCategory) => {
    switch (cat) {
      case 'ASSEMBLY': return 'Perhimpunan';
      case 'PROGRAMME': return 'Program Rasmi';
      case 'SEMINAR': return 'Seminar';
      case 'BRIEFING': return 'Taklimat';
      case 'CEREMONY': return 'Majlis Rasmi';
      case 'STUDENT_ACTIVITY': return 'Aktiviti Pelajar';
      default: return 'Acara Umum';
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  // Handle Create Event Submission
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateEvent({
      title: title.trim(),
      type,
      rosterType,
      targetClasses: rosterType === 'CLASS_SET' ? targetClasses : [],
      location: location.trim() || undefined,
      organizer: organizer.trim() || undefined,
      description: description.trim() || undefined,
      status: 'DRAFT'
    });

    // Reset & close
    setTitle('');
    setType('ASSEMBLY');
    setRosterType('ALL');
    setTargetClasses([]);
    setLocation('');
    setOrganizer('');
    setDescription('');
    setIsCreateModalOpen(false);
  };

  // Open Edit Modal
  const handleOpenEdit = (evt: Event) => {
    setActiveMenuEventId(null);
    setEditingEvent(evt);
    setTitle(evt.title);
    setType(evt.type);
    setRosterType(evt.rosterType === 'CLASS_SET' ? 'CLASS_SET' : 'ALL');
    setTargetClasses(evt.targetClasses || []);
    setLocation(evt.location || '');
    setOrganizer(evt.organizer || '');
    setDescription(evt.description || '');
  };

  // Handle Edit Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !title.trim()) return;

    if (onUpdateEvent) {
      onUpdateEvent({
        ...editingEvent,
        title: title.trim(),
        type,
        rosterType,
        targetClasses: rosterType === 'CLASS_SET' ? targetClasses : [],
        location: location.trim() || undefined,
        organizer: organizer.trim() || undefined,
        description: description.trim() || undefined
      });
    }

    setEditingEvent(null);
  };

  const toggleTargetClass = (cls: string) => {
    if (targetClasses.includes(cls)) {
      setTargetClasses(targetClasses.filter((c) => c !== cls));
    } else {
      setTargetClasses([...targetClasses, cls]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Acara
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Pengurusan rekod kehadiran acara rasmi dan aktiviti kolej
          </p>
        </div>

        <button
          id="btn-create-event"
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Sediakan Acara</span>
        </button>
      </div>

      {/* HORIZONTAL OPERATIONAL EVENT TABLE (MYAU-07) */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 min-w-[220px]">Acara</th>
                <th className="py-3.5 px-4">Tarikh</th>
                <th className="py-3.5 px-4">Kehadiran</th>
                <th className="py-3.5 px-4">Peserta</th>
                <th className="py-3.5 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <CalendarCheck className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-semibold text-slate-400">Tiada Acara Dijadualkan</p>
                    <p className="text-xs mt-1">Klik butang &quot;Sediakan Acara&quot; di atas untuk memulakan.</p>
                  </td>
                </tr>
              ) : (
                events.map((event) => {
                  const eventRecords = attendanceRecords.filter(
                    (r) => (r.eventId === event.id || r.sessionId === event.id) && r.status === 'PRESENT'
                  );

                  let targetCount = students.length;
                  if (event.rosterType === 'CLASS_SET' && event.targetClasses && event.targetClasses.length > 0) {
                    targetCount = students.filter((s) => event.targetClasses!.includes(s.className)).length;
                  }

                  const percent = targetCount > 0 ? Math.round((eventRecords.length / targetCount) * 100) : 0;

                  return (
                    <tr
                      key={event.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* STATUS */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {event.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            <span>AKTIF</span>
                          </span>
                        )}
                        {event.status === 'DRAFT' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            DRAFT
                          </span>
                        )}
                        {event.status === 'COMPLETED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Check className="w-3 h-3" />
                            <span>SELESAI</span>
                          </span>
                        )}
                        {event.status === 'ARCHIVED' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-500">
                            ARKIB
                          </span>
                        )}
                      </td>

                      {/* ACARA */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">
                          {event.title}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="text-indigo-400 font-medium">{getCategoryLabel(event.type)}</span>
                          {event.location && (
                            <>
                              <span className="text-slate-600">·</span>
                              <span>{event.location}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* TARIKH */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                        {formatDate(event.createdAt)}
                      </td>

                      {/* KEHADIRAN */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {event.status === 'DRAFT' ? (
                          <span className="text-slate-500 font-medium">—</span>
                        ) : (
                          <div>
                            <span className="font-bold text-white">{eventRecords.length}</span>
                            <span className="text-slate-400"> / {targetCount}</span>
                            <span className="text-[11px] text-slate-500 ml-1.5">({percent}%)</span>
                          </div>
                        )}
                      </td>

                      {/* PESERTA */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                        {event.rosterType === 'CLASS_SET' && event.targetClasses && event.targetClasses.length > 0 ? (
                          <span>Set {event.targetClasses.join(', ')}</span>
                        ) : (
                          <span>Semua Pelajar ({students.length})</span>
                        )}
                      </td>

                      {/* TINDAKAN (MYAU-01: One Primary Action based on state + Secondary in ⋯) */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* PRIMARY ACTION BASED ON STATUS */}
                          {event.status === 'DRAFT' && (
                            <button
                              id={`btn-activate-event-${event.id}`}
                              type="button"
                              onClick={() => onActivateEvent(event.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                              title="Aktifkan sesi kehadiran"
                            >
                              Aktifkan
                            </button>
                          )}

                          {event.status === 'ACTIVE' && (
                            <button
                              id={`btn-scan-event-${event.id}`}
                              type="button"
                              onClick={() => onOpenScannerForEvent(event.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
                              title="Buka bilik imbasan QR"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>Imbas</span>
                            </button>
                          )}

                          {(event.status === 'COMPLETED' || event.status === 'ARCHIVED') && (
                            <button
                              id={`btn-view-event-${event.id}`}
                              type="button"
                              onClick={() => {
                                if (onViewReportForEvent) onViewReportForEvent(event.id);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
                              title="Lihat ringkasan kehadiran"
                            >
                              Lihat
                            </button>
                          )}

                          {/* SECONDARY ACTION OVERFLOW MENU (MYAU-08) */}
                          <div className="relative inline-block text-left">
                            <button
                              id={`btn-menu-event-${event.id}`}
                              type="button"
                              onClick={() =>
                                setActiveMenuEventId(activeMenuEventId === event.id ? null : event.id)
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Tindakan Lanjut"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuEventId === event.id && (
                              <div
                                className="absolute right-0 mt-1 w-44 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1 z-30 divide-y divide-slate-800 text-left"
                                onMouseLeave={() => setActiveMenuEventId(null)}
                              >
                                <div className="py-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(event)}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>Edit Acara</span>
                                  </button>

                                  {event.status === 'ACTIVE' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuEventId(null);
                                        onCloseEvent(event.id);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-amber-300 hover:text-amber-200 hover:bg-slate-800 cursor-pointer"
                                    >
                                      <Check className="w-3.5 h-3.5 text-amber-400" />
                                      <span>Tamatkan Kehadiran</span>
                                    </button>
                                  )}

                                  {event.status === 'DRAFT' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuEventId(null);
                                        onActivateEvent(event.id);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-300 hover:text-emerald-200 hover:bg-slate-800 cursor-pointer"
                                    >
                                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>Aktifkan Kehadiran</span>
                                    </button>
                                  )}
                                </div>

                                {onDeleteEvent && (
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuEventId(null);
                                        if (confirm(`Padam acara "${event.title}"?`)) {
                                          onDeleteEvent(event.id);
                                        }
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-slate-800 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                      <span>Padam Acara</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EVENT CREATION MODAL (MYAU: Admin defines WHAT, System records WHEN) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Sediakan Acara Baharu</h3>
                <p className="text-xs text-slate-400">Takrifkan butiran acara untuk pendaftaran kehadiran</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Tajuk Acara *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Contoh: Perhimpunan Pelajar Bulan September"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Jenis Acara *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as EventCategory)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="ASSEMBLY">Perhimpunan Pelajar</option>
                  <option value="PROGRAMME">Program Rasmi Kolej</option>
                  <option value="SEMINAR">Seminar / Taklimat Akademik</option>
                  <option value="BRIEFING">Taklimat Disiplin & Am</option>
                  <option value="CEREMONY">Majlis Rasmi & Anugerah</option>
                  <option value="STUDENT_ACTIVITY">Aktiviti / Kokurikulum Pelajar</option>
                  <option value="OTHER">Acara Umum</option>
                </select>
              </div>

              {/* Roster / Participant Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-300">Peserta Berdaftar *</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setRosterType('ALL')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer text-left transition-all ${
                      rosterType === 'ALL'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Semua Pelajar ({students.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRosterType('CLASS_SET')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer text-left transition-all ${
                      rosterType === 'CLASS_SET'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Pilihan Set Kelas
                  </button>
                </div>

                {rosterType === 'CLASS_SET' && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[11px] text-slate-400 font-medium">Pilih Set Kelas Terlibat:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {availableClasses.map((cls) => {
                        const isSelected = targetClasses.includes(cls);
                        return (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => toggleTargetClass(cls)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-500'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            Set {cls}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Lokasi Acara</label>
                  <input
                    type="text"
                    placeholder="Contoh: Dewan Besar Kolej"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Penganjur</label>
                  <input
                    type="text"
                    placeholder="Contoh: Hal Ehwal Pelajar (HEP)"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Keterangan / Catatan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan mengenai acara..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Simpan Acara
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVENT EDIT MODAL */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Edit Acara</h3>
                <p className="text-xs text-slate-400">ID: {editingEvent.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Tajuk Acara *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Jenis Acara *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as EventCategory)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="ASSEMBLY">Perhimpunan Pelajar</option>
                  <option value="PROGRAMME">Program Rasmi Kolej</option>
                  <option value="SEMINAR">Seminar / Taklimat Akademik</option>
                  <option value="BRIEFING">Taklimat Disiplin & Am</option>
                  <option value="CEREMONY">Majlis Rasmi & Anugerah</option>
                  <option value="STUDENT_ACTIVITY">Aktiviti / Kokurikulum Pelajar</option>
                  <option value="OTHER">Acara Umum</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Lokasi</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Penganjur</label>
                  <input
                    type="text"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Keterangan</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
