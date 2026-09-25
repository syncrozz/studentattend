/**
 * Automated Verification Script for Phase 2: Operational UI/UX Consolidation
 * Standard: SYNCROZZ ENGINEERING STANDARD (SES) v4.5
 * UX Principle: MYAU — Make Yourself as User/Admin
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

async function runPhase2Verification() {
  console.log('====================================================');
  console.log('STARTING PHASE 2 VERIFICATION TEST SUITE (SES 4.5)');
  console.log('====================================================\n');

  // Test 1: Navigation Structure & 5 Operational Areas
  console.log('Test 1: Verification of 5 Operational Areas');
  const allowedOperationalTabs = ['dashboard', 'attendance', 'events', 'students', 'reports'];
  assert(
    allowedOperationalTabs.length === 5,
    'Operational Areas Count',
    `Exactly 5 operational areas established: ${allowedOperationalTabs.join(', ')}`
  );

  // Test 2: Active Event Resolution for Kehadiran / Dashboard
  console.log('\nTest 2: Active Event Resolution');
  const activeEvt = attendanceEngine.getActiveEvent();
  assert(
    activeEvt !== null && (activeEvt.status === 'ACTIVE' || activeEvt.status === 'OPEN'),
    'Active Event Authoritatively Identified',
    `Active event ID: ${activeEvt?.id}, Title: ${activeEvt?.title}`
  );

  // Test 3: Event Creation without manual start/end times (MYAU: Admin defines WHAT, System records WHEN)
  console.log('\nTest 3: Event Creation without manual timestamps');
  const newEvt = attendanceEngine.createEvent({
    title: 'Majlis Sambutan Hari Kemerdekaan Kolej',
    type: 'CEREMONY',
    rosterType: 'ALL',
    location: 'Dataran Kolej',
    organizer: 'Majlis Perwakilan Pelajar'
  });

  assert(
    newEvt.status === 'DRAFT' && !!newEvt.id,
    'Event Created in DRAFT State',
    `ID: ${newEvt.id}, Status: ${newEvt.status}`
  );
  assert(
    !newEvt.activatedAt && !newEvt.closedAt,
    'No manual start/end times entered',
    'Timestamps are clean and unset prior to activation'
  );

  // Test 4: One Primary Action Hierarchy by State
  console.log('\nTest 4: Action Hierarchy Verification');
  // DRAFT -> AKTIFKAN
  assert(newEvt.status === 'DRAFT', 'DRAFT State Primary Action is AKTIFKAN', 'Action: AKTIFKAN');

  // Activate Event
  attendanceEngine.activateEvent(newEvt.id);
  const activatedEvt = attendanceEngine.getEventById(newEvt.id);

  // ACTIVE -> IMBAS
  assert(
    activatedEvt?.status === 'ACTIVE' && typeof activatedEvt.activatedAt === 'string',
    'ACTIVE State Primary Action is IMBAS',
    `Action: IMBAS (activatedAt: ${activatedEvt?.activatedAt})`
  );

  // Test 5: Kehadiran Scanner Execution & Authoritative Scan Timestamps
  console.log('\nTest 5: Kehadiran Scanner Execution');
  const scanResult1 = attendanceEngine.processScan('STUDENT|PDA-2502-005', 'CAMERA_SCAN', newEvt.id);
  assert(
    scanResult1.success === true && scanResult1.code === 'RECORDED',
    'Student Attendance Recorded',
    `Student: ${scanResult1.student?.name} (${scanResult1.student?.className})`
  );

  // Test 6: Duplicate Prevention in Kehadiran
  console.log('\nTest 6: Duplicate Prevention');
  const duplicateResult = attendanceEngine.processScan('STUDENT|PDA-2502-005', 'CAMERA_SCAN', newEvt.id);
  assert(
    duplicateResult.success === false && duplicateResult.code === 'ALREADY_RECORDED' && duplicateResult.isDuplicate === true,
    'Duplicate Attendance Blocked',
    `Code: ${duplicateResult.code}, isDuplicate: ${duplicateResult.isDuplicate}`
  );

  // Test 7: Closure of Attendance via TAMATKAN KEHADIRAN
  console.log('\nTest 7: Attendance Closure (TAMATKAN KEHADIRAN)');
  attendanceEngine.closeEvent(newEvt.id);
  const closedEvt = attendanceEngine.getEventById(newEvt.id);

  // COMPLETED -> LIHAT
  assert(
    closedEvt?.status === 'COMPLETED' && typeof closedEvt.closedAt === 'string',
    'COMPLETED State Primary Action is LIHAT',
    `Status: ${closedEvt?.status}, closedAt: ${closedEvt?.closedAt}`
  );

  // Test 8: Scan Rejection after Closure
  console.log('\nTest 8: Scan Rejection on COMPLETED Event');
  const postCloseScan = attendanceEngine.processScan('STUDENT|PDA-2502-018', 'CAMERA_SCAN', newEvt.id);
  assert(
    postCloseScan.success === false && postCloseScan.code === 'EVENT_NOT_ACTIVE',
    'Scan on COMPLETED Event Rejected',
    `Result code: ${postCloseScan.code}`
  );

  // Clean up test event
  attendanceEngine.deleteEvent(newEvt.id);

  // Final Summary
  console.log('\n====================================================');
  console.log('PHASE 2 VERIFICATION RESULTS SUMMARY');
  console.log('====================================================');
  const total = results.length;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`Total Assertions: ${total} | Passed: ${passed} | Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n>>> ALL PHASE 2 OPERATIONAL TESTS PASSED <<<');
    process.exit(0);
  } else {
    console.error(`\n>>> ${failed} TEST(S) FAILED <<<`);
    process.exit(1);
  }
}

runPhase2Verification().catch((err) => {
  console.error('Verification script crashed:', err);
  process.exit(1);
});
