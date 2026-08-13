import React from 'react';
import {
  GraduationCap,
  QrCode,
  CalendarCheck,
  Users,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  Cpu
} from 'lucide-react';

export const ConceptGuideView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Senibina Sistem Universal StudentAttend</span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">
          Panduan Konsep & Aliran Kerja Kehadiran Universal
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          StudentAttend direka bentuk untuk menyokong pelbagai jenis kehadiran kolej dan institusi pendidikan dengan struktur data modular yang fleksibel dan berprestasi tinggi.
        </p>
      </div>

      {/* 1. STRUCTURAL DATA MODEL FLOW */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <span>1. Model Data Universal (Hierarki 4 Peringkat)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/30 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
              01
            </div>
            <h4 className="text-sm font-bold text-white">Master Pelajar</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              95 Pelajar unik merangkumi 4 set (DIA_4A, DIA_4B, DIA_4C, DIA_4D) dengan No. Pelajar rasmi (contoh: <code className="text-indigo-300">PDA-2502-005</code>).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-purple-500/30 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-xs">
              02
            </div>
            <h4 className="text-sm font-bold text-white">Aktiviti Induk</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Kategori aktiviti universal: Perhimpunan, Kuliah/Kelas, Program Rasmi, Bengkel, dan Seminar.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <h4 className="text-sm font-bold text-white">Sesi Berkala</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Sesi berjadual (contoh: Sesi Ogos 2026, Kuliah Minggu 1) dengan status kawalan <strong className="text-emerald-400">OPEN / CLOSED</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold text-xs">
              04
            </div>
            <h4 className="text-sm font-bold text-white">Rekod Kehadiran</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Transaksi kehadiran pantas dengan cap masa ISO, kaedah (QR/Manual), dan pengesahan <strong className="text-amber-300">Anti-Duplicate</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 2. THREE CORE USER ROLES */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" />
          <span>2. Tiga Peranan Pengguna (Role-Based Workflows)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="text-xs font-bold uppercase text-purple-400">01. Pelajar (Student)</div>
            <h4 className="text-sm font-bold text-white">Kad ID & Portal Kehadiran</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Papar Kod QR peribadi, semak kadar kehadiran peribadi (%), sejarah aktiviti yang dihadiri atau terlepas, dan pecahan mengikut kategori.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="text-xs font-bold uppercase text-emerald-400">02. Operator / Pensyarah</div>
            <h4 className="text-sm font-bold text-white">Pusat Imbasan & Verifikasi</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Buka sesi kehadiran, aktifkan kamera pengimbas QR, terima maklum balas bunyi masa nyata, dan laksana imbasan pantas manual jika perlu.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="text-xs font-bold uppercase text-blue-400">03. Pentadbir (Admin / HEP)</div>
            <h4 className="text-sm font-bold text-white">Pengurusan Master & Laporan</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Urus direktori 95 pelajar, cipta aktiviti induk, eksport/import fail CSV rasmi, dan cetak lembaran laporan kehadiran serta kad QR A4.
            </p>
          </div>
        </div>
      </div>

      {/* 3. HARDWARE & CLOUD ENGINE HIGHLIGHTS */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <span>3. Ciri-ciri Enjin Berprestasi Tinggi</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block">Kamera Pengimbas html5-qrcode:</strong>
              Akses kamera persekitaran peranti dengan zon imbasan tepat dan jeda pemprosesan 2 saat bagi mengelakkan imbasan berulang secara tidak sengaja.
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block">Sintesis Bunyi Web Audio:</strong>
              Bunyi maklum balas berbeza untuk imbasan berjaya (chime ceria), amaran pendua (beep amaran), dan ralat (buzzer) tanpa fail audio luaran.
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block">Pangkalan Data Dwi-Lapisan (Dual-Layer):</strong>
              Penyegerakan masa nyata Firestore digabungkan dengan storan tempatan untuk memastikan sistem berfungsi tanpa gangguan walaupun talian internet perlahan.
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block">Dwi-Perspektif Laporan:</strong>
              Semakan kehadiran dari sudut pandang sesi aktiviti kolej atau dari sudut profil kumulatif setiap individu pelajar.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
