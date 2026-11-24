import React, { useEffect } from 'react';
import { FaultState } from '../types/circuit';
import {
  AlertTriangle,
  ArrowRight,
  Eye,
  Flame,
  GraduationCap,
  Radio,
  RotateCcw,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react';

interface DramaticEventOverlayProps {
  mode: 'fault' | 'victory';
  faultState: FaultState;
  debriefNote?: string;
  nextActionLabel?: string;
  nextActionIsLesson?: boolean;
  onReset: () => void;
  onInspect: () => void;
  onNextMission?: () => void;
}

const SPARKS = [
  { angle: 12, dist: 240, size: 7, delay: 0, colour: '#fde047' },
  { angle: 38, dist: 310, size: 5, delay: 40, colour: '#fb923c' },
  { angle: 65, dist: 270, size: 8, delay: 20, colour: '#f97316' },
  { angle: 92, dist: 290, size: 6, delay: 60, colour: '#fef08a' },
  { angle: 118, dist: 330, size: 7, delay: 15, colour: '#ef4444' },
  { angle: 145, dist: 260, size: 5, delay: 55, colour: '#fbbf24' },
  { angle: 172, dist: 320, size: 8, delay: 30, colour: '#fb923c' },
  { angle: 198, dist: 280, size: 6, delay: 75, colour: '#fde047' },
  { angle: 224, dist: 340, size: 7, delay: 10, colour: '#f97316' },
  { angle: 252, dist: 250, size: 5, delay: 50, colour: '#ef4444' },
  { angle: 280, dist: 310, size: 8, delay: 25, colour: '#fbbf24' },
  { angle: 306, dist: 295, size: 6, delay: 65, colour: '#fef08a' },
  { angle: 332, dist: 330, size: 7, delay: 35, colour: '#fb923c' },
  { angle: 354, dist: 270, size: 5, delay: 80, colour: '#fde047' },
];

const VICTORY_SPARKS = [
  { angle: 18, dist: 230, size: 7, delay: 0, colour: '#34d399' },
  { angle: 50, dist: 280, size: 6, delay: 35, colour: '#fbbf24' },
  { angle: 85, dist: 250, size: 7, delay: 15, colour: '#6ee7b7' },
  { angle: 120, dist: 290, size: 6, delay: 50, colour: '#38bdf8' },
  { angle: 155, dist: 240, size: 7, delay: 25, colour: '#34d399' },
  { angle: 192, dist: 275, size: 6, delay: 60, colour: '#fde047' },
  { angle: 228, dist: 260, size: 7, delay: 10, colour: '#6ee7b7' },
  { angle: 264, dist: 295, size: 6, delay: 45, colour: '#38bdf8' },
  { angle: 300, dist: 245, size: 7, delay: 20, colour: '#34d399' },
  { angle: 338, dist: 285, size: 6, delay: 55, colour: '#fbbf24' },
];

export const DramaticEventOverlay: React.FC<DramaticEventOverlayProps> = ({
  mode,
  faultState,
  debriefNote,
  nextActionLabel,
  nextActionIsLesson,
  onReset,
  onInspect,
  onNextMission,
}) => {
  const isVictory = mode === 'victory';
  const kind = faultState.kind;
  const isExplosion = !isVictory && (kind === 'timeout' || kind === 'thermal');
  const isElectric = !isVictory && (kind === 'short' || kind === 'fuse' || kind === 'overload');
  const isSiren = !isVictory && kind === 'sequence';

  const headline = isVictory
    ? 'DEVICE DISARMED!'
    : kind === 'timeout'
      ? "BOOM! TIME'S UP!"
      : kind === 'thermal'
        ? 'CORE MELTDOWN!'
        : kind === 'short'
          ? 'SHORT CIRCUIT BLAST!'
          : kind === 'fuse'
            ? 'FUSE SNAPPED!'
            : kind === 'overload'
              ? 'COIL BURNT OUT!'
              : 'ALARM TRAP TRIGGERED!';

  const subtag = isVictory
    ? 'COUNTDOWN STOPPED · CIRCUIT SAFE'
    : kind === 'timeout'
      ? 'DETONATION SEQUENCE TRIGGERED AT 00:00'
      : kind === 'thermal'
        ? 'CRITICAL OVERHEAT · CORE CONTAINMENT BREACHED'
        : isElectric
          ? 'HIGH-CURRENT ARC · SAFETY LOCKOUT ENGAGED'
          : 'ANTI-TAMPER SIREN ACTIVATED · PANEL LOCKED';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onInspect();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onInspect]);

  return (
    <div
      className="no-print fixed inset-0 z-40 flex items-center justify-center p-4 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={headline}
    >
      {/* Atmospheric Backdrop Scrim */}
      <div
        className={`absolute inset-0 backdrop-blur-[3px] ${
          isVictory
            ? 'bg-emerald-950/70'
            : isExplosion
              ? 'bg-gradient-to-b from-red-950/88 via-stone-950/88 to-orange-950/90'
              : isElectric
                ? 'bg-slate-950/85'
                : 'bg-red-950/85'
        }`}
      />

      {/* Initial Blinding Impact Flash */}
      <div
        className={`pointer-events-none absolute inset-0 animate-blast-flash ${
          isVictory
            ? 'bg-emerald-300/65'
            : isExplosion
              ? 'bg-amber-200/90'
              : isElectric
                ? 'bg-sky-200/85'
                : 'bg-red-500/70'
        }`}
      />

      {/* Rotating Emergency Strobe Beams for Siren Trap */}
      {isSiren && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vmax] h-[150vmax] animate-strobe-sweep opacity-35">
            <div
              className="w-full h-full"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent 0deg, rgba(239,68,68,0.85) 28deg, transparent 60deg, transparent 180deg, rgba(239,68,68,0.85) 208deg, transparent 240deg)',
              }}
            />
          </div>
        </div>
      )}

      {/* Expanding Concentric Shockwave Rings (Explosion, Electric Blast, or Victory Cool-Down Wave) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {[0, 140, 290].map((delayMs, idx) => (
          <div
            key={idx}
            className={`absolute w-40 h-40 rounded-full border-4 animate-shockwave-ring ${
              isVictory
                ? 'border-emerald-400/85'
                : isExplosion
                  ? idx === 0
                    ? 'border-amber-300'
                    : 'border-orange-500/85'
                  : isElectric
                    ? 'border-cyan-300/90'
                    : 'border-red-500/80'
            }`}
            style={{ animationDelay: `${delayMs}ms` }}
          />
        ))}
      </div>

      {/* Radial Flying Sparks / Debris Particles */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {(isVictory ? VICTORY_SPARKS : SPARKS).map((sp, i) => {
          const rad = (sp.angle * Math.PI) / 180;
          const dx = Math.round(Math.cos(rad) * sp.dist);
          const dy = Math.round(Math.sin(rad) * sp.dist);
          return (
            <span
              key={i}
              className="absolute rounded-full animate-spark-burst"
              style={
                {
                  width: `${sp.size}px`,
                  height: `${sp.size}px`,
                  backgroundColor: isElectric ? (i % 2 === 0 ? '#7dd3fc' : '#fef08a') : sp.colour,
                  boxShadow: `0 0 12px ${isElectric ? '#38bdf8' : sp.colour}`,
                  animationDelay: `${sp.delay}ms`,
                  '--dx': `${dx}px`,
                  '--dy': `${dy}px`,
                } as React.CSSProperties
              }
            />
          );
        })}
      </div>

      {/* Jagged Electric Lightning Arcs SVG (Short Circuit / Fuse / Overload) */}
      {isElectric && (
        <svg
          viewBox="0 0 1000 600"
          className="pointer-events-none absolute inset-0 w-full h-full animate-arc-flash"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline
            points="80,70 210,160 185,205 340,280 295,310 470,350"
            fill="none"
            stroke="#7dd3fc"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="920,90 790,175 820,220 660,285 705,320 535,345"
            fill="none"
            stroke="#fef08a"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="160,540 290,445 265,415 440,340"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="850,535 720,440 745,405 565,335"
            fill="none"
            stroke="#7dd3fc"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* Cracked Visor Overlay Lines for Explosion / Core Meltdown */}
      {isExplosion && (
        <svg
          viewBox="0 0 1000 600"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-40"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M 0 0 L 145 110 L 115 165 L 220 215 M 145 110 L 245 75"
            fill="none"
            stroke="#fed7aa"
            strokeWidth="2.5"
          />
          <path
            d="M 1000 0 L 855 120 L 895 175 L 775 230 M 855 120 L 760 80"
            fill="none"
            stroke="#fed7aa"
            strokeWidth="2.5"
          />
          <path
            d="M 0 600 L 160 470 L 235 495 M 1000 600 L 835 475 L 770 500"
            fill="none"
            stroke="#fed7aa"
            strokeWidth="2.5"
          />
        </svg>
      )}

      {/* Central High-Impact Action Card */}
      <div
        className={`relative z-10 w-full max-w-lg rounded-2xl border-2 overflow-hidden shadow-2xl ${
          isVictory
            ? 'animate-stamp-pop border-emerald-400 bg-[#0b1914]/96 text-emerald-50'
            : isExplosion
              ? 'animate-blast-recoil border-orange-500 bg-[#1a0b07]/96 text-orange-50'
              : isElectric
                ? 'animate-blast-recoil border-cyan-400 bg-[#0a1322]/96 text-slate-50'
                : 'animate-blast-recoil border-red-500 bg-[#1b080a]/96 text-red-50'
        }`}
      >
        <div className={`h-2 w-full ${isVictory ? 'bg-emerald-400' : 'hazard-stripe-bar'}`} />

        <button
          type="button"
          onClick={onInspect}
          aria-label="Close overlay"
          className="absolute top-4 right-3.5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-7 text-center space-y-4">
          {/* Iconic Focal Crest */}
          <div className="flex justify-center">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 shadow-lg ${
                isVictory
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : isExplosion
                    ? 'bg-orange-500/25 border-orange-400 text-amber-300'
                    : isElectric
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-red-500/25 border-red-400 text-red-300'
              }`}
            >
              {isVictory ? (
                <ShieldCheck className="w-9 h-9" />
              ) : isExplosion ? (
                <Flame className="w-9 h-9" />
              ) : isElectric ? (
                <Zap className="w-9 h-9" />
              ) : isSiren ? (
                <Radio className="w-9 h-9" />
              ) : (
                <AlertTriangle className="w-9 h-9" />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <div
              className={`text-[11px] font-mono font-bold tracking-widest uppercase ${
                isVictory
                  ? 'text-emerald-300'
                  : isExplosion
                    ? 'text-amber-300'
                    : isElectric
                      ? 'text-cyan-300'
                      : 'text-red-300'
              }`}
            >
              {subtag}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white">
              {headline}
            </h2>
            <p className="text-sm leading-relaxed text-slate-200 max-w-md mx-auto pt-1">
              {isVictory ? debriefNote : faultState.detail}
            </p>
          </div>

          {/* Crisp Action Deck */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5">
            {isVictory ? (
              <>
                {onNextMission && (
                  <button
                    type="button"
                    onClick={onNextMission}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-extrabold transition-colors shadow-md ${
                      nextActionIsLesson
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                        : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                    }`}
                  >
                    {nextActionIsLesson && <GraduationCap className="w-4 h-4" />}
                    <span>{nextActionLabel ?? 'Next Mission'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onInspect}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-emerald-500/50 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-100 text-xs font-bold transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Board
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onReset}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-extrabold transition-colors shadow-md ${
                    isElectric
                      ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Device &amp; Try Again
                </button>
                <button
                  type="button"
                  onClick={onInspect}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-slate-600 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Inspect Wires
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
