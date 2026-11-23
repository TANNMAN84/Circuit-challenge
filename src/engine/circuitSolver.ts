import {
  BranchResult,
  CircuitComponent,
  CircuitSolution,
  LevelDefinition,
  ScenarioId,
  SequenceTrap,
  WinCheckResult,
} from '../types/circuit';

const CLOSED_SWITCH_OHMS = 1e-4;
const INTACT_FUSE_OHMS = 1e-4;
const WIRE_OHMS = 1e-5;
const DIODE_ON_OHMS = 1e-3;
const GMIN_SIEMENS = 1e-9;

interface ZeroEdge {
  to: string;
  kind: 'wire' | 'switch' | 'fuse';
  id: string;
}

/**
 * Solve A * x = b using Gaussian elimination with partial pivoting.
 */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, idx) => [...row, b[idx]]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let maxVal = Math.abs(M[col][col]);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(M[r][col]);
      if (v > maxVal) {
        maxVal = v;
        pivotRow = r;
      }
    }

    if (maxVal < 1e-14) {
      continue;
    }

    if (pivotRow !== col) {
      const tmp = M[col];
      M[col] = M[pivotRow];
      M[pivotRow] = tmp;
    }

    const pivot = M[col][col];
    for (let r = col + 1; r < n; r++) {
      const factor = M[r][col] / pivot;
      if (Math.abs(factor) < 1e-18) continue;
      for (let c = col; c <= n; c++) {
        M[r][c] -= factor * M[col][c];
      }
    }
  }

  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let sum = M[r][n];
    for (let c = r + 1; c < n; c++) {
      sum -= M[r][c] * x[c];
    }
    const diag = M[r][r];
    x[r] = Math.abs(diag) > 1e-14 ? sum / diag : 0;
  }

  return x;
}

/**
 * Pre-solve zero-resistance short-circuit detector.
 * Finds the shortest zero-ohm path across closed switches, wires, and intact fuses
 * directly shorting any battery's positive terminal to its negative terminal.
 */
function detectShortCircuit(
  level: LevelDefinition,
  switchStates: Record<string, boolean>,
  blownFuseIds: Set<string>,
): { detected: boolean; faultWireIds: string[]; faultSwitchIds: string[] } {
  const adj = new Map<string, ZeroEdge[]>();
  const addEdge = (u: string, v: string, kind: ZeroEdge['kind'], id: string) => {
    if (!adj.has(u)) adj.set(u, []);
    if (!adj.has(v)) adj.set(v, []);
    adj.get(u)!.push({ to: v, kind, id });
    adj.get(v)!.push({ to: u, kind, id });
  };

  for (const wire of level.wires) {
    addEdge(wire.from, wire.to, 'wire', wire.id);
  }

  for (const sw of level.switches) {
    if (switchStates[sw.id]) {
      addEdge(sw.nodeA, sw.nodeB, 'switch', sw.id);
    }
  }

  for (const comp of level.components) {
    if (comp.type === 'fuse' && !blownFuseIds.has(comp.id)) {
      addEdge(comp.nodeA, comp.nodeB, 'fuse', comp.id);
    }
  }

  const batteries = level.components.filter((c) => c.type === 'battery');
  for (const bat of batteries) {
    const start = bat.nodeA;
    const target = bat.nodeB;
    const visited = new Set<string>([start]);
    const parent = new Map<string, { prev: string; edge: ZeroEdge }>();
    const queue: string[] = [start];

    let found = false;
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === target) {
        found = true;
        break;
      }
      const edges = adj.get(curr) ?? [];
      for (const edge of edges) {
        if (!visited.has(edge.to)) {
          visited.add(edge.to);
          parent.set(edge.to, { prev: curr, edge });
          queue.push(edge.to);
        }
      }
    }

    if (found) {
      const faultWireIds: string[] = [];
      const faultSwitchIds: string[] = [];
      let cur = target;
      while (cur !== start) {
        const step = parent.get(cur);
        if (!step) break;
        if (step.edge.kind === 'wire') faultWireIds.push(step.edge.id);
        if (step.edge.kind === 'switch') faultSwitchIds.push(step.edge.id);
        cur = step.prev;
      }
      return { detected: true, faultWireIds, faultSwitchIds };
    }
  }

  return { detected: false, faultWireIds: [], faultSwitchIds: [] };
}

function getEffectiveResistance(
  comp: CircuitComponent,
  rheostatValues: Record<string, number>,
): number {
  if (comp.type === 'rheostat') {
    return Math.max(0.5, rheostatValues[comp.id] ?? comp.initialOhms ?? 30);
  }
  if (comp.type === 'fuse') {
    return INTACT_FUSE_OHMS;
  }
  if (comp.type === 'diode') {
    return DIODE_ON_OHMS;
  }
  return Math.max(0.01, comp.resistanceOhms ?? 50);
}

/**
 * Execute one Modified Nodal Analysis (MNA) linear solve for fixed diode states.
 */
function runSingleMnaSolve(
  level: LevelDefinition,
  switchStates: Record<string, boolean>,
  rheostatValues: Record<string, number>,
  blownFuseIds: Set<string>,
  diodeConducting: Record<string, boolean>,
): { nodeVoltages: Record<string, number>; batteryCurrents: Record<string, number> } {
  const groundNode =
    level.nodes.find((n) => n.isGround)?.id ??
    level.components.find((c) => c.type === 'battery')?.nodeB ??
    level.nodes[0].id;

  const nonGroundNodes = level.nodes.filter((n) => n.id !== groundNode);
  const nodeIndex = new Map<string, number>();
  nonGroundNodes.forEach((n, idx) => nodeIndex.set(n.id, idx));

  const batteries = level.components.filter((c) => c.type === 'battery');
  const numNodes = nonGroundNodes.length;
  const numBats = batteries.length;
  const dim = numNodes + numBats;

  const A = Array.from({ length: dim }, () => new Array<number>(dim).fill(0));
  const b = new Array<number>(dim).fill(0);

  // Add tiny GMIN conductance to ground on all non-ground nodes to prevent singular islands
  for (let i = 0; i < numNodes; i++) {
    A[i][i] += GMIN_SIEMENS;
  }

  const stampConductance = (nodeA: string, nodeB: string, g: number) => {
    const i = nodeIndex.get(nodeA);
    const j = nodeIndex.get(nodeB);
    if (i !== undefined) A[i][i] += g;
    if (j !== undefined) A[j][j] += g;
    if (i !== undefined && j !== undefined) {
      A[i][j] -= g;
      A[j][i] -= g;
    }
  };

  // Stamp wires
  for (const wire of level.wires) {
    stampConductance(wire.from, wire.to, 1 / WIRE_OHMS);
  }

  // Stamp closed switches
  for (const sw of level.switches) {
    if (switchStates[sw.id]) {
      stampConductance(sw.nodeA, sw.nodeB, 1 / CLOSED_SWITCH_OHMS);
    }
  }

  // Stamp resistive components, intact fuses, and conducting diodes
  for (const comp of level.components) {
    if (comp.type === 'battery') continue;
    if (comp.type === 'fuse') {
      if (!blownFuseIds.has(comp.id)) {
        stampConductance(comp.nodeA, comp.nodeB, 1 / INTACT_FUSE_OHMS);
      }
      continue;
    }
    if (comp.type === 'diode') {
      if (diodeConducting[comp.id]) {
        stampConductance(comp.nodeA, comp.nodeB, 1 / DIODE_ON_OHMS);
      }
      continue;
    }

    const r = getEffectiveResistance(comp, rheostatValues);
    stampConductance(comp.nodeA, comp.nodeB, 1 / r);
  }

  // Stamp voltage sources (batteries)
  batteries.forEach((bat, k) => {
    const row = numNodes + k;
    const posIdx = nodeIndex.get(bat.nodeA);
    const negIdx = nodeIndex.get(bat.nodeB);
    if (posIdx !== undefined) {
      A[posIdx][row] += 1;
      A[row][posIdx] += 1;
    }
    if (negIdx !== undefined) {
      A[negIdx][row] -= 1;
      A[row][negIdx] -= 1;
    }
    b[row] = bat.voltageVolts ?? 12;
  });

  const x = solveLinearSystem(A, b);

  const nodeVoltages: Record<string, number> = { [groundNode]: 0 };
  nonGroundNodes.forEach((n, idx) => {
    const val = x[idx];
    nodeVoltages[n.id] = Math.abs(val) < 1e-7 ? 0 : val;
  });

  const batteryCurrents: Record<string, number> = {};
  batteries.forEach((bat, k) => {
    // MNA convention: current leaving positive terminal is -x[numNodes + k]
    batteryCurrents[bat.id] = -x[numNodes + k];
  });

  return { nodeVoltages, batteryCurrents };
}

/**
 * Full deterministic circuit solver combining short-circuit pre-check,
 * iterative ideal diode bias convergence, MNA nodal voltage solution,
 * fuse/overload/trap detection, and win-condition verification.
 */
export function solveCircuit(
  level: LevelDefinition,
  switchStates: Record<string, boolean>,
  rheostatValues: Record<string, number>,
  existingBlownFuses: string[],
  scenario: ScenarioId,
): CircuitSolution {
  const blownSet = new Set<string>(existingBlownFuses);

  // 1. Pre-solve zero-resistance short-circuit check
  const shortCheck = detectShortCircuit(level, switchStates, blownSet);
  if (shortCheck.detected) {
    const zeroVoltages: Record<string, number> = {};
    for (const n of level.nodes) zeroVoltages[n.id] = 0;

    const emptyBranches: Record<string, BranchResult> = {};
    for (const comp of level.components) {
      emptyBranches[comp.id] = {
        id: comp.id,
        currentAmps: 0,
        voltageDropVolts: 0,
        powerWatts: 0,
        wasteHeatWatts: 0,
        isEnergised: false,
        isBlown: blownSet.has(comp.id),
      };
    }
    for (const sw of level.switches) {
      emptyBranches[sw.id] = {
        id: sw.id,
        currentAmps: 0,
        voltageDropVolts: 0,
        powerWatts: 0,
        wasteHeatWatts: 0,
        isEnergised: false,
      };
    }

    const winChecks: WinCheckResult[] = level.winConditions.map((wc) => {
      const comp = level.components.find((c) => c.id === wc.componentId);
      return {
        conditionId: wc.id,
        componentId: wc.componentId,
        satisfied: false,
        label: comp ? comp.scenarioLabels[scenario] : wc.componentId,
        targetText:
          wc.targetState === 'current_range'
            ? `${wc.minCurrentAmps?.toFixed(2)}–${wc.maxCurrentAmps?.toFixed(2)} A`
            : wc.targetState.toUpperCase(),
        currentText: 'TRIPPED',
      };
    });

    return {
      nodeVoltages: zeroVoltages,
      branches: emptyBranches,
      totalSupplyCurrentAmps: 0,
      totalWasteHeatWatts: 0,
      shortCircuit: shortCheck,
      blownFuseIds: Array.from(blownSet),
      overloadedComponentIds: [],
      triggeredTrap: null,
      winChecks,
      allConditionsMet: false,
    };
  }

  // 2. Iterative ideal diode conduction solve
  const diodes = level.components.filter((c) => c.type === 'diode');
  const diodeConducting: Record<string, boolean> = {};
  for (const d of diodes) {
    diodeConducting[d.id] = false;
  }

  let mnaResult = runSingleMnaSolve(
    level,
    switchStates,
    rheostatValues,
    blownSet,
    diodeConducting,
  );

  if (diodes.length > 0) {
    for (let iter = 0; iter < 16; iter++) {
      let changed = false;
      for (const d of diodes) {
        const va = mnaResult.nodeVoltages[d.nodeA] ?? 0;
        const vb = mnaResult.nodeVoltages[d.nodeB] ?? 0;
        const dv = va - vb;
        if (!diodeConducting[d.id] && dv > 1e-3) {
          diodeConducting[d.id] = true;
          changed = true;
        } else if (diodeConducting[d.id]) {
          const iDiode = dv / DIODE_ON_OHMS;
          if (iDiode < -1e-4) {
            diodeConducting[d.id] = false;
            changed = true;
          }
        }
      }
      if (!changed) break;
      mnaResult = runSingleMnaSolve(
        level,
        switchStates,
        rheostatValues,
        blownSet,
        diodeConducting,
      );
    }
  }

  // 3. Evaluate branch currents, power, fuses, overloads, waste heat
  const branches: Record<string, BranchResult> = {};
  const newlyBlownFuses: string[] = [];
  const overloadedComponentIds: string[] = [];
  let totalWasteHeatWatts = 0;
  let totalSupplyCurrentAmps = 0;

  for (const comp of level.components) {
    const va = mnaResult.nodeVoltages[comp.nodeA] ?? 0;
    const vb = mnaResult.nodeVoltages[comp.nodeB] ?? 0;
    const dv = va - vb;

    if (comp.type === 'battery') {
      const current = mnaResult.batteryCurrents[comp.id] ?? 0;
      totalSupplyCurrentAmps += Math.abs(current);
      branches[comp.id] = {
        id: comp.id,
        currentAmps: current,
        voltageDropVolts: dv,
        powerWatts: Math.abs(dv * current),
        wasteHeatWatts: 0,
        isEnergised: true,
      };
      continue;
    }

    if (comp.type === 'fuse') {
      const isAlreadyBlown = blownSet.has(comp.id);
      const current = isAlreadyBlown ? 0 : dv / INTACT_FUSE_OHMS;
      const limit = comp.maxCurrentAmps ?? 5.0;
      const exceeds = !isAlreadyBlown && Math.abs(current) > limit + 1e-4;
      if (exceeds) {
        newlyBlownFuses.push(comp.id);
        blownSet.add(comp.id);
      }
      branches[comp.id] = {
        id: comp.id,
        currentAmps: current,
        voltageDropVolts: dv,
        powerWatts: Math.abs(dv * current),
        wasteHeatWatts: 0,
        isEnergised: !isAlreadyBlown && !exceeds && Math.abs(current) > 0.01,
        isBlown: isAlreadyBlown || exceeds,
        isOverloaded: exceeds,
      };
      continue;
    }

    if (comp.type === 'diode') {
      const conducting = Boolean(diodeConducting[comp.id]);
      const current = conducting ? Math.max(0, dv / DIODE_ON_OHMS) : 0;
      branches[comp.id] = {
        id: comp.id,
        currentAmps: current,
        voltageDropVolts: dv,
        powerWatts: Math.abs(dv * current),
        wasteHeatWatts: 0,
        isEnergised: conducting && current > 0.005,
        isForwardBiased: conducting,
      };
      continue;
    }

    const r = getEffectiveResistance(comp, rheostatValues);
    const current = dv / r;
    const absI = Math.abs(current);
    const absV = Math.abs(dv);
    const power = absV * absI;

    const minI = comp.minOnCurrentAmps ?? 0.04;
    const isEnergised =
      comp.minOnVoltageVolts !== undefined
        ? absV >= comp.minOnVoltageVolts
        : absI >= minI;

    const isOverloaded =
      comp.maxCurrentAmps !== undefined && absI > comp.maxCurrentAmps + 1e-4;
    if (isOverloaded) {
      overloadedComponentIds.push(comp.id);
    }

    const isOverVoltage =
      comp.maxVoltageVolts !== undefined && absV > comp.maxVoltageVolts + 0.05;

    const effPct = comp.efficiencyPct ?? 100;
    const wasteHeat = power * ((100 - effPct) / 100);
    totalWasteHeatWatts += wasteHeat;

    branches[comp.id] = {
      id: comp.id,
      currentAmps: current,
      voltageDropVolts: dv,
      powerWatts: power,
      wasteHeatWatts: wasteHeat,
      isEnergised,
      isOverloaded,
      isOverVoltage,
    };
  }

  for (const sw of level.switches) {
    const va = mnaResult.nodeVoltages[sw.nodeA] ?? 0;
    const vb = mnaResult.nodeVoltages[sw.nodeB] ?? 0;
    const dv = va - vb;
    const closed = Boolean(switchStates[sw.id]);
    const current = closed ? dv / CLOSED_SWITCH_OHMS : 0;
    branches[sw.id] = {
      id: sw.id,
      currentAmps: current,
      voltageDropVolts: dv,
      powerWatts: 0,
      wasteHeatWatts: 0,
      isEnergised: closed && Math.abs(current) > 0.005,
    };
  }

  // 4. Sequence trap check (e.g. Level 5 anti-tamper siren)
  let triggeredTrap: SequenceTrap | null = null;
  if (level.sequenceTraps) {
    for (const trap of level.sequenceTraps) {
      const br = branches[trap.componentId];
      if (br?.isEnergised) {
        triggeredTrap = trap;
        break;
      }
    }
  }

  // 5. Evaluate win conditions
  const winChecks: WinCheckResult[] = level.winConditions.map((wc) => {
    const comp = level.components.find((c) => c.id === wc.componentId);
    const br = branches[wc.componentId];
    const label = comp ? comp.scenarioLabels[scenario] : wc.componentId;
    const absI = Math.abs(br?.currentAmps ?? 0);

    if (wc.targetState === 'current_range') {
      const minA = wc.minCurrentAmps ?? 0;
      const maxA = wc.maxCurrentAmps ?? 1;
      const satisfied =
        absI >= minA - 1e-4 && absI <= maxA + 1e-4 && !br?.isOverloaded;
      return {
        conditionId: wc.id,
        componentId: wc.componentId,
        satisfied,
        label,
        targetText: `${minA.toFixed(2)}–${maxA.toFixed(2)} A`,
        currentText: `${absI.toFixed(2)} A`,
      };
    }

    const wantOn = wc.targetState === 'on';
    const isOn = Boolean(br?.isEnergised);
    const satisfied = wantOn
      ? isOn && !br?.isOverVoltage && !br?.isOverloaded
      : !isOn;

    return {
      conditionId: wc.id,
      componentId: wc.componentId,
      satisfied,
      label,
      targetText: wantOn ? 'ON' : 'OFF',
      currentText: br?.isOverVoltage
        ? `OVER-V (${Math.abs(br.voltageDropVolts).toFixed(1)}V)`
        : isOn
          ? 'ON'
          : 'OFF',
    };
  });

  const hasFault =
    newlyBlownFuses.length > 0 ||
    blownSet.size > 0 ||
    overloadedComponentIds.length > 0 ||
    triggeredTrap !== null;

  const allConditionsMet =
    !hasFault && winChecks.length > 0 && winChecks.every((c) => c.satisfied);

  return {
    nodeVoltages: mnaResult.nodeVoltages,
    branches,
    totalSupplyCurrentAmps,
    totalWasteHeatWatts,
    shortCircuit: { detected: false, faultWireIds: [], faultSwitchIds: [] },
    blownFuseIds: Array.from(blownSet),
    overloadedComponentIds,
    triggeredTrap,
    winChecks,
    allConditionsMet,
  };
}
