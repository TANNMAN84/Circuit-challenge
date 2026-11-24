import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LEVELS } from './data/levels';
import {
  CONFIDENCE_TIERS,
  SCENARIOS,
  computeLevelSeconds,
} from './data/scenarios';
import { solveCircuit } from './engine/circuitSolver';
import { soundEngine } from './engine/sound';
import {
  CircuitHatch,
  ConfidenceTier,
  FaultState,
  LevelDefinition,
  ScenarioId,
} from './types/circuit';
import { MissionHub } from './components/MissionHub';
import { HardwarePanelSvg } from './components/HardwarePanelSvg';
import { SwitchboardPanel } from './components/SwitchboardPanel';
import { CheckZoneBar } from './components/CheckZoneBar';
import { SchematicSvg } from './components/SchematicSvg';
import { RetroDigitalClock } from './components/RetroDigitalClock';
import { KeypadModal } from './components/KeypadModal';
import { BulkPrintModal, TeacherPinModal, TeacherToolbar } from './components/TeacherPinModal';
import { PrintWorksheet, buildStandaloneWorksheetHtml } from './components/PrintWorksheet';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Flame,
  Lock,
  Moon,
  Printer,
  RotateCcw,
  ShieldCheck,
  Sun,
  Unlock,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';

const LS_KEYS = {
  theme: 'circuit_disarm_theme',
  teacherPin: 'circuit_disarm_teacher_pin',
  completed: 'circuit_disarm_completed_levels',
  confidence: 'circuit_disarm_confidence_tier',
  scenario: 'circuit_disarm_scenario',
};

const EMPTY_FAULT: FaultState = {
  locked: false,
  kind: null,
  title: '',
  detail: '',
  highlightWireIds: [],
  highlightComponentIds: [],
  highlightSwitchIds: [],
};

function buildInitialSwitches(level: LevelDefinition): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const sw of level.switches) {
    map[sw.id] = sw.initialClosed;
  }
  return map;
}

function buildInitialRheostats(level: LevelDefinition): Record<string, number> {
  const map: Record<string, number> = {};
  for (const comp of level.components) {
    if (comp.type === 'rheostat') {
      map[comp.id] = comp.initialOhms ?? 30;
    }
  }
  return map;
}

export default function App() {
  // Persistent preferences
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_KEYS.theme) === 'dark';
    } catch {
      return false;
    }
  });

  const [scenario, setScenario] = useState<ScenarioId>(() => {
    try {
      const saved = localStorage.getItem(LS_KEYS.scenario) as ScenarioId | null;
      return saved && saved in SCENARIOS ? saved : 'forensic';
    } catch {
      return 'forensic';
    }
  });

  const [confidenceTier, setConfidenceTier] = useState<ConfidenceTier>(() => {
    try {
      const saved = localStorage.getItem(LS_KEYS.confidence) as ConfidenceTier | null;
      return saved && saved in CONFIDENCE_TIERS ? saved : 'standard';
    } catch {
      return 'standard';
    }
  });

  const [completedLevelIds, setCompletedLevelIds] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.completed);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
    } catch {
      return [];
    }
  });

  const [teacherPin, setTeacherPin] = useState<string>(() => {
    try {
      return localStorage.getItem(LS_KEYS.teacherPin) || '2026';
    } catch {
      return '2026';
    }
  });

  // Global UI states
  const [activeLevelId, setActiveLevelId] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [teacherUnlocked, setTeacherUnlocked] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [bulkPrintModalOpen, setBulkPrintModalOpen] = useState(false);
  const [bulkPrintJob, setBulkPrintJob] = useState<{
    includeAnswerKeys: boolean;
    bulkLayout: 'grouped' | 'paired';
  } | null>(null);
  const [showViBadges, setShowViBadges] = useState(true);
  const [paperOnlyMode, setPaperOnlyMode] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [schematicDrawerOpen, setSchematicDrawerOpen] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const printWorksheetRef = useRef<HTMLDivElement | null>(null);

  // Active level electrical & interactive state
  const activeLevel = useMemo(
    () => (activeLevelId !== null ? LEVELS.find((l) => l.id === activeLevelId) ?? null : null),
    [activeLevelId],
  );

  const [switchStates, setSwitchStates] = useState<Record<string, boolean>>({});
  const [rheostatValues, setRheostatValues] = useState<Record<string, number>>({});
  const [unlockedHatches, setUnlockedHatches] = useState<Record<string, boolean>>({});
  const [blownFuseIds, setBlownFuseIds] = useState<string[]>([]);
  const [faultState, setFaultState] = useState<FaultState>(EMPTY_FAULT);
  const [isWon, setIsWon] = useState(false);
  const [activeHatchModal, setActiveHatchModal] = useState<CircuitHatch | null>(null);

  // Countdown timer & Level 9 heat gauge state
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [thermalPct, setThermalPct] = useState<number>(20);

  // Active inline Check Zones (Levels 6–10)
  const [activeCheckZoneIds, setActiveCheckZoneIds] = useState<string[]>([]);

  const winAnnouncedRef = useRef(false);

  // Sync Tailwind v4 `.dark` class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(LS_KEYS.theme, isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDark]);

  useEffect(() => {
    soundEngine.setMuted(muted);
  }, [muted]);

  const handleSelectScenario = (next: ScenarioId) => {
    setScenario(next);
    try {
      localStorage.setItem(LS_KEYS.scenario, next);
    } catch {
      // ignore
    }
  };

  const handleSelectConfidence = (tier: ConfidenceTier) => {
    setConfidenceTier(tier);
    try {
      localStorage.setItem(LS_KEYS.confidence, tier);
    } catch {
      // ignore
    }
    if (activeLevel) {
      setRemainingSeconds(computeLevelSeconds(activeLevel.standardSeconds, tier));
      if (faultState.kind === 'timeout') {
        setFaultState(EMPTY_FAULT);
      }
    }
  };

  const initialiseLevel = useCallback(
    (level: LevelDefinition, keepUnlockedHatches?: Record<string, boolean>) => {
      setSwitchStates(buildInitialSwitches(level));
      setRheostatValues(buildInitialRheostats(level));
      setUnlockedHatches(keepUnlockedHatches ?? {});
      setBlownFuseIds([]);
      setFaultState(EMPTY_FAULT);
      setIsWon(false);
      setActiveHatchModal(null);
      setRemainingSeconds(computeLevelSeconds(level.standardSeconds, confidenceTier));
      setThermalPct(level.thermalEnabled ? 78 : 20);
      setActiveCheckZoneIds([]);
      winAnnouncedRef.current = false;
    },
    [confidenceTier],
  );

  const handleLaunchLevel = useCallback(
    (levelId: number) => {
      const target = LEVELS.find((l) => l.id === levelId);
      if (!target) return;
      setActiveLevelId(levelId);
      setSchematicDrawerOpen(false);
      initialiseLevel(target);
    },
    [initialiseLevel],
  );

  const handleResetCircuit = useCallback(() => {
    if (!activeLevel) return;
    soundEngine.playSwitchClick(false);
    initialiseLevel(activeLevel, { ...unlockedHatches });
  }, [activeLevel, initialiseLevel, unlockedHatches]);

  // Solve live circuit via deterministic MNA engine
  const solution = useMemo(() => {
    if (!activeLevel) return null;
    return solveCircuit(
      activeLevel,
      switchStates,
      rheostatValues,
      blownFuseIds,
      scenario,
    );
  }, [activeLevel, switchStates, rheostatValues, blownFuseIds, scenario]);

  // React to solver faults & win states
  useEffect(() => {
    if (!activeLevel || !solution) return;

    if (solution.blownFuseIds.length > blownFuseIds.length) {
      setBlownFuseIds(solution.blownFuseIds);
    }

    if (!faultState.locked) {
      if (solution.shortCircuit.detected) {
        soundEngine.playFaultTrip();
        setShakeTrigger((n) => n + 1);
        setFaultState({
          locked: true,
          kind: 'short',
          title: 'SHORT CIRCUIT — BREAKER TRIPPED!',
          detail:
            'Direct loop from + to − with no load. Check the glowing red wires and press Reset.',
          highlightWireIds: solution.shortCircuit.faultWireIds,
          highlightComponentIds: ['V1'],
          highlightSwitchIds: solution.shortCircuit.faultSwitchIds,
        });
        return;
      }

      if (solution.blownFuseIds.length > 0) {
        soundEngine.playFaultTrip();
        setShakeTrigger((n) => n + 1);
        const fuseId = solution.blownFuseIds[0];
        const fuseComp = activeLevel.components.find((c) => c.id === fuseId);
        setFaultState({
          locked: true,
          kind: 'fuse',
          title: `FUSE ${fuseComp?.code ?? fuseId} BLEW!`,
          detail: `Current passed ${fuseComp?.maxCurrentAmps?.toFixed(1) ?? '5.0'} A and snapped the fuse. Switch off extra loads first.`,
          highlightWireIds: [],
          highlightComponentIds: solution.blownFuseIds,
          highlightSwitchIds: [],
        });
        return;
      }

      if (solution.overloadedComponentIds.length > 0) {
        soundEngine.playFaultTrip();
        setShakeTrigger((n) => n + 1);
        const cid = solution.overloadedComponentIds[0];
        const comp = activeLevel.components.find((c) => c.id === cid);
        const br = solution.branches[cid];
        setFaultState({
          locked: true,
          kind: 'overload',
          title: `${comp?.code ?? cid} OVERLOADED!`,
          detail: `Current hit ${Math.abs(br?.currentAmps ?? 0).toFixed(2)} A (limit ${comp?.maxCurrentAmps?.toFixed(2)} A). Use R = V ÷ I and set Dial VR1 first.`,
          highlightWireIds: [],
          highlightComponentIds: solution.overloadedComponentIds,
          highlightSwitchIds: [],
        });
        return;
      }

      if (solution.triggeredTrap) {
        soundEngine.playFaultTrip();
        setShakeTrigger((n) => n + 1);
        setFaultState({
          locked: true,
          kind: 'sequence',
          title: solution.triggeredTrap.title,
          detail: solution.triggeredTrap.detail,
          highlightWireIds: [],
          highlightComponentIds: [solution.triggeredTrap.componentId],
          highlightSwitchIds: [],
        });
        return;
      }
    }

    const thermalSatisfied = !activeLevel.thermalEnabled || thermalPct <= 42;
    if (solution.allConditionsMet && thermalSatisfied && !faultState.locked) {
      if (!winAnnouncedRef.current) {
        winAnnouncedRef.current = true;
        setIsWon(true);
        soundEngine.playDisarmSuccess();
        setCompletedLevelIds((prev) => {
          if (prev.includes(activeLevel.id)) return prev;
          const next = [...prev, activeLevel.id].sort((a, b) => a - b);
          try {
            localStorage.setItem(LS_KEYS.completed, JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
      }
    }
  }, [activeLevel, solution, blownFuseIds, faultState.locked, thermalPct]);

  // Deterministic 1-second Confidence Countdown Timer
  useEffect(() => {
    if (
      !activeLevel ||
      remainingSeconds === null ||
      faultState.locked ||
      isWon ||
      timerPaused
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          soundEngine.playFaultTrip();
          setShakeTrigger((n) => n + 1);
          setFaultState({
            locked: true,
            kind: 'timeout',
            title: "TIME'S UP — BOX LOCKED!",
            detail:
              'The red clock hit 00:00! Press Reset to try again, or choose a slower timer pace.',
            highlightWireIds: [],
            highlightComponentIds: [],
            highlightSwitchIds: [],
          });
          return 0;
        }
        if (prev <= 16) {
          soundEngine.playLowTimeTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeLevel, remainingSeconds, faultState.locked, isWon, timerPaused]);

  // Level 9 Heat Gauge Simulation
  useEffect(() => {
    if (!activeLevel?.thermalEnabled || !solution || faultState.locked || isWon) return;

    const interval = window.setInterval(() => {
      const wasteW = solution.totalWasteHeatWatts;
      setThermalPct((prev) => {
        if (wasteW > 70) {
          const next = Math.min(100, prev + 0.65);
          if (next >= 100) {
            soundEngine.playFaultTrip();
            setShakeTrigger((n) => n + 1);
            setFaultState({
              locked: true,
              kind: 'thermal',
              title: 'OVERHEATED — BOX LOCKED!',
              detail:
                'The hot filament globes wasted 85% of their energy as heat and overheated the box. Switch the hot globes off first and turn on the cool LEDs!',
              highlightWireIds: [],
              highlightComponentIds: ['LAMP1', 'LAMP2'],
              highlightSwitchIds: [],
            });
          }
          return next;
        }
        if (wasteW > 35) {
          return prev + (62 - prev) * 0.14;
        }
        return Math.max(18, prev - 3.6);
      });
    }, 250);

    return () => window.clearInterval(interval);
  }, [activeLevel, solution, faultState.locked, isWon]);

  // Tactile Switch Toggle
  const handleToggleSwitch = (switchId: string) => {
    if (!activeLevel || faultState.locked || isWon) return;
    const sw = activeLevel.switches.find((s) => s.id === switchId);
    if (!sw) return;
    if (sw.jammed) {
      soundEngine.playErrorBuzz();
      return;
    }
    if (sw.hatchId && !unlockedHatches[sw.hatchId]) {
      soundEngine.playErrorBuzz();
      return;
    }
    const nextClosed = !switchStates[switchId];
    soundEngine.playSwitchClick(nextClosed);
    setSwitchStates((prev) => ({ ...prev, [switchId]: nextClosed }));
  };

  const handleChangeRheostat = (componentId: string, ohms: number) => {
    if (faultState.locked || isWon) return;
    setRheostatValues((prev) => ({ ...prev, [componentId]: ohms }));
  };

  const handleUnlockHatch = (hatchId: string) => {
    setUnlockedHatches((prev) => ({ ...prev, [hatchId]: true }));
    setActiveHatchModal(null);
  };

  const handleForceUnlockHatches = () => {
    if (!activeLevel) return;
    const all: Record<string, boolean> = {};
    for (const h of activeLevel.hatches) {
      all[h.id] = true;
    }
    soundEngine.playHatchUnlock();
    setUnlockedHatches(all);
  };

  const handleToggleCheckZone = useCallback((zoneId: string) => {
    setActiveCheckZoneIds((prev) =>
      prev.includes(zoneId) ? prev.filter((id) => id !== zoneId) : [...prev, zoneId],
    );
  }, []);

  const handleToggleAllCheckZones = useCallback(
    (showAll: boolean) => {
      if (!activeLevel?.checkZones) return;
      setActiveCheckZoneIds(showAll ? activeLevel.checkZones.map((z) => z.id) : []);
    },
    [activeLevel],
  );

  const handleUpdatePin = (newPin: string) => {
    setTeacherPin(newPin);
    try {
      localStorage.setItem(LS_KEYS.teacherPin, newPin);
    } catch {
      // ignore
    }
  };

  const handleClearProgress = () => {
    setCompletedLevelIds([]);
    try {
      localStorage.removeItem(LS_KEYS.completed);
    } catch {
      // ignore
    }
  };

  const handlePrintWorksheet = () => {
    setBulkPrintJob(null);
    window.setTimeout(() => window.print(), 30);
  };

  const handleBulkPrint = (
    includeAnswerKeys: boolean,
    bulkLayout: 'grouped' | 'paired',
  ) => {
    setBulkPrintModalOpen(false);
    setBulkPrintJob({ includeAnswerKeys, bulkLayout });

    const cleanup = () => {
      setBulkPrintJob(null);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    window.setTimeout(() => {
      window.print();
    }, 80);
  };

  const handleBulkDownload = (
    includeAnswerKeys: boolean,
    bulkLayout: 'grouped' | 'paired',
  ) => {
    setBulkPrintModalOpen(false);
    setBulkPrintJob({ includeAnswerKeys, bulkLayout });

    window.setTimeout(() => {
      const container = printWorksheetRef.current;
      if (container) {
        const meta = SCENARIOS[scenario];
        const pageCount = includeAnswerKeys ? LEVELS.length * 2 : LEVELS.length;
        const docTitle = includeAnswerKeys
          ? `Circuit Disarm — All 10 Circuit Maps & Teacher Answer Keys (${meta.name})`
          : `Circuit Disarm — All 10 Student Circuit Maps & Questions (${meta.name})`;
        const html = buildStandaloneWorksheetHtml(
          container.innerHTML,
          docTitle,
          pageCount,
        );
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = includeAnswerKeys
          ? `circuit-disarm-all-10-maps-with-keys-${scenario}.html`
          : `circuit-disarm-all-10-student-maps-${scenario}.html`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setBulkPrintJob(null);
    }, 80);
  };

  const scenarioMeta = SCENARIOS[scenario];
  const baseTotalSeconds = activeLevel
    ? computeLevelSeconds(activeLevel.standardSeconds, confidenceTier)
    : null;
  const completedSet = new Set(completedLevelIds);

  return (
    <div className="relative min-h-screen flex flex-col text-slate-900 dark:text-slate-100">
      {/* ================================================================= */}
      {/* FULL-BLEED THEMED SCENARIO BACKDROP (Hidden on print)             */}
      {/* ================================================================= */}
      <div className="no-print fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${scenarioMeta.fallbackGradient}`}
        />
        <img
          key={scenarioMeta.backgroundImage}
          src={scenarioMeta.backgroundImage}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        {/* Calibrated Light/Dark atmosphere scrim so world shines cleanly while keeping high readability */}
        <div
          className={`absolute inset-0 transition-colors duration-300 ${
            isDark
              ? 'bg-slate-950/72'
              : 'bg-gradient-to-b from-slate-100/72 via-slate-100/62 to-slate-200/78'
          }`}
        />
        {/* Red alert vignette flash during Fault Lockout */}
        {faultState.locked && (
          <div className="absolute inset-0 bg-red-600/20 ring-inset ring-8 ring-red-600/60" />
        )}
      </div>

      {/* ================================================================= */}
      {/* TOP NAVIGATION BAR (Clean 3-Zone Contract, hidden on print)       */}
      {/* ================================================================= */}
      <header className="no-print sticky top-0 z-30 border-b border-slate-300/80 dark:border-slate-800 bg-white/90 dark:bg-[#0d111a]/92 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveLevelId(null)}
            className="inline-flex items-center gap-2 text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white hover:opacity-80 transition-opacity whitespace-nowrap shrink-0"
          >
            <Zap className={`w-4 h-4 ${scenarioMeta.accentTextClass}`} />
            <span>Circuit Disarm</span>
          </button>

          {/* Zone 2: Concise single-line navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setActiveLevelId(null)}
              className={`hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activeLevelId === null ? `${scenarioMeta.accentTextClass} font-bold` : ''
              }`}
            >
              Mission Hub
            </button>

            {/* Quick Scenario Switcher */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800">
              {(['forensic', 'rov', 'outback'] as ScenarioId[]).map((sid) => (
                <button
                  key={sid}
                  type="button"
                  onClick={() => handleSelectScenario(sid)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                    scenario === sid
                      ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {SCENARIOS[sid].shortName}
                </button>
              ))}
            </div>

            {activeLevel && !paperOnlyMode && (
              <button
                type="button"
                onClick={() => setSchematicDrawerOpen(true)}
                className={`inline-flex items-center gap-1.5 font-semibold hover:underline whitespace-nowrap shrink-0 ${scenarioMeta.accentTextClass}`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Circuit Map
              </button>
            )}
          </nav>

          {/* Zone 3: Utility icons + Primary Print CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
              title={muted ? 'Unmute audio' : 'Mute audio'}
              className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setIsDark((d) => !d)}
              aria-label={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                if (teacherUnlocked) {
                  setTeacherUnlocked(false);
                  setPaperOnlyMode(false);
                  setTimerPaused(false);
                  setBulkPrintModalOpen(false);
                } else {
                  setPinModalOpen(true);
                }
              }}
              aria-label={teacherUnlocked ? 'Lock Teacher Mode' : 'Unlock Teacher Mode'}
              title={teacherUnlocked ? 'Teacher Mode Active (click to lock)' : 'Teacher Mode'}
              className={`p-2 rounded-lg transition-colors ${
                teacherUnlocked
                  ? 'bg-amber-400/30 text-amber-900 dark:text-amber-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              {teacherUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>

            {activeLevel && (
              <button
                type="button"
                onClick={handlePrintWorksheet}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 text-xs font-bold transition-colors whitespace-nowrap shrink-0 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Map
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Teacher Mode Demonstration Bar */}
      {teacherUnlocked && (
        <TeacherToolbar
          levels={LEVELS}
          activeLevelId={activeLevelId}
          showViBadges={showViBadges}
          paperOnlyMode={paperOnlyMode}
          timerPaused={timerPaused}
          onJumpLevel={handleLaunchLevel}
          onForceUnlockHatches={handleForceUnlockHatches}
          onToggleViBadges={() => setShowViBadges((v) => !v)}
          onTogglePaperOnly={() => {
            setPaperOnlyMode((p) => {
              const next = !p;
              if (next) setSchematicDrawerOpen(false);
              return next;
            });
          }}
          onTogglePauseTimer={() => setTimerPaused((p) => !p)}
          onOpenBulkPrint={() => setBulkPrintModalOpen(true)}
          onUpdatePin={handleUpdatePin}
          onLockTeacher={() => {
            setTeacherUnlocked(false);
            setPaperOnlyMode(false);
            setTimerPaused(false);
            setBulkPrintModalOpen(false);
          }}
        />
      )}

      {/* ================================================================= */}
      {/* MAIN CONTENT: MISSION HUB OR PHYSICAL HARDWARE WORKBENCH          */}
      {/* ================================================================= */}
      <div className="no-print flex-1">
        {activeLevel === null || !solution ? (
          <MissionHub
            levels={LEVELS}
            scenario={scenario}
            confidenceTier={confidenceTier}
            completedLevelIds={completedLevelIds}
            onSelectScenario={handleSelectScenario}
            onSelectConfidence={handleSelectConfidence}
            onLaunchLevel={handleLaunchLevel}
            onClearProgress={handleClearProgress}
          />
        ) : (
          <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 space-y-4">
            {/* Sleek Mission Header & 10-Mission Campaign Strip */}
            <div className="rounded-xl border border-slate-300/80 dark:border-slate-700/80 bg-white/88 dark:bg-slate-950/82 backdrop-blur-md px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
                  <span className={`font-bold ${scenarioMeta.accentTextClass}`}>
                    {scenarioMeta.name}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{activeLevel.phaseTitle}</span>
                </div>
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-0.5">
                  Mission {String(activeLevel.id).padStart(2, '0')}: {activeLevel.title}
                </h1>
              </div>

              {/* Compact 10-Mission Quick Selector */}
              <div className="flex flex-wrap items-center gap-1">
                {LEVELS.map((lvl) => {
                  const isCurrent = lvl.id === activeLevel.id;
                  const isDone = completedSet.has(lvl.id);
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => handleLaunchLevel(lvl.id)}
                      title={`Mission ${lvl.id}: ${lvl.title}`}
                      className={`w-7 h-7 rounded-md font-mono text-xs font-bold transition-all ${
                        isCurrent
                          ? `${scenarioMeta.accentBgClass} shadow-sm scale-105`
                          : isDone
                            ? 'bg-emerald-600/20 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {String(lvl.id).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                {!paperOnlyMode ? (
                  <button
                    type="button"
                    onClick={() => setSchematicDrawerOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-amber-500 dark:hover:border-amber-400 text-xs font-bold text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    View Circuit Map
                  </button>
                ) : (
                  <span className="text-xs font-mono font-semibold text-amber-700 dark:text-amber-400">
                    Paper-Only · Use Printed Map
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleResetCircuit}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            </div>

            {/* Two-Zone Game Workbench (~68% Tactile Hardware Case / ~32% Red Clock + Checklist) */}
            <div className="grid lg:grid-cols-12 gap-5 items-start">
              {/* LEFT ZONE: HYBRID WIRED BAY OR INDUSTRIAL SWITCHBOARD */}
              <section className="lg:col-span-8 space-y-3">
                <div
                  key={shakeTrigger}
                  className={`relative rounded-2xl border-2 overflow-hidden shadow-2xl ${
                    faultState.locked
                      ? 'border-red-600 animate-chassis-shake'
                      : isWon
                        ? 'border-emerald-500'
                        : 'border-slate-700/80 dark:border-slate-600/80'
                  } bg-slate-900/90 backdrop-blur-sm`}
                >
                  {/* Scenario-Themed Caution / Bulkhead / Storm Trim Strip */}
                  <div className={`h-2 w-full ${scenarioMeta.stripeClass}`} />

                  <div className="relative p-2 sm:p-3">
                    {activeLevel.panelStyle === 'switchboard' ? (
                      <SwitchboardPanel
                        level={activeLevel}
                        scenario={scenario}
                        switchStates={switchStates}
                        rheostatValues={rheostatValues}
                        unlockedHatches={unlockedHatches}
                        solution={solution}
                        faultState={faultState}
                        showViBadges={showViBadges}
                        activeCheckZoneIds={activeCheckZoneIds}
                        onToggleCheckZone={handleToggleCheckZone}
                        onToggleAllCheckZones={handleToggleAllCheckZones}
                        onToggleSwitch={handleToggleSwitch}
                        onChangeRheostat={handleChangeRheostat}
                        onOpenHatch={(hatch) => setActiveHatchModal(hatch)}
                      />
                    ) : (
                      <HardwarePanelSvg
                        level={activeLevel}
                        scenario={scenario}
                        switchStates={switchStates}
                        rheostatValues={rheostatValues}
                        unlockedHatches={unlockedHatches}
                        solution={solution}
                        faultState={faultState}
                        showViBadges={showViBadges}
                        isDark={isDark}
                        activeCheckZoneIds={activeCheckZoneIds}
                        onToggleCheckZone={handleToggleCheckZone}
                        onToggleSwitch={handleToggleSwitch}
                        onChangeRheostat={handleChangeRheostat}
                        onOpenHatch={(hatch) => setActiveHatchModal(hatch)}
                      />
                    )}
                  </div>
                </div>

                {/* Inline Check Zones Bar for Wired Bays with Measurements (Level 7) */}
                {activeLevel.panelStyle !== 'switchboard' &&
                  activeLevel.checkZones &&
                  activeLevel.checkZones.length > 0 && (
                    <CheckZoneBar
                      zones={activeLevel.checkZones}
                      solution={solution}
                      activeZoneIds={activeCheckZoneIds}
                      onToggleZone={handleToggleCheckZone}
                      onToggleAll={handleToggleAllCheckZones}
                    />
                  )}
              </section>

              {/* RIGHT ZONE: RETRO RED DIGITAL CLOCK, OBJECTIVES & ACTION DECK */}
              <aside className="lg:col-span-4 space-y-4">
                {/* Retro Old-Style Red 7-Segment LED Digital Clock */}
                <RetroDigitalClock
                  remainingSeconds={remainingSeconds}
                  totalSeconds={baseTotalSeconds}
                  confidenceTier={confidenceTier}
                  isLevelOne={activeLevel.id === 1}
                  isWon={isWon}
                  isLockedOut={faultState.locked}
                  isPaused={timerPaused}
                  onSelectConfidence={handleSelectConfidence}
                />

                {/* FAULT LOCKOUT ALERT */}
                {faultState.locked && (
                  <div className="animate-stamp-pop rounded-xl border-2 border-red-600 bg-red-950/95 text-red-50 p-4 space-y-3 shadow-xl">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h2 className="text-sm font-extrabold font-mono text-red-300 tracking-wide">
                          {faultState.title}
                        </h2>
                        <p className="text-xs leading-relaxed text-red-100/90">
                          {faultState.detail}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetCircuit}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold tracking-wide transition-colors shadow"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Device &amp; Try Again
                    </button>
                  </div>
                )}

                {/* VICTORY STAMP & NEXT MISSION */}
                {isWon && !faultState.locked && (
                  <div className="animate-stamp-pop rounded-xl border-2 border-emerald-500 bg-emerald-950/92 text-emerald-50 p-4 space-y-3 shadow-xl">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h2 className="text-base font-extrabold font-mono tracking-wider text-emerald-300">
                          {scenarioMeta.successHeadline}
                        </h2>
                        <p className="text-xs leading-relaxed text-emerald-100/90">
                          {activeLevel.debriefNote}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeLevel.id < LEVELS.length ? (
                        <button
                          type="button"
                          onClick={() => handleLaunchLevel(activeLevel.id + 1)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-colors"
                        >
                          Next Mission (Mission {String(activeLevel.id + 1).padStart(2, '0')})
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveLevelId(null)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-colors"
                        >
                          All 10 Missions Cleared! Return to Hub
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* EXPLICIT LEVEL 5 ANTI-TAMPER WARNING */}
                {activeLevel.antiTamperWarning && (
                  <div className="rounded-xl border-2 border-red-500/90 bg-red-950/90 text-red-50 p-3.5 flex items-start gap-2.5 shadow-md">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold leading-relaxed text-red-100">
                      {activeLevel.antiTamperWarning}
                    </p>
                  </div>
                )}

                {/* LEVEL 9 LIVE HEAT GAUGE */}
                {activeLevel.thermalEnabled && (
                  <div className="rounded-xl border border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-950/85 backdrop-blur-md p-4 space-y-2 shadow-md">
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-white">
                        <Flame
                          className={`w-4 h-4 ${
                            thermalPct > 70
                              ? 'text-red-600 dark:text-red-400'
                              : thermalPct > 42
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        />
                        Box Heat Gauge
                      </span>
                      <span className="font-mono font-bold tabular-nums text-slate-800 dark:text-slate-200">
                        {Math.round(thermalPct)}% · {solution.totalWasteHeatWatts.toFixed(1)} W heat
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-200 ${
                          thermalPct > 75
                            ? 'bg-red-600'
                            : thermalPct > 42
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.round(thermalPct)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Cool the box below 42% by switching off the hot globes and turning on the cool LEDs.
                    </p>
                  </div>
                )}

                {/* CONCISE MISSION BRIEFING + HIGHLIGHTED CHECK ZONES */}
                <div className="rounded-xl border border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-950/85 backdrop-blur-md p-4 space-y-2.5 shadow-md">
                  <h2 className={`text-xs font-mono font-bold uppercase tracking-wider ${scenarioMeta.accentTextClass}`}>
                    Mission
                  </h2>
                  <p className="text-sm leading-snug text-slate-800 dark:text-slate-200">
                    {activeLevel.briefings[scenario]}
                  </p>

                  {activeLevel.checkZones &&
                    activeLevel.checkZones.some((z) => z.highlight) && (
                      <div className="pt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10.5px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                          Key Checks:
                        </span>
                        {activeLevel.checkZones
                          .filter((z) => z.highlight)
                          .map((z) => {
                            const isOpen = activeCheckZoneIds.includes(z.id);
                            return (
                              <button
                                key={z.id}
                                type="button"
                                onClick={() => {
                                  soundEngine.playKeypadBeep(z.kind === 'V' ? 2 : 5);
                                  handleToggleCheckZone(z.id);
                                }}
                                className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold border transition-colors ${
                                  isOpen
                                    ? z.kind === 'V'
                                      ? 'bg-amber-400 border-amber-500 text-slate-950'
                                      : 'bg-sky-400 border-sky-500 text-slate-950'
                                    : z.kind === 'V'
                                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25'
                                      : 'bg-sky-500/15 border-sky-500/50 text-sky-800 dark:text-sky-300 hover:bg-sky-500/25'
                                }`}
                              >
                                {z.kind}: {z.label}
                              </button>
                            );
                          })}
                      </div>
                    )}
                </div>

                {/* CHECKLIST */}
                <div className="rounded-xl border border-slate-300/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-950/85 backdrop-blur-md p-4 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Checklist
                    </h2>
                    <span className="text-xs font-mono font-bold tabular-nums text-slate-700 dark:text-slate-300">
                      {solution.winChecks.filter((w) => w.satisfied).length} / {solution.winChecks.length}
                    </span>
                  </div>

                  <ul className="divide-y divide-slate-200/80 dark:divide-slate-800">
                    {solution.winChecks.map((wc) => {
                      const comp = activeLevel.components.find((c) => c.id === wc.componentId);
                      return (
                        <li
                          key={wc.conditionId}
                          className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {wc.satisfied ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                {wc.label}
                              </div>
                              <div className="font-mono text-[10.5px] text-slate-500 dark:text-slate-400">
                                {comp?.code} · {wc.targetText}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`font-mono text-[11px] font-bold tabular-nums shrink-0 ${
                              wc.satisfied
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {wc.currentText}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </aside>
            </div>
          </main>
        )}
      </div>

      {/* ================================================================= */}
      {/* FIELD MANUAL REFERENCE SCHEMATIC DRAWER (Hidden in Paper-Only)    */}
      {/* ================================================================= */}
      {schematicDrawerOpen && activeLevel && !paperOnlyMode && (
        <div
          className="no-print fixed inset-0 z-40 flex justify-end bg-slate-950/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="schematic-drawer-title"
        >
          <div className="w-full max-w-3xl bg-white dark:bg-[#111726] border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl">
            <div className={`h-1.5 w-full ${scenarioMeta.stripeClass}`} />
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 id="schematic-drawer-title" className="text-base font-extrabold text-slate-900 dark:text-white">
                  Circuit Map · Mission {String(activeLevel.id).padStart(2, '0')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Find the switch numbers (S1–S{activeLevel.switches.length}) on this map, then flip those same switches on the box.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintWorksheet}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Sheet
                </button>
                <button
                  type="button"
                  onClick={() => setSchematicDrawerOpen(false)}
                  aria-label="Close circuit map drawer"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-slate-900 dark:text-slate-100">
                <SchematicSvg
                  level={activeLevel}
                  scenario={scenario}
                  switchStates={switchStates}
                  rheostatValues={rheostatValues}
                  solution={solution}
                  unlockedHatches={unlockedHatches}
                  showViBadges={showViBadges}
                />
              </div>

              {activeLevel.antiTamperWarning && (
                <div className="rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950/40 p-3 text-xs font-bold text-red-900 dark:text-red-200">
                  {activeLevel.antiTamperWarning}
                </div>
              )}

              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-1.5 text-xs">
                <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  Quick Formula Helper
                </div>
                <div className="grid sm:grid-cols-2 gap-1.5 font-mono text-slate-600 dark:text-slate-300 pt-1">
                  <span>Ohm’s Law: V = I × R · R = V ÷ I</span>
                  <span>In Series: Volts add up (V₁ + V₂)</span>
                  <span>In Parallel: Amps add up (I₁ + I₂)</span>
                  <span>Efficiency: (Useful ÷ Total) × 100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Field Manual Hatch Keypad Modal */}
      {activeHatchModal && (
        <KeypadModal
          hatch={activeHatchModal}
          onUnlock={handleUnlockHatch}
          onClose={() => setActiveHatchModal(null)}
        />
      )}

      {/* Teacher Mode Access Code Modal */}
      {pinModalOpen && (
        <TeacherPinModal
          storedPin={teacherPin}
          onUnlock={() => {
            setTeacherUnlocked(true);
            setPinModalOpen(false);
          }}
          onClose={() => setPinModalOpen(false)}
        />
      )}

      {/* Teacher Mode Bulk Print / Download All 10 Modal */}
      {bulkPrintModalOpen && teacherUnlocked && (
        <BulkPrintModal
          scenario={scenario}
          onBulkPrint={handleBulkPrint}
          onBulkDownload={handleBulkDownload}
          onClose={() => setBulkPrintModalOpen(false)}
        />
      )}

      {/* ================================================================= */}
      {/* MONOCHROME A4 PRINT WORKSHEET LAYER (@media print ONLY)           */}
      {/* ================================================================= */}
      {(bulkPrintJob || activeLevel) && (
        <PrintWorksheet
          ref={printWorksheetRef}
          levels={bulkPrintJob ? LEVELS : activeLevel ? [activeLevel] : []}
          scenario={scenario}
          includeTeacherAnswerKey={
            bulkPrintJob ? bulkPrintJob.includeAnswerKeys : teacherUnlocked
          }
          bulkLayout={bulkPrintJob ? bulkPrintJob.bulkLayout : 'paired'}
        />
      )}
    </div>
  );
}
