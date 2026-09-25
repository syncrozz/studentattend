export type EventCategory =
  | 'ASSEMBLY'
  | 'PROGRAMME'
  | 'SEMINAR'
  | 'BRIEFING'
  | 'CEREMONY'
  | 'STUDENT_ACTIVITY'
  | 'OTHER';

export type EventStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'ARCHIVED'
  | 'OPEN'
  | 'CLOSED';

export type ActivityCategory =
  | 'CLASS'
  | 'ASSEMBLY'
  | 'OFFICIAL_PROGRAMME'
  | 'SEMINAR'
  | 'WORKSHOP'
  | 'BRIEFING'
  | 'CO_CURRICULAR'
  | 'STUDENT_PROGRAMME'
  | 'CLUB_ACTIVITY'
  | 'SPECIAL_EVENT'
  | 'OTHER';

export type ActivityStatus = 'ACTIVE' | 'ARCHIVED';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export type AttendanceMethod = 'QR' | 'MANUAL' | 'CAMERA_SCAN' | 'SIMULATOR' | 'MANUAL_OVERRIDE';

export type UserRole = 'ADMIN' | 'OPERATOR' | 'STUDENT';

export interface Student {
  id: string; // Unique student identifier (e.g. PDA-2502-005)
  studentId: string; // Normalized No_Pelajar (e.g. PDA-2502-005)
  name: string;
  className: string; // e.g. DIA_4A, DIA_4B, DIA_4C, DIA_4D
  classId?: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  department?: string; // Optional programme (e.g. Diploma Perakaunan)
}

// Backward compatibility alias if needed
export type Staff = Student;

/**
 * Unified Event Model (SES 4.5 / Phase 1 Product Architecture)
 * Core model: EVENT -> ROSTER -> ATTENDANCE
 * Admin defines WHAT. System records WHEN.
 */
export interface Event {
  id: string; // e.g. EVT-2026-001
  title: string; // e.g. "Perhimpunan Pelajar Bulan September"
  type: EventCategory;
  rosterType: 'ALL' | 'CLASS_SET' | 'CUSTOM';
  targetClasses?: string[]; // e.g. ['DIA_4A', 'DIA_4B'] (Class used strictly as participant-selection metadata)
  location?: string;
  organizer?: string;
  description?: string;
  status: EventStatus;
  
  // Authoritative system-recorded timestamps (NO manual start/end times entered by Admin)
  activatedAt?: string; // Authoritative timestamp set on AKTIFKAN KEHADIRAN
  firstScanAt?: string; // Authoritative timestamp set on first valid scan
  lastScanAt?: string;  // Authoritative timestamp updated on latest valid scan
  closedAt?: string;    // Authoritative timestamp set on TAMATKAN KEHADIRAN
  
  createdAt: string;
  createdById?: string;

  // Internal backward compatibility fields
  date?: string;
  startTime?: string;
  endTime?: string;
}

// Legacy container kept for non-destructive migration during Phase 1
export interface AttendanceActivity {
  id: string; // Unique activity ID (e.g. ACT-001)
  name: string; // e.g. "Majlis Perhimpunan Pelajar Bulanan"
  category: ActivityCategory;
  description?: string;
  organizer: string; // e.g. "Hal Ehwal Pelajar (HEP)"
  location?: string;
  status: ActivityStatus;
  createdAt: string;
}

// Legacy container kept for non-destructive migration during Phase 1
export interface AttendanceSession {
  id: string; // Unique session ID (e.g. SES-2026-08)
  activityId: string; // Linked activity ID
  activityName?: string;
  category?: ActivityCategory;
  sessionName: string; // e.g. "Perhimpunan Bulan Ogos 2026" or "Kuliah Minggu 1"
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: EventStatus; // OPEN | CLOSED | ARCHIVED
  attendanceMethod: AttendanceMethod;
  qrToken?: string;
  location?: string;
  organizer?: string;
  classId?: string; // Contextual for class
  className?: string; // e.g. DIA_4B
  subjectId?: string;
  subjectName?: string;
  lecturerId?: string;
  lecturerName?: string;
  createdAt: string;
}

// Backward compatibility alias for event
export type EventItem = Event;

/**
 * Unified Attendance Record Model
 * Attendance belongs directly to eventId
 */
export interface AttendanceRecord {
  id: string; // Record ID (e.g. REC-EVT-001-PDA-2502-005)
  eventId: string; // Direct link to Event
  sessionId?: string; // Backward compatibility alias
  studentId: string; // Associated Student ID (No_Pelajar)
  studentName?: string; // Cached for quick rendering & export
  className?: string; // Cached student class
  scannedAt: string; // Authoritative scan timestamp
  timestamp: string; // Backward compatibility alias matching scannedAt
  status: AttendanceStatus; // PRESENT, ABSENT, etc.
  method: AttendanceMethod;
  scannerDeviceId?: string;
  operatorId?: string;
  notes?: string;
  verifiedBy?: string;
}

export interface ScanResult {
  success: boolean;
  code:
    | 'RECORDED'
    | 'ALREADY_RECORDED'
    | 'INVALID_QR'
    | 'NO_ACTIVE_EVENT'
    | 'STUDENT_NOT_FOUND'
    | 'NOT_ELIGIBLE'
    | 'EVENT_NOT_ACTIVE'
    | 'ERROR';
  message: string;
  student?: Student;
  event?: Event;
  session?: AttendanceSession;
  activity?: AttendanceActivity;
  timestamp: string;
  isDuplicate?: boolean;
  record?: AttendanceRecord;
}

export type ActiveTab =
  | 'dashboard'
  | 'attendance'
  | 'events'
  | 'students'
  | 'reports'
  | 'scanner'
  | 'activities'
  | 'my-attendance'
  | 'guide'
  | 'qr';

export interface StudentAttendanceSummary {
  student: Student;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  percentage: number;
  categoryBreakdown: Record<string, { total: number; present: number; percentage: number }>;
  recentRecords: Array<{
    record: AttendanceRecord;
    session: AttendanceSession;
    activity?: AttendanceActivity;
  }>;
}

/**
 * Official StudentAttend App Icon — Single Source of Truth
 * Direct Raw URL from SYNCROZZ Assets Repository
 */
export const OFFICIAL_STUDENT_ATTEND_ICON =
  'https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/logo/StudentAttend/android-chrome-192x192.png';

/**
 * Official StudentAttend Open Graph Image (OGI) — Single Source of Truth
 * Direct Raw URL from SYNCROZZ Assets Repository
 */
export const OFFICIAL_STUDENT_ATTEND_OGI =
  'https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/logo/StudentAttend/OGI%20StudentAttend.jpg';
