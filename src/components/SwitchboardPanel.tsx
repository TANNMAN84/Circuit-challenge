import React from 'react';
import {
  CircuitComponent,
  CircuitHatch,
  CircuitSolution,
  CircuitSwitch,
  FaultState,
  LevelDefinition,
  ScenarioId,
} from '../types/circuit';
import { SCENARIOS } from '../data/scenarios';
import { CheckZoneBar } from './CheckZoneBar';
import { Flame, Lock, Sliders, Unlock } from 'lucide-react';

interface SwitchboardPanelProps {
  level: LevelDefinition;
  scenario: ScenarioId;
  switchStates: Record<string, boolean>;
  rheostatValues: Record<string, number>;
  unlockedHatches: Record<string, boolean>;
  solution: CircuitSolution;
  faultState: FaultState;
  showViBadges: boolean;
  activeCheckZoneIds: string[];
  onToggleCheckZone: (zoneId: string) => void;
  onToggleAllCheckZones: (showAll: boolean) => void;
  onToggleSwitch: (switchId: string) => void;
  onChangeRheostat: (componentId: string, ohms: number) => void;
  onOpenHatch: (hatch: CircuitHatch) => void;
}

const TactileSwitchTile: React.FC<{
  sw: CircuitSwitch;
  isClosed: boolean;
  isFault: boolean;
  disabled: boolean;
  onToggle: () => void;
}> = ({ sw, isClosed, isFault, disabled, onToggle }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`group relative flex flex-col items-center justify-between rounded-xl border-2 px-2.5 py-3 transition-all select-none ${
        isFault
          ? 'bg-red-950/80 border-red-500 shadow-[0_0_14px_rgba(239,68,68,0.45)]'
          : sw.jammed
            ? 'bg-slate-900/90 border-red-500/70 cursor-not-allowed'
            : isClosed
              ? 'bg-[#1a2436] border-emerald-500/80 hover:border-emerald-400 shadow-md active:scale-[0.98]'
              : 'bg-[#141a26] border-slate-700 hover:border-amber-400/80 shadow-sm active:scale-[0.98]'
      }`}
    >
      {/* Top Row: Stamped Switch Tag + Status LED */}
      <div className="w-full flex items-center justify-between">
        <span className="font-mono text-sm font-extrabold tracking-tight text-white">
          {sw.label}
        </span>
        <span
          className={`w-2.5 h-2.5 rounded-full border ${
            sw.jammed
              ? 'bg-red-500 border-red-300 shadow-[0_0_6px_#ef4444]'
              : isClosed
                ? 'bg-emerald-400 border-emerald-200 shadow-[0_0_8px_#34d399]'
                : 'bg-slate-700 border-slate-500'
          }`}
        />
      </div>

      {/* Tactile Vertical Rocker / Toggle Lever */}
      <div className="my-2.5 relative w-11 h-16 rounded-lg bg-[#090d14] border border-slate-700 shadow-inner flex items-center justify-center p-1">
        <div
          className={`w-full h-7 rounded-md border transition-transform duration-150 flex items-center justify-center shadow ${
            isClosed
              ? '-translate-y-3 bg-gradient-to-b from-emerald-400 to-emerald-600 border-emerald-300 text-slate-950'
              : 'translate-y-3 bg-gradient-to-b from-slate-500 to-slate-700 border-slate-400 text-white'
          }`}
        >
          <span className="w-4 h-0.5 rounded-full bg-black/30" />
        </div>
      </div>

      {/* Bottom Status Plate */}
      {sw.jammed ? (
        <span className="px-1.5 py-0.5 rounded bg-red-600 text-[9.5px] font-mono font-extrabold text-white tracking-wider">
          STUCK {isClosed ? 'ON' : 'OFF'}
        </span>
      ) : (
        <span
          className={`font-mono text-[11px] font-extrabold tracking-wider ${
            isClosed ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          {isClosed ? 'ON' : 'OFF'}
        </span>
      )}
    </button>
  );
};

const HardwareModuleCard: React.FC<{
  comp: CircuitComponent;
  scenario: ScenarioId;
  solution: CircuitSolution;
  isFault: boolean;
  showViBadges: boolean;
  thermalEnabled?: boolean;
}> = ({ comp, scenario, solution, isFault, showViBadges, thermalEnabled }) => {
  const br = solution.branches[comp.id];
  const isOn = Boolean(br?.isEnergised);
  const amps = Math.abs(br?.currentAmps ?? 0);
  const volts = Math.abs(br?.voltageDropVolts ?? 0);
  const fanSpinSeconds = isOn ? Math.max(0.28, 1.35 / Math.max(amps * 2.1, 0.35)) : 0;

  return (
    <div
      className={`rounded-xl border-2 px-3 py-2.5 flex flex-col justify-between gap-2 transition-all ${
        isFault
          ? 'bg-red-950/75 border-red-500 shadow-[0_0_16px_rgba(239,68,68,0.4)]'
          : isOn
            ? comp.type === 'siren'
              ? 'bg-red-950/45 border-red-500/80'
              : comp.type === 'lamp' && thermalEnabled
                ? 'bg-orange-950/50 border-orange-500/80'
                : 'bg-[#172231] border-emerald-500/70'
            : 'bg-[#111722] border-slate-700/80'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300">
          {comp.code}
        </span>
        <span
          className={`font-mono text-[10.5px] font-extrabold ${
            isFault
              ? 'text-red-400'
              : isOn
                ? comp.type === 'siren'
                  ? 'text-red-400'
                  : comp.type === 'lamp' && thermalEnabled
                    ? 'text-orange-300'
                    : 'text-emerald-400'
                : 'text-slate-500'
          }`}
        >
          {isFault ? 'FAULT' : isOn ? 'ON' : 'OFF'}
        </span>
      </div>

      {/* Crisp Visual Hardware Indicator */}
      <div className="flex items-center gap-2.5 py-0.5">
        <div className="w-10 h-10 rounded-lg bg-[#090d14] border border-slate-700 flex items-center justify-center shrink-0">
          {comp.type === 'led' && (
            <span
              className={`w-5 h-5 rounded-full border-2 transition-all ${
                isOn
                  ? comp.ledColour === 'amber'
                    ? 'bg-amber-400 border-amber-200 shadow-[0_0_12px_#fbbf24]'
                    : comp.ledColour === 'cyan'
                      ? 'bg-cyan-400 border-cyan-200 shadow-[0_0_12px_#22d3ee]'
                      : 'bg-emerald-400 border-emerald-200 shadow-[0_0_12px_#34d399]'
                  : 'bg-slate-800 border-slate-600'
              }`}
            />
          )}

          {comp.type === 'lamp' && (
            <div className="relative flex items-center justify-center">
              <span
                className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
                  isOn
                    ? thermalEnabled
                      ? 'bg-orange-400 border-amber-200 shadow-[0_0_14px_#f97316]'
                      : 'bg-amber-300 border-amber-100 shadow-[0_0_12px_#fcd34d]'
                    : 'bg-slate-800 border-slate-600'
                }`}
              >
                {isOn && thermalEnabled && <Flame className="w-3.5 h-3.5 text-red-900" />}
              </span>
            </div>
          )}

          {comp.type === 'siren' && (
            <span
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                isOn
                  ? 'bg-red-600 border-red-300 shadow-[0_0_14px_#ef4444] animate-pulse'
                  : 'bg-slate-800 border-slate-600'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white/90" />
            </span>
          )}

          {comp.type === 'fan' && (
            <svg viewBox="-16 -16 32 32" className="w-8 h-8">
              <g
                className={isOn ? 'fan-spin' : ''}
                style={isOn ? { animationDuration: `${fanSpinSeconds}s` } : undefined}
              >
                {[0, 90, 180, 270].map((deg) => (
                  <path
                    key={deg}
                    d="M 0 0 Q 6 -3 11 -1 Q 12 4 6 5 Z"
                    transform={`rotate(${deg})`}
                    fill={isOn ? '#38bdf8' : '#475569'}
                  />
                ))}
              </g>
              <circle r={3.5} fill="#0f172a" stroke="#94a3b8" strokeWidth={1.2} />
            </svg>
          )}

          {comp.type === 'relay' && (
            <svg viewBox="-16 -12 32 24" className="w-8 h-6">
              <rect
                x={-13}
                y={-9}
                width={26}
                height={18}
                rx={3}
                fill={isOn ? '#0369a1' : '#1e293b'}
                stroke={isOn ? '#38bdf8' : '#64748b'}
                strokeWidth={1.5}
              />
              <path
                d="M -9 0 Q -6 -6 -3 0 Q 0 6 3 0 Q 6 -6 9 0"
                fill="none"
                stroke={isOn ? '#fbbf24' : '#94a3b8'}
                strokeWidth={1.8}
              />
            </svg>
          )}
        </div>

        <div className="min-w-0">
          <div className="text-xs font-bold text-slate-100 leading-tight truncate">
            {comp.scenarioLabels[scenario]}
          </div>
          {showViBadges ? (
            <div className="font-mono text-[10px] text-cyan-300 mt-0.5 tabular-nums">
              {volts.toFixed(1)}V · {amps.toFixed(2)}A
            </div>
          ) : (
            comp.maxVoltageVolts &&
            br?.isOverVoltage && (
              <div className="font-mono text-[10px] font-bold text-red-400 mt-0.5">
                TOO HIGH ({volts.toFixed(1)}V)
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export const SwitchboardPanel: React.FC<SwitchboardPanelProps> = ({
  level,
  scenario,
  switchStates,
  rheostatValues,
  unlockedHatches,
  solution,
  faultState,
  showViBadges,
  activeCheckZoneIds,
  onToggleCheckZone,
  onToggleAllCheckZones,
  onToggleSwitch,
  onChangeRheostat,
  onOpenHatch,
}) => {
  const scenarioMeta = SCENARIOS[scenario];
  const battery = level.components.find((c) => c.type === 'battery');
  const mainSwitches = level.switches.filter((s) => !s.hatchId);
  const rheostats = level.components.filter((c) => c.type === 'rheostat');
  const fuses = level.components.filter((c) => c.type === 'fuse');
  const diodes = level.components.filter((c) => c.type === 'diode');
  const fixedResistors = level.components.filter(
    (c) => c.type === 'resistor' && c.id !== 'R_DIAG',
  );
  const outputModules = level.components.filter((c) =>
    ['led', 'lamp', 'fan', 'siren', 'relay'].includes(c.type),
  );

  const hasControlsRow =
    (level.checkZones && level.checkZones.length > 0) ||
    rheostats.length > 0 ||
    fuses.length > 0 ||
    diodes.length > 0 ||
    fixedResistors.length > 0;

  return (
    <div className="rounded-xl bg-[#161c28] text-slate-100 border border-slate-700/80 p-3.5 sm:p-4 space-y-4">
      {/* Top Industrial Faceplate Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-500 shadow-inner" />
          <span className="font-mono text-xs font-extrabold tracking-wider text-slate-200 uppercase">
            {scenarioMeta.chassisCode} · SWITCHBOARD
          </span>
        </div>

        <div className="flex items-center gap-2">
          {battery && (
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-xs font-extrabold text-amber-300">
              {battery.voltageVolts} V DC
            </span>
          )}
          <span className="w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-500 shadow-inner" />
        </div>
      </div>

      {/* ================================================================= */}
      {/* BAND 1: MAIN SWITCHES + UNLOCKABLE SUB-PANEL HATCH(ES)            */}
      {/* ================================================================= */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
          <span>Switch Bank (S1–S{level.switches.length})</span>
          <span className="text-slate-500">Match tags to Circuit Map</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
          {mainSwitches.map((sw) => (
            <TactileSwitchTile
              key={sw.id}
              sw={sw}
              isClosed={Boolean(switchStates[sw.id])}
              isFault={faultState.highlightSwitchIds.includes(sw.id)}
              disabled={Boolean(sw.jammed) || faultState.locked}
              onToggle={() => onToggleSwitch(sw.id)}
            />
          ))}

          {/* Sub-Panel Hatch Modules */}
          {level.hatches.map((hatch) => {
            const isUnlocked = Boolean(unlockedHatches[hatch.id]);
            const hatchSwitches = level.switches.filter((s) => s.hatchId === hatch.id);
            const spanClass =
              hatchSwitches.length >= 2 ? 'col-span-2' : 'col-span-1';

            if (!isUnlocked) {
              return (
                <button
                  key={hatch.id}
                  type="button"
                  onClick={() => onOpenHatch(hatch)}
                  className={`${spanClass} relative rounded-xl border-2 border-amber-500/80 bg-[#1e232e] hover:border-amber-300 overflow-hidden flex flex-col items-center justify-center p-3 text-center gap-1.5 transition-all shadow-lg group`}
                >
                  <div className="absolute inset-x-0 top-0 h-2 hazard-stripe-bar" />
                  <div className="absolute inset-x-0 bottom-0 h-2 hazard-stripe-bar" />
                  <Lock className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <div className="font-mono text-xs font-extrabold text-amber-300 tracking-wide">
                    {hatch.label}
                  </div>
                  <div className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono text-[10px] font-extrabold">
                    UNLOCK ({hatchSwitches.map((s) => s.label).join(', ')})
                  </div>
                </button>
              );
            }

            return (
              <div
                key={hatch.id}
                className={`${spanClass} rounded-xl border-2 border-dashed border-emerald-500/60 bg-emerald-950/20 p-2 space-y-1.5`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-emerald-300 px-0.5">
                  <span className="inline-flex items-center gap-1">
                    <Unlock className="w-3 h-3" />
                    {hatch.label}
                  </span>
                  <span>OPEN</span>
                </div>
                <div
                  className={`grid gap-2 ${
                    hatchSwitches.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'
                  }`}
                >
                  {hatchSwitches.map((sw) => (
                    <TactileSwitchTile
                      key={sw.id}
                      sw={sw}
                      isClosed={Boolean(switchStates[sw.id])}
                      isFault={faultState.highlightSwitchIds.includes(sw.id)}
                      disabled={Boolean(sw.jammed) || faultState.locked}
                      onToggle={() => onToggleSwitch(sw.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================= */}
      {/* BAND 2: CHECK ZONES & INLINE CONTROLS (DIAL, FUSE, DIODES)        */}
      {/* ================================================================= */}
      {hasControlsRow && (
        <div className="space-y-2.5">
          {level.checkZones && level.checkZones.length > 0 && (
            <CheckZoneBar
              zones={level.checkZones}
              solution={solution}
              activeZoneIds={activeCheckZoneIds}
              onToggleZone={onToggleCheckZone}
              onToggleAll={onToggleAllCheckZones}
              embedded
            />
          )}

          {(rheostats.length > 0 ||
            fuses.length > 0 ||
            diodes.length > 0 ||
            fixedResistors.length > 0) && (
            <div className="grid sm:grid-cols-2 gap-2.5">
              {/* Resistance Dial (VR1) */}
              {rheostats.map((comp) => {
                const ohms = rheostatValues[comp.id] ?? comp.initialOhms ?? 30;
                const min = comp.minOhms ?? 5;
                const max = comp.maxOhms ?? 60;
                const step = comp.stepOhms ?? 1;
                return (
                  <div
                    key={comp.id}
                    className="rounded-xl border border-amber-500/60 bg-[#0e131e] p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-extrabold text-amber-300">
                        <Sliders className="w-3.5 h-3.5" />
                        Dial {comp.code}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono text-sm font-extrabold tabular-nums">
                        {ohms} Ω
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={faultState.locked}
                        onClick={() => onChangeRheostat(comp.id, Math.max(min, ohms - 5))}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 font-mono text-xs font-bold text-slate-200 disabled:opacity-40"
                      >
                        -5
                      </button>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={ohms}
                        disabled={faultState.locked}
                        onChange={(e) => onChangeRheostat(comp.id, Number(e.target.value))}
                        className="flex-1 accent-amber-400 cursor-pointer"
                      />
                      <button
                        type="button"
                        disabled={faultState.locked}
                        onClick={() => onChangeRheostat(comp.id, Math.min(max, ohms + 5))}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 font-mono text-xs font-bold text-slate-200 disabled:opacity-40"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 5 A Safety Fuse Bay */}
              {fuses.map((comp) => {
                const br = solution.branches[comp.id];
                const isBlown = Boolean(br?.isBlown);
                const amps = Math.abs(br?.currentAmps ?? 0);
                const maxA = comp.maxCurrentAmps ?? 5;
                const pct = Math.min(100, (amps / maxA) * 100);
                return (
                  <div
                    key={comp.id}
                    className={`rounded-xl border p-3 space-y-2 ${
                      isBlown
                        ? 'border-red-500 bg-red-950/60'
                        : 'border-slate-700 bg-[#0e131e]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="font-extrabold text-white">
                        Fuse {comp.code}
                      </span>
                      <span
                        className={`font-extrabold tabular-nums ${
                          isBlown
                            ? 'text-red-400'
                            : pct > 80
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                        }`}
                      >
                        {isBlown ? 'BLOWN!' : `${amps.toFixed(1)} / ${maxA.toFixed(1)} A`}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-900 border border-slate-700 overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-200 ${
                          isBlown
                            ? 'bg-red-600 w-full'
                            : pct > 80
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                        }`}
                        style={!isBlown ? { width: `${Math.round(pct)}%` } : undefined}
                      />
                    </div>
                  </div>
                );
              })}

              {/* One-Way Diodes + Fixed Resistors Summary Tile */}
              {(diodes.length > 0 || fixedResistors.length > 0) && (
                <div className="rounded-xl border border-slate-700 bg-[#0e131e] p-3 flex flex-wrap items-center gap-2">
                  {fixedResistors.map((r) => (
                    <span
                      key={r.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs font-bold text-slate-200"
                    >
                      <span className="text-amber-300">{r.code}</span>
                    </span>
                  ))}
                  {diodes.map((d) => {
                    const br = solution.branches[d.id];
                    const passing = Boolean(br?.isForwardBiased && br?.isEnergised);
                    return (
                      <span
                        key={d.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs font-bold ${
                          passing
                            ? 'bg-emerald-950/60 border-emerald-500/70 text-emerald-300'
                            : 'bg-slate-900 border-slate-700 text-slate-300'
                        }`}
                      >
                        <span>{d.code} ▶|</span>
                        <span
                          className={`text-[10px] font-extrabold ${
                            passing ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {passing ? 'PASS' : 'STOP'}
                        </span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* BAND 3: DEVICE INDICATORS (LIGHTS, FANS, SIRENS, COILS)           */}
      {/* ================================================================= */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
          Device Status
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {outputModules.map((comp) => (
            <HardwareModuleCard
              key={comp.id}
              comp={comp}
              scenario={scenario}
              solution={solution}
              isFault={faultState.highlightComponentIds.includes(comp.id)}
              showViBadges={showViBadges}
              thermalEnabled={level.thermalEnabled}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
