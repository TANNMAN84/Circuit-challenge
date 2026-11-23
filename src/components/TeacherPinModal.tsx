import React, { useState } from 'react';
import { LevelDefinition } from '../types/circuit';
import { soundEngine } from '../engine/sound';
import {
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Lock,
  Pause,
  Play,
  Unlock,
  X,
} from 'lucide-react';

interface TeacherPinModalProps {
  storedPin: string;
  onUnlock: () => void;
  onClose: () => void;
}

export const TeacherPinModal: React.FC<TeacherPinModalProps> = ({
  storedPin,
  onUnlock,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === storedPin) {
      soundEngine.playHatchUnlock();
      onUnlock();
    } else {
      soundEngine.playErrorBuzz();
      setError('Incorrect 4-digit PIN.');
      setPin('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-pin-title"
    >
      <div className="w-full max-w-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C2E] text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-sky-700 dark:text-sky-400" />
            <h2 id="teacher-pin-title" className="text-sm font-bold">
              Teacher Mode PIN
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close PIN prompt"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Enter your 4-digit Teacher PIN to enable level jump, live V/I component overlays, Paper-Only classroom mode, hatch force-unlock, and printable Teacher Answer Keys.
          </p>

          <div>
            <label htmlFor="teacher-pin-input" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              4-Digit PIN (default: 2026)
            </label>
            <input
              id="teacher-pin-input"
              type="password"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              value={pin}
              onChange={(e) => {
                setError(null);
                setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
              }}
              placeholder="••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-lg tracking-[0.4em] text-center text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
          </div>

          {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950"
            >
              Unlock Teacher Mode
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface TeacherToolbarProps {
  levels: LevelDefinition[];
  activeLevelId: number | null;
  showViBadges: boolean;
  paperOnlyMode: boolean;
  timerPaused: boolean;
  onJumpLevel: (levelId: number) => void;
  onForceUnlockHatches: () => void;
  onToggleViBadges: () => void;
  onTogglePaperOnly: () => void;
  onTogglePauseTimer: () => void;
  onUpdatePin: (newPin: string) => void;
  onLockTeacher: () => void;
}

export const TeacherToolbar: React.FC<TeacherToolbarProps> = ({
  levels,
  activeLevelId,
  showViBadges,
  paperOnlyMode,
  timerPaused,
  onJumpLevel,
  onForceUnlockHatches,
  onToggleViBadges,
  onTogglePaperOnly,
  onTogglePauseTimer,
  onUpdatePin,
  onLockTeacher,
}) => {
  const [editingPin, setEditingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinSaved, setPinSaved] = useState(false);

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length === 4) {
      onUpdatePin(newPin);
      setNewPin('');
      setEditingPin(false);
      setPinSaved(true);
      setTimeout(() => setPinSaved(false), 2500);
    }
  };

  return (
    <div className="no-print border-b border-amber-300/80 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 px-4 sm:px-6 py-2">
      <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-mono font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 whitespace-nowrap">
            <Unlock className="w-3.5 h-3.5" />
            Teacher Mode Active
          </span>

          <span className="text-amber-400 dark:text-amber-700" aria-hidden="true">·</span>

          {/* Direct Level Jump */}
          <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
            <span>Jump:</span>
            <select
              value={activeLevelId ?? ''}
              onChange={(e) => {
                const id = Number(e.target.value);
                if (id) onJumpLevel(id);
              }}
              className="rounded border border-amber-400/70 dark:border-amber-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-mono text-slate-900 dark:text-slate-100"
            >
              <option value="" disabled>
                Select Level
              </option>
              {levels.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  L{lvl.id} · {lvl.title}
                </option>
              ))}
            </select>
          </label>

          {activeLevelId !== null && (
            <>
              <button
                type="button"
                onClick={onForceUnlockHatches}
                className="px-2.5 py-1 rounded border border-amber-400/80 dark:border-amber-700 bg-white dark:bg-slate-900 hover:bg-amber-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap"
              >
                Force Unlock Hatches
              </button>

              <button
                type="button"
                onClick={onToggleViBadges}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium whitespace-nowrap transition-colors ${
                  showViBadges
                    ? 'bg-sky-700 border-sky-700 text-white'
                    : 'bg-white dark:bg-slate-900 border-amber-400/80 dark:border-amber-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                {showViBadges ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                Live V/I Badges
              </button>

              <button
                type="button"
                onClick={onTogglePauseTimer}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium whitespace-nowrap transition-colors ${
                  timerPaused
                    ? 'bg-amber-600 border-amber-600 text-white'
                    : 'bg-white dark:bg-slate-900 border-amber-400/80 dark:border-amber-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                {timerPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                {timerPaused ? 'Resume Clock' : 'Pause Clock'}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onTogglePaperOnly}
            title="Hide the on-screen Reference Schematic drawer so students use printed worksheets only"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium whitespace-nowrap transition-colors ${
              paperOnlyMode
                ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-950'
                : 'bg-white dark:bg-slate-900 border-amber-400/80 dark:border-amber-700 text-slate-800 dark:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            {paperOnlyMode ? 'Paper-Only: ON' : 'Paper-Only: OFF'}
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {pinSaved && (
            <span className="font-mono text-emerald-700 dark:text-emerald-400">PIN updated</span>
          )}
          {editingPin ? (
            <form onSubmit={handleSavePin} className="flex items-center gap-1.5">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="4 digits"
                className="w-20 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
              />
              <button
                type="submit"
                disabled={newPin.length !== 4}
                className="px-2 py-1 rounded bg-sky-700 text-white text-xs font-medium disabled:opacity-40"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingPin(false)}
                className="px-2 py-1 text-slate-600 dark:text-slate-400 hover:underline"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setEditingPin(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-amber-400/80 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-amber-100 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <KeyRound className="w-3 h-3" />
              Change PIN
            </button>
          )}

          <button
            type="button"
            onClick={onLockTeacher}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-950 font-medium whitespace-nowrap"
          >
            <Lock className="w-3 h-3" />
            Lock
          </button>
        </div>
      </div>
    </div>
  );
};
