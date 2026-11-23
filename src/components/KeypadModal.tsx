import React, { useEffect, useState } from 'react';
import { CircuitHatch } from '../types/circuit';
import { soundEngine } from '../engine/sound';
import { CheckCircle2, Delete, KeyRound, X } from 'lucide-react';

interface KeypadModalProps {
  hatch: CircuitHatch;
  onUnlock: (hatchId: string) => void;
  onClose: () => void;
}

export const KeypadModal: React.FC<KeypadModalProps> = ({ hatch, onUnlock, onClose }) => {
  const [stageIndex, setStageIndex] = useState(0);
  const [digits, setDigits] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stageClearedMsg, setStageClearedMsg] = useState<string | null>(null);

  const stage = hatch.stages[stageIndex];
  const totalStages = hatch.stages.length;

  const handleDigit = (d: string) => {
    if (digits.length >= 3) return;
    soundEngine.playKeypadBeep(Number(d));
    setErrorMsg(null);
    setDigits((prev) => prev + d);
  };

  const handleBackspace = () => {
    soundEngine.playKeypadBeep(-2);
    setErrorMsg(null);
    setDigits((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    soundEngine.playKeypadBeep(-4);
    setErrorMsg(null);
    setDigits('');
  };

  const handleSubmit = () => {
    if (digits.length < 3) {
      setErrorMsg('Enter all 3 digits (include leading zeros, e.g. 006).');
      soundEngine.playErrorBuzz();
      return;
    }

    if (digits === stage.code) {
      if (stageIndex + 1 < totalStages) {
        soundEngine.playHatchUnlock();
        setStageClearedMsg(
          `Code ${stage.stageNumber} unlocked (${stage.code})! Now enter Code ${stage.stageNumber + 1}.`,
        );
        setStageIndex((prev) => prev + 1);
        setDigits('');
        setErrorMsg(null);
      } else {
        soundEngine.playHatchUnlock();
        onUnlock(hatch.id);
      }
    } else {
      soundEngine.playErrorBuzz();
      setErrorMsg('WRONG CODE — check your circuit map or Pocket Meter and try again.');
      setDigits('');
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keypad-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl border-2 border-amber-500/70 bg-[#141822] text-slate-100 shadow-2xl overflow-hidden">
        <div className="h-1.5 w-full hazard-stripe-bar" />
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#1c212e]">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <div>
              <h2 id="keypad-modal-title" className="text-sm font-extrabold tracking-tight text-white">
                {hatch.label} · Secret Code Lock
              </h2>
              <p className="text-[11px] font-mono text-amber-300/90">
                TYPE THE 3-DIGIT CODE TO SLIDE THE COVER OPEN
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close keypad modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {stageClearedMsg && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/60 bg-emerald-950/60 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{stageClearedMsg}</span>
            </div>
          )}

          {/* Security Puzzle Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-300">{stage.title}</span>
              {totalStages > 1 && (
                <span className="font-mono font-bold tabular-nums text-slate-400">
                  LOCK {stageIndex + 1} OF {totalStages}
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-slate-200">{stage.prompt}</p>
            <div className="rounded-lg border border-slate-700 bg-[#0b0e15] px-3.5 py-2 text-xs font-mono text-cyan-300">
              {stage.formulaHint}
            </div>
          </div>

          {/* Retro Red/Amber 3-Digit LED Entry Screen */}
          <div className="flex items-center justify-center gap-3 py-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-16 h-14 flex items-center justify-center rounded-lg border-2 border-slate-700 bg-[#050608] text-[#ff3333] drop-shadow-[0_0_6px_rgba(255,43,43,0.65)] font-mono text-3xl font-bold tabular-nums"
              >
                {digits[i] ?? '–'}
              </div>
            ))}
          </div>

          {errorMsg && (
            <p className="text-xs font-mono font-semibold text-red-400 text-center">
              {errorMsg}
            </p>
          )}

          {/* Tactile Hardware Keypad */}
          <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigit(num)}
                className="h-11 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 active:scale-95 font-mono text-lg font-bold text-white shadow-sm transition-transform"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-11 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-mono font-bold text-slate-300"
            >
              CLR
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-11 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 active:scale-95 font-mono text-lg font-bold text-white shadow-sm transition-transform"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              aria-label="Backspace digit"
              className="h-11 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-extrabold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors"
            >
              Unlock Cover
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
