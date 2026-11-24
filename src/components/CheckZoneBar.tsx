import React from 'react';
import { CheckZone, CircuitSolution } from '../types/circuit';
import { soundEngine } from '../engine/sound';
import { Activity, Eye, EyeOff, Zap } from 'lucide-react';

interface CheckZoneBarProps {
  zones: CheckZone[];
  solution: CircuitSolution;
  activeZoneIds: string[];
  onToggleZone: (zoneId: string) => void;
  onToggleAll: (showAll: boolean) => void;
  /** Render compactly inside SwitchboardPanel vs standalone card under Wired Bay */
  embedded?: boolean;
}

export function readCheckZoneValue(
  zone: CheckZone,
  solution: CircuitSolution,
): { text: string; numeric: number } {
  if (zone.kind === 'V' && zone.nodeA && zone.nodeB) {
    const va = solution.nodeVoltages[zone.nodeA] ?? 0;
    const vb = solution.nodeVoltages[zone.nodeB] ?? 0;
    const val = Math.abs(va - vb);
    return { text: `${val.toFixed(2)} V`, numeric: val };
  }
  if (zone.kind === 'A' && zone.componentId) {
    const br = solution.branches[zone.componentId];
    const val = Math.abs(br?.currentAmps ?? 0);
    return { text: `${val.toFixed(2)} A`, numeric: val };
  }
  return { text: '0.00', numeric: 0 };
}

export const CheckZoneBar: React.FC<CheckZoneBarProps> = ({
  zones,
  solution,
  activeZoneIds,
  onToggleZone,
  onToggleAll,
  embedded = false,
}) => {
  if (zones.length === 0) return null;

  const activeSet = new Set(activeZoneIds);
  const allVisible = zones.every((z) => activeSet.has(z.id));

  const content = (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Check Zones</span>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playKeypadBeep(allVisible ? -2 : 4);
            onToggleAll(!allVisible);
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10.5px] font-mono font-bold text-slate-200 transition-colors"
        >
          {allVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {allVisible ? 'Hide All' : 'Show All'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {zones.map((zone) => {
          const isOpen = activeSet.has(zone.id);
          const isVolt = zone.kind === 'V';
          const { text } = readCheckZoneValue(zone, solution);

          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => {
                soundEngine.playKeypadBeep(isVolt ? 2 : 5);
                onToggleZone(zone.id);
              }}
              className={`group relative text-left rounded-lg border-2 px-2.5 py-2 transition-all ${
                isOpen
                  ? isVolt
                    ? 'bg-amber-950/50 border-amber-400 shadow-sm'
                    : 'bg-sky-950/50 border-sky-400 shadow-sm'
                  : zone.highlight
                    ? isVolt
                      ? 'bg-slate-900/90 border-amber-500/80 hover:border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.22)]'
                      : 'bg-slate-900/90 border-sky-500/80 hover:border-sky-300 shadow-[0_0_12px_rgba(14,165,233,0.22)]'
                    : 'bg-slate-900/80 border-slate-700 hover:border-slate-500'
              }`}
            >
              {/* Mission-highlighted pulsing beacon when not yet checked */}
              {zone.highlight && !isOpen && (
                <span
                  className={`absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded text-[9px] font-mono font-extrabold tracking-wider shadow ${
                    isVolt ? 'bg-amber-400 text-slate-950' : 'bg-sky-400 text-slate-950'
                  }`}
                >
                  CHECK
                </span>
              )}

              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-mono font-extrabold shrink-0 ${
                      isVolt
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-sky-400 text-slate-950'
                    }`}
                  >
                    {isVolt ? 'V' : 'A'}
                  </span>
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-extrabold text-white truncate">
                      {zone.label}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {zone.sublabel}
                    </div>
                  </div>
                </div>

                {isOpen ? (
                  <span className="px-2 py-1 rounded bg-[#d8e8d3] border border-slate-700 font-mono text-xs font-extrabold tabular-nums text-slate-950 shrink-0 shadow-inner">
                    {text}
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-bold shrink-0 ${
                      isVolt ? 'text-amber-300' : 'text-sky-300'
                    }`}
                  >
                    {isVolt ? <Zap className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                    Show
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="rounded-xl border border-slate-700/90 bg-[#0e131e] p-3">
        {content}
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-slate-700 bg-[#121722] text-slate-100 p-3 shadow-lg">
      {content}
    </div>
  );
};
