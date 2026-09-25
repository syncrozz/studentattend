import React from 'react';
import { Event, OFFICIAL_STUDENT_ATTEND_ICON } from '../types';
import { Volume2, VolumeX } from 'lucide-react';

interface HeaderProps {
  activeEvent: Event | null;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  onOpenScanner: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeEvent,
  soundEnabled,
  onToggleSound,
  onOpenScanner
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm ring-1 ring-white/10 bg-slate-900 flex items-center justify-center shrink-0">
            <img
              src={OFFICIAL_STUDENT_ATTEND_ICON}
              alt="StudentAttend Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">
                STUDENT<span className="text-indigo-400">ATTEND</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Sistem Kehadiran Acara Pelajar
            </p>
          </div>
        </div>

        {/* Operational Context & Actions */}
        <div className="flex items-center gap-3">
          {/* Active Event Status Indicator */}
          {activeEvent ? (
            <button
              id="header-active-event-indicator"
              type="button"
              onClick={onOpenScanner}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all text-xs font-medium text-emerald-300 cursor-pointer group"
              title="Kehadiran sedang aktif. Klik untuk buka bilik imbasan."
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="truncate max-w-[160px] sm:max-w-[240px] text-slate-200 group-hover:text-white font-medium">
                {activeEvent.title}
              </span>
              <span className="hidden xs:inline text-[10px] text-emerald-400 font-semibold uppercase">
                Imbas
              </span>
            </button>
          ) : (
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 text-xs text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
              <span>Tiada acara aktif</span>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            id="header-btn-sound-toggle"
            type="button"
            onClick={() => onToggleSound(!soundEnabled)}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title={soundEnabled ? 'Bunyi diaktifkan' : 'Bunyi dimatikan'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
