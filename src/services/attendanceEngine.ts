import {
  Student,
  AttendanceActivity,
  AttendanceSession,
  AttendanceRecord,
  EventStatus,
  ScanResult,
  AttendanceMethod,
  ActivityCategory
} from '../types';
import {
  INITIAL_STUDENTS,
  INITIAL_ACTIVITIES,
  INITIAL_SESSIONS,
  INITIAL_ATTENDANCE_RECORDS
} from '../data/mockData';
import { db, sanitizeForFirestore } from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

const STORAGE_KEYS = {
  STUDENTS: 'studentattend_students_v2',
  ACTIVITIES: 'studentattend_activities_v2',
  SESSIONS: 'studentattend_sessions_v2',
  RECORDS: 'studentattend_records_v2',
  INITIALIZED: 'studentattend_initialized_v2'
};

class AttendanceEngine {
  private students: Student[] = [];
  private activities: AttendanceActivity[] = [];
  private sessions: AttendanceSession[] = [];
  private attendanceRecords: AttendanceRecord[] = [];

  private isFirestoreConnected: boolean = false;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // 1. Try local storage first for fast startup
    const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);

    if (isInitialized) {
      try {
        const storedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
        const storedActivities = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
        const storedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
        const storedRecords = localStorage.getItem(STORAGE_KEYS.RECORDS);

        this.students = storedStudents ? JSON.parse(storedStudents) : INITIAL_STUDENTS;
        this.activities = storedActivities ? JSON.parse(storedActivities) : INITIAL_ACTIVITIES;
        this.sessions = storedSessions ? JSON.parse(storedSessions) : INITIAL_SESSIONS;
        this.attendanceRecords = storedRecords ? JSON.parse(storedRecords) : INITIAL_ATTENDANCE_RECORDS;
      } catch (e) {
        console.warn('Error reading from localStorage, resetting to initial dataset', e);
        this.resetToDefaultData();
      }
    } else {
      this.resetToDefaultData();
    }

    if (db) {
      this.isFirestoreConnected = true;
    }
  }

  public resetToDefaultData() {
    this.students = [...INITIAL_STUDENTS];
    this.activities = [...INITIAL_ACTIVITIES];
    this.sessions = [...INITIAL_SESSIONS];
    this.attendanceRecords = [...INITIAL_ATTENDANCE_RECORDS];

    this.saveStudentsLocally();
    this.saveActivitiesLocally();
    this.saveSessionsLocally();
    this.saveRecordsLocally();
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

    // Optionally sync initial data to Firestore if available
    if (db) {
      this.syncInitialToFirestore();
    }
  }

  private async syncInitialToFirestore() {
    if (!db) return;
    try {
      // Sync students
      for (const student of this.students) {
        await setDoc(doc(db, 'students', student.id), sanitizeForFirestore(student), { merge: true });
      }
      // Sync activities
      for (const activity of this.activities) {
        await setDoc(doc(db, 'activities', activity.id), sanitizeForFirestore(activity), { merge: true });
      }
      // Sync sessions
      for (const session of this.sessions) {
        await setDoc(doc(db, 'sessions', session.id), sanitizeForFirestore(session), { merge: true });
      }
      // Sync records
      for (const rec of this.attendanceRecords) {
        await setDoc(doc(db, 'attendance_records', rec.id), sanitizeForFirestore(rec), { merge: true });
      }
    } catch (e) {
      console.warn('Firestore initial sync error (fallback to local state):', e);
    }
  }

  // --- Subscriptions ---
  public subscribeStudents(callback: (students: Student[]) => void): () => void {
    if (!db) {
      callback(this.students);
      return () => {};
    }

    try {
      const q = collection(db, 'students');
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const data = snapshot.docs.map((docSnap) => docSnap.data() as Student);
            this.students = data;
            this.saveStudentsLocally();
            callback(this.students);
          } else {
            callback(this.students);
          }
        },
        (error) => {
          console.warn('Firestore students sync error, using local data:', error);
          callback(this.students);
        }
      );
      return unsubscribe;
    } catch (e) {
      callback(this.students);
      return () => {};
    }
  }

  public subscribeActivities(callback: (activities: AttendanceActivity[]) => void): () => void {
    if (!db) {
      callback(this.activities);
      return () => {};
    }

    try {
      const q = collection(db, 'activities');
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const data = snapshot.docs.map((docSnap) => docSnap.data() as AttendanceActivity);
            this.activities = data;
            this.saveActivitiesLocally();
            callback(this.activities);
          } else {
            callback(this.activities);
          }
        },
        (error) => {
          console.warn('Firestore activities sync error, using local data:', error);
          callback(this.activities);
        }
      );
      return unsubscribe;
    } catch (e) {
      callback(this.activities);
      return () => {};
    }
  }

  public subscribeSessions(callback: (sessions: AttendanceSession[]) => void): () => void {
    if (!db) {
      callback(this.sessions);
      return () => {};
    }

    try {
      const q = collection(db, 'sessions');
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const data = snapshot.docs.map((docSnap) => docSnap.data() as AttendanceSession);
            this.sessions = data;
            this.saveSessionsLocally();
            callback(this.sessions);
          } else {
            callback(this.sessions);
          }
        },
        (error) => {
          console.warn('Firestore sessions sync error, using local data:', error);
          callback(this.sessions);
        }
      );
      return unsubscribe;
    } catch (e) {
      callback(this.sessions);
      return () => {};
    }
  }

  public subscribeRecords(callback: (records: AttendanceRecord[]) => void): () => void {
    if (!db) {
      callback(this.attendanceRecords);
      return () => {};
    }

    try {
      const q = collection(db, 'attendance_records');
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const data = snapshot.docs.map((docSnap) => docSnap.data() as AttendanceRecord);
            this.attendanceRecords = data;
            this.saveRecordsLocally();
            callback(this.attendanceRecords);
          } else {
            callback(this.attendanceRecords);
          }
        },
        (error) => {
          console.warn('Firestore records sync error, using local data:', error);
          callback(this.attendanceRecords);
        }
      );
      return unsubscribe;
    } catch (e) {
      callback(this.attendanceRecords);
      return () => {};
    }
  }

  // --- Local Persistence Helpers ---
  private saveStudentsLocally() {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(this.students));
  }

  private saveActivitiesLocally() {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(this.activities));
  }

  private saveSessionsLocally() {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(this.sessions));
  }

  private saveRecordsLocally() {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(this.attendanceRecords));
  }

  // --- Getters ---
  public getStudents(): Student[] {
    return [...this.students];
  }

  public getActivities(): AttendanceActivity[] {
    return [...this.activities];
  }

  public getSessions(): AttendanceSession[] {
    return [...this.sessions];
  }

  public getAttendanceRecords(): AttendanceRecord[] {
    return [...this.attendanceRecords];
  }

  public getActiveSession(): AttendanceSession | null {
    return this.sessions.find((s) => s.status === 'OPEN') || null;
  }

  public getStudentById(studentId: string): Student | undefined {
    const cleanId = studentId.trim().toUpperCase();
    return this.students.find(
      (s) =>
        s.id.toUpperCase() === cleanId ||
        s.studentId.toUpperCase() === cleanId ||
        s.phone.includes(cleanId) ||
        s.email.toUpperCase() === cleanId
    );
  }

  // --- Mutation Methods ---
  public saveStudentsList(students: Student[]) {
    this.students = students;
    this.saveStudentsLocally();

    if (db) {
      students.forEach((student) => {
        setDoc(doc(db, 'students', student.id), sanitizeForFirestore(student), { merge: true }).catch((err) => {
          console.warn(`Error saving student ${student.id} to Firestore:`, err);
        });
      });
    }
  }

  public addStudent(student: Student) {
    const updated = [student, ...this.students.filter((s) => s.id !== student.id)];
    this.saveStudentsList(updated);
  }

  public deleteStudent(studentId: string) {
    this.students = this.students.filter((s) => s.id !== studentId);
    this.saveStudentsLocally();

    if (db) {
      deleteDoc(doc(db, 'students', studentId)).catch((err) => {
        console.warn(`Error deleting student ${studentId} from Firestore:`, err);
      });
    }
  }

  public saveActivities(activities: AttendanceActivity[]) {
    this.activities = activities;
    this.saveActivitiesLocally();

    if (db) {
      activities.forEach((activity) => {
        setDoc(doc(db, 'activities', activity.id), sanitizeForFirestore(activity), { merge: true }).catch((err) => {
          console.warn(`Error saving activity ${activity.id} to Firestore:`, err);
        });
      });
    }
  }

  public addActivity(activity: AttendanceActivity) {
    const updated = [activity, ...this.activities.filter((a) => a.id !== activity.id)];
    this.saveActivities(updated);
  }

  public saveSessions(sessions: AttendanceSession[]) {
    this.sessions = sessions;
    this.saveSessionsLocally();

    if (db) {
      sessions.forEach((session) => {
        setDoc(doc(db, 'sessions', session.id), sanitizeForFirestore(session), { merge: true }).catch((err) => {
          console.warn(`Error saving session ${session.id} to Firestore:`, err);
        });
      });
    }
  }

  public addSession(session: AttendanceSession) {
    // If new session is OPEN, automatically close other open sessions
    let updated = [...this.sessions];
    if (session.status === 'OPEN') {
      updated = updated.map((s) => ({
        ...s,
        status: s.id === session.id ? 'OPEN' : s.status === 'OPEN' ? 'CLOSED' : s.status
      } as AttendanceSession));
    }
    
    // Add or replace
    const index = updated.findIndex((s) => s.id === session.id);
    if (index >= 0) {
      updated[index] = session;
    } else {
      updated = [session, ...updated];
    }

    this.saveSessions(updated);
    return updated;
  }

  public setSessionStatus(sessionId: string, newStatus: EventStatus): AttendanceSession[] {
    const updated = this.sessions.map((session) => {
      if (session.id === sessionId) {
        return { ...session, status: newStatus };
      }
      if (newStatus === 'OPEN' && session.status === 'OPEN') {
        return { ...session, status: 'CLOSED' as EventStatus };
      }
      return session;
    });

    this.saveSessions(updated);
    return updated;
  }

  public saveAttendanceRecords(records: AttendanceRecord[]) {
    this.attendanceRecords = records;
    this.saveRecordsLocally();

    if (db) {
      records.forEach((record) => {
        setDoc(doc(db, 'attendance_records', record.id), sanitizeForFirestore(record), { merge: true }).catch((err) => {
          console.warn(`Error saving attendance record ${record.id} to Firestore:`, err);
        });
      });
    }
  }

  // --- CORE ATTENDANCE SCANNING & VERIFICATION ENGINE ---
  public processScan(
    qrString: string,
    method: AttendanceMethod = 'CAMERA_SCAN',
    targetSessionId?: string
  ): ScanResult {
    const now = new Date().toISOString();

    // 1. Identify Target Session
    let activeSession: AttendanceSession | null = null;
    if (targetSessionId) {
      activeSession = this.sessions.find((s) => s.id === targetSessionId) || null;
    } else {
      activeSession = this.getActiveSession();
    }

    if (!activeSession) {
      return {
        success: false,
        code: 'NO_ACTIVE_EVENT',
        message: 'Tiada sesi aktiviti yang aktif atau dibuka pada masa ini.',
        timestamp: now
      };
    }

    // 2. Parse and validate student identifier from QR
    const studentId = this.parseStudentQR(qrString);
    if (!studentId) {
      return {
        success: false,
        code: 'INVALID_QR',
        message: 'Format kod QR tidak sah atau tidak dikenali.',
        timestamp: now,
        session: activeSession
      };
    }

    // 3. Find student in Master Data
    const student = this.getStudentById(studentId);
    if (!student) {
      return {
        success: false,
        code: 'STUDENT_NOT_FOUND',
        message: `Pelajar dengan No. ID [${studentId}] tiada dalam pangkalan data.`,
        timestamp: now,
        session: activeSession
      };
    }

    // Find linked activity
    const activity = this.activities.find((a) => a.id === activeSession!.activityId);

    // 4. Duplicate Check: One student per session
    const isAlreadyRecorded = this.attendanceRecords.some(
      (r) => r.sessionId === activeSession!.id && r.studentId === student.id && r.status === 'PRESENT'
    );

    if (isAlreadyRecorded) {
      const existingRecord = this.attendanceRecords.find(
        (r) => r.sessionId === activeSession!.id && r.studentId === student.id
      );
      return {
        success: false,
        code: 'ALREADY_RECORDED',
        isDuplicate: true,
        message: `Kehadiran ${student.name} telah direkodkan sebelum ini.`,
        student,
        session: activeSession,
        activity,
        timestamp: now,
        record: existingRecord
      };
    }

    // 5. Create new Attendance Record
    const newRecord: AttendanceRecord = {
      id: `REC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sessionId: activeSession.id,
      studentId: student.id,
      timestamp: now,
      status: 'PRESENT',
      method: method
    };

    const updatedRecords = [newRecord, ...this.attendanceRecords];
    this.saveAttendanceRecords(updatedRecords);

    return {
      success: true,
      code: 'RECORDED',
      message: `Kehadiran berjaya direkodkan: ${student.name}`,
      student,
      session: activeSession,
      activity,
      timestamp: now,
      record: newRecord
    };
  }

  public parseStudentQR(rawString: string): string | null {
    if (!rawString) return null;
    const clean = rawString.trim();

    // Check for STUDENT|PDA-2502-005 format
    if (clean.startsWith('STUDENT|')) {
      const parts = clean.split('|');
      return parts[1]?.trim() || null;
    }

    // Check for legacy STAFF|ST001 format
    if (clean.startsWith('STAFF|')) {
      const parts = clean.split('|');
      return parts[1]?.trim() || null;
    }

    // Check for JSON payload: { studentId: "PDA-2502-005" } or { id: "PDA-2502-005" }
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const parsed = JSON.parse(clean);
        return parsed.studentId || parsed.id || parsed.noPelajar || null;
      } catch {
        // Not valid JSON
      }
    }

    // Direct PDA-2502-XXX format check
    if (/^[A-Za-z0-9\-_]{3,20}$/.test(clean)) {
      return clean;
    }

    return clean;
  }

  // --- ANALYTICS & REPORTING COMPUTATIONS (SOURCE OF TRUTH DERIVED) ---
  public getSessionAttendanceSummary(sessionId: string) {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) return null;

    const activity = this.activities.find((a) => a.id === session.activityId);
    const sessionRecords = this.attendanceRecords.filter((r) => r.sessionId === sessionId);
    const presentStudentIds = new Set(sessionRecords.filter((r) => r.status === 'PRESENT').map((r) => r.studentId));

    // Determine target students (if session is class-specific, filter by class)
    let targetStudents = this.students;
    if (session.className) {
      targetStudents = this.students.filter((s) => s.className === session.className);
    }

    const totalStudents = targetStudents.length;
    const presentCount = targetStudents.filter((s) => presentStudentIds.has(s.id)).length;
    const absentCount = Math.max(0, totalStudents - presentCount);
    const percentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

    return {
      session,
      activity,
      totalStudents,
      presentCount,
      absentCount,
      percentage,
      records: sessionRecords
    };
  }

  public getStudentOverallSummary(studentId: string) {
    const student = this.getStudentById(studentId);
    if (!student) return null;

    // Find all closed or open sessions applicable to this student
    const applicableSessions = this.sessions.filter((session) => {
      if (session.status === 'ARCHIVED') return false;
      if (session.className && session.className !== student.className) return false;
      return true;
    });

    const totalSessions = applicableSessions.length;
    const studentRecords = this.attendanceRecords.filter((r) => r.studentId === student.id && r.status === 'PRESENT');
    const presentCount = studentRecords.length;
    const absentCount = Math.max(0, totalSessions - presentCount);
    const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

    // Breakdown by category
    const categoryBreakdown: Record<string, { total: number; present: number; percentage: number }> = {};

    applicableSessions.forEach((session) => {
      const activity = this.activities.find((a) => a.id === session.activityId);
      const cat = session.category || activity?.category || 'OTHER';
      
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { total: 0, present: 0, percentage: 0 };
      }
      categoryBreakdown[cat].total += 1;

      const attended = studentRecords.some((r) => r.sessionId === session.id);
      if (attended) {
        categoryBreakdown[cat].present += 1;
      }
    });

    Object.keys(categoryBreakdown).forEach((cat) => {
      const item = categoryBreakdown[cat];
      item.percentage = item.total > 0 ? Math.round((item.present / item.total) * 100) : 0;
    });

    // Recent records
    const recentRecords = studentRecords.slice(0, 10).map((record) => {
      const session = this.sessions.find((s) => s.id === record.sessionId)!;
      const activity = session ? this.activities.find((a) => a.id === session.activityId) : undefined;
      return { record, session, activity };
    });

    return {
      student,
      totalSessions,
      presentCount,
      absentCount,
      percentage,
      categoryBreakdown,
      recentRecords
    };
  }

  // --- Backward compatibility aliases ---
  public subscribeStaff(callback: (staff: Student[]) => void) {
    return this.subscribeStudents(callback);
  }
  public subscribeEvents(callback: (events: AttendanceSession[]) => void) {
    return this.subscribeSessions(callback);
  }
  public getStaffList() {
    return this.getStudents();
  }
  public getEvents() {
    return this.getSessions();
  }
  public saveStaffList(staff: Student[]) {
    this.saveStudentsList(staff);
  }
  public saveEvents(events: AttendanceSession[]) {
    this.saveSessions(events);
  }
  public setEventStatus(eventId: string, newStatus: EventStatus) {
    return this.setSessionStatus(eventId, newStatus);
  }
  public deleteStaff(staffId: string) {
    this.deleteStudent(staffId);
  }
}

export const attendanceEngine = new AttendanceEngine();
