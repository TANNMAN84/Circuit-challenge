import React, { useState } from 'react';
import { LessonId } from '../data/lessons';
import { soundEngine } from '../engine/sound';
import { AlertTriangle, CheckCircle2, Flame, RotateCcw, Zap } from 'lucide-react';

interface LessonAnimationProps {
  lessonId: LessonId;
}

/**
 * 1. LOOPS, PARALLEL BRANCHES & SHORT CIRCUIT ANALOGY
 * Interactive water-pipe loop with Main Valve (S1), Branch A (S2), Branch B (S3), and Shortcut Trap (S4).
 */
const LoopsAnalogy: React.FC = () => {
  const [s1, setS1] = useState(true);
  const [s2, setS2] = useState(true);
  const [s3, setS3] = useState(true);
  const [trap, setTrap] = useState(false);

  const shortCircuit = s1 && trap;
  const branchAFlow = s1 && s2 && !shortCircuit;
  const branchBFlow = s1 && s3 && !shortCircuit;
  const mainFlow = shortCircuit || branchAFlow || branchBFlow;

  const statusText = shortCircuit
    ? 'SHORT CIRCUIT! Water rushes down the empty shortcut pipe — the breaker trips and starves both wheels.'
    : !s1
      ? 'Main Valve S1 is OPEN — the pump loop is broken, so neither branch gets flow.'
      : branchAFlow && branchBFlow
        ? 'Both parallel branches have their own complete loop — both wheels spin!'
        : branchAFlow
          ? 'Branch B is OFF, yet Branch A keeps spinning independently in parallel!'
          : branchBFlow
            ? 'Branch A is OFF, yet Branch B keeps spinning independently in parallel!'
            : 'Main Valve is closed, but both branch valves are open — zero flow.';

  const toggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, current: boolean) => {
    soundEngine.playSwitchClick(!current);
    setter(!current);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-700 bg-[#0d1320] p-3 overflow-hidden">
        <svg viewBox="0 0 640 280" className="w-full h-auto block" role="img" aria-label="Interactive parallel water pipe analogy">
          {/* Background grid */}
          <rect x="0" y="0" width="640" height="280" rx="8" fill="#0d1320" />

          {/* Main supply top & return bottom pipes */}
          <path d="M 85 110 L 85 50 L 540 50" fill="none" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 85 170 L 85 235 L 540 235" fill="none" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />

          {/* Vertical branch pipes: Shortcut trap (x=250), Branch A (x=390), Branch B (x=540) */}
          <line x1="250" y1="50" x2="250" y2="235" stroke="#1e293b" strokeWidth="14" />
          <line x1="390" y1="50" x2="390" y2="235" stroke="#1e293b" strokeWidth="14" />
          <line x1="540" y1="50" x2="540" y2="235" stroke="#1e293b" strokeWidth="14" />

          {/* Animated water flow streams */}
          {mainFlow && (
            <path
              d={shortCircuit ? 'M 85 110 L 85 50 L 250 50 L 250 235 L 85 235 L 85 170' : 'M 85 110 L 85 50 L 390 50'}
              fill="none"
              stroke={shortCircuit ? '#ef4444' : '#38bdf8'}
              strokeWidth={shortCircuit ? 7 : 5}
              strokeDasharray="10 10"
              className={shortCircuit ? 'lesson-flow-fast' : 'lesson-flow-normal'}
            />
          )}
          {branchAFlow && (
            <path
              d="M 250 50 L 390 50 L 390 235 L 85 235 L 85 170"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="5"
              strokeDasharray="10 10"
              className="lesson-flow-normal"
            />
          )}
          {branchBFlow && (
            <path
              d="M 390 50 L 540 50 L 540 235 L 85 235 L 85 170"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="5"
              strokeDasharray="10 10"
              className="lesson-flow-normal"
            />
          )}

          {/* Pump / Battery Box */}
          <g transform="translate(45, 108)">
            <rect x="0" y="0" width="80" height="64" rx="8" fill="#1e293b" stroke={shortCircuit ? '#ef4444' : '#f59e0b'} strokeWidth="2.5" />
            <text x="40" y="26" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700" fontFamily="monospace">
              PUMP / 12V
            </text>
            <text x="40" y="45" textAnchor="middle" fill={shortCircuit ? '#f87171' : '#e2e8f0'} fontSize="10" fontWeight="700" fontFamily="monospace">
              {shortCircuit ? 'BREAKER TRIP!' : 'BATTERY'}
            </text>
          </g>

          {/* Main Switch S1 */}
          <g
            transform="translate(165, 50)"
            onClick={() => toggle(setS1, s1)}
            className="cursor-pointer"
          >
            <rect x="-26" y="-20" width="52" height="40" rx="6" fill="#0f172a" stroke={s1 ? '#10b981' : '#64748b'} strokeWidth="2" />
            <line x1="-16" y1="0" x2="16" y2={s1 ? 0 : -11} stroke={s1 ? '#34d399' : '#94a3b8'} strokeWidth="3.5" strokeLinecap="round" />
            <text x="0" y="-26" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="700" fontFamily="monospace">
              S1 Main ({s1 ? 'ON' : 'OFF'})
            </text>
          </g>

          {/* Shortcut Trap Valve (S4) */}
          <g
            transform="translate(250, 142)"
            onClick={() => toggle(setTrap, trap)}
            className="cursor-pointer"
          >
            <rect x="-42" y="-24" width="84" height="48" rx="7" fill={shortCircuit ? '#450a0a' : '#1e293b'} stroke={trap ? '#ef4444' : '#f59e0b'} strokeWidth="2" />
            <text x="0" y="-4" textAnchor="middle" fill={trap ? '#fca5a5' : '#fde68a'} fontSize="10.5" fontWeight="700" fontFamily="monospace">
              TRAP (0 Ω)
            </text>
            <text x="0" y="13" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="700" fontFamily="monospace">
              {trap ? 'SHORT ON!' : 'SAFE OFF'}
            </text>
          </g>

          {/* Branch A Valve + Wheel (Light A) */}
          <g
            transform="translate(390, 98)"
            onClick={() => toggle(setS2, s2)}
            className="cursor-pointer"
          >
            <rect x="-26" y="-16" width="52" height="32" rx="6" fill="#0f172a" stroke={s2 ? '#10b981' : '#64748b'} strokeWidth="2" />
            <text x="0" y="4" textAnchor="middle" fill={s2 ? '#34d399' : '#94a3b8'} fontSize="10.5" fontWeight="700" fontFamily="monospace">
              S2 {s2 ? 'ON' : 'OFF'}
            </text>
          </g>
          <g transform="translate(390, 178)">
            <circle r="24" fill={branchAFlow ? '#064e3b' : '#1e293b'} stroke={branchAFlow ? '#34d399' : '#475569'} strokeWidth="2.5" />
            <g className={branchAFlow ? 'fan-spinning' : ''} style={{ animationDuration: '1.3s' }}>
              <line x1="-15" y1="0" x2="15" y2="0" stroke={branchAFlow ? '#6ee7b7' : '#64748b'} strokeWidth="3.5" strokeLinecap="round" />
              <line x1="0" y1="-15" x2="0" y2="15" stroke={branchAFlow ? '#6ee7b7' : '#64748b'} strokeWidth="3.5" strokeLinecap="round" />
            </g>
            <text x="0" y="39" textAnchor="middle" fill="#e2e8f0" fontSize="10.5" fontWeight="700" fontFamily="monospace">
              Light A · {branchAFlow ? 'ON' : 'OFF'}
            </text>
          </g>

          {/* Branch B Valve + Wheel (Light B) */}
          <g
            transform="translate(540, 98)"
            onClick={() => toggle(setS3, s3)}
            className="cursor-pointer"
          >
            <rect x="-26" y="-16" width="52" height="32" rx="6" fill="#0f172a" stroke={s3 ? '#10b981' : '#64748b'} strokeWidth="2" />
            <text x="0" y="4" textAnchor="middle" fill={s3 ? '#34d399' : '#94a3b8'} fontSize="10.5" fontWeight="700" fontFamily="monospace">
              S3 {s3 ? 'ON' : 'OFF'}
            </text>
          </g>
          <g transform="translate(540, 178)">
            <circle r="24" fill={branchBFlow ? '#064e3b' : '#1e293b'} stroke={branchBFlow ? '#34d399' : '#475569'} strokeWidth="2.5" />
            <g className={branchBFlow ? 'fan-spinning' : ''} style={{ animationDuration: '1.3s' }}>
              <line x1="-15" y1="0" x2="15" y2="0" stroke={branchBFlow ? '#6ee7b7' : '#64748b'} strokeWidth="3.5" strokeLinecap="round" />
              <line x1="0" y1="-15" x2="0" y2="15" stroke={branchBFlow ? '#6ee7b7' : '#64748b'} strokeWidth="3.5" strokeLinecap="round" />
            </g>
            <text x="0" y="39" textAnchor="middle" fill="#e2e8f0" fontSize="10.5" fontWeight="700" fontFamily="monospace">
              Light B · {branchBFlow ? 'ON' : 'OFF'}
            </text>
          </g>
        </svg>
      </div>

      {/* Tactile Control Row */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => toggle(setS1, s1)}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
            s1
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          S1 Main: {s1 ? 'ON' : 'OFF'}
        </button>
        <button
          type="button"
          onClick={() => toggle(setS2, s2)}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
            s2
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          S2 Branch A: {s2 ? 'ON' : 'OFF'}
        </button>
        <button
          type="button"
          onClick={() => toggle(setS3, s3)}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
            s3
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          S3 Branch B: {s3 ? 'ON' : 'OFF'}
        </button>
        <button
          type="button"
          onClick={() => toggle(setTrap, trap)}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
            trap
              ? 'bg-red-600 border-red-500 text-white'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-300'
          }`}
        >
          Shortcut Trap: {trap ? 'TRIPPED' : 'OFF'}
        </button>
      </div>

      {/* Live Observation Bar */}
      <div
        className={`rounded-lg border px-3.5 py-2.5 text-xs font-medium flex items-center gap-2 ${
          shortCircuit
            ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200'
            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200'
        }`}
      >
        {shortCircuit ? (
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
        ) : (
          <Zap className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
        )}
        <span>{statusText}</span>
      </div>
    </div>
  );
};

/**
 * 2. VOLTS (V), AMPS (I), OHMS (R) & SERIES VOLTAGE SHARING
 * Water tower height (V) cascading over two waterfalls (R1 and R2).
 */
const VoltageSharingAnalogy: React.FC = () => {
  const [volts, setVolts] = useState(9);
  const [r1, setR1] = useState(10);
  const [r2, setR2] = useState(20);

  const rTotal = r1 + r2;
  const current = volts / rTotal;
  const v1 = current * r1;
  const v2 = current * r2;

  // Height scaling for the waterfall visual (top = 36, ground = 216 -> 180px total)
  const totalHeightPx = Math.round((volts / 18) * 160) + 20;
  const topY = 220 - totalHeightPx;
  const midDropPx = Math.round((v1 / volts) * totalHeightPx);
  const midY = topY + midDropPx;

  const flowDuration = `${Math.max(0.35, Math.min(2.4, 0.5 / Math.max(0.08, current))).toFixed(2)}s`;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-700 bg-[#0d1320] p-3 overflow-hidden">
        <svg viewBox="0 0 640 265" className="w-full h-auto block" role="img" aria-label="Interactive voltage sharing waterfall analogy">
          <rect x="0" y="0" width="640" height="265" rx="8" fill="#0d1320" />

          {/* Ground level baseline (0 V) */}
          <line x1="30" y1="220" x2="610" y2="220" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
          <text x="604" y="238" textAnchor="end" fill="#94a3b8" fontSize="10" fontFamily="monospace">
            0 V Ground Return
          </text>

          {/* Left Battery Water Tower Column */}
          <rect x="48" y={topY} width="78" height={220 - topY} rx="6" fill="#1e3a8a" stroke="#38bdf8" strokeWidth="2" />
          <text x="87" y={topY - 8} textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="700" fontFamily="monospace">
            V = {volts} V
          </text>
          <text x="87" y="238" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="700" fontFamily="monospace">
            Battery Push
          </text>

          {/* Animated stepped pipe path: Tower top -> Step 1 (R1) -> Middle ledge -> Step 2 (R2) -> Ground -> Return */}
          <path
            d={`M 126 ${topY + 12} L 250 ${topY + 12} L 250 ${midY} L 440 ${midY} L 440 220 L 87 220`}
            fill="none"
            stroke="#1e293b"
            strokeWidth="12"
            strokeLinejoin="round"
          />
          <path
            d={`M 126 ${topY + 12} L 250 ${topY + 12} L 250 ${midY} L 440 ${midY} L 440 220 L 87 220`}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="5"
            strokeDasharray="10 10"
            className="lesson-flow-custom"
            style={{ animationDuration: flowDuration }}
          />

          {/* Step 1: Resistor R1 Box */}
          <g transform={`translate(250, ${(topY + 12 + midY) / 2})`}>
            <rect x="-42" y="-22" width="84" height="44" rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
            <text x="0" y="-4" textAnchor="middle" fill="#fde68a" fontSize="10.5" fontWeight="700" fontFamily="monospace">
              R1 = {r1} Ω
            </text>
            <text x="0" y="13" textAnchor="middle" fill="#38bdf8" fontSize="11.5" fontWeight="700" fontFamily="monospace">
              {v1.toFixed(1)} V drop
            </text>
          </g>

          {/* Step 2: Resistor R2 Box */}
          <g transform={`translate(440, ${(midY + 220) / 2})`}>
            <rect x="-42" y="-22" width="84" height="44" rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
            <text x="0" y="-4" textAnchor="middle" fill="#fde68a" fontSize="10.5" fontWeight="700" fontFamily="monospace">
              R2 = {r2} Ω
            </text>
            <text x="0" y="13" textAnchor="middle" fill={v2 > 5 ? '#f87171' : '#34d399'} fontSize="11.5" fontWeight="700" fontFamily="monospace">
              {v2.toFixed(1)} V drop
            </text>
          </g>

          {/* Live Readout Box on Right */}
          <g transform="translate(502, 24)">
            <rect x="0" y="0" width="122" height="106" rx="8" fill="#111827" stroke="#334155" strokeWidth="1.5" />
            <text x="10" y="20" fill="#94a3b8" fontSize="9.5" fontWeight="700" fontFamily="monospace">
              LIVE READOUT
            </text>
            <text x="10" y="42" fill="#38bdf8" fontSize="12" fontWeight="700" fontFamily="monospace">
              I = {current.toFixed(2)} A
            </text>
            <text x="10" y="62" fill="#e2e8f0" fontSize="10.5" fontFamily="monospace">
              R_tot = {rTotal} Ω
            </text>
            <line x1="10" y1="73" x2="112" y2="73" stroke="#334155" strokeWidth="1" />
            <text x="10" y="92" fill="#fbbf24" fontSize="10.5" fontWeight="700" fontFamily="monospace">
              {v1.toFixed(1)} + {v2.toFixed(1)} = {volts.toFixed(1)} V
            </text>
          </g>
        </svg>
      </div>

      {/* Interactive Sliders */}
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 p-2.5 text-xs space-y-1">
          <div className="flex items-center justify-between font-mono font-bold">
            <span>Battery (V)</span>
            <span className="text-amber-600 dark:text-amber-400 tabular-nums">{volts} V</span>
          </div>
          <input
            type="range"
            min={6}
            max={18}
            step={3}
            value={volts}
            onChange={(e) => setVolts(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
        </label>

        <label className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 p-2.5 text-xs space-y-1">
          <div className="flex items-center justify-between font-mono font-bold">
            <span>Resistor R1</span>
            <span className="text-sky-600 dark:text-sky-400 tabular-nums">{r1} Ω</span>
          </div>
          <input
            type="range"
            min={5}
            max={30}
            step={5}
            value={r1}
            onChange={(e) => setR1(Number(e.target.value))}
            className="w-full accent-sky-500"
          />
        </label>

        <label className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 p-2.5 text-xs space-y-1">
          <div className="flex items-center justify-between font-mono font-bold">
            <span>Resistor R2</span>
            <span className="text-sky-600 dark:text-sky-400 tabular-nums">{r2} Ω</span>
          </div>
          <input
            type="range"
            min={5}
            max={30}
            step={5}
            value={r2}
            onChange={(e) => setR2(Number(e.target.value))}
            className="w-full accent-sky-500"
          />
        </label>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200">
        Bigger resistance takes a bigger share of the Volts: <strong>R1 ({r1} Ω)</strong> takes{' '}
        <strong className="font-mono">{v1.toFixed(1)} V</strong> and <strong>R2 ({r2} Ω)</strong> takes{' '}
        <strong className="font-mono">{v2.toFixed(1)} V</strong> — always adding up to{' '}
        <strong className="font-mono">{volts} V</strong>!
      </div>
    </div>
  );
};

/**
 * 3. RESISTANCE & OHM'S LAW (V = I × R)
 * Interactive Garden Hose + Pinch Clamp + Clickable V/I/R Formula Triangle.
 */
const OhmsLawAnalogy: React.FC = () => {
  const [volts, setVolts] = useState(12);
  const [ohms, setOhms] = useState(40);
  const [solveFor, setSolveFor] = useState<'V' | 'I' | 'R'>('R');

  const amps = volts / ohms;
  const isOverload = amps > 0.5;
  const isSafeWindow = amps >= 0.35 && amps <= 0.45;

  // Hose inner channel narrows as resistance increases (10 Ω -> wide 36px, 60 Ω -> narrow 10px)
  const pinchDepth = Math.round(((ohms - 10) / 50) * 18); // 0 to 18px squeeze from top & bottom
  const flowDuration = `${Math.max(0.22, Math.min(2.2, 0.35 / Math.max(0.08, amps))).toFixed(2)}s`;

  const formulaMap = {
    V: `V = I × R  →  ${amps.toFixed(2)} A × ${ohms} Ω = ${volts.toFixed(1)} V`,
    I: `I = V ÷ R  →  ${volts} V ÷ ${ohms} Ω = ${amps.toFixed(2)} A`,
    R: `R = V ÷ I  →  ${volts} V ÷ ${amps.toFixed(2)} A = ${ohms} Ω`,
  };

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-12 gap-3 items-stretch">
        {/* Left: Animated Garden Hose & Pinch Clamp */}
        <div className="md:col-span-8 rounded-xl border border-slate-700 bg-[#0d1320] p-3 flex flex-col justify-center">
          <svg viewBox="0 0 460 220" className="w-full h-auto block" role="img" aria-label="Interactive Ohm's Law hose and pinch clamp analogy">
            <rect x="0" y="0" width="460" height="220" rx="8" fill="#0d1320" />

            {/* Pump (Voltage V) */}
            <rect x="16" y="72" width="88" height="76" rx="10" fill="#1e293b" stroke="#f59e0b" strokeWidth="2.5" />
            <text x="60" y="102" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700" fontFamily="monospace">
              VOLT PUSH
            </text>
            <text x="60" y="124" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="800" fontFamily="monospace">
              {volts} V
            </text>

            {/* Flexible Hose Wall (Top & Bottom curves pinching inward at x=225) */}
            <path
              d={`M 104 86 L 175 86 Q 225 ${86 + pinchDepth} 275 86 L 352 86`}
              fill="none"
              stroke="#64748b"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d={`M 104 134 L 175 134 Q 225 ${134 - pinchDepth} 275 134 L 352 134`}
              fill="none"
              stroke="#64748b"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* Animated Current Flow Inside Hose */}
            <line
              x1="108"
              y1="110"
              x2="352"
              y2="110"
              stroke={isOverload ? '#ef4444' : isSafeWindow ? '#10b981' : '#38bdf8'}
              strokeWidth={Math.max(4, Math.min(26, amps * 24))}
              strokeDasharray="12 10"
              className="lesson-flow-custom"
              style={{ animationDuration: flowDuration }}
            />

            {/* Resistance Pinch Clamp Jaws (R in Ohms) */}
            <rect x="206" y={34 + pinchDepth} width="38" height="44" rx="5" fill="#d97706" stroke="#fde68a" strokeWidth="2" />
            <rect x="206" y={142 - pinchDepth} width="38" height="44" rx="5" fill="#d97706" stroke="#fde68a" strokeWidth="2" />
            <text x="225" y="22" textAnchor="middle" fill="#fde68a" fontSize="11" fontWeight="700" fontFamily="monospace">
              RESISTANCE (PINCH): {ohms} Ω
            </text>

            {/* Amp Meter / Target Coil on Right */}
            <rect
              x="354"
              y="66"
              width="92"
              height="88"
              rx="10"
              fill={isOverload ? '#450a0a' : isSafeWindow ? '#064e3b' : '#1e293b'}
              stroke={isOverload ? '#ef4444' : isSafeWindow ? '#10b981' : '#38bdf8'}
              strokeWidth="2.5"
            />
            <text x="400" y="92" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="700" fontFamily="monospace">
              FLOW (AMPS)
            </text>
            <text
              x="400"
              y="118"
              textAnchor="middle"
              fill={isOverload ? '#fca5a5' : isSafeWindow ? '#6ee7b7' : '#38bdf8'}
              fontSize="17"
              fontWeight="800"
              fontFamily="monospace"
            >
              {amps.toFixed(2)} A
            </text>
            <text
              x="400"
              y="140"
              textAnchor="middle"
              fill={isOverload ? '#f87171' : isSafeWindow ? '#34d399' : '#94a3b8'}
              fontSize="9.5"
              fontWeight="700"
              fontFamily="monospace"
            >
              {isOverload ? 'OVERLOAD!' : isSafeWindow ? 'SAFE ZONE' : 'LOW FLOW'}
            </text>

            {/* Safe Window Legend */}
            <text x="225" y="206" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              Goal: Hit the 0.35–0.45 A green safe zone without crossing 0.50 A!
            </text>
          </svg>
        </div>

        {/* Right: Interactive Ohm's Law Triangle */}
        <div className="md:col-span-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 p-3 flex flex-col justify-between gap-2">
          <div className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
            Tap a letter to solve
          </div>

          <div className="flex flex-col items-center gap-1.5 py-1">
            <button
              type="button"
              onClick={() => setSolveFor('V')}
              className={`w-24 py-2 rounded-lg font-mono text-sm font-extrabold border transition-colors ${
                solveFor === 'V'
                  ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-sm'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              V (Volts)
            </button>
            <div className="w-40 h-0.5 bg-slate-400 dark:bg-slate-600" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSolveFor('I')}
                className={`w-20 py-2 rounded-lg font-mono text-sm font-extrabold border transition-colors ${
                  solveFor === 'I'
                    ? 'bg-sky-500 border-sky-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                I (A)
              </button>
              <span className="font-mono font-bold text-slate-500">×</span>
              <button
                type="button"
                onClick={() => setSolveFor('R')}
                className={`w-20 py-2 rounded-lg font-mono text-sm font-extrabold border transition-colors ${
                  solveFor === 'R'
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                R (Ω)
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-slate-900 text-cyan-300 px-2.5 py-2 font-mono text-[11px] font-bold text-center tabular-nums">
            {formulaMap[solveFor]}
          </div>
        </div>
      </div>

      {/* Interactive Sliders */}
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 p-2.5 text-xs space-y-1">
          <div className="flex items-center justify-between font-mono font-bold">
            <span>Pump Push · Voltage (V)</span>
            <span className="text-amber-600 dark:text-amber-400 tabular-nums">{volts} V</span>
          </div>
          <input
            type="range"
            min={3}
            max={18}
            step={3}
            value={volts}
            onChange={(e) => setVolts(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
        </label>

        <label className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 p-2.5 text-xs space-y-1">
          <div className="flex items-center justify-between font-mono font-bold">
            <span>Hose Pinch · Resistance (R)</span>
            <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">{ohms} Ω</span>
          </div>
          <input
            type="range"
            min={10}
            max={60}
            step={2}
            value={ohms}
            onChange={(e) => setOhms(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </label>
      </div>

      <div
        className={`rounded-lg border px-3.5 py-2.5 text-xs font-medium flex items-center gap-2 ${
          isOverload
            ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200'
            : isSafeWindow
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200'
        }`}
      >
        {isOverload ? (
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
        ) : isSafeWindow ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        ) : (
          <Zap className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
        )}
        <span>
          {isOverload
            ? `Too little resistance! I = ${volts} ÷ ${ohms} = ${amps.toFixed(2)} A (> 0.50 A) burns out the coil. Increase R!`
            : isSafeWindow
              ? `Spot on! I = ${volts} ÷ ${ohms} = ${amps.toFixed(2)} A sits right inside the 0.35–0.45 A safe window.`
              : `Flow is ${amps.toFixed(2)} A. Lower R (open the pinch clamp slightly) or raise V to reach 0.35–0.45 A.`}
        </span>
      </div>
    </div>
  );
};

/**
 * 4. PARALLEL CURRENT SUMMATION & 5.0 A SAFETY FUSE
 * Main pipe feeding 3 parallel taps through a single 5.0 A weak-link safety fuse.
 */
const ParallelFuseAnalogy: React.FC = () => {
  const [t1, setT1] = useState(true);
  const [t2, setT2] = useState(true);
  const [t3, setT3] = useState(false);
  const [fuseBlown, setFuseBlown] = useState(false);

  const requestedAmps = (t1 ? 1.5 : 0) + (t2 ? 2.0 : 0) + (t3 ? 2.5 : 0);
  const liveAmps = fuseBlown ? 0 : requestedAmps;

  const handleToggleTap = (tap: 1 | 2 | 3) => {
    if (fuseBlown) {
      soundEngine.playErrorBuzz();
      return;
    }
    const nextT1 = tap === 1 ? !t1 : t1;
    const nextT2 = tap === 2 ? !t2 : t2;
    const nextT3 = tap === 3 ? !t3 : t3;
    const nextTotal = (nextT1 ? 1.5 : 0) + (nextT2 ? 2.0 : 0) + (nextT3 ? 2.5 : 0);

    setT1(nextT1);
    setT2(nextT2);
    setT3(nextT3);

    if (nextTotal > 5.0) {
      setFuseBlown(true);
      soundEngine.playFaultTrip();
    } else {
      soundEngine.playSwitchClick(true);
    }
  };

  const handleResetFuse = () => {
    soundEngine.playSwitchClick(false);
    setFuseBlown(false);
    setT1(true);
    setT2(true);
    setT3(false);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-700 bg-[#0d1320] p-3 overflow-hidden">
        <svg viewBox="0 0 640 250" className="w-full h-auto block" role="img" aria-label="Interactive parallel currents and 5 amp fuse analogy">
          <rect x="0" y="0" width="640" height="250" rx="8" fill="#0d1320" />

          {/* Main Trunk Pipe + Return */}
          <path d="M 90 125 L 90 52 L 545 52" fill="none" stroke="#1e293b" strokeWidth="16" strokeLinejoin="round" />
          <path d="M 90 165 L 90 218 L 545 218" fill="none" stroke="#1e293b" strokeWidth="14" strokeLinejoin="round" />

          {/* 3 Parallel Branch Pipes */}
          <line x1="325" y1="52" x2="325" y2="218" stroke="#1e293b" strokeWidth="12" />
          <line x1="435" y1="52" x2="435" y2="218" stroke="#1e293b" strokeWidth="12" />
          <line x1="545" y1="52" x2="545" y2="218" stroke="#1e293b" strokeWidth="12" />

          {/* Animated Flow Streams (width scales with current!) */}
          {!fuseBlown && liveAmps > 0 && (
            <path
              d="M 90 125 L 90 52 L 325 52"
              fill="none"
              stroke={liveAmps >= 4.0 ? '#f59e0b' : '#38bdf8'}
              strokeWidth={Math.max(4, liveAmps * 2.8)}
              strokeDasharray="10 10"
              className="lesson-flow-fast"
            />
          )}
          {!fuseBlown && t1 && (
            <path d="M 325 52 L 325 218 L 90 218" fill="none" stroke="#38bdf8" strokeWidth="4" strokeDasharray="8 8" className="lesson-flow-normal" />
          )}
          {!fuseBlown && t2 && (
            <path d="M 325 52 L 435 52 L 435 218 L 325 218" fill="none" stroke="#38bdf8" strokeWidth="5" strokeDasharray="8 8" className="lesson-flow-normal" />
          )}
          {!fuseBlown && t3 && (
            <path d="M 435 52 L 545 52 L 545 218 L 435 218" fill="none" stroke="#10b981" strokeWidth="6" strokeDasharray="8 8" className="lesson-flow-fast" />
          )}

          {/* Battery */}
          <rect x="48" y="110" width="84" height="62" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="2.5" />
          <text x="90" y="137" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700" fontFamily="monospace">
            12 V MAIN
          </text>
          <text x="90" y="156" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontFamily="monospace">
            SUPPLY
          </text>

          {/* 5.0 A Safety Fuse Link on Main Wire */}
          <g transform="translate(205, 52)">
            <rect
              x="-52"
              y="-24"
              width="104"
              height="48"
              rx="8"
              fill={fuseBlown ? '#450a0a' : '#0f172a'}
              stroke={fuseBlown ? '#ef4444' : liveAmps >= 4.0 ? '#f59e0b' : '#10b981'}
              strokeWidth="2.5"
            />
            {fuseBlown ? (
              <>
                <line x1="-36" y1="-4" x2="-8" y2="-4" stroke="#ef4444" strokeWidth="3" />
                <line x1="8" y1="-4" x2="36" y2="-4" stroke="#ef4444" strokeWidth="3" />
                <text x="0" y="14" textAnchor="middle" fill="#fca5a5" fontSize="10" fontWeight="800" fontFamily="monospace">
                  FUSE SNAPPED!
                </text>
              </>
            ) : (
              <>
                <line x1="-36" y1="-6" x2="36" y2="-6" stroke={liveAmps >= 4.0 ? '#fbbf24' : '#34d399'} strokeWidth="3" />
                <text x="0" y="14" textAnchor="middle" fill="#e2e8f0" fontSize="10.5" fontWeight="700" fontFamily="monospace">
                  F1: {liveAmps.toFixed(1)} / 5.0 A
                </text>
              </>
            )}
          </g>

          {/* Branch 1: 1.5 A */}
          <g transform="translate(325, 138)" onClick={() => handleToggleTap(1)} className="cursor-pointer">
            <rect x="-42" y="-34" width="84" height="68" rx="8" fill={t1 && !fuseBlown ? '#1e3a5f' : '#1e293b'} stroke={t1 ? '#38bdf8' : '#475569'} strokeWidth="2" />
            <text x="0" y="-10" textAnchor="middle" fill="#e2e8f0" fontSize="10.5" fontWeight="700" fontFamily="monospace">
              Branch 1
            </text>
            <text x="0" y="8" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="800" fontFamily="monospace">
              1.5 A
            </text>
            <text x="0" y="24" textAnchor="middle" fill={t1 ? '#34d399' : '#94a3b8'} fontSize="9.5" fontWeight="700" fontFamily="monospace">
              {t1 ? 'ON' : 'OFF'}
            </text>
          </g>

          {/* Branch 2: 2.0 A */}
          <g transform="translate(435, 138)" onClick={() => handleToggleTap(2)} className="cursor-pointer">
            <rect x="-42" y="-34" width="84" height="68" rx="8" fill={t2 && !fuseBlown ? '#1e3a5f' : '#1e293b'} stroke={t2 ? '#38bdf8' : '#475569'} strokeWidth="2" />
            <text x="0" y="-10" textAnchor="middle" fill="#e2e8f0" fontSize="10.5" fontWeight="700" fontFamily="monospace">
              Branch 2
            </text>
            <text x="0" y="8" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="800" fontFamily="monospace">
              2.0 A
            </text>
            <text x="0" y="24" textAnchor="middle" fill={t2 ? '#34d399' : '#94a3b8'} fontSize="9.5" fontWeight="700" fontFamily="monospace">
              {t2 ? 'ON' : 'OFF'}
            </text>
          </g>

          {/* Branch 3: 2.5 A Pump */}
          <g transform="translate(545, 138)" onClick={() => handleToggleTap(3)} className="cursor-pointer">
            <rect x="-42" y="-34" width="84" height="68" rx="8" fill={t3 && !fuseBlown ? '#064e3b' : '#1e293b'} stroke={t3 ? '#10b981' : '#475569'} strokeWidth="2" />
            <text x="0" y="-10" textAnchor="middle" fill="#e2e8f0" fontSize="10.5" fontWeight="700" fontFamily="monospace">
              Pump
            </text>
            <text x="0" y="8" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="800" fontFamily="monospace">
              2.5 A
            </text>
            <text x="0" y="24" textAnchor="middle" fill={t3 ? '#34d399' : '#94a3b8'} fontSize="9.5" fontWeight="700" fontFamily="monospace">
              {t3 ? 'ON' : 'OFF'}
            </text>
          </g>
        </svg>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleToggleTap(1)}
            disabled={fuseBlown}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors disabled:opacity-45 ${
              t1 ? 'bg-sky-600 border-sky-500 text-white' : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            Tap 1 (1.5 A): {t1 ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={() => handleToggleTap(2)}
            disabled={fuseBlown}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors disabled:opacity-45 ${
              t2 ? 'bg-sky-600 border-sky-500 text-white' : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            Tap 2 (2.0 A): {t2 ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={() => handleToggleTap(3)}
            disabled={fuseBlown}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors disabled:opacity-45 ${
              t3 ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            Pump (2.5 A): {t3 ? 'ON' : 'OFF'}
          </button>
        </div>

        {fuseBlown && (
          <button
            type="button"
            onClick={handleResetFuse}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Replace Blown Fuse
          </button>
        )}
      </div>

      <div
        className={`rounded-lg border px-3.5 py-2.5 text-xs font-medium flex items-center gap-2 ${
          fuseBlown
            ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200'
            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200'
        }`}
      >
        {fuseBlown ? (
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
        ) : (
          <Zap className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
        )}
        <span>
          {fuseBlown
            ? `Main fuse snapped! 1.5 A + 2.0 A + 2.5 A = ${requestedAmps.toFixed(1)} A (> 5.0 A limit). Replace the fuse, switch OFF extra taps first, then start the Pump.`
            : `Main Wire Total: ${t1 ? '1.5' : '0.0'} + ${t2 ? '2.0' : '0.0'} + ${t3 ? '2.5' : '0.0'} = ${liveAmps.toFixed(1)} A (Safe under 5.0 A fuse limit).`}
        </span>
      </div>
    </div>
  );
};

/**
 * 5. ENERGY EFFICIENCY (WASTE HEAT) & ONE-WAY DIODE GATE
 * Two interactive tabs: Energy Split Stream + One-Way Mechanical Flap Valve.
 */
const EfficiencyDiodeAnalogy: React.FC = () => {
  const [tab, setTab] = useState<'efficiency' | 'diode'>('efficiency');
  const [bulbType, setBulbType] = useState<'globe' | 'led'>('globe');
  const [diodeForward, setDiodeForward] = useState(true);

  const usefulPct = bulbType === 'globe' ? 15 : 85;
  const heatPct = 100 - usefulPct;

  return (
    <div className="space-y-3">
      {/* Interactive Mode Tabs */}
      <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setTab('efficiency')}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
            tab === 'efficiency'
              ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Part A · Light vs Waste Heat
        </button>
        <button
          type="button"
          onClick={() => setTab('diode')}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
            tab === 'diode'
              ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Part B · One-Way Diode Valve
        </button>
      </div>

      {tab === 'efficiency' ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-700 bg-[#0d1320] p-3 overflow-hidden">
            <svg viewBox="0 0 640 230" className="w-full h-auto block" role="img" aria-label="Interactive energy efficiency light vs heat diagram">
              <rect x="0" y="0" width="640" height="230" rx="8" fill="#0d1320" />

              {/* Input Energy Band (100%) */}
              <rect x="24" y="80" width="140" height="70" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <text x="94" y="110" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="800" fontFamily="monospace">
                100 J INPUT
              </text>
              <text x="94" y="130" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="monospace">
                Electricity In
              </text>

              {/* Animated Input Flow */}
              <line x1="164" y1="115" x2="250" y2="115" stroke="#38bdf8" strokeWidth="18" strokeDasharray="12 10" className="lesson-flow-normal" />

              {/* Light Source Hub */}
              <circle cx="290" cy="115" r="42" fill={bulbType === 'led' ? '#064e3b' : '#451a03'} stroke={bulbType === 'led' ? '#34d399' : '#f59e0b'} strokeWidth="3" />
              <text x="290" y="110" textAnchor="middle" fill="#ffffff" fontSize="11.5" fontWeight="800" fontFamily="monospace">
                {bulbType === 'led' ? 'COOL LED' : 'OLD GLOBE'}
              </text>
              <text x="290" y="128" textAnchor="middle" fill={bulbType === 'led' ? '#6ee7b7' : '#fcd34d'} fontSize="10" fontWeight="700" fontFamily="monospace">
                {usefulPct}% Useful
              </text>

              {/* Upper Output Stream: Useful Light */}
              <path
                d="M 332 102 C 390 102, 410 56, 475 56"
                fill="none"
                stroke="#34d399"
                strokeWidth={Math.max(4, usefulPct * 0.28)}
                strokeDasharray="10 8"
                className="lesson-flow-normal"
              />
              <rect x="478" y="28" width="142" height="56" rx="8" fill="#064e3b" stroke="#34d399" strokeWidth="2" />
              <text x="549" y="52" textAnchor="middle" fill="#6ee7b7" fontSize="12" fontWeight="800" fontFamily="monospace">
                USEFUL LIGHT
              </text>
              <text x="549" y="72" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="800" fontFamily="monospace">
                {usefulPct} J ({usefulPct}%)
              </text>

              {/* Lower Output Stream: Wasted Heat */}
              <path
                d="M 332 128 C 390 128, 410 174, 475 174"
                fill="none"
                stroke="#ef4444"
                strokeWidth={Math.max(4, heatPct * 0.28)}
                strokeDasharray="10 8"
                className="lesson-flow-fast"
              />
              <rect x="478" y="146" width="142" height="56" rx="8" fill="#450a0a" stroke="#ef4444" strokeWidth="2" />
              <text x="549" y="170" textAnchor="middle" fill="#fca5a5" fontSize="12" fontWeight="800" fontFamily="monospace">
                WASTED HEAT
              </text>
              <text x="549" y="190" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="800" fontFamily="monospace">
                {heatPct} J ({heatPct}%)
              </text>
            </svg>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playSwitchClick(true);
                setBulbType('globe');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                bulbType === 'globe'
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Old Filament Globe (15% Light · 85% Heat)
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playSwitchClick(true);
                setBulbType('led');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                bulbType === 'led'
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Cool LED Array (85% Light · 15% Heat)
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-700 bg-[#0d1320] p-3 overflow-hidden">
            <svg viewBox="0 0 640 230" className="w-full h-auto block" role="img" aria-label="Interactive one-way diode flap valve analogy">
              <rect x="0" y="0" width="640" height="230" rx="8" fill="#0d1320" />

              {/* Left Supply (+) & Right Return (-) */}
              <rect x="24" y="78" width="96" height="74" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="2.5" />
              <text x="72" y="108" textAnchor="middle" fill="#fbbf24" fontSize="13" fontWeight="800" fontFamily="monospace">
                +10 V IN
              </text>
              <text x="72" y="130" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="monospace">
                Push →
              </text>

              {/* Pipe left & right of diode chamber */}
              <line x1="120" y1="115" x2="245" y2="115" stroke="#1e293b" strokeWidth="18" />
              <line x1="395" y1="115" x2="508" y2="115" stroke="#1e293b" strokeWidth="18" />

              {/* Flow Left Side */}
              {diodeForward ? (
                <>
                  <line x1="120" y1="115" x2="508" y2="115" stroke="#10b981" strokeWidth="8" strokeDasharray="12 10" className="lesson-flow-normal" />
                </>
              ) : (
                <line x1="120" y1="115" x2="262" y2="115" stroke="#ef4444" strokeWidth="8" opacity="0.65" />
              )}

              {/* Diode Symbol & Mechanical Flap Chamber */}
              <rect
                x="245"
                y="52"
                width="150"
                height="126"
                rx="10"
                fill="#111827"
                stroke={diodeForward ? '#10b981' : '#ef4444'}
                strokeWidth="2.5"
              />
              <text x="320" y="74" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="700" fontFamily="monospace">
                {diodeForward ? 'FORWARD (▶|)' : 'REVERSED (|◀)'}
              </text>

              {diodeForward ? (
                <g transform="translate(320, 118)">
                  {/* Arrow pointing right with bar on right */}
                  <polygon points="-28,-22 -28,22 14,0" fill="#10b981" stroke="#6ee7b7" strokeWidth="2" />
                  <line x1="18" y1="-22" x2="18" y2="22" stroke="#6ee7b7" strokeWidth="4" />
                </g>
              ) : (
                <g transform="translate(320, 118)">
                  {/* Bar on left blocking incoming push, arrow pointing left */}
                  <line x1="-18" y1="-22" x2="-18" y2="22" stroke="#f87171" strokeWidth="5" />
                  <polygon points="28,-22 28,22 -14,0" fill="#7f1d1d" stroke="#f87171" strokeWidth="2" />
                </g>
              )}

              <text
                x="320"
                y="164"
                textAnchor="middle"
                fill={diodeForward ? '#34d399' : '#fca5a5'}
                fontSize="10.5"
                fontWeight="800"
                fontFamily="monospace"
              >
                {diodeForward ? 'VALVE OPEN · FLOWS' : 'VALVE SHUT · BLOCKED'}
              </text>

              {/* Right Current Meter */}
              <rect
                x="508"
                y="78"
                width="108"
                height="74"
                rx="8"
                fill={diodeForward ? '#064e3b' : '#450a0a'}
                stroke={diodeForward ? '#10b981' : '#ef4444'}
                strokeWidth="2.5"
              />
              <text x="562" y="106" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="700" fontFamily="monospace">
                AMPS OUT
              </text>
              <text
                x="562"
                y="132"
                textAnchor="middle"
                fill={diodeForward ? '#6ee7b7' : '#fca5a5'}
                fontSize="16"
                fontWeight="800"
                fontFamily="monospace"
              >
                {diodeForward ? '0.50 A' : '0.00 A'}
              </text>
            </svg>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playSwitchClick(true);
                setDiodeForward(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
                diodeForward
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              Arrow Matches Push (▶|) → Flows
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playSwitchClick(false);
                setDiodeForward(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
                !diodeForward
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              Flat Bar Faces Push (|◀) → Blocks (0.00 A)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const LessonAnimationStage: React.FC<LessonAnimationProps> = ({ lessonId }) => {
  switch (lessonId) {
    case 'loops':
      return <LoopsAnalogy />;
    case 'voltage':
      return <VoltageSharingAnalogy />;
    case 'ohms_law':
      return <OhmsLawAnalogy />;
    case 'parallel_fuses':
      return <ParallelFuseAnalogy />;
    case 'efficiency_diodes':
      return <EfficiencyDiodeAnalogy />;
  }
};
