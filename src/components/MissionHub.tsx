import React from 'react';
import { ConfidenceTier, LevelDefinition, ScenarioId } from '../types/circuit';
import {
  CONFIDENCE_TIERS,
  SCENARIOS,
  computeLevelSeconds,
  formatCountdown,
} from '../data/scenarios';
import {
  ArrowRight,
  Check,
  Compass,
  Gauge,
  Radio,
  ShieldAlert,
  Zap,
} from 'lucide-react';

interface MissionHubProps {
  levels: LevelDefinition[];
  scenario: ScenarioId;
  confidenceTier: ConfidenceTier;
  completedLevelIds: number[];
  onSelectScenario: (scenario: ScenarioId) => void;
  onSelectConfidence: (tier: ConfidenceTier) => void;
  onLaunchLevel: (levelId: number) => void;
  onClearProgress: () => void;
}

const SCENARIO_ICONS: Record<ScenarioId, React.ReactNode> = {
  forensic: <ShieldAlert className="w-4 h-4" />,
  rov: <Compass className="w-4 h-4" />,
  outback: <Radio className="w-4 h-4" />,
};

export const MissionHub: React.FC<MissionHubProps> = ({
  levels,
  scenario,
  confidenceTier,
  completedLevelIds,
  onSelectScenario,
  onSelectConfidence,
  onLaunchLevel,
  onClearProgress,
}) => {
  const completedSet = new Set(completedLevelIds);
  const activeScenario = SCENARIOS[scenario];
  const levelOnePreview = formatCountdown(
    computeLevelSeconds(levels[0].standardSeconds, confidenceTier),
  );

  const operations = [
    {
      num: 1 as const,
      title: 'Stage 1 · Wires, Switches & Traps',
      subtitle: 'Missions 01–05 · Read the circuit map, dodge short circuits, and beat the alarm trap.',
    },
    {
      num: 2 as const,
      title: 'Stage 2 · Using the Pocket Meter',
      subtitle: 'Missions 06–08 · Pocket Meter unlocked — check Volts and Amps, turn Resistance Dials, and protect the 5 A fuse.',
    },
    {
      num: 3 as const,
      title: 'Stage 3 · Heat, One-Way Diodes & Final Box',
      subtitle: 'Missions 09–10 · Cool down a hot box, crack one-way diodes, and unlock the 2-sided final challenge.',
    },
  ];

  return (
    <main className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-9">
      {/* Hero Banner framed cleanly over the active themed backdrop */}
      <section className="rounded-2xl border border-slate-300/80 dark:border-slate-700/80 bg-white/88 dark:bg-slate-950/82 backdrop-blur-md shadow-xl overflow-hidden">
        <div className={`h-2 w-full ${activeScenario.stripeClass}`} />
        <div className="p-6 sm:p-8 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-3.5">
            <div className={`inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider ${activeScenario.accentTextClass}`}>
              <Zap className="w-3.5 h-3.5" />
              <span>{activeScenario.accentLabel}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Read the map. Beat the clock. Disarm the box.
            </h1>
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed max-w-2xl">
              Each box is packed with coloured wire bundles and labelled switches (<span className="font-mono font-bold">S1–S8</span>). Use your printed Circuit Map to flip the right switches, crack secret keypad codes, and clear all ten missions before the red timer hits zero.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onLaunchLevel(1)}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-extrabold tracking-tight shadow-md transition-transform active:scale-95 whitespace-nowrap ${activeScenario.accentBgClass}`}
              >
                Start Mission 01
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                {completedLevelIds.length} / 10 cleared · All missions unlocked
                {completedLevelIds.length > 0 && (
                  <>
                    {' '}·{' '}
                    <button
                      type="button"
                      onClick={onClearProgress}
                      className="underline hover:text-slate-900 dark:hover:text-white"
                    >
                      Reset checks
                    </button>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Mini Retro Red LED Clock Preview + Confidence Pace Selector */}
          <div className="lg:col-span-5 rounded-xl border-2 border-slate-800 bg-[#11141c] text-slate-100 p-4 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold tracking-widest text-slate-400">
                COUNTDOWN DIFFICULTY
              </span>
              <span className="font-mono text-xl font-bold tabular-nums tracking-widest text-[#ff3333] drop-shadow-[0_0_8px_rgba(255,43,43,0.75)] bg-[#06070a] px-2.5 py-0.5 rounded border border-slate-800">
                {levelOnePreview}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pick your clock pace based on confidence (you can also switch this anytime on Mission 01).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-lg bg-[#090b10] border border-slate-800">
              {(['untimed', 'learner', 'standard', 'extreme'] as ConfidenceTier[]).map((tier) => {
                const cfg = CONFIDENCE_TIERS[tier];
                const active = confidenceTier === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => onSelectConfidence(tier)}
                    className={`px-2 py-2 rounded-md text-xs font-mono font-bold transition-colors whitespace-nowrap ${
                      active
                        ? tier === 'extreme'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              {CONFIDENCE_TIERS[confidenceTier].summary}
            </p>
          </div>
        </div>
      </section>

      {/* Atmospheric Scenario Theme Cards with Live Backdrop Artwork */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white drop-shadow-sm">
            01. Pick Your World
          </h2>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Changes the story, backdrop art &amp; mission labels
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {(['forensic', 'rov', 'outback'] as ScenarioId[]).map((id) => {
            const meta = SCENARIOS[id];
            const selected = scenario === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectScenario(id)}
                className={`group relative text-left rounded-xl overflow-hidden border-2 transition-all h-44 flex flex-col justify-end p-4 shadow-md ${
                  selected
                    ? `${meta.accentRingClass} scale-[1.01] shadow-xl`
                    : 'border-slate-300/80 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                {/* Fallback gradient + generated background art */}
                <div className={`absolute inset-0 bg-gradient-to-br ${meta.fallbackGradient}`} />
                <img
                  src={meta.backgroundImage}
                  alt={meta.name}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Measured legibility scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/15" />

                <div className="relative z-10 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-white">
                      {SCENARIO_ICONS[id]}
                      {meta.name}
                    </span>
                    {selected && (
                      <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-snug text-slate-200 line-clamp-2">
                    {meta.tagline}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Ten-Mission Operations Grid */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white drop-shadow-sm">
            02. Pick a Mission (01–10)
          </h2>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Jump straight into any mission · Print Circuit Maps inside each level
          </span>
        </div>

        <div className="space-y-6">
          {operations.map((op) => {
            const opLevels = levels.filter((l) => l.phase === op.num);
            return (
              <div
                key={op.num}
                className="rounded-2xl border border-slate-300/80 dark:border-slate-700/80 bg-white/88 dark:bg-slate-950/80 backdrop-blur-md p-5 space-y-4 shadow-lg"
              >
                <div className="border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {op.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {op.subtitle}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {opLevels.map((lvl) => {
                    const isDone = completedSet.has(lvl.id);
                    const secs = computeLevelSeconds(lvl.standardSeconds, confidenceTier);
                    const gear: string[] = [`${lvl.switches.length} switches`];
                    if (lvl.hardwarePanels && lvl.hardwarePanels.length > 1) gear.push('2-Sided Box');
                    if (lvl.multimeterEnabled) gear.push('Pocket Meter');
                    if (lvl.components.some((c) => c.type === 'rheostat')) gear.push('Resistance Dial');
                    if (lvl.components.some((c) => c.type === 'fuse')) gear.push('5 A Fuse');
                    if (lvl.thermalEnabled) gear.push('Heat Gauge');
                    if (lvl.components.some((c) => c.type === 'diode')) gear.push('One-Way Diodes');

                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => onLaunchLevel(lvl.id)}
                        className="group text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121928] hover:border-amber-500 dark:hover:border-amber-400 p-4 transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="font-bold text-slate-500 dark:text-slate-400">
                              MISSION {String(lvl.id).padStart(2, '0')}
                            </span>
                            {isDone ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                                <Check className="w-3.5 h-3.5" />
                                Cleared
                              </span>
                            ) : (
                              <span className="tabular-nums font-bold text-red-600 dark:text-red-400">
                                {formatCountdown(secs)}
                              </span>
                            )}
                          </div>

                          <div className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                            {lvl.title}
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {lvl.briefings[scenario]}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1.5 truncate">
                            {lvl.multimeterEnabled && (
                              <Gauge className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                            )}
                            <span className="truncate">{gear.join(' · ')}</span>
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
};
