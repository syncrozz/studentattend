import React, { useState, useEffect } from 'react';
import {
  ActiveTab,
  Student,
  Event as StudentEvent,
  AttendanceRecord,
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
import { ReportsView } from './components/ReportsView';
import { StudentQRPortalView } from './components/StudentQRPortalView';
import { AdminPinModal } from './components/AdminPinModal';
import { CSVImportModal } from './components/CSVImportModal';
import { PWAInstallModal } from './components/PWAInstallModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('ADMIN');

  // Real-time state from Phase 1 Attendance Engine
  const [events, setEvents] = useState<StudentEvent[]>(() => attendanceEngine.getEvents());
  const [students, setStudents] = useState<Student[]>(() => attendanceEngine.getStudents());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    attendanceEngine.getAttendanceRecords()
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Admin Mode & Modal States
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState<boolean>(false);
  const [adminActionTitle, setAdminActionTitle] = useState<string>('Sila Sahkan Akses Admin');
  const [isCSVModalOpen, setIsCSVModalOpen] = useState<boolean>(false);
  const [selectedReportEventId, setSelectedReportEventId] = useState<string | undefined>(undefined);

  // PWA Installation state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPWAInstallModalOpen, setIsPWAInstallModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
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

  // Listen to URL routing (supporting direct /qr, /attendance, /events, /students, /reports)
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      if (path === '/qr' || path.startsWith('/qr') || hash === '#/qr' || hash.startsWith('#/qr')) {
        setActiveTab('qr');
      } else if (path === '/attendance' || path === '/scanner' || hash === '#/attendance' || hash === '#/scanner') {
        setActiveTab('attendance');
      } else if (path === '/events' || path === '/activities' || hash === '#/events' || hash === '#/activities') {
        setActiveTab('events');
      } else if (path === '/students' || hash === '#/students') {
        setActiveTab('students');
      } else if (path === '/reports' || hash === '#/reports') {
        setActiveTab('reports');
      } else {
        setActiveTab('dashboard');
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
    const targetPath =
      tab === 'qr'
        ? '/qr'
        : tab === 'dashboard'
        ? '/'
        : tab === 'attendance' || tab === 'scanner'
        ? '/attendance'
        : tab === 'events' || tab === 'activities'
        ? '/events'
        : `/${tab}`;

    try {
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    } catch (e) {
      window.location.hash = tab === 'dashboard' ? '' : `#/${tab}`;
    }
  };

  // Subscriptions to Engine / Firestore
  useEffect(() => {
    const unsubEvents = attendanceEngine.subscribeEvents((data) => setEvents(data));
    const unsubStudents = attendanceEngine.subscribeStudents((data) => setStudents(data));
    const unsubRecords = attendanceEngine.subscribeRecords((data) => setAttendanceRecords(data));

    return () => {
      unsubEvents();
      unsubStudents();
      unsubRecords();
    };
  }, []);

  // Authoritative Active Event
  const activeEvent = events.find((e) => e.status === 'ACTIVE' || e.status === 'OPEN') || null;

  // Request Admin Access with Context
  const handleRequestAdminAccess = (actionName?: string) => {
    if (!isAdmin) {
      setAdminActionTitle(actionName ? `Akses Admin: ${actionName}` : 'Akses Admin Diperlukan');
      setIsAdminPinModalOpen(true);
    }
  };

  // Event Lifecycle Handlers (Phase 1 Engine Integration)
  const handleActivateEvent = (eventId: string) => {
    const updated = attendanceEngine.activateEvent(eventId);
    setEvents(updated);
    soundService.playSuccess();
  };

  const handleCloseEvent = (eventId: string) => {
    const updated = attendanceEngine.closeEvent(eventId);
    setEvents(updated);
    soundService.playClick();
  };

  const handleCreateEvent = (
    eventData: Omit<StudentEvent, 'id' | 'createdAt' | 'status'> & Partial<StudentEvent>
  ) => {
    attendanceEngine.createEvent(eventData);
    setEvents(attendanceEngine.getEvents());
    soundService.playSuccess();
  };

  const handleUpdateEvent = (updatedEvent: StudentEvent) => {
    const updated = attendanceEngine.updateEvent(updatedEvent);
    setEvents(updated);
    soundService.playSuccess();
  };

  const handleDeleteEvent = (eventId: string) => {
    const updated = attendanceEngine.deleteEvent(eventId);
    setEvents(updated);
    setAttendanceRecords(attendanceEngine.getAttendanceRecords());
    soundService.playClick();
  };

  // Attendance Scanning Handler
  const handleProcessScan = (
    qrString: string,
    method: AttendanceMethod = 'CAMERA_SCAN',
    targetEventId?: string
  ): ScanResult => {
    const result = attendanceEngine.processScan(qrString, method, targetEventId);
    setAttendanceRecords(attendanceEngine.getAttendanceRecords());
    setEvents(attendanceEngine.getEvents());
    return result;
  };

  // Add Single Student
  const handleAddStudent = (newStudent: Student) => {
    attendanceEngine.addStudent(newStudent);
    setStudents(attendanceEngine.getStudents());
    soundService.playSuccess();
  };

  // Update Single Student
  const handleUpdateStudent = (updatedStudent: Student) => {
    attendanceEngine.updateStudent(updatedStudent);
    setStudents(attendanceEngine.getStudents());
    soundService.playSuccess();
  };

  // Delete Single Student
  const handleDeleteStudent = (studentId: string) => {
    attendanceEngine.deleteStudent(studentId);
    setStudents(attendanceEngine.getStudents());
    soundService.playClick();
  };

  // Batch Import Students
  const handleImportStudents = (newStudentsList: Student[]) => {
    attendanceEngine.saveStudentsList(newStudentsList);
    setStudents(attendanceEngine.getStudents());
    soundService.playSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* App Header (Minimal, Operational) */}
      <Header
        activeEvent={activeEvent}
        soundEnabled={soundEnabled}
        onToggleSound={(enabled) => setSoundEnabled(enabled)}
        onOpenScanner={() => handleNavigateTab('attendance')}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        {/* Sidebar Nav (5 Approved Operational Areas) */}
        <SidebarNav
          activeTab={activeTab}
          onTabChange={(tab) => handleNavigateTab(tab)}
          hasActiveEvent={Boolean(activeEvent)}
          activeEventTitle={activeEvent?.title}
          totalStudentsCount={students.length}
          totalRecordsCount={attendanceRecords.length}
          onOpenPWAInstall={() => setIsPWAInstallModalOpen(true)}
        />

        {/* Main Operational Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              activeEvent={activeEvent}
              events={events}
              students={students}
              attendanceRecords={attendanceRecords}
              onOpenScanner={() => handleNavigateTab('attendance')}
              onGoToEvents={() => handleNavigateTab('events')}
              onGoToStudents={() => handleNavigateTab('students')}
              onGoToReports={() => handleNavigateTab('reports')}
            />
          )}

          {(activeTab === 'attendance' || activeTab === 'scanner') && (
            <ScannerView
              activeEvent={activeEvent}
              allEvents={events}
              students={students}
              attendanceRecords={attendanceRecords}
              isAdmin={isAdmin}
              onProcessScan={handleProcessScan}
              onCloseEvent={handleCloseEvent}
              onGoToEvents={() => handleNavigateTab('events')}
              soundEnabled={soundEnabled}
              onToggleSound={(enabled) => setSoundEnabled(enabled)}
              onRequestAdminAccess={handleRequestAdminAccess}
            />
          )}

          {(activeTab === 'events' || activeTab === 'activities') && (
            <EventManagementView
              events={events}
              attendanceRecords={attendanceRecords}
              students={students}
              isAdmin={isAdmin}
              onActivateEvent={handleActivateEvent}
              onCloseEvent={handleCloseEvent}
              onCreateEvent={handleCreateEvent}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
              onOpenScannerForEvent={(eventId) => {
                handleActivateEvent(eventId);
                handleNavigateTab('attendance');
              }}
              onRequestAdminAccess={handleRequestAdminAccess}
              onViewReportForEvent={(eventId) => {
                setSelectedReportEventId(eventId);
                handleNavigateTab('reports');
              }}
            />
          )}

          {activeTab === 'students' && (
            <StaffDirectoryView
              students={students}
              sessions={attendanceEngine.getSessions()}
              activities={attendanceEngine.getActivities()}
              attendanceRecords={attendanceRecords}
              isAdmin={isAdmin}
              onAddStudent={handleAddStudent}
              onDeleteStudent={handleDeleteStudent}
              onOpenCSVImport={() => setIsCSVModalOpen(true)}
              onRequestAdminAccess={handleRequestAdminAccess}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              events={events}
              students={students}
              sessions={attendanceEngine.getSessions()}
              activities={attendanceEngine.getActivities()}
              attendanceRecords={attendanceRecords}
              initialSelectedEventId={selectedReportEventId}
            />
          )}

          {activeTab === 'qr' && (
            <StudentQRPortalView
              students={students}
              sessions={attendanceEngine.getSessions()}
              activities={attendanceEngine.getActivities()}
              attendanceRecords={attendanceRecords}
              onUpdateStudent={handleUpdateStudent}
            />
          )}
        </main>
      </div>

      {/* Admin PIN Verification Modal */}
      <AdminPinModal
        isOpen={isAdminPinModalOpen}
        onClose={() => setIsAdminPinModalOpen(false)}
        onSuccess={() => {
          setIsAdmin(true);
          soundService.playSuccess();
        }}
        actionTitle={adminActionTitle}
      />

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        currentStudents={students}
        onImportSuccess={handleImportStudents}
      />

      {/* PWA Install Modal */}
      <PWAInstallModal
        isOpen={isPWAInstallModalOpen}
        onClose={() => setIsPWAInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
      />
    </div>
  );
}
