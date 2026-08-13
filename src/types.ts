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

export type EventStatus = 'OPEN' | 'CLOSED' | 'ARCHIVED'; // Kept for session status

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
export type EventItem = AttendanceSession;

export interface AttendanceRecord {
  id: string; // Record ID (e.g. REC-172354890)
  sessionId: string; // Associated Session ID
  studentId: string; // Associated Student ID (No_Pelajar)
  timestamp: string; // ISO String
  status: AttendanceStatus; // PRESENT, ABSENT, etc.
  method: AttendanceMethod;
  notes?: string;
  verifiedBy?: string;
}

export interface ScanResult {
  success: boolean;
  code: 'RECORDED' | 'ALREADY_RECORDED' | 'INVALID_QR' | 'NO_ACTIVE_EVENT' | 'STUDENT_NOT_FOUND' | 'ERROR';
  message: string;
  student?: Student;
  session?: AttendanceSession;
  activity?: AttendanceActivity;
  timestamp: string;
  isDuplicate?: boolean;
  record?: AttendanceRecord;
}

export type ActiveTab =
  | 'dashboard'
  | 'scanner'
  | 'activities'
  | 'students'
  | 'my-attendance'
  | 'reports'
  | 'guide';

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
