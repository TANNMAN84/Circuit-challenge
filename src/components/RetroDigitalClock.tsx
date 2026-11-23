import React from 'react';
import { ConfidenceTier } from '../types/circuit';
import { CONFIDENCE_TIERS } from '../data/scenarios';

interface RetroDigitalClockProps {
  remainingSeconds: number | null;
  totalSeconds: number | null;
  confidenceTier: ConfidenceTier;
  isLevelOne: boolean;
  isWon: boolean;
  isLockedOut: boolean;
  isPaused: boolean;
  onSelectConfidence: (tier: ConfidenceTier) => void;
}

// Standard 7-segment bitmask: [a(top), b(tr), c(br), d(bot), e(bl), f(tl), g(mid)]
const SEGMENT_MAP: Record<string, [number, number, number, number, number, number, number]> = {
  '0': [1, 1, 1, 1, 1, 1, 0],
  '1': [0, 1, 1, 0, 0, 0, 0],
  '2': [1, 1, 0, 1, 1, 0, 1],
  '3': [1, 1, 1, 1, 0, 0, 1],
  '4': [0, 1, 1, 0, 0, 1, 1],
  '5': [1, 0, 1, 1, 0, 1, 1],
  '6': [1, 0, 1, 1, 1, 1, 1],
  '7': [1, 1, 1, 0, 0, 0, 0],
  '8': [1, 1, 1, 1, 1, 1, 1],
  '9': [1, 1, 1, 1, 0, 1, 1],
  '-': [0, 0, 0, 0, 0, 0, 1],
  'E': [1, 0, 0, 1, 1, 1, 1],
  'r': [0, 0, 0, 0, 1, 0, 1],
  ' ': [0, 0, 0, 0, 0, 0, 0],
};

interface SevenSegDigitProps {
  char: string;
  x: number;
  litColour: string;
  ghostColour: string;
  glowFilter: string;
}

const SevenSegDigit: React.FC<SevenSegDigitProps> = ({
  char,
  x,
  litColour,
  ghostColour,
  glowFilter,
}) => {
  const segs = SEGMENT_MAP[char] ?? SEGMENT_MAP[' '];
  // Polygonal beveled retro LED segments (width 34, height 60)
  const paths = [
    'M 6,3 L 28,3 L 24,8 L 10,8 Z', // a (top)
    'M 30,5 L 30,27 L 25,24 L 25,9 Z', // b (top-right)
    'M 30,33 L 30,55 L 25,51 L 25,36 Z', // c (bottom-right)
    'M 6,57 L 28,57 L 24,52 L 10,52 Z', // d (bottom)
    'M 4,33 L 9,36 L 9,51 L 4,55 Z', // e (bottom-left)
    'M 4,5 L 9,9 L 9,24 L 4,27 Z', // f (top-left)
    'M 6,30 L 10,26.5 L 24,26.5 L 28,30 L 24,33.5 L 10,33.5 Z', // g (middle)
  ];

  return (
    <g transform={`translate(${x}, 6)`}>
      {paths.map((d, idx) => {
        const isLit = segs[idx] === 1;
        return (
          <path
            key={idx}
            d={d}
            fill={isLit ? litColour : ghostColour}
            filter={isLit ? glowFilter : undefined}
          />
        );
      })}
    </g>
  );
};

export const RetroDigitalClock: React.FC<RetroDigitalClockProps> = ({
  remainingSeconds,
  totalSeconds,
  confidenceTier,
  isLevelOne,
  isWon,
  isLockedOut,
  isPaused,
  onSelectConfidence,
}) => {
  const isUntimed = remainingSeconds === null;
  const isLow = remainingSeconds !== null && remainingSeconds <= 30 && remainingSeconds > 10;
  const isCritical = remainingSeconds !== null && remainingSeconds <= 10;

  let d0 = '-';
  let d1 = '-';
  let d2 = '-';
  let d3 = '-';
  let showColon = true;

  if (isLockedOut && remainingSeconds === 0) {
    d0 = '0';
    d1 = '0';
    d2 = '0';
    d3 = '0';
  } else if (isLockedOut) {
    d0 = 'E';
    d1 = 'r';
    d2 = 'r';
    d3 = ' ';
    showColon = false;
  } else if (!isUntimed) {
    const clamped = Math.max(0, Math.floor(remainingSeconds));
    const mins = Math.min(99, Math.floor(clamped / 60));
    const secs = clamped % 60;
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    d0 = mm[0];
    d1 = mm[1];
    d2 = ss[0];
    d3 = ss[1];
    // Blink colon on alternating seconds while running
    showColon = isWon || isPaused ? true : secs % 2 === 0;
  }

  // Retro phosphor palette: classic red digital LED, green on disarm win, amber on pause
  const litColour = isWon
    ? '#22ff88'
    : isPaused
      ? '#fbbf24'
      : '#ff2b2b';
  const ghostColour = isWon
    ? '#0a291a'
    : isPaused
      ? '#2b200a'
      : '#2d0a0a';
  const glowFilter = isWon
    ? 'url(#led-glow-win)'
    : isPaused
      ? 'url(#led-glow-pause)'
      : 'url(#led-glow-red)';

  const ratio =
    remainingSeconds !== null && totalSeconds
      ? Math.max(0, Math.min(1, remainingSeconds / totalSeconds))
      : 1;

  const statusText = isWon
    ? 'SAFE · HALTED'
    : isLockedOut
      ? 'LOCKED OUT'
      : isPaused
        ? 'HOLD'
        : isUntimed
          ? 'FREE PLAY'
          : isCritical
            ? 'CRITICAL'
            : isLow
              ? 'HURRY'
              : 'ARMED';

  return (
    <div
      className={`rounded-xl border-2 bg-[#14171f] text-slate-100 shadow-lg overflow-hidden transition-colors ${
        isWon
          ? 'border-emerald-500/80'
          : isLockedOut || isCritical
            ? 'border-red-500'
            : 'border-slate-700'
      }`}
    >
      {/* Bolted Aluminium Clock Bezel Header */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#1d222e] border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isWon
                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                : isPaused
                  ? 'bg-amber-400'
                  : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
            }`}
          />
          <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-slate-300">
            TIMER MODULE
          </span>
        </div>
        <span
          className={`font-mono text-[10px] font-bold tracking-wider ${
            isWon
              ? 'text-emerald-400'
              : isLockedOut || isCritical
                ? 'text-red-400'
                : isLow || isPaused
                  ? 'text-amber-400'
                  : 'text-red-400/90'
          }`}
        >
          {statusText}
        </span>
      </div>

      {/* Recessed Dark Glass 7-Segment Red LED Display */}
      <div className="p-3 bg-[#090b10]">
        <div
          className={`relative rounded-lg bg-[#050608] border border-slate-800 px-3 py-2 shadow-inner ${
            isCritical && !isWon && !isLockedOut ? 'animate-pulse' : ''
          }`}
        >
          {/* Subtle glass reflection sheen */}
          <div className="pointer-events-none absolute inset-x-2 top-1 h-3 rounded-full bg-gradient-to-b from-white/[0.06] to-transparent" />

          <svg
            viewBox="0 0 184 72"
            className="w-full max-w-[230px] mx-auto h-auto block"
            role="timer"
            aria-label={
              isUntimed
                ? 'Untimed free play mode'
                : `Remaining time ${d0}${d1} minutes ${d2}${d3} seconds`
            }
          >
            <defs>
              <filter id="led-glow-red" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="led-glow-win" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="led-glow-pause" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <SevenSegDigit char={d0} x={8} litColour={litColour} ghostColour={ghostColour} glowFilter={glowFilter} />
            <SevenSegDigit char={d1} x={48} litColour={litColour} ghostColour={ghostColour} glowFilter={glowFilter} />

            {/* Blinking 7-segment colon */}
            <circle
              cx={92}
              cy={25}
              r={3.4}
              fill={showColon ? litColour : ghostColour}
              filter={showColon ? glowFilter : undefined}
            />
            <circle
              cx={92}
              cy={47}
              r={3.4}
              fill={showColon ? litColour : ghostColour}
              filter={showColon ? glowFilter : undefined}
            />

            <SevenSegDigit char={d2} x={102} litColour={litColour} ghostColour={ghostColour} glowFilter={glowFilter} />
            <SevenSegDigit char={d3} x={142} litColour={litColour} ghostColour={ghostColour} glowFilter={glowFilter} />
          </svg>

          {/* Segmented LED bar beneath clock */}
          {!isUntimed && (
            <div className="mt-2 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-0.5">
              {Array.from({ length: 16 }).map((_, idx) => {
                const lit = idx / 16 < ratio;
                const barColour = isWon
                  ? 'bg-emerald-400'
                  : idx < 4
                    ? 'bg-red-500'
                    : idx < 8
                      ? 'bg-amber-400'
                      : 'bg-red-500/90';
                return (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-[1px] transition-opacity ${
                      lit ? `${barColour} opacity-95` : 'bg-slate-800 opacity-50'
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Confidence Pace Selector (Prominent on Level 1, always accessible) */}
        <div className="mt-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-400">
            <span>{isLevelOne ? 'PICK DIFFICULTY PACE:' : 'TIMER PACE:'}</span>
            <span className="text-slate-200 font-semibold">
              {CONFIDENCE_TIERS[confidenceTier].label}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1 p-0.5 rounded-lg bg-[#161a24] border border-slate-800">
            {(['untimed', 'learner', 'standard', 'extreme'] as ConfidenceTier[]).map((tier) => {
              const active = confidenceTier === tier;
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => onSelectConfidence(tier)}
                  className={`py-1 px-1 rounded text-[10.5px] font-mono font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? tier === 'extreme'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  {CONFIDENCE_TIERS[tier].label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
