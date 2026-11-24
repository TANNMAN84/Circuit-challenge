import React, { useState } from 'react';
import { LevelDefinition, ScenarioId } from '../types/circuit';
import { SCENARIOS } from '../data/scenarios';
import { soundEngine } from '../engine/sound';
import {
  Download,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Lock,
  Pause,
  Play,
  Printer,
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
      setError('Incorrect access code.');
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
              Teacher Mode
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close access code prompt"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Unlock teacher controls, bulk circuit-map packs, Paper-Only classroom mode, and printable answer keys.
          </p>

          <div>
            <label
              htmlFor="teacher-pin-input"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Enter access code
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
              Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface BulkPrintModalProps {
  scenario: ScenarioId;
  onBulkPrint: (includeAnswerKeys: boolean, layout: 'grouped' | 'paired') => void;
  onBulkDownload: (includeAnswerKeys: boolean, layout: 'grouped' | 'paired') => void;
  onClose: () => void;
}

export const BulkPrintModal: React.FC<BulkPrintModalProps> = ({
  scenario,
  onBulkPrint,
  onBulkDownload,
  onClose,
}) => {
  const [includeKeys, setIncludeKeys] = useState(true);
  const [layout, setLayout] = useState<'grouped' | 'paired'>('grouped');
  const scenarioMeta = SCENARIOS[scenario];
  const totalPages = includeKeys ? 20 : 10;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-print-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131C2E] text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h2 id="bulk-print-title" className="text-sm font-bold">
              All 10 Circuit Maps &amp; Questions
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bulk print modal"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Generate a monochrome A4 classroom pack for all 10 missions using the{' '}
            <strong className="text-slate-900 dark:text-white">{scenarioMeta.name}</strong> theme.
          </p>

          <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 cursor-pointer">
            <input
              type="checkbox"
              checked={includeKeys}
              onChange={(e) => setIncludeKeys(e.target.checked)}
              className="mt-0.5 rounded border-slate-400 text-sky-600 focus:ring-sky-500"
            />
            <div className="text-xs">
              <div className="font-bold text-slate-900 dark:text-white">
                Include Teacher Answer Keys
              </div>
              <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                {includeKeys
                  ? '20 A4 pages total (10 student worksheets + 10 worked teacher answer keys).'
                  : '10 A4 pages total (student circuit maps, checklists & questions only).'}
              </div>
            </div>
          </label>

          {includeKeys && (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Page Order
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLayout('grouped')}
                  className={`px-3 py-2 rounded-lg border text-left text-xs transition-colors ${
                    layout === 'grouped'
                      ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div>Grouped</div>
                  <div className="text-[10.5px] font-normal opacity-80">
                    Maps 1–10, then Keys 11–20
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setLayout('paired')}
                  className={`px-3 py-2 rounded-lg border text-left text-xs transition-colors ${
                    layout === 'paired'
                      ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div>Paired</div>
                  <div className="text-[10.5px] font-normal opacity-80">
                    Map + Key per mission
                  </div>
                </button>
              </div>
            </div>
          )}

          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={() => onBulkPrint(includeKeys, layout)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 text-xs font-extrabold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF ({totalPages}p)
            </button>
            <button
              type="button"
              onClick={() => onBulkDownload(includeKeys, layout)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Pack (.html)
            </button>
          </div>
        </div>
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
  onOpenBulkPrint: () => void;
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
  onOpenBulkPrint,
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
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="font-mono font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 whitespace-nowrap">
            <Unlock className="w-3.5 h-3.5" />
            Teacher Mode
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

          <button
            type="button"
            onClick={onOpenBulkPrint}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 text-xs font-bold whitespace-nowrap transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            All 10 Maps &amp; Questions
          </button>

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
            <span className="font-mono text-emerald-700 dark:text-emerald-400">Code updated</span>
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
              Change Code
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
