# Circuit Disarm — Architecture & Antigravity Export Guide

**Circuit Disarm** is a 100% deterministic, client-side educational electrical circuit game aligned with the **2017 NSW Science Years 7–10 Syllabus (Stage 5 Physical World outcomes PW3 & PW4)**, written in Australian English with zero external API dependencies.

---

## 1. Repository File Layout

```text
/
├── index.html                        # Entry HTML, Google Fonts (Plus Jakarta Sans, DM Sans, IBM Plex Mono)
├── metadata.json                     # Applet metadata
├── ARCHITECTURE.md                   # This export & architecture reference
└── src/
    ├── main.tsx                      # React 19 root mount
    ├── index.css                     # Tailwind v4 (@custom-variant dark), animations, @media print A4 rules
    ├── App.tsx                       # Root orchestration: theme, timer, MNA state, modals, drawers, print layer
    ├── types/
    │   └── circuit.ts                # Core TypeScript schema for levels, dual layouts, MNA outputs, faults
    ├── data/
    │   ├── scenarios.ts              # 3 cosmetic mission skins (Forensic, ROV, Outback) & confidence timer helpers
    │   └── levels.ts                 # 10 typed Stage 5 PW3/PW4 level graphs (dual schematic + physical layouts)
    ├── engine/
    │   ├── circuitSolver.ts          # Deterministic Modified Nodal Analysis (MNA) linear physics solver
    │   └── sound.ts                  # Zero-dependency Web Audio API mechanical sound synthesiser
    └── components/
        ├── MissionHub.tsx            # Home screen: scenario selector, confidence timer selector, 10-level grid
        ├── HardwarePanelSvg.tsx      # Interactive scrambled physical hardware bay with central cable-tie looms
        ├── SchematicSvg.tsx          # Tidy IEC/Australian circuit schematic renderer (screen & monochrome print)
        ├── VirtualMultimeter.tsx     # Safe draggable multimeter (V red/black probes vs single-probe A clamp)
        ├── KeypadModal.tsx           # Field Manual 3-digit hatch keypad (supports 2-stage Level 10 lock)
        ├── TeacherPinModal.tsx       # 4-digit PIN prompt (default 2026) & Teacher Mode demonstration bar
        └── PrintWorksheet.tsx        # Dedicated black-and-white A4 printable worksheet + Teacher Answer Key
```

---

## 2. Unified Dual-Layout JSON Level Schema (`src/data/levels.ts`)

Every level is declared as a single authoritative electrical graph (`LevelDefinition`) mapped onto **two distinct visual coordinate systems**:

1. **Scrambled Physical Hardware Bay (`viewBox="0 0 860 540"`)**:
   - Switches (`S1`–`S8`), components, brass test-point studs (`TP1`–`TP3`), inline ammeter shunt jacks (`A0`–`A4`), and steel compartment hatches (`H1`) are positioned in scrambled chassis bays (`physical: { x, y }`).
   - Insulated Bezier wires route through a **structured central cable-tie spine** (`loomLane: 0..9`) and fan cleanly into component terminal lugs so physical connections are unambiguous while still requiring students to read the IEC schematic to deduce circuit topology.
2. **Tidy IEC / Australian Circuit Schematic (`viewBox="0 0 800 410"`)**:
   - Uses orthogonal right-angle wire waypoints (`schematicPoints`) and standard IEC symbols (`schematic: { x, y, orientation }`).
   - Rendered both on the **monochrome A4 printed Field Manual worksheet** and in the toggleable **Schematic Manual drawer** (which teachers can disable via **Paper-Only Mode**).

### Core Level Properties

| Field | Type | Purpose |
| :--- | :--- | :--- |
| `nodes` | `CircuitNode[]` | Named electrical nodes with `isGround`, `schematic`, optional `testPointLabel` (`TP1`…) and `physicalTestPoint`. |
| `wires` | `CircuitWire[]` | Zero-resistance edges connecting `from` → `to` with `schematicPoints`, `wireColour`, and `loomLane`. |
| `switches` | `CircuitSwitch[]` | `id`, `label`, `nodeA`, `nodeB`, `initialClosed`, optional `jammed`, optional `hatchId`. |
| `components` | `CircuitComponent[]` | `battery`, `resistor`, `rheostat`, `lamp`, `led`, `fan`, `siren`, `relay`, `fuse`, `diode` with electrical ratings, optional `shuntLabel` (`A1`…), and 3-scenario `scenarioLabels`. |
| `hatches` | `CircuitHatch[]` | Concealing rectangles (`physicalRect`, `schematicRect`) and 1–2 `stages` (`code`, `prompt`, `formulaHint`). |
| `sequenceTraps` | `SequenceTrap[]` | Momentary hazard triggers (e.g. Level 5 anti-tamper siren lockout). |
| `winConditions` | `WinCondition[]` | Required `on`, `off`, or `current_range` (`minCurrentAmps`–`maxCurrentAmps`) criteria. |
| `standardSeconds` | `number` | Base Standard countdown seconds (`120–210s` for L1–L5; `240–360s` for L6–L10). |
| `worksheet` | `WorksheetData` | Syllabus outcome, keypad summary, 3 Stage 5 PW3/PW4 analysis questions, and Teacher Answer Key. |

---

## 3. Modified Nodal Analysis (MNA) Solver Assumptions (`src/engine/circuitSolver.ts`)

1. **Pre-Solve Short-Circuit Detection**:
   - Before constructing the MNA matrix, a Breadth-First Search (BFS) traverses all zero-resistance edges (wires, closed switches, and intact fuses) starting from each battery's positive terminal (`nodeA`) to its negative terminal (`nodeB`).
   - If a zero-resistance closed path exists across a battery, the solver immediately flags `shortCircuit.detected = true` and returns exact `faultWireIds` and `faultSwitchIds`, halting the breaker and highlighting the fault path in crimson.
2. **MNA Matrix Formulation**:
   - Ground reference (`0 V`) is assigned to the node marked `isGround: true` (battery negative terminal).
   - Non-ground node voltages and battery branch currents form an `(N − 1 + M) × (N − 1 + M)` linear system `[G B; C D] · x = z`, solved deterministically via **Gaussian elimination with partial pivoting**.
   - **Numerical Stability (`GMIN`)**: Every non-ground node receives a `1 × 10⁻⁹ S` (`1 GΩ`) conductance to ground so electrically isolated switch islands never produce singular matrices.
   - **Ideal Switch, Wire & Fuse Conductances**:
     - Wire resistance: `1 × 10⁻⁵ Ω`
     - Closed switch / intact fuse resistance: `1 × 10⁻⁴ Ω`
     - Open switch / blown fuse: unstamped (infinite resistance).
3. **Ideal Semiconductor Diode Iteration (Level 10)**:
   - Diodes use an ideal Stage 5 teaching model (`V_f = 0 V`, `R_on = 1 × 10⁻³ Ω`, reverse-biased = open circuit `0.00 A`) so Ohm's Law calculations (`10 V / 25 Ω = 0.40 A`) remain clean without `0.7 V` silicon drop offsets.
   - Solved via bounded fixed-point iteration (up to 16 passes): a blocking diode turns ON if `V_anode − V_cathode > 1 mV`; a conducting diode turns OFF if `I_diode < −0.1 mA`.
4. **Power, Thermal Waste & Safety Limits**:
   - Branch power: `P = |ΔV × I|`.
   - Waste heat (Level 9): `P_waste = P × (1 − efficiencyPct / 100)` — 60 W incandescent globes (`15%` efficient) dissipate `51 W` waste heat each, driving the thermal gauge toward runaway; 12 W LEDs (`85%` efficient) dissipate only `1.8 W` each, cooling the enclosure.
   - Fuses (`F1`) blow permanently (until Reset Circuit) if `|I| > maxCurrentAmps`. Rated coils/fans trigger overload lockout if `|I| > maxCurrentAmps`.

---

## 4. Safe Virtual Multimeter & Confidence Timers

- **Strict Measurement Safety (Levels 6–10)**:
  - **Voltmeter (`V`) Mode**: Dual Red (`+`) and Black (`COM`) curved SVG leads snap exclusively to brass `TP` voltage studs (`ΔV = V_red − V_black` in parallel).
  - **Ammeter (`A`) Mode**: Retracts the dual probes and switches to a **single-probe current clamp** snapping exclusively to labelled inline shunt jacks (`A0`, `A1`…) in series, preventing students from ever connecting an ammeter in parallel.
- **Confidence Countdown Tiers** (persisted under `circuit_disarm_confidence_tier`):
  - `untimed`: `null` (no countdown)
  - `learner`: `2.0× standardSeconds`
  - `standard`: `1.0× standardSeconds` (`120–210s` for L1–L5; `240–360s` for L6–L10)
  - `extreme`: `0.45× standardSeconds` (floor `45s`)
- **Local Storage Keys**:
  - `circuit_disarm_theme` (`'light' | 'dark'`, defaults to `'light'`)
  - `circuit_disarm_teacher_pin` (4-digit string, defaults to `'2026'`)
  - `circuit_disarm_completed_levels` (JSON array of completed level numbers)
  - `circuit_disarm_confidence_tier` (`'untimed' | 'learner' | 'standard' | 'extreme'`)
  - `circuit_disarm_scenario` (`'forensic' | 'rov' | 'outback'`)

---

## 5. Strict A4 Print Stylesheet Classes (`src/index.css`)

Printing is driven by native browser `@media print` with `@page { size: A4 portrait; margin: 9mm 10mm; }`:

| CSS Class | Behaviour under `@media print` |
| :--- | :--- |
| `.no-print` | Forces `display: none !important` on all interactive game chrome, dark backgrounds, hardware bays, timers, and modals. |
| `.print-only` | Overrides screen `hidden` to `display: block !important` with forced `#ffffff` background and `#000000` ink. |
| `.print-student-page` | Constrains Page 1 strictly within a single A4 portrait frame (`max-height: 277mm; overflow: hidden`) containing the header, tidy monochrome IEC schematic, Level 5 Anti-Tamper Warning (when applicable), ON/OFF Target Table, Keypad Box, and 3 PW3/PW4 questions. |
| `.print-avoid-break` | Applies `break-inside: avoid; page-break-inside: avoid` to header, schematic, tables, and each written question block. |
| `.print-teacher-key-page` | Applies `break-before: page; page-break-before: always` so the optional Teacher Answer Key (rendered only when Teacher Mode is unlocked) starts cleanly on Page 2. |
