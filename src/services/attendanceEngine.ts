import {
  Student,
  Event,
  EventStatus,
  AttendanceActivity,
  AttendanceSession,
  AttendanceRecord,
  ScanResult,
  AttendanceMethod
} from '../types';
import {
  INITIAL_STUDENTS,
  INITIAL_EVENTS,
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
  EVENTS: 'studentattend_events_v3',
  STUDENTS: 'studentattend_students_v2',
  ACTIVITIES: 'studentattend_activities_v2',
  SESSIONS: 'studentattend_sessions_v2',
  RECORDS: 'studentattend_records_v3',
  INITIALIZED: 'studentattend_initialized_v3'
};

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch {
      // In-memory or restricted environment
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {
      // In-memory or restricted environment
    }
  }
};

class AttendanceEngine {
  private events: Event[] = [];
  private students: Student[] = [];
  private attendanceRecords: AttendanceRecord[] = [];

  // Legacy collections preserved for non-destructive backwards compatibility
  private activities: AttendanceActivity[] = [];
  private sessions: AttendanceSession[] = [];

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // 1. Try local storage first for instant startup
    const isInitialized = safeStorage.getItem(STORAGE_KEYS.INITIALIZED);

    if (isInitialized) {
      try {
        const storedEvents = safeStorage.getItem(STORAGE_KEYS.EVENTS);
        const storedStudents = safeStorage.getItem(STORAGE_KEYS.STUDENTS);
        const storedActivities = safeStorage.getItem(STORAGE_KEYS.ACTIVITIES);
        const storedSessions = safeStorage.getItem(STORAGE_KEYS.SESSIONS);
        const storedRecords = safeStorage.getItem(STORAGE_KEYS.RECORDS);

        const loadedStudents: Student[] = storedStudents ? JSON.parse(storedStudents) : INITIAL_STUDENTS;
        this.students = loadedStudents.map((st) => {
          if (!st.name || st.name.trim().toUpperCase() === st.className?.trim().toUpperCase()) {
            return { ...st, name: st.studentId || st.name || 'PELAJAR' };
          }
          return st;
        });

        this.events = storedEvents ? JSON.parse(storedEvents) : [...INITIAL_EVENTS];
        this.activities = storedActivities ? JSON.parse(storedActivities) : [...INITIAL_ACTIVITIES];
        this.sessions = storedSessions ? JSON.parse(storedSessions) : [...INITIAL_SESSIONS];
        this.attendanceRecords = storedRecords ? JSON.parse(storedRecords) : [...INITIAL_ATTENDANCE_RECORDS];

        // Ensure legacy sessions and events stay bidirectionally synchronized
        this.syncEventsAndSessions();
      } catch (e) {
        console.warn('Error reading from localStorage, resetting to initial dataset', e);
        this.resetToDefaultData();
      }
    } else {
      this.resetToDefaultData();
    }
  }

  public resetToDefaultData() {
    this.events = [...INITIAL_EVENTS];
    this.students = [...INITIAL_STUDENTS];
    this.activities = [...INITIAL_ACTIVITIES];
    this.sessions = [...INITIAL_SESSIONS];
    this.attendanceRecords = [...INITIAL_ATTENDANCE_RECORDS];

    this.syncEventsAndSessions();

    this.saveEventsLocally();
    this.saveStudentsLocally();
    this.saveActivitiesLocally();
    this.saveSessionsLocally();
    this.saveRecordsLocally();
    safeStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

    if (db) {
      this.syncInitialToFirestore();
    }
  }

  /**
   * Bridges Events and legacy Sessions bidirectionally so neither legacy UI
   * nor new unified components fail during Phase 1.
   */
  private syncEventsAndSessions() {
    // Map any missing event into sessions
    this.events.forEach((event) => {
      const existingSessionIndex = this.sessions.findIndex((s) => s.id === event.id);
      const sessionEquivalent: AttendanceSession = {
        id: event.id,
        activityId: event.id,
        activityName: event.title,
        sessionName: event.title,
        date: event.date || (event.createdAt ? event.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
        startTime: event.startTime || (event.activatedAt ? event.activatedAt.substring(11, 16) : '08:00'),
        endTime: event.endTime || (event.closedAt ? event.closedAt.substring(11, 16) : '17:00'),
        status: event.status === 'ACTIVE' ? 'OPEN' : event.status === 'COMPLETED' ? 'CLOSED' : (event.status as EventStatus),
        attendanceMethod: 'QR',
        location: event.location,
        organizer: event.organizer,
        className: event.targetClasses && event.targetClasses.length > 0 ? event.targetClasses.join(', ') : undefined,
        createdAt: event.createdAt
      };

      if (existingSessionIndex >= 0) {
        this.sessions[existingSessionIndex] = {
          ...this.sessions[existingSessionIndex],
          sessionName: event.title,
          status: sessionEquivalent.status,
          location: event.location || this.sessions[existingSessionIndex].location,
          organizer: event.organizer || this.sessions[existingSessionIndex].organizer
        };
      } else {
        this.sessions.push(sessionEquivalent);
      }
    });

    // Ensure attendance records have eventId set
    this.attendanceRecords = this.attendanceRecords.map((r) => {
      const eventId = r.eventId || r.sessionId;
      const scannedAt = r.scannedAt || r.timestamp || new Date().toISOString();
      return {
        ...r,
        eventId,
        scannedAt,
        timestamp: scannedAt
      };
    });
  }

  private async syncInitialToFirestore() {
    if (!db) return;
    try {
      // Sync events
      for (const event of this.events) {
        await setDoc(doc(db, 'events', event.id), sanitizeForFirestore(event), { merge: true });
      }
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

  // =========================================================================
  // --- REAL-TIME SUBSCRIPTIONS ---
  // =========================================================================

  public subscribeEvents(callback: (events: Event[]) => void): () => void {
    if (!db) {
      callback(this.events);
      return () => {};
    }

    try {
      const q = collection(db, 'events');
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const data = snapshot.docs.map((docSnap) => docSnap.data() as Event);
            this.events = data;
            this.syncEventsAndSessions();
            this.saveEventsLocally();
            this.saveSessionsLocally();
            callback(this.events);
          } else {
            callback(this.events);
          }
        },
        (error) => {
          console.warn('Firestore events sync error, using local data:', error);
          callback(this.events);
        }
      );
      return unsubscribe;
    } catch (e) {
      callback(this.events);
      return () => {};
    }
  }

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
            this.students = data.map((st) => {
              if (!st.name || st.name.trim().toUpperCase() === st.className?.trim().toUpperCase()) {
                return { ...st, name: st.studentId || st.name || 'PELAJAR' };
              }
              return st;
            });
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

  // =========================================================================
  // --- LOCAL PERSISTENCE HELPERS ---
  // =========================================================================

  private saveEventsLocally() {
    safeStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(this.events));
  }

  private saveStudentsLocally() {
    safeStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(this.students));
  }

  private saveActivitiesLocally() {
    safeStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(this.activities));
  }

  private saveSessionsLocally() {
    safeStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(this.sessions));
  }

  private saveRecordsLocally() {
    safeStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(this.attendanceRecords));
  }

  // =========================================================================
  // --- UNIFIED EVENT METHODS (PHASE 1 CORE) ---
  // =========================================================================

  public getEvents(): Event[] {
    return [...this.events];
  }

  public getEventById(eventId: string): Event | undefined {
    return this.events.find((e) => e.id === eventId);
  }

  /**
   * Returns the single currently active attendance event
   */
  public getActiveEvent(): Event | null {
    return this.events.find((e) => e.status === 'ACTIVE' || e.status === 'OPEN') || null;
  }

  /**
   * Sediakan Acara (Admin defines WHAT, System records WHEN)
   * No manual start/end times required!
   */
  public createEvent(
    eventData: Omit<Event, 'id' | 'createdAt' | 'status'> & Partial<Event>
  ): Event {
    const id =
      eventData.id ||
      `EVT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;

    const newEvent: Event = {
      id,
      title: eventData.title.trim(),
      type: eventData.type || 'ASSEMBLY',
      rosterType: eventData.rosterType || 'ALL',
      targetClasses: eventData.targetClasses || [],
      location: eventData.location?.trim() || undefined,
      organizer: eventData.organizer?.trim() || undefined,
      description: eventData.description?.trim() || undefined,
      status: eventData.status || 'DRAFT',
      createdAt: eventData.createdAt || new Date().toISOString(),
      createdById: eventData.createdById
    };

    this.events = [newEvent, ...this.events.filter((e) => e.id !== newEvent.id)];
    this.syncEventsAndSessions();
    this.saveEventsLocally();
    this.saveSessionsLocally();

    if (db) {
      setDoc(doc(db, 'events', newEvent.id), sanitizeForFirestore(newEvent), { merge: true }).catch((err) => {
        console.warn(`Error writing event ${newEvent.id} to Firestore:`, err);
      });
    }

    return newEvent;
  }

  public updateEvent(updatedEvent: Event): Event[] {
    this.events = this.events.map((e) => (e.id === updatedEvent.id ? updatedEvent : e));
    this.syncEventsAndSessions();
    this.saveEventsLocally();
    this.saveSessionsLocally();

    if (db) {
      setDoc(doc(db, 'events', updatedEvent.id), sanitizeForFirestore(updatedEvent), { merge: true }).catch((err) => {
        console.warn(`Error updating event ${updatedEvent.id} in Firestore:`, err);
      });
    }

    return [...this.events];
  }

  public deleteEvent(eventId: string): Event[] {
    this.events = this.events.filter((e) => e.id !== eventId);
    this.sessions = this.sessions.filter((s) => s.id !== eventId && s.activityId !== eventId);
    this.attendanceRecords = this.attendanceRecords.filter((r) => r.eventId !== eventId && r.sessionId !== eventId);

    this.saveEventsLocally();
    this.saveSessionsLocally();
    this.saveRecordsLocally();

    if (db) {
      deleteDoc(doc(db, 'events', eventId)).catch((err) => {
        console.warn(`Error deleting event ${eventId} from Firestore:`, err);
      });
      deleteDoc(doc(db, 'sessions', eventId)).catch(() => {});
    }

    return [...this.events];
  }

  /**
   * AKTIFKAN KEHADIRAN
   * Authoritative activation: System records activatedAt timestamp automatically.
   * Closes any previous active attendance so only 1 event is actively accepting scans.
   */
  public activateEvent(eventId: string): Event[] {
    const target = this.events.find((e) => e.id === eventId);
    if (!target) return [...this.events];

    // INVARIANT GUARD: COMPLETED and ARCHIVED events cannot be re-activated
    if (target.status === 'COMPLETED' || target.status === 'ARCHIVED') {
      console.warn(
        `[SES 4.5] Cannot activate event ${eventId}: status is ${target.status}. Closed events are immutable.`
      );
      return [...this.events];
    }

    const now = new Date().toISOString();
    const previouslyActiveEvents: Event[] = [];

    this.events = this.events.map((e) => {
      if (e.id === eventId) {
        return {
          ...e,
          status: 'ACTIVE',
          activatedAt: e.activatedAt || now
        };
      }
      // If another event was active, transition it to COMPLETED
      if (e.status === 'ACTIVE' || e.status === 'OPEN') {
        const completedEvt: Event = {
          ...e,
          status: 'COMPLETED',
          closedAt: e.closedAt || now
        };
        previouslyActiveEvents.push(completedEvt);
        return completedEvt;
      }
      return e;
    });

    this.syncEventsAndSessions();
    this.saveEventsLocally();
    this.saveSessionsLocally();

    if (db) {
      const activeEvt = this.events.find((e) => e.id === eventId);
      if (activeEvt) {
        setDoc(doc(db, 'events', activeEvt.id), sanitizeForFirestore(activeEvt), { merge: true }).catch((err) => {
          console.warn('Error activating event in Firestore:', err);
        });
      }
      // Also persist any auto-completed events to Firestore for multi-client consistency
      previouslyActiveEvents.forEach((closedEvt) => {
        setDoc(doc(db, 'events', closedEvt.id), sanitizeForFirestore(closedEvt), { merge: true }).catch(() => {});
      });
    }

    return [...this.events];
  }

  /**
   * TAMATKAN KEHADIRAN
   * Authoritative closure: System records closedAt timestamp automatically.
   * Locks the event into COMPLETED state.
   */
  public closeEvent(eventId: string): Event[] {
    const target = this.events.find((e) => e.id === eventId);
    if (!target || target.status === 'COMPLETED' || target.status === 'ARCHIVED') {
      return [...this.events];
    }

    const now = new Date().toISOString();

    this.events = this.events.map((e) => {
      if (e.id === eventId) {
        return {
          ...e,
          status: 'COMPLETED',
          closedAt: e.closedAt || now
        };
      }
      return e;
    });

    this.syncEventsAndSessions();
    this.saveEventsLocally();
    this.saveSessionsLocally();

    if (db) {
      const closedEvt = this.events.find((e) => e.id === eventId);
      if (closedEvt) {
        setDoc(doc(db, 'events', closedEvt.id), sanitizeForFirestore(closedEvt), { merge: true }).catch((err) => {
          console.warn('Error closing event in Firestore:', err);
        });
      }
    }

    return [...this.events];
  }

  // =========================================================================
  // --- CORE ATTENDANCE RECORDING & DUPLICATE PREVENTION ---
  // =========================================================================

  /**
   * Records attendance directly against an Event.
   * Guarantees:
   * 1. Event must be ACTIVE (otherwise rejected with EVENT_NOT_ACTIVE)
   * 2. Student must exist in Master Directory (otherwise STUDENT_NOT_FOUND)
   * 3. Roster eligibility check if restricted by class set (otherwise NOT_ELIGIBLE)
   * 4. Enforces Idempotent Duplicate Prevention at Service Layer (ALREADY_RECORDED)
   * 5. Automatically updates firstScanAt, lastScanAt on the Event
   * 6. Generates authoritative scannedAt timestamp
   */
  public recordAttendance(
    eventId: string,
    studentId: string,
    method: AttendanceMethod = 'CAMERA_SCAN',
    scannerDeviceId?: string,
    operatorId?: string
  ): ScanResult {
    const now = new Date().toISOString();

    // 1. Verify Event Exists
    const event = this.events.find((e) => e.id === eventId);
    if (!event) {
      return {
        success: false,
        code: 'NO_ACTIVE_EVENT',
        message: 'Acara tidak ditemui dalam sistem.',
        timestamp: now
      };
    }

    // 2. Verify Event is ACTIVE
    if (event.status !== 'ACTIVE' && event.status !== 'OPEN') {
      return {
        success: false,
        code: 'EVENT_NOT_ACTIVE',
        message: `Acara "${event.title}" tidak aktif untuk penerimaan kehadiran (Status: ${event.status}).`,
        timestamp: now,
        event
      };
    }

    // 3. Find Student in Master Data
    const student = this.getStudentById(studentId);
    if (!student) {
      return {
        success: false,
        code: 'STUDENT_NOT_FOUND',
        message: `Pelajar dengan No. ID [${studentId}] tiada dalam direktori pelajar.`,
        timestamp: now,
        event
      };
    }

    // 4. Validate Roster Eligibility (if event restricted by class set)
    if (
      event.rosterType === 'CLASS_SET' &&
      event.targetClasses &&
      event.targetClasses.length > 0 &&
      !event.targetClasses.includes(student.className)
    ) {
      return {
        success: false,
        code: 'NOT_ELIGIBLE',
        message: `Pelajar ${student.name} (${student.className}) bukan peserta berdaftar untuk acara ini (Sasaran: ${event.targetClasses.join(', ')}).`,
        timestamp: now,
        student,
        event
      };
    }

    // 5. Enforce Idempotency / Duplicate Prevention at Service Layer
    const isAlreadyRecorded = this.attendanceRecords.some(
      (r) =>
        (r.eventId === event.id || r.sessionId === event.id) &&
        r.studentId === student.id &&
        r.status === 'PRESENT'
    );

    if (isAlreadyRecorded) {
      const existingRecord = this.attendanceRecords.find(
        (r) =>
          (r.eventId === event.id || r.sessionId === event.id) &&
          r.studentId === student.id
      );
      return {
        success: false,
        code: 'ALREADY_RECORDED',
        isDuplicate: true,
        message: `Kehadiran ${student.name} (${student.className}) telah direkodkan sebelum ini.`,
        student,
        event,
        timestamp: now,
        record: existingRecord
      };
    }

    // 6. Update Event Operational Timeline
    if (!event.firstScanAt) {
      event.firstScanAt = now;
    }
    event.lastScanAt = now;
    this.saveEventsLocally();

    if (db) {
      setDoc(doc(db, 'events', event.id), sanitizeForFirestore(event), { merge: true }).catch(() => {});
    }

    // 7. Create Authoritative Attendance Record
    const recordId = `REC-${event.id}-${student.id}`;
    const newRecord: AttendanceRecord = {
      id: recordId,
      eventId: event.id,
      sessionId: event.id, // compatibility
      studentId: student.id,
      studentName: student.name,
      className: student.className,
      scannedAt: now,
      timestamp: now, // compatibility
      status: 'PRESENT',
      method: method,
      scannerDeviceId,
      operatorId
    };

    this.attendanceRecords = [newRecord, ...this.attendanceRecords.filter((r) => r.id !== newRecord.id)];
    this.saveRecordsLocally();

    if (db) {
      setDoc(doc(db, 'attendance_records', newRecord.id), sanitizeForFirestore(newRecord), { merge: true }).catch((err) => {
        console.warn(`[Firestore Error] Failed to write attendance record ${newRecord.id}:`, err);
      });
    }

    return {
      success: true,
      code: 'RECORDED',
      message: `Kehadiran berjaya direkodkan: ${student.name} (${student.className})`,
      student,
      event,
      timestamp: now,
      record: newRecord
    };
  }

  /**
   * Process raw QR scan string and route to recordAttendance
   */
  public processScan(
    qrString: string,
    method: AttendanceMethod = 'CAMERA_SCAN',
    targetEventOrSessionId?: string
  ): ScanResult {
    const now = new Date().toISOString();

    // 1. Identify Target Event
    let activeEvent: Event | null = null;
    if (targetEventOrSessionId) {
      activeEvent = this.events.find((e) => e.id === targetEventOrSessionId) || null;
      if (!activeEvent) {
        // Check if legacy session was passed
        const matchedSession = this.sessions.find((s) => s.id === targetEventOrSessionId);
        if (matchedSession) {
          activeEvent = this.events.find((e) => e.id === matchedSession.id) || null;
        }
      }
    } else {
      activeEvent = this.getActiveEvent();
    }

    if (!activeEvent) {
      return {
        success: false,
        code: 'NO_ACTIVE_EVENT',
        message: 'Tiada acara aktif pada masa ini. Sila aktifkan acara terlebih dahulu.',
        timestamp: now
      };
    }

    // 2. Parse Student Identifier from QR
    const studentId = this.parseStudentQR(qrString);
    if (!studentId) {
      return {
        success: false,
        code: 'INVALID_QR',
        message: 'Format kod QR tidak sah atau tidak dikenali.',
        timestamp: now,
        event: activeEvent
      };
    }

    // 3. Delegate to recordAttendance
    const result = this.recordAttendance(activeEvent.id, studentId, method);

    // Provide legacy session compatibility if required by consumers
    const legacySession = this.sessions.find((s) => s.id === activeEvent!.id);
    const legacyActivity = this.activities.find((a) => a.id === activeEvent!.id);

    return {
      ...result,
      session: legacySession,
      activity: legacyActivity
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

  // =========================================================================
  // --- STUDENT DIRECTORY METHODS ---
  // =========================================================================

  public getStudents(): Student[] {
    return [...this.students];
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

  public updateStudent(updatedStudent: Student) {
    this.students = this.students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
    this.saveStudentsLocally();

    if (db) {
      setDoc(doc(db, 'students', updatedStudent.id), sanitizeForFirestore(updatedStudent), { merge: true }).catch((err) => {
        console.warn(`Error updating student ${updatedStudent.id} in Firestore:`, err);
      });
    }
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

  // =========================================================================
  // --- ATTENDANCE RECORDS QUERY METHODS ---
  // =========================================================================

  public getAttendanceRecords(): AttendanceRecord[] {
    return [...this.attendanceRecords];
  }

  public getEventAttendanceSummary(eventId: string) {
    const event = this.events.find((e) => e.id === eventId);
    if (!event) return null;

    const eventRecords = this.attendanceRecords.filter((r) => r.eventId === eventId || r.sessionId === eventId);
    const presentStudentIds = new Set(eventRecords.filter((r) => r.status === 'PRESENT').map((r) => r.studentId));

    // Determine target roster students
    let targetStudents = this.students;
    if (event.rosterType === 'CLASS_SET' && event.targetClasses && event.targetClasses.length > 0) {
      targetStudents = this.students.filter((s) => event.targetClasses!.includes(s.className));
    }

    const totalStudents = targetStudents.length;
    const presentCount = targetStudents.filter((s) => presentStudentIds.has(s.id)).length;
    const absentCount = Math.max(0, totalStudents - presentCount);
    const percentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

    return {
      event,
      totalStudents,
      presentCount,
      absentCount,
      percentage,
      records: eventRecords
    };
  }

  // =========================================================================
  // --- BACKWARDS COMPATIBILITY WRAPPERS (LEGACY SUPPORT) ---
  // =========================================================================

  public getActivities(): AttendanceActivity[] {
    return [...this.activities];
  }

  public getSessions(): AttendanceSession[] {
    return [...this.sessions];
  }

  public getActiveSession(): AttendanceSession | null {
    const activeEvt = this.getActiveEvent();
    if (activeEvt) {
      return this.sessions.find((s) => s.id === activeEvt.id) || {
        id: activeEvt.id,
        activityId: activeEvt.id,
        sessionName: activeEvt.title,
        date: activeEvt.createdAt.split('T')[0],
        startTime: activeEvt.activatedAt ? activeEvt.activatedAt.substring(11, 16) : '08:00',
        endTime: activeEvt.closedAt ? activeEvt.closedAt.substring(11, 16) : '17:00',
        status: 'OPEN',
        attendanceMethod: 'QR',
        location: activeEvt.location,
        organizer: activeEvt.organizer,
        createdAt: activeEvt.createdAt
      };
    }
    return this.sessions.find((s) => s.status === 'OPEN') || null;
  }

  public saveActivities(activities: AttendanceActivity[]) {
    this.activities = activities;
    this.saveActivitiesLocally();
  }

  public addActivity(activity: AttendanceActivity) {
    const updated = [activity, ...this.activities.filter((a) => a.id !== activity.id)];
    this.saveActivities(updated);
  }

  public updateActivity(updatedActivity: AttendanceActivity): AttendanceActivity[] {
    this.activities = this.activities.map((a) => (a.id === updatedActivity.id ? updatedActivity : a));
    this.saveActivitiesLocally();
    return [...this.activities];
  }

  public deleteActivity(activityId: string): AttendanceActivity[] {
    this.activities = this.activities.filter((a) => a.id !== activityId);
    this.saveActivitiesLocally();
    this.deleteEvent(activityId);
    return this.activities;
  }

  public saveSessions(sessions: AttendanceSession[]) {
    this.sessions = sessions;
    this.saveSessionsLocally();
  }

  public addSession(session: AttendanceSession) {
    let updated = [...this.sessions];
    if (session.status === 'OPEN') {
      updated = updated.map((s) => ({
        ...s,
        status: s.id === session.id ? 'OPEN' : s.status === 'OPEN' ? 'CLOSED' : s.status
      } as AttendanceSession));
    }

    const index = updated.findIndex((s) => s.id === session.id);
    if (index >= 0) {
      updated[index] = session;
    } else {
      updated = [session, ...updated];
    }

    this.saveSessions(updated);

    // Also mirror into Events
    this.createEvent({
      id: session.id,
      title: session.sessionName,
      type: 'ASSEMBLY',
      rosterType: session.className ? 'CLASS_SET' : 'ALL',
      targetClasses: session.className ? [session.className] : [],
      location: session.location,
      organizer: session.organizer,
      status: session.status === 'OPEN' ? 'ACTIVE' : 'DRAFT'
    });

    return updated;
  }

  public updateSession(updatedSession: AttendanceSession): AttendanceSession[] {
    this.sessions = this.sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s));
    this.saveSessionsLocally();

    // Mirror to event
    const evt = this.getEventById(updatedSession.id);
    if (evt) {
      this.updateEvent({
        ...evt,
        title: updatedSession.sessionName,
        location: updatedSession.location || evt.location,
        organizer: updatedSession.organizer || evt.organizer
      });
    }

    return [...this.sessions];
  }

  public deleteSession(sessionId: string): AttendanceSession[] {
    this.sessions = this.sessions.filter((s) => s.id !== sessionId);
    this.saveSessionsLocally();
    this.deleteEvent(sessionId);
    return this.sessions;
  }

  public setSessionStatus(sessionId: string, newStatus: EventStatus): AttendanceSession[] {
    if (newStatus === 'OPEN') {
      this.activateEvent(sessionId);
    } else if (newStatus === 'CLOSED') {
      this.closeEvent(sessionId);
    }

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

  public getSessionAttendanceSummary(sessionId: string) {
    const summary = this.getEventAttendanceSummary(sessionId);
    if (summary) {
      const session = this.sessions.find((s) => s.id === sessionId);
      const activity = this.activities.find((a) => a.id === session?.activityId);
      return {
        ...summary,
        session: session || {
          id: summary.event.id,
          sessionName: summary.event.title,
          activityId: summary.event.id,
          date: summary.event.createdAt.split('T')[0],
          startTime: summary.event.activatedAt ? summary.event.activatedAt.substring(11, 16) : '08:00',
          endTime: summary.event.closedAt ? summary.event.closedAt.substring(11, 16) : '17:00',
          status: summary.event.status === 'ACTIVE' ? 'OPEN' : 'CLOSED',
          attendanceMethod: 'QR'
        } as AttendanceSession,
        activity
      };
    }
    return null;
  }

  public getStudentOverallSummary(studentId: string) {
    const student = this.getStudentById(studentId);
    if (!student) return null;

    const applicableEvents = this.events.filter((e) => {
      if (e.status === 'ARCHIVED' || e.status === 'DRAFT') return false;
      if (e.rosterType === 'CLASS_SET' && e.targetClasses && e.targetClasses.length > 0) {
        return e.targetClasses.includes(student.className);
      }
      return true;
    });

    const totalEvents = applicableEvents.length;
    const studentRecords = this.attendanceRecords.filter(
      (r) => r.studentId === student.id && r.status === 'PRESENT'
    );
    const presentCount = studentRecords.length;
    const absentCount = Math.max(0, totalEvents - presentCount);
    const percentage = totalEvents > 0 ? Math.round((presentCount / totalEvents) * 100) : 0;

    return {
      student,
      totalSessions: totalEvents,
      presentCount,
      absentCount,
      percentage,
      categoryBreakdown: {},
      recentRecords: []
    };
  }

  // Legacy staff & events aliases
  public subscribeStaff(callback: (staff: Student[]) => void) {
    return this.subscribeStudents(callback);
  }
  public getStaffList() {
    return this.getStudents();
  }
  public saveStaffList(staff: Student[]) {
    this.saveStudentsList(staff);
  }
  public deleteStaff(staffId: string) {
    this.deleteStudent(staffId);
  }
}

export const attendanceEngine = new AttendanceEngine();
