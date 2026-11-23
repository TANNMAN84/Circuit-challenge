import { ConfidenceTier, ScenarioId } from '../types/circuit';

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

export const SCENARIOS: Record<ScenarioId, ScenarioMetadata> = {
  forensic: {
    id: 'forensic',
    name: 'Locked Evidence Case',
    shortName: 'Evidence Case',
    tagline: 'Open trapped evidence boxes on your workbench before the alarm goes off.',
    chassisCode: 'EVIDENCE BOX',
    successVerb: 'Disarmed',
    successHeadline: 'BOX DISARMED!',
    accentLabel: 'Workbench Mission',
    backgroundImage: '/src/assets/images/bg_forensic_bench_1795417780790.jpg',
    fallbackGradient: 'from-stone-900 via-zinc-900 to-amber-950',
    stripeClass: 'hazard-stripe-bar',
    chassisFrameBorder: '#f59e0b',
    accentTextClass: 'text-amber-600 dark:text-amber-400',
    accentBgClass: 'bg-amber-500 hover:bg-amber-600 text-slate-950',
    accentRingClass: 'border-amber-500 dark:border-amber-400',
    bayTintLight: '#eceae4',
    bayTintDark: '#1b1d24',
  },
  rov: {
    id: 'rov',
    name: 'Deep-Sea Sub Rescue',
    shortName: 'Deep-Sea Sub',
    tagline: 'Fix flooded control boxes inside a deep-sea rescue robot before power runs out.',
    chassisCode: 'SUB CONTROL BOX',
    successVerb: 'Fixed',
    successHeadline: 'SUB SAFE & READY!',
    accentLabel: 'Deep-Sea Mission',
    backgroundImage: '/src/assets/images/bg_deepsea_rov_1795417780221.jpg',
    fallbackGradient: 'from-slate-950 via-cyan-950 to-teal-950',
    stripeClass: 'rov-stripe-bar',
    chassisFrameBorder: '#06b6d4',
    accentTextClass: 'text-cyan-700 dark:text-cyan-400',
    accentBgClass: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950',
    accentRingClass: 'border-cyan-500 dark:border-cyan-400',
    bayTintLight: '#e3eff3',
    bayTintDark: '#0f202c',
  },
  outback: {
    id: 'outback',
    name: 'Outback Solar Station',
    shortName: 'Outback Station',
    tagline: 'Beat an outback dust storm to switch off broken solar wires and keep the station safe.',
    chassisCode: 'SOLAR CONTROL BOX',
    successVerb: 'Fixed',
    successHeadline: 'STATION SAFE!',
    accentLabel: 'Outback Storm Mission',
    backgroundImage: '/src/assets/images/bg_outback_station_1795417780956.jpg',
    fallbackGradient: 'from-stone-950 via-orange-950 to-amber-950',
    stripeClass: 'outback-stripe-bar',
    chassisFrameBorder: '#ea580c',
    accentTextClass: 'text-orange-700 dark:text-orange-400',
    accentBgClass: 'bg-orange-500 hover:bg-orange-400 text-slate-950',
    accentRingClass: 'border-orange-500 dark:border-orange-400',
    bayTintLight: '#f3eae3',
    bayTintDark: '#221714',
  },
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
