import React from 'react';
import { CircuitSolution, LevelDefinition } from '../types/circuit';
import { Gauge, ShieldCheck, X, Zap } from 'lucide-react';

interface VirtualMultimeterProps {
  level: LevelDefinition;
  solution: CircuitSolution;
  mode: 'V' | 'A';
  onChangeMode: (mode: 'V' | 'A') => void;
  redNodeId: string | null;
  blackNodeId: string | null;
  clampComponentId: string | null;
  onSnapRed: (nodeId: string | null) => void;
  onSnapBlack: (nodeId: string | null) => void;
  onSnapClamp: (componentId: string | null) => void;
  /** Optional callback to flip the 2-panel box to the side containing a chosen test point */
  onJumpToPanelForNode?: (nodeId: string) => void;
  onJumpToPanelForComp?: (componentId: string) => void;
}

/**
 * Docked Beginner Pocket Meter (sits cleanly BELOW the hardware board so it NEVER blocks wires or switches):
 * - Volts (V) mode: 1-tap pair buttons (e.g. TP1 ↔ TP2) OR tap any 2 yellow TP pins on the board.
 * - Amps (A) mode: 1-tap blue clip buttons (A0, A1, A2...) OR tap any blue A clip on the board.
 * Strictly preserves electrical safety: Volts measure across 2 pins; Amps clip onto 1 wire loop.
 */
export const VirtualMultimeter: React.FC<VirtualMultimeterProps> = ({
  level,
  solution,
  mode,
  onChangeMode,
  redNodeId,
  blackNodeId,
  clampComponentId,
  onSnapRed,
  onSnapBlack,
  onSnapClamp,
  onJumpToPanelForNode,
  onJumpToPanelForComp,
}) => {
  const testNodes = level.nodes.filter((n) => n.testPointLabel && n.physicalTestPoint);
  const shuntComps = level.components.filter((c) => c.shuntLabel && c.physicalShunt);

  // Build friendly 1-tap voltage pairs (e.g. TP1 <-> TP2, TP2 <-> TP3, TP1 <-> TP3)
  const voltPairs: { a: (typeof testNodes)[number]; b: (typeof testNodes)[number] }[] = [];
  for (let i = 0; i < testNodes.length; i++) {
    for (let j = i + 1; j < testNodes.length; j++) {
      voltPairs.push({ a: testNodes[i], b: testNodes[j] });
    }
  }

  let readingValue = '0.00';
  let readingUnit = mode === 'V' ? 'V' : 'A';
  let readingLabel = '';
  let hasActiveReading = false;

  if (mode === 'V') {
    if (redNodeId && blackNodeId) {
      const vRed = solution.nodeVoltages[redNodeId] ?? 0;
      const vBlack = solution.nodeVoltages[blackNodeId] ?? 0;
      const delta = Math.abs(vRed - vBlack);
      readingValue = delta.toFixed(2);
      const rLabel = testNodes.find((n) => n.id === redNodeId)?.testPointLabel ?? '';
      const bLabel = testNodes.find((n) => n.id === blackNodeId)?.testPointLabel ?? '';
      readingLabel = `Volts between ${rLabel} and ${bLabel}`;
      hasActiveReading = true;
    } else if (redNodeId) {
      const rLabel = testNodes.find((n) => n.id === redNodeId)?.testPointLabel ?? '';
      readingValue = '--.--';
      readingLabel = `Red probe on ${rLabel} — tap a 2nd yellow pin`;
    } else {
      readingValue = '--.--';
      readingLabel = 'Pick a pair on the right (or tap 2 yellow TP pins above)';
    }
  } else {
    if (clampComponentId) {
      const br = solution.branches[clampComponentId];
      const amps = Math.abs(br?.currentAmps ?? 0);
      readingValue = amps.toFixed(2);
      const comp = shuntComps.find((c) => c.id === clampComponentId);
      readingLabel = `Current flowing at ${comp?.shuntLabel ?? ''}`;
      hasActiveReading = true;
    } else {
      readingValue = '--.--';
      readingLabel = 'Pick a blue clip on the right (or tap one above)';
    }
  }

  const handleSelectPair = (aId: string, bId: string) => {
    const isSame =
      (redNodeId === aId && blackNodeId === bId) ||
      (redNodeId === bId && blackNodeId === aId);
    if (isSame) {
      onSnapRed(null);
      onSnapBlack(null);
      return;
    }
    onSnapRed(aId);
    onSnapBlack(bId);
    onJumpToPanelForNode?.(aId);
  };

  const handleSelectClamp = (compId: string) => {
    if (clampComponentId === compId) {
      onSnapClamp(null);
      return;
    }
    onSnapClamp(compId);
    onJumpToPanelForComp?.(compId);
  };

  return (
    <div className="rounded-xl border-2 border-slate-700 bg-[#121722] text-slate-100 shadow-lg overflow-hidden">
      {/* Slim Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-[#1a2130] border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-amber-400" />
          <span className="font-mono text-xs font-extrabold tracking-wide text-amber-300">
            POCKET METER
          </span>
          <span className="hidden sm:inline text-xs text-slate-400">
            · Docked below so it never blocks the wires
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            {mode === 'V'
              ? 'Volts = test across 2 yellow pins'
              : 'Amps = clip onto 1 blue test loop'}
          </span>
        </div>
      </div>

      {/* Clean 3-Zone Horizontal Bench Dock */}
      <div className="p-3 grid md:grid-cols-12 gap-3 items-center">
        {/* Zone 1: Big Friendly Mode Buttons */}
        <div className="md:col-span-3 grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onChangeMode('V')}
            className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg border-2 font-bold transition-all ${
              mode === 'V'
                ? 'bg-amber-400 border-amber-300 text-slate-950 shadow-sm'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-400/70 hover:text-white'
            }`}
          >
            <span className="text-sm font-mono font-extrabold">VOLTS (V)</span>
            <span
              className={`text-[10px] font-medium ${
                mode === 'V' ? 'text-slate-800' : 'text-slate-400'
              }`}
            >
              Yellow TP pins
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChangeMode('A')}
            disabled={shuntComps.length === 0}
            className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg border-2 font-bold transition-all disabled:opacity-35 disabled:cursor-not-allowed ${
              mode === 'A'
                ? 'bg-sky-400 border-sky-300 text-slate-950 shadow-sm'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-sky-400/70 hover:text-white'
            }`}
          >
            <span className="text-sm font-mono font-extrabold">AMPS (A)</span>
            <span
              className={`text-[10px] font-medium ${
                mode === 'A' ? 'text-slate-800' : 'text-slate-400'
              }`}
            >
              Blue A clips
            </span>
          </button>
        </div>

        {/* Zone 2: Big High-Contrast Digital Screen */}
        <div className="md:col-span-4 rounded-lg bg-[#d8e8d3] border-2 border-slate-700 px-3.5 py-2 text-slate-950 shadow-inner">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-3xl font-extrabold tabular-nums tracking-tight leading-none">
              {readingValue}
            </span>
            <span
              className={`font-mono text-sm font-extrabold px-1.5 py-0.5 rounded ${
                mode === 'V' ? 'bg-amber-600/20 text-amber-950' : 'bg-sky-600/20 text-sky-950'
              }`}
            >
              {readingUnit}
            </span>
          </div>
          <div className="text-[11px] font-semibold text-slate-700 truncate mt-1">
            {readingLabel}
          </div>
        </div>

        {/* Zone 3: 1-Tap Beginner Test Buttons */}
        <div className="md:col-span-5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span className="font-semibold flex items-center gap-1">
              <Zap className={`w-3.5 h-3.5 ${mode === 'V' ? 'text-amber-400' : 'text-sky-400'}`} />
              {mode === 'V'
                ? 'Quick Volt Test (1 click):'
                : 'Quick Amp Test (1 click):'}
            </span>
            {hasActiveReading && (
              <button
                type="button"
                onClick={() => {
                  if (mode === 'V') {
                    onSnapRed(null);
                    onSnapBlack(null);
                  } else {
                    onSnapClamp(null);
                  }
                }}
                className="inline-flex items-center gap-0.5 text-[10.5px] font-mono text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          {mode === 'V' ? (
            <div className="flex flex-wrap gap-1.5">
              {voltPairs.map(({ a, b }) => {
                const active =
                  (redNodeId === a.id && blackNodeId === b.id) ||
                  (redNodeId === b.id && blackNodeId === a.id);
                return (
                  <button
                    key={`${a.id}-${b.id}`}
                    type="button"
                    onClick={() => handleSelectPair(a.id, b.id)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all ${
                      active
                        ? 'bg-amber-400 border-amber-300 text-slate-950 shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-amber-200 hover:bg-slate-700 hover:border-amber-400'
                    }`}
                  >
                    {a.testPointLabel} ↔ {b.testPointLabel}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {shuntComps.map((c) => {
                const active = clampComponentId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectClamp(c.id)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all ${
                      active
                        ? 'bg-sky-400 border-sky-300 text-slate-950 shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-sky-200 hover:bg-slate-700 hover:border-sky-400'
                    }`}
                  >
                    Clip {c.shuntLabel}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
