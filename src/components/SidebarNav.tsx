import React from 'react';
import { ActiveTab, OFFICIAL_STUDENT_ATTEND_ICON } from '../types';
import {
  LayoutDashboard,
  QrCode,
  CalendarCheck,
  Users,
  FileSpreadsheet
} from 'lucide-react';

interface SidebarNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  hasActiveEvent?: boolean;
  activeEventTitle?: string;
  totalStudentsCount?: number;
  totalRecordsCount?: number;
  onOpenPWAInstall?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onTabChange,
  hasActiveEvent,
  activeEventTitle,
  totalStudentsCount,
  onOpenPWAInstall
}) => {
  // 5 Approved Operational Navigation Areas (MYAU Standard)
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: undefined
    },
    {
      id: 'attendance' as ActiveTab,
      aliasIds: ['attendance', 'scanner'] as ActiveTab[],
      label: 'Kehadiran',
      icon: QrCode,
      badge: hasActiveEvent ? 'AKTIF' : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-semibold'
    },
    {
      id: 'events' as ActiveTab,
      aliasIds: ['events', 'activities'] as ActiveTab[],
      label: 'Acara',
      icon: CalendarCheck,
      badge: undefined
    },
    {
      id: 'students' as ActiveTab,
      label: 'Pelajar',
      icon: Users,
      badge: totalStudentsCount && totalStudentsCount > 0 ? `${totalStudentsCount}` : undefined,
      badgeColor: 'bg-slate-800 text-slate-400 border-slate-700'
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Laporan',
      icon: FileSpreadsheet,
      badge: undefined
    }
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900/60 md:min-h-[calc(100vh-4rem)] border-b md:border-b-0 md:border-r border-slate-800/80 p-3 sm:p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Menu Utama
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.aliasIds && item.aliasIds.includes(activeTab));

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : item.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="space-y-2 mt-6">
        {onOpenPWAInstall && (
          <button
            id="sidebar-btn-pwa-install"
            onClick={onOpenPWAInstall}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-medium transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <img
                src={OFFICIAL_STUDENT_ATTEND_ICON}
                alt="StudentAttend"
                className="w-5 h-5 rounded-md object-contain group-hover:scale-105 transition-transform shrink-0"
                referrerPolicy="no-referrer"
              />
              <span>Pasang Aplikasi</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">PWA</span>
          </button>
        )}

        <div className="hidden md:block p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-400">
          <div className="text-[11px] font-medium text-slate-300">StudentAttend</div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Sistem Kehadiran Acara & Aktiviti Rasmi Pelajar
          </p>
        </div>
      </div>
    </aside>
  );
};
