import { ConfidenceTier, ScenarioId } from '../types/circuit';
import coreBenchBg from '../assets/images/bg_forensic_bench_1795417780790.jpg';

export interface ScenarioMetadata {
  id: ScenarioId;
  name: string;
  shortName: string;
  tagline: string;
  chassisCode: string;
  successVerb: string;
  successHeadline: string;
  accentLabel: string;
  backgroundImage: string;
  fallbackGradient: string;
  stripeClass: string;
  chassisFrameBorder: string;
  accentTextClass: string;
  accentBgClass: string;
  accentRingClass: string;
  bayTintLight: string;
  bayTintDark: string;
}

export const DEFAULT_SCENARIO: ScenarioId = 'forensic';

const UNIFIED_THEME: ScenarioMetadata = {
  id: 'forensic',
  name: 'Core Disarm',
  shortName: 'Core Disarm',
  tagline: 'Trace the circuit map, dodge traps, and disarm the countdown core before detonation.',
  chassisCode: 'LIVE CORE UNIT',
  successVerb: 'Disarmed',
  successHeadline: 'DEVICE DISARMED!',
  accentLabel: 'Live Countdown Device',
  backgroundImage: coreBenchBg,
  fallbackGradient: 'from-stone-900 via-zinc-900 to-amber-950',
  stripeClass: 'hazard-stripe-bar',
  chassisFrameBorder: '#f59e0b',
  accentTextClass: 'text-amber-600 dark:text-amber-400',
  accentBgClass: 'bg-amber-500 hover:bg-amber-600 text-slate-950',
  accentRingClass: 'border-amber-500 dark:border-amber-400',
  bayTintLight: '#eceae4',
  bayTintDark: '#1b1d24',
};

export const SCENARIOS: Record<ScenarioId, ScenarioMetadata> = {
  forensic: UNIFIED_THEME,
  rov: UNIFIED_THEME,
  outback: UNIFIED_THEME,
};

export interface ConfidenceConfig {
  id: ConfidenceTier;
  label: string;
  multiplier: number | null;
  summary: string;
}

export const CONFIDENCE_TIERS: Record<ConfidenceTier, ConfidenceConfig> = {
  untimed: {
    id: 'untimed',
    label: 'No Timer',
    multiplier: null,
    summary: 'No rush — take all the time you want to figure out the wires.',
  },
  learner: {
    id: 'learner',
    label: 'Learner',
    multiplier: 2.0,
    summary: 'Double time (2×) — great if you are just getting started.',
  },
  standard: {
    id: 'standard',
    label: 'Standard',
    multiplier: 1.0,
    summary: 'Normal game clock — steady pace, fun challenge!',
  },
  extreme: {
    id: 'extreme',
    label: 'Extreme',
    multiplier: 0.45,
    summary: 'Super short clock — fast hands only!',
  },
};

export function computeLevelSeconds(standardSeconds: number, tier: ConfidenceTier): number | null {
  const cfg = CONFIDENCE_TIERS[tier];
  if (cfg.multiplier === null) {
    return null;
  }
  return Math.max(45, Math.round(standardSeconds * cfg.multiplier));
}

export function formatCountdown(seconds: number | null): string {
  if (seconds === null) {
    return '--:--';
  }
  const clamped = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
