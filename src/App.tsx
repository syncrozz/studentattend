import React, { useState, useEffect } from 'react';
import {
  ActiveTab,
  Student,
  AttendanceActivity,
  AttendanceSession,
  AttendanceRecord,
  EventStatus,
  ScanResult,
  AttendanceMethod,
  UserRole
} from './types';
import { attendanceEngine } from './services/attendanceEngine';
import { soundService } from './services/soundService';

import { Header } from './components/Header';
import { SidebarNav } from './components/SidebarNav';
import { DashboardView } from './components/DashboardView';
import { ScannerView } from './components/ScannerView';
import { EventManagementView } from './components/EventManagementView';
import { StaffDirectoryView } from './components/StaffDirectoryView';
import { MyAttendanceView } from './components/MyAttendanceView';
import { ReportsView } from './components/ReportsView';
import { ConceptGuideView } from './components/ConceptGuideView';
import { StudentQRPortalView } from './components/StudentQRPortalView';
import { AdminPinModal } from './components/AdminPinModal';
import { CSVImportModal } from './components/CSVImportModal';
import { PWAInstallModal } from './components/PWAInstallModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('ADMIN');

  // Real-time state from Attendance Engine
  const [students, setStudents] = useState<Student[]>(() => attendanceEngine.getStudents());
  const [activities, setActivities] = useState<AttendanceActivity[]>(() => attendanceEngine.getActivities());
  const [sessions, setSessions] = useState<AttendanceSession[]>(() => attendanceEngine.getSessions());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => attendanceEngine.getAttendanceRecords());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Admin Mode & Modal States
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState<boolean>(false);
  const [adminActionTitle, setAdminActionTitle] = useState<string>('Sila Sahkan Akses Admin');
  const [isCSVModalOpen, setIsCSVModalOpen] = useState<boolean>(false);

  // PWA Installation state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPWAInstallModalOpen, setIsPWAInstallModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Listen to URL routing (support slug /qr and query params)
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      if (path === '/qr' || path.startsWith('/qr') || hash === '#/qr' || hash.startsWith('#/qr')) {
        setActiveTab('qr');
      } else if (path === '/scanner' || hash === '#/scanner') {
        setActiveTab('scanner');
      } else if (path === '/activities' || hash === '#/activities') {
        setActiveTab('activities');
      } else if (path === '/students' || hash === '#/students') {
        setActiveTab('students');
      } else if (path === '/my-attendance' || hash === '#/my-attendance') {
        setActiveTab('my-attendance');
      } else if (path === '/reports' || hash === '#/reports') {
        setActiveTab('reports');
      } else if (path === '/guide' || hash === '#/guide') {
        setActiveTab('guide');
      }
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    window.addEventListener('hashchange', handleUrlRoute);

    return () => {
      window.removeEventListener('popstate', handleUrlRoute);
      window.removeEventListener('hashchange', handleUrlRoute);
    };
  }, []);

  const handleNavigateTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    const targetPath = tab === 'qr' ? '/qr' : tab === 'dashboard' ? '/' : `/${tab}`;
    try {
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    } catch (e) {
      console.warn('pushState error:', e);
      window.location.hash = tab === 'dashboard' ? '' : `#/${tab}`;
    }
  };

  // Subscriptions to Engine / Firestore
  useEffect(() => {
    const unsubStudents = attendanceEngine.subscribeStudents((data) => setStudents(data));
    const unsubActivities = attendanceEngine.subscribeActivities((data) => setActivities(data));
    const unsubSessions = attendanceEngine.subscribeSessions((data) => setSessions(data));
    const unsubRecords = attendanceEngine.subscribeRecords((data) => setAttendanceRecords(data));

    return () => {
      unsubStudents();
      unsubActivities();
      unsubSessions();
      unsubRecords();
    };
  }, []);

  const activeSession = sessions.find((s) => s.status === 'OPEN') || null;

  // Toggle Admin Mode
  const handleToggleAdminMode = () => {
    if (isAdmin) {
      setIsAdmin(false);
      soundService.playSuccess();
    } else {
      setAdminActionTitle('Aktifkan Mod Pentadbir (Admin Mode)');
      setIsAdminPinModalOpen(true);
    }
  };

  // Request Admin Access with Context
  const handleRequestAdminAccess = (actionName?: string) => {
    if (!isAdmin) {
      setAdminActionTitle(actionName ? `Akses Admin: ${actionName}` : 'Akses Admin Diperlukan');
      setIsAdminPinModalOpen(true);
    }
  };

  // Session Status Change (OPEN / CLOSED / ARCHIVED)
  const handleSetSessionStatus = (sessionId: string, newStatus: EventStatus) => {
    const updated = attendanceEngine.setSessionStatus(sessionId, newStatus);
    setSessions(updated);
    if (newStatus === 'CLOSED') {
      soundService.playClick();
    }
  };

  // Delete Session (e.g. redundant session created by accident)
  const handleDeleteSession = (sessionId: string) => {
    const updated = attendanceEngine.deleteSession(sessionId);
    setSessions(updated);
    soundService.playClick();
  };

  // Delete Activity
  const handleDeleteActivity = (activityId: string) => {
    const updated = attendanceEngine.deleteActivity(activityId);
    setActivities(updated);
    setSessions(attendanceEngine.getSessions());
    soundService.playClick();
  };

  // Create Activity
  const handleCreateActivity = (activity: AttendanceActivity) => {
    attendanceEngine.addActivity(activity);
    setActivities(attendanceEngine.getActivities());
  };

  // Create Session
  const handleCreateSession = (session: AttendanceSession) => {
    const updated = attendanceEngine.addSession(session);
    setSessions(updated);
  };

  // Process Scan
  const handleProcessScan = (
    qrString: string,
    method: AttendanceMethod = 'CAMERA_SCAN',
    targetSessionId?: string
  ): ScanResult => {
    const result = attendanceEngine.processScan(qrString, method, targetSessionId);
    setAttendanceRecords(attendanceEngine.getAttendanceRecords());
    return result;
  };

  // Quick Simulator Scan
  const handleQuickSimulateScan = (studentId: string): ScanResult => {
    return handleProcessScan(`STUDENT|${studentId}`, 'SIMULATOR');
  };

  // Add Single Student
  const handleAddStudent = (newStudent: Student) => {
    attendanceEngine.addStudent(newStudent);
    setStudents(attendanceEngine.getStudents());
  };

  // Update Single Student (e.g. Full Name from QR Portal)
  const handleUpdateStudent = (updatedStudent: Student) => {
    attendanceEngine.updateStudent(updatedStudent);
    setStudents(attendanceEngine.getStudents());
  };

  // Delete Student
  const handleDeleteStudent = (studentId: string) => {
    attendanceEngine.deleteStudent(studentId);
    setStudents(attendanceEngine.getStudents());
  };

  // Import CSV Students
  const handleImportStudents = (newStudentsList: Student[]) => {
    // Merge with existing students by ID
    const existingMap = new Map<string, Student>(students.map((s) => [s.id, s]));
    newStudentsList.forEach((s) => existingMap.set(s.id, s));
    const merged = Array.from(existingMap.values());

    attendanceEngine.saveStudentsList(merged);
    setStudents(merged);
  };

  // Reset Data to Default Students
  const handleResetData = () => {
    if (window.confirm('Adakah anda pasti untuk mengeset semula data kepada Master Pelajar asal?')) {
      attendanceEngine.resetToDefaultData();
      setStudents(attendanceEngine.getStudents());
      setActivities(attendanceEngine.getActivities());
      setSessions(attendanceEngine.getSessions());
      setAttendanceRecords(attendanceEngine.getAttendanceRecords());
      soundService.playSuccess();
    }
  };

  // Dedicated Clean Student View for /qr slug (Distraction-Free for Students)
  if (activeTab === 'qr') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
        {/* Minimalist Student Portal Header */}
        <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3 no-print">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-indigo-500/30 overflow-hidden flex items-center justify-center p-1 shrink-0">
                <img
                  src="https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/logo/StudentAttend/android-chrome-192x192.png"
                  alt="StudentAttend Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black text-white tracking-tight">
                    STUDENT ATTEND
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Portal Pelajar
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Kolej Profesional MARA Bandar Penawar
                </p>
              </div>
            </div>

            {/* Subtle button to access main dashboard / admin system */}
            <button
              id="btn-qr-to-admin"
              onClick={() => handleNavigateTab('dashboard')}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-800"
              title="Akses Sistem Pengurusan Pentadbir"
            >
              <span>Akses Pentadbir</span>
            </button>
          </div>
        </header>

        {/* Dedicated Student Portal Main Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-auto">
          <StudentQRPortalView
            students={students}
            sessions={sessions}
            activities={activities}
            attendanceRecords={attendanceRecords}
            onUpdateStudent={handleUpdateStudent}
            onGoToAdmin={() => handleNavigateTab('dashboard')}
          />
        </main>

        {/* Minimal Student Footer */}
        <footer className="border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-500 no-print">
          <p>© {new Date().getFullYear()} Kolej Profesional MARA Bandar Penawar • Sistem Kehadiran Pelajar</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* App Header */}
      <Header
        activeSession={activeSession}
        soundEnabled={soundEnabled}
        isAdmin={isAdmin}
        currentRole={currentRole}
        onRoleChange={(role) => setCurrentRole(role)}
        onToggleSound={(enabled) => setSoundEnabled(enabled)}
        onResetData={handleResetData}
        onOpenScanner={() => handleNavigateTab('scanner')}
        onOpenQRPortal={() => handleNavigateTab('qr')}
        onToggleAdminMode={handleToggleAdminMode}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        {/* Sidebar Nav */}
        <SidebarNav
          activeTab={activeTab}
          onTabChange={(tab) => handleNavigateTab(tab)}
          activeSessionName={activeSession?.sessionName}
          totalRecordsCount={attendanceRecords.length}
          totalStudentsCount={students.length}
          onOpenPWAInstall={() => setIsPWAInstallModalOpen(true)}
        />

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              activeSession={activeSession}
              activities={activities}
              sessions={sessions}
              students={students}
              attendanceRecords={attendanceRecords}
              onOpenScanner={() => handleNavigateTab('scanner')}
              onGoToActivities={() => handleNavigateTab('activities')}
              onGoToStudents={() => handleNavigateTab('students')}
              onGoToReports={() => handleNavigateTab('reports')}
              onCloseActiveSession={(id) => handleSetSessionStatus(id, 'CLOSED')}
              onQuickSimulateScan={handleQuickSimulateScan}
            />
          )}

          {activeTab === 'scanner' && (
            <ScannerView
              activeSession={activeSession}
              allSessions={sessions}
              students={students}
              attendanceRecords={attendanceRecords}
              isAdmin={isAdmin}
              onRequestAdminAccess={handleRequestAdminAccess}
              onProcessScan={handleProcessScan}
              onGoToActivities={() => handleNavigateTab('activities')}
              soundEnabled={soundEnabled}
              onToggleSound={(enabled) => setSoundEnabled(enabled)}
            />
          )}

          {activeTab === 'activities' && (
            <EventManagementView
              activities={activities}
              sessions={sessions}
              attendanceRecords={attendanceRecords}
              isAdmin={isAdmin}
              onSetSessionStatus={handleSetSessionStatus}
              onCreateActivity={handleCreateActivity}
              onCreateSession={handleCreateSession}
              onDeleteSession={handleDeleteSession}
              onDeleteActivity={handleDeleteActivity}
              onOpenScannerForSession={(sessionId) => {
                handleSetSessionStatus(sessionId, 'OPEN');
                handleNavigateTab('scanner');
              }}
              onRequestAdminAccess={handleRequestAdminAccess}
            />
          )}

          {activeTab === 'students' && (
            <StaffDirectoryView
              students={students}
              sessions={sessions}
              activities={activities}
              attendanceRecords={attendanceRecords}
              isAdmin={isAdmin}
              onAddStudent={handleAddStudent}
              onDeleteStudent={handleDeleteStudent}
              onOpenCSVImport={() => setIsCSVModalOpen(true)}
              onRequestAdminAccess={handleRequestAdminAccess}
              onQuickSimulateScan={handleQuickSimulateScan}
            />
          )}

          {activeTab === 'qr' && (
            <StudentQRPortalView
              students={students}
              sessions={sessions}
              activities={activities}
              attendanceRecords={attendanceRecords}
              onUpdateStudent={handleUpdateStudent}
            />
          )}

          {activeTab === 'my-attendance' && (
            <MyAttendanceView
              students={students}
              sessions={sessions}
              activities={activities}
              attendanceRecords={attendanceRecords}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              students={students}
              sessions={sessions}
              activities={activities}
              attendanceRecords={attendanceRecords}
            />
          )}

          {activeTab === 'guide' && <ConceptGuideView />}
        </main>
      </div>

      {/* Admin PIN Verification Modal */}
      <AdminPinModal
        isOpen={isAdminPinModalOpen}
        onClose={() => setIsAdminPinModalOpen(false)}
        onSuccess={() => setIsAdmin(true)}
        actionTitle={adminActionTitle}
      />

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onImport={handleImportStudents}
      />

      {/* PWA Install Modal */}
      <PWAInstallModal
        isOpen={isPWAInstallModalOpen}
        onClose={() => setIsPWAInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstalled={() => setDeferredPrompt(null)}
      />
    </div>
  );
}
