import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId.trim() !== ''
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Utility to clean undefined values before saving to Firestore
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = typeof value === 'object' && value !== null ? sanitizeForFirestore(value) : value;
      }
    }
    return cleaned as T;
  }
  return data;
}

/**
 * Universal Timestamp Normalization Adapter (SES 4.5 / Phase 4)
 * Safely converts Firestore Timestamps, Date instances, epoch numbers,
 * or ISO strings into normalized ISO-8601 strings.
 * Guarantees that UI, CSV exports, and reports never encounter Firestore Timestamp objects.
 */
export function normalizeTimestamp(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') {
    try {
      return new Date(val).toISOString();
    } catch {
      return '';
    }
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  // Firestore Timestamp with toDate()
  if (typeof (val as any).toDate === 'function') {
    try {
      return (val as any).toDate().toISOString();
    } catch {
      return '';
    }
  }
  // Serialized Firestore Timestamp object { seconds, nanoseconds }
  if (typeof (val as any).seconds === 'number') {
    try {
      return new Date((val as any).seconds * 1000).toISOString();
    } catch {
      return '';
    }
  }
  return String(val);
}

/**
 * Operational Error Translator (MYAU Principle)
 * Translates low-level Firebase/network exceptions into clear, actionable operational messages.
 */
export function formatOperationalError(error: unknown): string {
  if (!error) return 'Ralat tidak diketahui berlaku.';
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('permission-denied') || msg.includes('PERMISSION_DENIED')) {
    return 'Tiada kebenaran untuk menyimpan data ke pelayan cloud. Sila pastikan konfigurasi pangkalan data disahkan.';
  }
  if (msg.includes('unavailable') || msg.includes('client is offline') || msg.includes('network')) {
    return 'Sambungan ke pangkalan data cloud sedang terganggu. Data disimpan secara setempat (offline cache) dan akan disegerakkan semula.';
  }
  if (msg.includes('failed-precondition') || msg.includes('FAILED_PRECONDITION')) {
    return 'Operasi cloud gagal kerana percanggahan prasyarat dokumen. Sila muat semula halaman.';
  }
  if (msg.includes('not-found')) {
    return 'Rekod tidak dijumpai dalam pangkalan data cloud.';
  }
  return 'Ralat operasi sistem. Sila semak sambungan rangkaian atau cuba sebentar lagi.';
}

