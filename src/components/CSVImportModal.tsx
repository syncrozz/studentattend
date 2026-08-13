import React, { useState } from 'react';
import { Student } from '../types';
import { parseStudentCSV } from '../utils/csvHelper';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Download } from 'lucide-react';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (students: Student[]) => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [parsedStudents, setParsedStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const students = parseStudentCSV(text);
        if (students.length === 0) {
          setError('Gagal membaca rekod pelajar daripada fail CSV. Sila pastikan format fail adalah betul.');
        } else {
          setParsedStudents(students);
        }
      } catch (err) {
        setError('Ralat semasa memproses fail CSV.');
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (parsedStudents.length > 0) {
      onImport(parsedStudents);
      onClose();
    }
  };

  const downloadSampleTemplate = () => {
    const sample = `Bil,No_Telefon,Nama_Set,Nama_Pelajar,No_Pelajar,Email\n1,60166982011,DIA_4B,MUHAMMAD AIMAN BIN MUHAMMAD ARIFF,PDA-2502-005,aiman.ariff@bpenawar.kpm.edu.my\n2,60136353712,DIA_4B,FATIN ZAFIRA BINTI MOHD FADHLI,PDA-2502-018,zafira.mohd@bpenawar.kpm.edu.my`;
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Templat_Master_Pelajar.csv';
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl flex flex-col space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Import Master Data Pelajar (CSV)</h3>
            <p className="text-xs text-slate-400">Muat naik senarai pelajar untuk dikemas kini ke pangkalan data</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dropzone or Preview */}
        {parsedStudents.length === 0 ? (
          <div className="space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <Upload className="w-10 h-10 text-indigo-400 mb-3" />
              <h4 className="text-sm font-bold text-white mb-1">
                Tarik & Lepaskan fail CSV di sini
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                atau klik untuk memilih fail daripada komputer anda
              </p>

              <label className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-lg shadow-indigo-600/30 transition-all">
                <span>Pilih Fail CSV</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleChange}
                  className="hidden"
                />
              </label>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Format info & Template download */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div>
                <span className="font-semibold text-slate-300">Format Lajur Disokong:</span>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Bil, No_Telefon, Nama_Set, Nama_Pelajar, No_Pelajar, Email
                </div>
              </div>
              <button
                onClick={downloadSampleTemplate}
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Muat Turun Templat</span>
              </button>
            </div>
          </div>
        ) : (
          /* Preview state */
          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-emerald-300 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{parsedStudents.length} rekod pelajar berjaya dibaca daripada fail <strong>{fileName}</strong></span>
              </div>
              <button
                onClick={() => {
                  setParsedStudents([]);
                  setFileName('');
                }}
                className="text-[11px] underline hover:text-white cursor-pointer"
              >
                Pilih fail lain
              </button>
            </div>

            {/* Table Preview (first 6 rows) */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 text-[10px] font-bold sticky top-0">
                  <tr>
                    <th className="py-2 px-3">No. Pelajar</th>
                    <th className="py-2 px-3">Nama Pelajar</th>
                    <th className="py-2 px-3">Set</th>
                    <th className="py-2 px-3">Telefon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {parsedStudents.slice(0, 10).map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50">
                      <td className="py-2 px-3 text-indigo-400 font-bold">{s.studentId}</td>
                      <td className="py-2 px-3 font-sans font-semibold text-white">{s.name}</td>
                      <td className="py-2 px-3">{s.className}</td>
                      <td className="py-2 px-3 text-slate-400">{s.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Sahkan & Simpan {parsedStudents.length} Pelajar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
