/**
 * Automated Verification Script for Phase 1: Model & Attendance Engine Consolidation
 * Standard: SYNCROZZ ENGINEERING STANDARD (SES) v4.5
 */
import { attendanceEngine } from '../src/services/attendanceEngine';
import { Event } from '../src/types';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details: string) {
  if (condition) {
    results.push({ name, status: 'PASS', details });
    console.log(`[PASS] ${name}: ${details}`);
  } else {
    results.push({ name, status: 'FAIL', details });
    console.error(`[FAIL] ${name}: ${details}`);
  }
}

async function runVerification() {
  console.log('====================================================');
  console.log('STARTING PHASE 1 VERIFICATION TEST SUITE (SES 4.5)');
  console.log('====================================================\n');

  // Test 1: Unified Event Creation (Admin defines WHAT, System records WHEN)
  console.log('Test 1: Event Creation without manual start/end times');
  const createdEvent = attendanceEngine.createEvent({
    title: 'Perhimpunan Mingguan Khas 2026',
    type: 'ASSEMBLY',
    rosterType: 'ALL',
    location: 'Dewan Besar',
    organizer: 'Hal Ehwal Pelajar'
    // Notice: NO startTime, NO endTime, NO subject, NO lecturer
  });

  assert(
    !!createdEvent.id && createdEvent.status === 'DRAFT',
    'Event Creation Initial Status',
    `Created event ID: ${createdEvent.id}, Status: ${createdEvent.status}`
  );
  assert(
    !createdEvent.activatedAt && !createdEvent.closedAt,
    'Event Timestamps Unset on Creation',
    'activatedAt and closedAt are correctly undefined before activation'
  );

  // Test 2: Event Activation (Authoritative activatedAt timestamp recorded)
  console.log('\nTest 2: Event Activation (AKTIFKAN KEHADIRAN)');
  attendanceEngine.activateEvent(createdEvent.id);
  const activeEvent = attendanceEngine.getEventById(createdEvent.id);

  assert(
    activeEvent?.status === 'ACTIVE',
    'Event Status Transition to ACTIVE',
    `Status transitioned to: ${activeEvent?.status}`
  );
  assert(
    typeof activeEvent?.activatedAt === 'string' && activeEvent.activatedAt.length > 0,
    'Authoritative activatedAt Recorded',
    `activatedAt recorded: ${activeEvent?.activatedAt}`
  );

  // Test 3: Active Event Identification
  console.log('\nTest 3: Active Event Resolution');
  const resolvedActive = attendanceEngine.getActiveEvent();
  assert(
    resolvedActive?.id === createdEvent.id,
    'Active Event Resolved Authoritatively',
    `Resolved active event ID: ${resolvedActive?.id}`
  );

  // Test 4: Valid Student Attendance Scan (Authoritative scannedAt & firstScanAt)
  console.log('\nTest 4: Attendance Scan for Student A');
  const studentA_Id = 'PDA-2502-005'; // MUHAMMAD AIMAN BIN MUHAMMAD ARIFF (DIA_4B)
  const scanResultA = attendanceEngine.recordAttendance(createdEvent.id, studentA_Id, 'CAMERA_SCAN');

  assert(
    scanResultA.success === true && scanResultA.code === 'RECORDED',
    'Student A Attendance Recorded',
    `Code: ${scanResultA.code}, Student: ${scanResultA.student?.name}`
  );
  assert(
    typeof scanResultA.record?.scannedAt === 'string',
    'Record scannedAt Timestamp Generated',
    `scannedAt: ${scanResultA.record?.scannedAt}`
  );

  const eventAfterScanA = attendanceEngine.getEventById(createdEvent.id);
  assert(
    typeof eventAfterScanA?.firstScanAt === 'string' && eventAfterScanA.firstScanAt === scanResultA.record?.scannedAt,
    'Event firstScanAt Established',
    `firstScanAt: ${eventAfterScanA?.firstScanAt}`
  );

  // Test 5: Duplicate Attendance Protection (Idempotent service-layer enforcement)
  console.log('\nTest 5: Duplicate Attendance Prevention for Student A');
  const duplicateScan = attendanceEngine.recordAttendance(createdEvent.id, studentA_Id, 'CAMERA_SCAN');

  assert(
    duplicateScan.success === false && duplicateScan.code === 'ALREADY_RECORDED' && duplicateScan.isDuplicate === true,
    'Duplicate Attendance Blocked',
    `Result: code=${duplicateScan.code}, isDuplicate=${duplicateScan.isDuplicate}`
  );

  // Test 6: Second Student Attendance Scan (lastScanAt updated)
  console.log('\nTest 6: Attendance Scan for Student B');
  const studentB_Id = 'PDA-2502-018'; // FATIN ZAFIRA BINTI MOHD FADHLI (DIA_4B)
  const scanResultB = attendanceEngine.recordAttendance(createdEvent.id, studentB_Id, 'CAMERA_SCAN');

  assert(
    scanResultB.success === true && scanResultB.code === 'RECORDED',
    'Student B Attendance Recorded',
    `Code: ${scanResultB.code}, Student: ${scanResultB.student?.name}`
  );

  const eventAfterScanB = attendanceEngine.getEventById(createdEvent.id);
  assert(
    typeof eventAfterScanB?.lastScanAt === 'string' && eventAfterScanB.lastScanAt === scanResultB.record?.scannedAt,
    'Event lastScanAt Updated Authoritatively',
    `lastScanAt: ${eventAfterScanB?.lastScanAt}`
  );

  // Test 7: Roster Eligibility Check (CLASS_SET restriction)
  console.log('\nTest 7: Roster Eligibility Check');
  const restrictedEvent = attendanceEngine.createEvent({
    title: 'Bengkel Khas Kelas DIA_4A Sahaja',
    type: 'SEMINAR',
    rosterType: 'CLASS_SET',
    targetClasses: ['DIA_4A']
  });
  attendanceEngine.activateEvent(restrictedEvent.id);

  // Student from DIA_4B (Not eligible)
  const nonEligibleScan = attendanceEngine.recordAttendance(restrictedEvent.id, 'PDA-2502-005');
  assert(
    nonEligibleScan.success === false && nonEligibleScan.code === 'NOT_ELIGIBLE',
    'Non-eligible Student Blocked',
    `Result: code=${nonEligibleScan.code}, message: ${nonEligibleScan.message}`
  );

  // Student from DIA_4A (Eligible: e.g. PDA-2502-001)
  const eligibleScan = attendanceEngine.recordAttendance(restrictedEvent.id, 'PDA-2502-001');
  assert(
    eligibleScan.success === true && eligibleScan.code === 'RECORDED',
    'Eligible Student Accepted',
    `Result: code=${eligibleScan.code}, student=${eligibleScan.student?.name} (${eligibleScan.student?.className})`
  );

  // Test 8: Attendance Scan on Inactive Event (DRAFT or COMPLETED)
  console.log('\nTest 8: Rejection on Inactive Event');
  const draftEvent = attendanceEngine.createEvent({
    title: 'Acara Masih Draft',
    type: 'PROGRAMME',
    rosterType: 'ALL'
  });
  const draftScan = attendanceEngine.recordAttendance(draftEvent.id, 'PDA-2502-004');
  assert(
    draftScan.success === false && draftScan.code === 'EVENT_NOT_ACTIVE',
    'Scan on DRAFT Event Rejected',
    `Code: ${draftScan.code}`
  );

  // Test 9: Event Closure (TAMATKAN KEHADIRAN)
  console.log('\nTest 9: Event Closure (TAMATKAN KEHADIRAN)');
  attendanceEngine.closeEvent(createdEvent.id);
  const closedEvent = attendanceEngine.getEventById(createdEvent.id);

  assert(
    closedEvent?.status === 'COMPLETED',
    'Event Status Transition to COMPLETED',
    `Status: ${closedEvent?.status}`
  );
  assert(
    typeof closedEvent?.closedAt === 'string' && closedEvent.closedAt.length > 0,
    'Authoritative closedAt Recorded',
    `closedAt: ${closedEvent?.closedAt}`
  );

  // Test 10: Rejection of Scans after Closure
  console.log('\nTest 10: Scan Rejection on COMPLETED Event');
  const postCloseScan = attendanceEngine.recordAttendance(createdEvent.id, 'PDA-2502-060');
  assert(
    postCloseScan.success === false && postCloseScan.code === 'EVENT_NOT_ACTIVE',
    'Scan on COMPLETED Event Rejected',
    `Code: ${postCloseScan.code}, Message: ${postCloseScan.message}`
  );

  // Test 11: Summary & Metrics Calculation
  console.log('\nTest 11: Event Attendance Summary Query');
  const summary = attendanceEngine.getEventAttendanceSummary(createdEvent.id);
  assert(
    summary !== null && summary.presentCount === 2,
    'Attendance Summary Present Count Correct',
    `Present count: ${summary?.presentCount}, Total: ${summary?.totalStudents}`
  );

  // Clean up test events
  attendanceEngine.deleteEvent(createdEvent.id);
  attendanceEngine.deleteEvent(restrictedEvent.id);
  attendanceEngine.deleteEvent(draftEvent.id);

  // Final Summary
  console.log('\n====================================================');
  console.log('PHASE 1 VERIFICATION RESULTS SUMMARY');
  console.log('====================================================');
  const total = results.length;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`Total Assertions: ${total} | Passed: ${passed} | Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n>>> ALL PHASE 1 ARCHITECTURAL TESTS PASSED <<<');
    process.exit(0);
  } else {
    console.error(`\n>>> ${failed} TEST(S) FAILED <<<`);
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Verification script crashed:', err);
  process.exit(1);
});
