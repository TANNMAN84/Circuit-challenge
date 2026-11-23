export type ScenarioId = 'forensic' | 'rov' | 'outback';

export type ConfidenceTier = 'untimed' | 'learner' | 'standard' | 'extreme';

export type ComponentType =
  | 'battery'
  | 'resistor'
  | 'rheostat'
  | 'lamp'
  | 'led'
  | 'fan'
  | 'siren'
  | 'relay'
  | 'fuse'
  | 'diode';

export interface Point2D {
  x: number;
  y: number;
}

export interface CircuitNode {
  id: string;
  /** Tidy IEC schematic coordinates (viewBox 0 0 800 440) */
  schematic: Point2D;
  /** Optional brass test-point stud label for Voltmeter (V) mode (e.g. "TP1") */
  testPointLabel?: string;
  /** Physical position of the brass test-point stud on the hardware bay (viewBox 0 0 860 540) */
  physicalTestPoint?: Point2D;
  /** Reference ground node (battery negative terminal) */
  isGround?: boolean;
}

export interface CircuitWire {
  id: string;
  from: string;
  to: string;
  /** Orthogonal waypoints on the tidy IEC schematic */
  schematicPoints: Point2D[];
  /** Physical wire insulation colour hex on the hardware panel */
  wireColour: string;
  /** Which structured central loom lane this physical wire routes through */
  loomLane?: number;
  /** Optional explicit physical endpoints override (derived automatically if omitted) */
  physicalFrom?: Point2D;
  physicalTo?: Point2D;
}

export interface CircuitSwitch {
  id: string;
  /** Stamped physical and schematic tag (e.g. "S1") */
  label: string;
  nodeA: string;
  nodeB: string;
  initialClosed: boolean;
  /** Jammed switches cannot be toggled by the student */
  jammed?: boolean;
  /** Concealed inside a locked compartment hatch until unlocked */
  hatchId?: string;
  /** Tidy IEC schematic position & orientation */
  schematic: {
    x: number;
    y: number;
    orientation: 'horizontal' | 'vertical';
  };
  /** Scrambled physical hardware bay coordinates */
  physical: {
    x: number;
    y: number;
    panelZone?: string;
  };
}

export interface ScenarioTextMap {
  forensic: string;
  rov: string;
  outback: string;
}

export interface CircuitComponent {
  id: string;
  /** Short schematic code e.g. "V1", "R1", "LED1", "F1", "VR1", "D1" */
  code: string;
  type: ComponentType;
  /** Node A (Positive terminal for battery; Anode for diode/LED) */
  nodeA: string;
  /** Node B (Negative terminal for battery; Cathode for diode/LED) */
  nodeB: string;
  /** Supply voltage in Volts (battery only) */
  voltageVolts?: number;
  /** Fixed resistance in Ohms */
  resistanceOhms?: number;
  /** Rheostat configuration */
  minOhms?: number;
  maxOhms?: number;
  initialOhms?: number;
  stepOhms?: number;
  /** Rated maximum current in Amps (for thermal fuse or protected coil) */
  maxCurrentAmps?: number;
  /** Rated maximum voltage in Volts (for voltage-sensitive sensor branches) */
  maxVoltageVolts?: number;
  /** Minimum current to count as energised (default 0.04 A) */
  minOnCurrentAmps?: number;
  /** Optional minimum voltage threshold for high-impedance sensors */
  minOnVoltageVolts?: number;
  /** Energy efficiency percentage (0-100) for Level 9 thermal model */
  efficiencyPct?: number;
  /** Optional LED/lamp accent colour */
  ledColour?: 'green' | 'amber' | 'red' | 'cyan';
  /** Optional inline ammeter shunt jack label (e.g. "A1") for safe single-probe Ammeter clamp */
  shuntLabel?: string;
  /** Physical position of the inline shunt jack on the hardware panel */
  physicalShunt?: Point2D;
  /** Tidy IEC schematic position of the inline shunt symbol */
  schematicShunt?: Point2D;
  /** Scenario-skinned human-readable labels */
  scenarioLabels: ScenarioTextMap;
  /** Tidy IEC schematic layout */
  schematic: {
    x: number;
    y: number;
    orientation: 'horizontal' | 'vertical';
  };
  /** Scrambled physical hardware bay position */
  physical: {
    x: number;
    y: number;
  };
  /** Optional hatch concealing this component */
  hatchId?: string;
}

export interface HatchStage {
  stageNumber: number;
  code: string;
  title: string;
  prompt: string;
  formulaHint: string;
  syllabusNote: string;
}

export interface CircuitHatch {
  id: string;
  label: string;
  /** Bounding box covering concealed switches/components on the physical hardware bay */
  physicalRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Bounding box on the tidy IEC schematic */
  schematicRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  stages: HatchStage[];
}

export interface SequenceTrap {
  id: string;
  componentId: string;
  title: string;
  detail: string;
}

export interface WinCondition {
  id: string;
  componentId: string;
  targetState: 'on' | 'off' | 'current_range';
  minCurrentAmps?: number;
  maxCurrentAmps?: number;
  /** Optional description override */
  description?: string;
}

export interface WorksheetData {
  syllabusOutcome: string;
  keypadSummary: string;
  questions: [string, string, string];
  answerKey: {
    switchStates: Record<string, 'CLOSED' | 'OPEN'>;
    rheostatSetting?: string;
    hatchCodes: string[];
    workedSolutions: [string, string, string];
  };
}

export interface HardwarePanelSection {
  id: string;
  label: string;
  subtitle: string;
  switchIds: string[];
  componentIds: string[];
  hatchIds: string[];
  testPointNodeIds?: string[];
  shuntComponentIds?: string[];
}

export interface LevelDefinition {
  id: number;
  phase: 1 | 2 | 3;
  phaseTitle: string;
  title: string;
  syllabusCodes: string[];
  multimeterEnabled: boolean;
  /** Base countdown seconds for Standard confidence tier (L1-5: 120-210s, L6-10: 240-360s) */
  standardSeconds: number;
  /** Explicit anti-tamper warning shown on both screen and printed sheet (Level 5) */
  antiTamperWarning?: string;
  /** Whether this level includes the live thermal runaway gauge (Level 9) */
  thermalEnabled?: boolean;
  /** Optional 2-panel modular bay split (Front Panel / Back Panel) for complex multi-part devices */
  hardwarePanels?: HardwarePanelSection[];
  /** Briefings skinned per mission scenario */
  briefings: ScenarioTextMap;
  /** Takeaway note shown upon disarming/stabilising */
  debriefNote: string;
  nodes: CircuitNode[];
  wires: CircuitWire[];
  switches: CircuitSwitch[];
  components: CircuitComponent[];
  hatches: CircuitHatch[];
  sequenceTraps?: SequenceTrap[];
  winConditions: WinCondition[];
  worksheet: WorksheetData;
}

export interface BranchResult {
  id: string;
  currentAmps: number;
  voltageDropVolts: number;
  powerWatts: number;
  wasteHeatWatts: number;
  isEnergised: boolean;
  isForwardBiased?: boolean;
  isOverloaded?: boolean;
  isBlown?: boolean;
  isOverVoltage?: boolean;
}

export interface FaultState {
  locked: boolean;
  kind: 'short' | 'fuse' | 'overload' | 'sequence' | 'thermal' | 'timeout' | null;
  title: string;
  detail: string;
  highlightWireIds: string[];
  highlightComponentIds: string[];
  highlightSwitchIds: string[];
}

export interface WinCheckResult {
  conditionId: string;
  componentId: string;
  satisfied: boolean;
  label: string;
  targetText: string;
  currentText: string;
}

export interface CircuitSolution {
  nodeVoltages: Record<string, number>;
  branches: Record<string, BranchResult>;
  totalSupplyCurrentAmps: number;
  totalWasteHeatWatts: number;
  shortCircuit: {
    detected: boolean;
    faultWireIds: string[];
    faultSwitchIds: string[];
  };
  blownFuseIds: string[];
  overloadedComponentIds: string[];
  triggeredTrap: SequenceTrap | null;
  winChecks: WinCheckResult[];
  allConditionsMet: boolean;
}
