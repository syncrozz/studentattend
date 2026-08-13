import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, KeyRound, Check, X, Sparkles } from 'lucide-react';
import { soundService } from '../services/soundService';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionTitle?: string;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = 'Sila Aktifkan Admin Mode'
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setShake(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmitPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (pin === '5313') {
      soundService.playSuccess();
      setError(false);
      onSuccess();
      onClose();
    } else {
      soundService.playError();
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      if (newPin.length === 4) {
        if (newPin === '5313') {
          soundService.playSuccess();
          onSuccess();
          onClose();
        } else {
          soundService.playError();
          setError(true);
          setShake(true);
          setTimeout(() => setShake(false), 500);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className={`bg-slate-900 border ${
          error ? 'border-rose-500/80 shadow-rose-950/50' : 'border-indigo-500/40 shadow-indigo-950/50'
        } rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 text-white transition-all ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{actionTitle}</h3>
              <p className="text-[11px] text-slate-400">Persetujuan Pentadbir Sistem</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PIN Description Notice */}
        <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 text-xs space-y-1">
          <div className="flex items-center space-x-1.5 text-indigo-300 font-semibold">
            <KeyRound className="w-4 h-4" />
            <span>Kunci Keselamatan Admin</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Sila masukkan <span className="text-emerald-400 font-mono font-bold text-xs bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.5 rounded">4-digit PIN</span> keselamatan untuk mengakses Mod Pentadbir.
          </p>
        </div>

        {/* PIN Display */}
        <div className="space-y-3 text-center">
          <div className="flex justify-center items-center space-x-3 my-2">
            {[0, 1, 2, 3].map((index) => {
              const hasDigit = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-11 h-12 rounded-xl border flex items-center justify-center font-mono font-bold text-xl transition-all ${
                    hasDigit
                      ? 'border-indigo-500 bg-indigo-950/80 text-indigo-300 shadow-inner'
                      : 'border-slate-700 bg-slate-800/50 text-slate-600'
                  }`}
                >
                  {hasDigit ? '•' : ''}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="text-rose-400 text-xs font-semibold flex items-center justify-center space-x-1 bg-rose-950/60 border border-rose-500/30 p-2 rounded-xl">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>PIN Salah! Sila masukkan PIN keselamatan yang betul.</span>
            </div>
          )}
        </div>

        {/* On-screen Keypad */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="py-3 bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 text-white font-bold text-lg rounded-2xl transition-colors cursor-pointer shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setPin('')}
            className="py-3 bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold text-xs rounded-2xl cursor-pointer"
          >
            Padam
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="py-3 bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 text-white font-bold text-lg rounded-2xl transition-colors cursor-pointer shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="py-3 bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold text-xs rounded-2xl cursor-pointer"
          >
            ⌫
          </button>
        </div>

        {/* Form Actions */}
        <form onSubmit={handleSubmitPin} className="pt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPin('');
              setError(false);
            }}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded-xl border border-slate-700 cursor-pointer flex items-center justify-center space-x-1"
          >
            <span>Reset Input</span>
          </button>
          <button
            type="submit"
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center space-x-1"
          >
            <Check className="w-4 h-4" />
            <span>Sahkan PIN</span>
          </button>
        </form>
      </div>
    </div>
  );
};
