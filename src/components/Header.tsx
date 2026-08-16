import React from 'react';
import { AttendanceSession, UserRole, OFFICIAL_STUDENT_ATTEND_ICON } from '../types';
import {
  QrCode,
  Volume2,
  VolumeX,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  UserCheck,
  GraduationCap
} from 'lucide-react';

interface HeaderProps {
  activeSession: AttendanceSession | null;
  soundEnabled: boolean;
  isAdmin: boolean;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onToggleSound: (enabled: boolean) => void;
  onResetData: () => void;
  onOpenScanner: () => void;
  onToggleAdminMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSession,
  soundEnabled,
  isAdmin,
  currentRole,
  onRoleChange,
  onToggleSound,
  onResetData,
  onOpenScanner,
  onToggleAdminMode
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20 ring-1 ring-white/20 bg-slate-900 flex items-center justify-center shrink-0">
            <img
              src={OFFICIAL_STUDENT_ATTEND_ICON}
              alt="StudentAttend Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight">
                <span className="text-white">STUDENT</span>
                <span className="text-blue-500">ATTEND</span>
              </h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wider">
                Universal Platform
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Sistem Kehadiran Pelajar Universal — Perhimpunan, Kuliah & Program Rasmi
            </p>
          </div>
        </div>

        {/* Active Session Pill & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Session Status */}
          {activeSession ? (
            <div
              id="header-active-session-indicator"
              onClick={onOpenScanner}
              className="cursor-pointer hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all text-xs font-medium text-emerald-300 group"
              title="Klik untuk buka pengimbas bagi sesi ini"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="truncate max-w-[200px] text-slate-200 group-hover:text-white">
                {activeSession.sessionName}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase font-bold">
                BUKA
              </span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              <span>Tiada Sesi Aktif</span>
            </div>
          )}

          {/* Quick Scanner Action Button */}
          <button
            id="header-btn-quick-scanner"
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">Imbas QR</span>
          </button>

          {/* Sound Toggle */}
          <button
            id="header-btn-sound-toggle"
            onClick={() => onToggleSound(!soundEnabled)}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title={soundEnabled ? 'Bunyi Diaktifkan' : 'Bunyi Dimatikan'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Admin Mode Toggle */}
          <button
            id="header-btn-admin-toggle"
            onClick={onToggleAdminMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
              isAdmin
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 shadow-sm'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Kunci Akses Mod Pentadbir"
          >
            {isAdmin ? (
              <>
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline font-semibold">Admin ON</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span className="hidden md:inline">Admin</span>
              </>
            )}
          </button>

          {/* Reset Demo Data Button */}
          <button
            id="header-btn-reset-demo"
            onClick={onResetData}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer"
            title="Set Semula Sampel Data (95 Pelajar)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
