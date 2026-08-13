import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Student,
  AttendanceRecord,
  AttendanceSession,
  AttendanceActivity,
  ScanResult
} from '../types';
import {
  getClassBadgeColor,
  getInitials,
  getStudentColor,
  getCategoryBadgeColor,
  getCategoryLabel
} from '../utils/studentUtils';
import { exportStudentsToCSV, downloadCSV } from '../utils/csvHelper';
import {
  Search,
  Plus,
  Download,
  Upload,
  QrCode,
  Printer,
  Trash2,
  X,
  Sparkles,
  Phone,
  Mail,
  GraduationCap,
  CheckCircle2,
  Clock,
  UserSquare2
} from 'lucide-react';

interface StudentDirectoryViewProps {
  students: Student[];
  sessions: AttendanceSession[];
  activities: AttendanceActivity[];
  attendanceRecords: AttendanceRecord[];
  isAdmin: boolean;
  onAddStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onOpenCSVImport: () => void;
  onRequestAdminAccess: (actionName?: string) => void;
  onQuickSimulateScan: (studentId: string) => ScanResult;
}

export const StaffDirectoryView: React.FC<StudentDirectoryViewProps> = ({
  students,
  sessions,
  activities,
  attendanceRecords,
  isAdmin,
  onAddStudent,
  onDeleteStudent,
  onOpenCSVImport,
  onRequestAdminAccess,
  onQuickSimulateScan
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSet, setSelectedSet] = useState<string>('ALL');

  // Modal States
  const [selectedStudentForQR, setSelectedStudentForQR] = useState<Student | null>(null);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState<boolean>(false);

  // New Student Form State
  const [newStudentId, setNewStudentId] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newSet, setNewSet] = useState<string>('DIA_4A');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');

  const sets = ['ALL', 'DIA_4A', 'DIA_4B', 'DIA_4C', 'DIA_4D'];

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSet = selectedSet === 'ALL' || student.className === selectedSet;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      student.name.toLowerCase().includes(q) ||
      student.studentId.toLowerCase().includes(q) ||
      student.email.toLowerCase().includes(q) ||
      student.phone.includes(q);
    return matchesSet && matchesSearch;
  });

  // Calculate personal attendance rate
  const getStudentStats = (studentId: string, className: string) => {
    const applicableSessions = sessions.filter((s) => !s.className || s.className === className);
    const presentRecords = attendanceRecords.filter((r) => r.studentId === studentId && r.status === 'PRESENT');
    const rate = applicableSessions.length > 0 ? Math.round((presentRecords.length / applicableSessions.length) * 100) : 0;
    return {
      total: applicableSessions.length,
      present: presentRecords.length,
      rate
    };
  };

  // Handle Export CSV
  const handleExportCSV = () => {
    const csvData = exportStudentsToCSV(filteredStudents);
    downloadCSV(csvData, `Senarai_Pelajar_StudentAttend_${selectedSet}.csv`);
  };

  // Handle Add Student Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentId.trim() || !newName.trim()) return;

    const student: Student = {
      id: newStudentId.trim().toUpperCase(),
      studentId: newStudentId.trim().toUpperCase(),
      name: newName.trim().toUpperCase(),
      className: newSet,
      phone: newPhone.trim(),
      email: newEmail.trim() || `${newStudentId.trim().toLowerCase()}@bpenawar.kpm.edu.my`,
      department: 'Diploma Perakaunan'
    };

    onAddStudent(student);
    setIsAddModalOpen(false);
    setNewStudentId('');
    setNewName('');
    setNewPhone('');
    setNewEmail('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Direktori Master Pelajar</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                {students.length} Pelajar
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Setiap pelajar mempunyai No. Pelajar unik dan Kod QR kekal untuk semua aktiviti kolej.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-add-student"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pelajar</span>
            </button>

            <button
              id="btn-import-csv"
              onClick={onOpenCSVImport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>

            <button
              id="btn-export-csv"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Eksport CSV</span>
            </button>

            <button
              id="btn-batch-print-qr"
              onClick={() => setIsBatchPrintOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              title="Cetak Lembaran Kad QR Pelajar"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak QR Set</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {/* Set Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 no-scrollbar">
            {sets.map((setName) => {
              const count = setName === 'ALL' ? students.length : students.filter((s) => s.className === setName).length;
              return (
                <button
                  key={setName}
                  onClick={() => setSelectedSet(setName)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedSet === setName
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>{setName === 'ALL' ? 'Semua Pelajar' : `Set ${setName}`}</span>
                  <span className="ml-1.5 text-[10px] opacity-80">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari nama, No. Pelajar, e-mel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* STUDENT CARDS GRID */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/60 rounded-2xl border border-slate-800 p-6 text-slate-500 text-xs">
          Tiada rekod pelajar sepadan dengan kriteria carian.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const stats = getStudentStats(student.id, student.className);

            return (
              <div
                key={student.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 truncate">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 shadow-inner ${getStudentColor(student.id)}`}>
                      {getInitials(student.name)}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getClassBadgeColor(student.className)}`}>
                          {student.className}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-300">
                          {student.studentId}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white truncate mt-0.5" title={student.name}>
                        {student.name}
                      </h4>
                    </div>
                  </div>

                  {/* QR Badge Trigger */}
                  <button
                    id={`btn-view-qr-${student.id}`}
                    onClick={() => setSelectedStudentForQR(student)}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-indigo-600/30 text-indigo-400 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer"
                    title="Papar Kad QR Pelajar"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>

                {/* Contact details */}
                <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{student.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{student.phone}</span>
                  </div>
                </div>

                {/* Attendance Summary Bar & Action Buttons */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-bold text-white">
                      {stats.present}/{stats.total}
                    </div>
                    <span className="text-[10px] text-slate-400">Hadir ({stats.rate}%)</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* View History */}
                    <button
                      onClick={() => setSelectedStudentForHistory(student)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-all cursor-pointer"
                    >
                      Sejarah
                    </button>

                    {/* Fast Simulator Check-in */}
                    <button
                      onClick={() => onQuickSimulateScan(student.id)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-semibold border border-indigo-500/30 transition-all cursor-pointer"
                      title="Uji Imbas Pantas"
                    >
                      Imbas
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* STUDENT DIGITAL QR BADGE MODAL */}
      {selectedStudentForQR && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-center space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Kad ID Digital Pelajar
              </span>
              <button
                onClick={() => setSelectedStudentForQR(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ID Card Front */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">StudentAttend ID</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getClassBadgeColor(selectedStudentForQR.className)}`}>
                  {selectedStudentForQR.className}
                </span>
              </div>

              {/* QR Code */}
              <div className="p-4 rounded-xl bg-white inline-block shadow-lg mx-auto">
                <QRCodeSVG
                  value={`STUDENT|${selectedStudentForQR.studentId}`}
                  size={160}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="space-y-0.5">
                <h4 className="text-sm font-extrabold text-white">
                  {selectedStudentForQR.name}
                </h4>
                <div className="text-xs font-mono font-bold text-indigo-400">
                  {selectedStudentForQR.studentId}
                </div>
                <div className="text-[10px] text-slate-400">
                  {selectedStudentForQR.department || 'Diploma Perakaunan'}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Pelajar boleh memaparkan QR ini pada telefon atau kad bercetak untuk sebarang sesi kehadiran rasmi kolej.
            </p>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kad ID Pelajar</span>
            </button>
          </div>
        </div>
      )}

      {/* STUDENT ATTENDANCE HISTORY MODAL */}
      {selectedStudentForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Sejarah Kehadiran Pelajar</h3>
                <p className="text-xs text-slate-400">
                  {selectedStudentForHistory.name} ({selectedStudentForHistory.studentId}) • {selectedStudentForHistory.className}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentForHistory(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Record Timeline */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {sessions.map((session) => {
                const activity = activities.find((a) => a.id === session.activityId);
                const rec = attendanceRecords.find(
                  (r) => r.sessionId === session.id && r.studentId === selectedStudentForHistory.id
                );
                const isAttended = rec?.status === 'PRESENT';

                return (
                  <div
                    key={session.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      isAttended
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${getCategoryBadgeColor(session.category)}`}>
                          {getCategoryLabel(session.category)}
                        </span>
                        <span className="text-xs font-bold text-white">{session.sessionName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {session.date} • {session.startTime}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {isAttended ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          HADIR ✓
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500">
                          TIDAK HADIR
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* BATCH PRINT SHEET MODAL */}
      {isBatchPrintOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Lembaran Kad QR Cetakan ({selectedSet})</h3>
                <p className="text-xs text-slate-400">
                  {filteredStudents.length} Kad QR sedia untuk dicetak pada kertas A4 / Kad Pelajar.
                </p>
              </div>
              <button
                onClick={() => setIsBatchPrintOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-2 bg-slate-950 rounded-xl">
              {filteredStudents.map((st) => (
                <div key={st.id} className="p-3 rounded-xl bg-white text-slate-900 text-center space-y-1 shadow">
                  <div className="text-[10px] font-bold text-indigo-700 truncate">{st.className}</div>
                  <div className="flex justify-center py-1">
                    <QRCodeSVG value={`STUDENT|${st.studentId}`} size={85} level="M" />
                  </div>
                  <div className="text-[10px] font-extrabold truncate">{st.name}</div>
                  <div className="text-[9px] font-mono text-slate-600">{st.studentId}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembaran A4</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Tambah Pelajar Baharu</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300">No. Pelajar (Unique ID) *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PDA-2502-120"
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Nama Penuh Pelajar *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: MUHAMMAD HARITH BIN KAMARUL"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Set Kelas *</label>
                  <select
                    value={newSet}
                    onChange={(e) => setNewSet(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="DIA_4A">DIA_4A</option>
                    <option value="DIA_4B">DIA_4B</option>
                    <option value="DIA_4C">DIA_4C</option>
                    <option value="DIA_4D">DIA_4D</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">No. Telefon</label>
                  <input
                    type="text"
                    placeholder="Contoh: 60123456789"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">E-mel Rasmi (Opsional)</label>
                <input
                  type="email"
                  placeholder="Contoh: harith@bpenawar.kpm.edu.my"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Simpan Pelajar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
