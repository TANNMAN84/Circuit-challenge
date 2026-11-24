export type LessonId =
  | 'loops'
  | 'voltage'
  | 'ohms_law'
  | 'parallel_fuses'
  | 'efficiency_diodes';

export interface SymbolKeyItem {
  symbol: string;
  name: string;
  unit: string;
  analogy: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonDefinition {
  id: LessonId;
  number: number;
  shortTitle: string;
  title: string;
  subtitle: string;
  unlocksLabel: string;
  unlocksLevelIds: number[];
  firstUnlockedLevelId: number;
  analogyHeadline: string;
  tryPrompts: string[];
  symbols: SymbolKeyItem[];
  quiz: QuizQuestion[];
}

export const LESSONS: LessonDefinition[] = [
  {
    id: 'loops',
    number: 1,
    shortTitle: 'Loops & Short Circuits',
    title: 'Loops, Parallel Paths & Short Circuits',
    subtitle: 'See why circuits need a complete path, how parallel branches work, and why short circuits trip breakers.',
    unlocksLabel: 'Unlocks Missions 02–05',
    unlocksLevelIds: [2, 3, 4, 5],
    firstUnlockedLevelId: 2,
    analogyHeadline: 'Water Pipe Analogy: One Main Pipe, Side-by-Side Lanes & a Shortcut Trap',
    tryPrompts: [
      'Close Main Valve (S1) and notice both wheels stop.',
      'Turn OFF Branch B (S3) while Branch A (S2) stays ON.',
      'Open the Shortcut Trap (S4) to see what a short circuit does.',
    ],
    symbols: [
      {
        symbol: 'ON / OFF',
        name: 'Switch',
        unit: 'Gate',
        analogy: 'A pipe valve: closed lets flow pass, open stops flow.',
      },
      {
        symbol: 'Series',
        name: 'Single Loop',
        unit: '1 Path',
        analogy: 'One road — block any part and everything in that line stops.',
      },
      {
        symbol: 'Parallel',
        name: 'Side-by-Side',
        unit: '2+ Paths',
        analogy: 'Separate lanes — turning one off leaves the others running.',
      },
      {
        symbol: 'Short',
        name: 'Short Circuit',
        unit: '0 Ω Trap',
        analogy: 'An empty shortcut pipe with no load — flow surges and trips the breaker.',
      },
    ],
    quiz: [
      {
        id: 'q_loops_1',
        question: 'Two lights are wired in parallel (side-by-side branches). If you switch OFF Light B’s own branch switch, what happens to Light A?',
        options: [
          'Light A stays ON because it still has its own complete loop.',
          'Light A turns OFF immediately.',
          'The battery explodes.',
        ],
        correctIndex: 0,
        explanation: 'Each parallel branch has its own separate path back to the battery, so switching one branch off leaves the others running.',
      },
      {
        id: 'q_loops_2',
        question: 'What happens if you turn OFF the main switch next to the battery?',
        options: [
          'Only the first light turns off.',
          'Every branch stops getting power because the main supply path is broken.',
          'Current flows faster through the remaining paths.',
        ],
        correctIndex: 1,
        explanation: 'A main switch is in series with the battery — opening it breaks the loop for every branch downstream.',
      },
      {
        id: 'q_loops_3',
        question: 'Why does a short-circuit wire (connecting + straight to − with no light or resistor) trip the safety breaker?',
        options: [
          'It blocks all electricity from leaving the battery.',
          'With almost zero resistance in the way, a huge surge of current rushes straight through.',
          'It reverses the battery voltage.',
        ],
        correctIndex: 1,
        explanation: 'Without a load to slow the flow, current spikes dangerously high and trips the breaker to prevent overheating.',
      },
    ],
  },
  {
    id: 'voltage',
    number: 2,
    shortTitle: 'Volts, Amps & Voltage Sharing',
    title: 'Volts (V), Amps (I) & Sharing Voltage',
    subtitle: 'Meet V, I, and R — and discover how parts in a single loop share the battery’s voltage.',
    unlocksLabel: 'Unlocks Mission 06',
    unlocksLevelIds: [6],
    firstUnlockedLevelId: 6,
    analogyHeadline: 'Water Tower & Two Waterfalls: How Voltage Drops Add Up',
    tryPrompts: [
      'Slide Battery Volts (V) up and down — watch the water tower height change.',
      'Set R1 = 10 Ω and R2 = 20 Ω at 9 V to see how the 9 V splits into 3 V + 6 V.',
      'Notice the flow rate (I, in Amps) is identical at every point in a single loop.',
    ],
    symbols: [
      {
        symbol: 'V',
        name: 'Voltage',
        unit: 'Volts (V)',
        analogy: 'The electrical push (like water tank height or pump pressure).',
      },
      {
        symbol: 'I',
        name: 'Current',
        unit: 'Amps (A)',
        analogy: 'How much electricity flows per second (like litres per second in a pipe).',
      },
      {
        symbol: 'R',
        name: 'Resistance',
        unit: 'Ohms (Ω)',
        analogy: 'How hard a part resists flow (like a narrow squeeze in a pipe).',
      },
    ],
    quiz: [
      {
        id: 'q_volt_1',
        question: 'Which symbol and unit stand for electrical Current (how fast charge flows)?',
        options: [
          'V — measured in Volts (V)',
          'I — measured in Amps (A)',
          'R — measured in Ohms (Ω)',
        ],
        correctIndex: 1,
        explanation: 'I stands for Current (measured in Amps, A). V is Voltage (Volts) and R is Resistance (Ohms, Ω).',
      },
      {
        id: 'q_volt_2',
        question: 'A 9 V battery pushes current through two resistors in series. If R1 uses 3 V, how many Volts are left across R2?',
        options: [
          '3 V',
          '6 V',
          '9 V',
        ],
        correctIndex: 1,
        explanation: 'In a single series loop, the voltage drops always add up to the battery voltage: 3 V + 6 V = 9 V.',
      },
      {
        id: 'q_volt_3',
        question: 'In a series pair of resistors (10 Ω and 20 Ω), which resistor takes the BIGGER share of the battery’s voltage?',
        options: [
          'The bigger resistor (20 Ω) takes a larger voltage drop.',
          'The smaller resistor (10 Ω) takes a larger voltage drop.',
          'They always split the voltage 50 / 50 no matter what their Ohms are.',
        ],
        correctIndex: 0,
        explanation: 'A larger resistance needs more electrical push (Volts) to force the same current through it, so 20 Ω takes twice the Volts of 10 Ω.',
      },
    ],
  },
  {
    id: 'ohms_law',
    number: 3,
    shortTitle: "Ohm's Law (V = I × R)",
    title: "Resistance & Ohm's Law (V = I × R)",
    subtitle: 'Control current safely by balancing Voltage (V) and Resistance (R) before switching on sensitive parts.',
    unlocksLabel: 'Unlocks Mission 07',
    unlocksLevelIds: [7],
    firstUnlockedLevelId: 7,
    analogyHeadline: 'Garden Hose & Pinch Clamp: Volt Pushes, Ohm Pinches, Amp Flows',
    tryPrompts: [
      'Increase Pump Push (V) and watch Current (I) rise.',
      'Tighten the Pinch Clamp (R in Ohms) to choke Current down into the green safe zone (0.35–0.45 A).',
      'Tap V, I, or R on the formula triangle to see how to rearrange Ohm’s Law.',
    ],
    symbols: [
      {
        symbol: 'V = I × R',
        name: 'Find Voltage',
        unit: 'Volts (V)',
        analogy: 'More flow or tighter squeeze requires more pump push.',
      },
      {
        symbol: 'I = V ÷ R',
        name: 'Find Current',
        unit: 'Amps (A)',
        analogy: 'More push (V) speeds flow up; more squeeze (R) slows flow down.',
      },
      {
        symbol: 'R = V ÷ I',
        name: 'Find Resistance',
        unit: 'Ohms (Ω)',
        analogy: 'Divide battery Volts by target Amps to pick the safe dial setting.',
      },
    ],
    quiz: [
      {
        id: 'q_ohm_1',
        question: 'If you INCREASE the Resistance (R, in Ohms) while keeping Battery Voltage the same, what happens to the Current (I, in Amps)?',
        options: [
          'Current goes UP.',
          'Current goes DOWN (slower flow).',
          'Current stays exactly the same.',
        ],
        correctIndex: 1,
        explanation: 'Resistance acts like pinching a hose — higher Ohms slows down the current (I = V ÷ R).',
      },
      {
        id: 'q_ohm_2',
        question: 'A 12 V battery powers a coil that must run at 0.40 A. Using R = V ÷ I, what resistance (in Ohms) do you need?',
        options: [
          '4.8 Ω',
          '30 Ω',
          '48 Ω',
        ],
        correctIndex: 1,
        explanation: 'R = V ÷ I = 12 V ÷ 0.40 A = 30 Ω.',
      },
      {
        id: 'q_ohm_3',
        question: 'A coil burns out if current goes above 0.50 A on a 12 V battery. What happens if someone sets the dial too LOW (say 15 Ω)?',
        options: [
          'Current jumps to 0.80 A and overloads the coil.',
          'Nothing flows at all.',
          'The battery voltage drops to 5 V.',
        ],
        correctIndex: 0,
        explanation: 'I = 12 V ÷ 15 Ω = 0.80 A, which is well over the 0.50 A limit! Always dial R high enough first.',
      },
    ],
  },
  {
    id: 'parallel_fuses',
    number: 4,
    shortTitle: 'Parallel Current & Fuses',
    title: 'Parallel Currents & Safety Fuses',
    subtitle: 'See why parallel currents add together on the main supply wire and how a fuse protects the circuit.',
    unlocksLabel: 'Unlocks Mission 08',
    unlocksLevelIds: [8],
    firstUnlockedLevelId: 8,
    analogyHeadline: 'Main Pipe & Three Taps: Every Open Branch Adds to the Main Fuse',
    tryPrompts: [
      'Turn ON Tap 1 (1.5 A) and Tap 2 (2.0 A) — watch the main fuse gauge climb to 3.5 A (safe).',
      'Now switch ON Tap 3 (2.5 A) as well — watch total current hit 6.0 A and snap the 5.0 A fuse!',
      'Reset the fuse, switch OFF extra taps first, then run Tap 3 safely.',
    ],
    symbols: [
      {
        symbol: 'I_total',
        name: 'Main Current',
        unit: 'I₁ + I₂ + I₃',
        analogy: 'Every open tap pulls more water through the single main pipe.',
      },
      {
        symbol: 'Fuse',
        name: 'Weak-Link Wire',
        unit: 'Max Amps',
        analogy: 'A thin safety wire that melts on purpose before cables catch fire.',
      },
      {
        symbol: 'Order',
        name: 'Shed Load First',
        unit: 'Safe Step',
        analogy: 'Turn OFF unneeded branches BEFORE switching on a heavy pump.',
      },
    ],
    quiz: [
      {
        id: 'q_fuse_1',
        question: 'Three parallel branches draw 1.5 A, 2.0 A, and 1.0 A from the same battery. What is the total current through the main wire?',
        options: [
          '2.0 A (just the biggest branch)',
          '4.5 A (all branch currents added together)',
          '1.5 A (the average of the three)',
        ],
        correctIndex: 1,
        explanation: 'Parallel branch currents add together on the main trunk wire: 1.5 + 2.0 + 1.0 = 4.5 A.',
      },
      {
        id: 'q_fuse_2',
        question: 'Why do circuits include a safety fuse (like a 5.0 A fuse) on the main wire?',
        options: [
          'To boost the battery voltage.',
          'To melt and cut the circuit safely if total current gets dangerously high.',
          'To store spare electricity.',
        ],
        correctIndex: 1,
        explanation: 'A fuse is a sacrificial weak link — if current exceeds its Amp rating, it snaps open to protect the wiring.',
      },
      {
        id: 'q_fuse_3',
        question: 'Your 5.0 A main fuse is currently carrying 3.5 A from two old lights. Before turning on a 2.5 A pump, what should you do first?',
        options: [
          'Switch on the pump right away, then turn off the lights later.',
          'Switch OFF the extra lights FIRST so total current never goes over 5.0 A.',
          'Turn off the main battery forever.',
        ],
        correctIndex: 1,
        explanation: '3.5 A + 2.5 A = 6.0 A, which instantly blows a 5.0 A fuse! Always switch off extra loads first.',
      },
    ],
  },
  {
    id: 'efficiency_diodes',
    number: 5,
    shortTitle: 'Efficiency & One-Way Diodes',
    title: 'Energy Efficiency & One-Way Diodes',
    subtitle: 'Compare useful light against wasted heat, and master one-way diode gates for the final missions.',
    unlocksLabel: 'Unlocks Missions 09–10',
    unlocksLevelIds: [9, 10],
    firstUnlockedLevelId: 9,
    analogyHeadline: 'Energy Split Stream & One-Way Flap Valve',
    tryPrompts: [
      'In Tab 1, toggle between Old Hot Globe and Cool LED — watch the heat waves and box temperature drop.',
      'In Tab 2, flip the Diode Arrow or Battery Polarity to see the one-way flap gate swing open vs slam shut (0.00 A).',
    ],
    symbols: [
      {
        symbol: 'Eff %',
        name: 'Efficiency',
        unit: '(Useful ÷ Total) × 100',
        analogy: 'How much energy does the job you want instead of heating the room.',
      },
      {
        symbol: '▶|',
        name: 'Diode',
        unit: 'One-Way Valve',
        analogy: 'Current flows along the triangle arrow, and stops dead against the flat bar.',
      },
      {
        symbol: '0.00 A',
        name: 'Blocked Path',
        unit: 'Reverse Bias',
        analogy: 'Push against the flat bar side and the valve slams shut — zero flow!',
      },
    ],
    quiz: [
      {
        id: 'q_eff_1',
        question: 'A light uses 100 J of electrical energy and produces 25 J of useful light (75 J becomes heat). What is its efficiency?',
        options: [
          '25%',
          '75%',
          '125%',
        ],
        correctIndex: 0,
        explanation: 'Efficiency = (Useful energy ÷ Total input energy) × 100 = (25 ÷ 100) × 100 = 25%.',
      },
      {
        id: 'q_eff_2',
        question: 'Why does swapping old filament globes (15% efficient) for LEDs (85% efficient) cool down an enclosed box?',
        options: [
          'LEDs use magic cold electricity.',
          'LEDs convert far more energy into useful light and waste far less as heat.',
          'Filament globes do not use any current.',
        ],
        correctIndex: 1,
        explanation: 'Old globes waste 85% of their energy as heat, whereas LEDs turn 85% into light and only 15% into heat.',
      },
      {
        id: 'q_eff_3',
        question: 'Current tries to push into the FLAT BAR side of a diode (against the arrow). How much current flows through it?',
        options: [
          'Full current flows backwards.',
          'Half the normal current flows.',
          '0.00 A — the diode blocks reverse current like a one-way valve.',
        ],
        correctIndex: 2,
        explanation: 'A diode only conducts in the direction of its arrow. Pushing against the flat cathode bar blocks flow completely (0.00 A).',
      },
    ],
  },
];

export function getLessonById(id: LessonId): LessonDefinition | undefined {
  return LESSONS.find((l) => l.id === id);
}

/**
 * Returns the mini-lesson required to unlock a given mission (Mission 01 has no gate).
 */
export function getRequiredLessonForLevel(levelId: number): LessonDefinition | null {
  if (levelId <= 1) return null;
  return LESSONS.find((l) => l.unlocksLevelIds.includes(levelId)) ?? null;
}

/**
 * Returns the most relevant refresher mini-lesson for any active mission (including Mission 01).
 */
export function getRefresherLessonForLevel(levelId: number): LessonDefinition {
  if (levelId <= 5) return LESSONS[0];
  if (levelId === 6) return LESSONS[1];
  if (levelId === 7) return LESSONS[2];
  if (levelId === 8) return LESSONS[3];
  return LESSONS[4];
}
