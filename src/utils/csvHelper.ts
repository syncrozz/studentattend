import { Student, AttendanceRecord, AttendanceSession } from '../types';

export const exportStudentsToCSV = (students: Student[]): string => {
  const headers = ['Bil', 'No_Telefon', 'Nama_Set', 'Nama_Pelajar', 'No_Pelajar', 'Email'];
  const rows = students.map((s, idx) => [
    idx + 1,
    `"${s.phone || ''}"`,
    `"${s.className || ''}"`,
    `"${s.name.replace(/"/g, '""')}"`,
    `"${s.studentId || s.id}"`,
    `"${s.email || ''}"`
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
};

export const exportSessionAttendanceToCSV = (
  session: AttendanceSession,
  students: Student[],
  records: AttendanceRecord[]
): string => {
  const headers = [
    'Bil',
    'No_Pelajar',
    'Nama_Pelajar',
    'Set_Kelas',
    'Status_Kehadiran',
    'Masa_Imbasan',
    'Kaedah',
    'Aktiviti',
    'Sesi'
  ];

  const recordMap = new Map<string, AttendanceRecord>();
  records.filter((r) => r.sessionId === session.id).forEach((r) => recordMap.set(r.studentId, r));

  // Determine target students
  let targetStudents = students;
  if (session.className) {
    targetStudents = students.filter((s) => s.className === session.className);
  }

  const rows = targetStudents.map((s, idx) => {
    const rec = recordMap.get(s.id);
    const status = rec ? rec.status : 'ABSENT';
    const scanTime = rec ? new Date(rec.timestamp).toLocaleTimeString('ms-MY') : '-';
    const method = rec ? rec.method : '-';

    return [
      idx + 1,
      `"${s.studentId || s.id}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.className}"`,
      `"${status}"`,
      `"${scanTime}"`,
      `"${method}"`,
      `"${session.activityName || ''}"`,
      `"${session.sessionName}"`
    ];
  });

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
};

export const parseStudentCSV = (csvText: string): Student[] => {
  const lines = csvText
    .split(/\r\n|\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length <= 1) return [];

  const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

  // Find column indices
  let idIndex = headers.findIndex((h) => h.includes('no_pelajar') || h.includes('id') || h.includes('matric') || h.includes('student'));
  let nameIndex = headers.findIndex((h) => h.includes('nama_pelajar') || h.includes('nama') || h.includes('name'));
  let setIndex = headers.findIndex((h) => h.includes('nama_set') || h.includes('set') || h.includes('kelas') || h.includes('class'));
  let phoneIndex = headers.findIndex((h) => h.includes('telefon') || h.includes('phone') || h.includes('tel'));
  let emailIndex = headers.findIndex((h) => h.includes('email') || h.includes('e-mel') || h.includes('mel'));

  // Fallbacks by position if not found by name
  if (idIndex === -1 && headers.length >= 5) idIndex = 4; // Typical CSV: Bil, No_Tel, Set, Nama, No_Pelajar, Email
  if (nameIndex === -1 && headers.length >= 4) nameIndex = 3;
  if (setIndex === -1 && headers.length >= 3) setIndex = 2;
  if (phoneIndex === -1 && headers.length >= 2) phoneIndex = 1;
  if (emailIndex === -1 && headers.length >= 6) emailIndex = 5;

  const resultStudents: Student[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawCols = splitCSVRow(lines[i]);
    if (rawCols.length < 2) continue;

    const studentId = (idIndex >= 0 ? rawCols[idIndex] : `PDA-${Date.now()}-${i}`) || `PDA-${i}`;
    const name = (nameIndex >= 0 ? rawCols[nameIndex] : `Pelajar ${i}`) || `Pelajar ${i}`;
    const className = (setIndex >= 0 ? rawCols[setIndex] : 'DIA_4A') || 'DIA_4A';
    const phone = phoneIndex >= 0 ? rawCols[phoneIndex] : '';
    const email = emailIndex >= 0 ? rawCols[emailIndex] : '';

    resultStudents.push({
      id: studentId.trim().toUpperCase(),
      studentId: studentId.trim().toUpperCase(),
      name: name.trim().toUpperCase(),
      className: className.trim().toUpperCase(),
      phone: phone.trim(),
      email: email.trim()
    });
  }

  return resultStudents;
};

function splitCSVRow(rowText: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < rowText.length; i++) {
    const char = rowText[i];
    if (char === '"') {
      if (inQuotes && rowText[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
