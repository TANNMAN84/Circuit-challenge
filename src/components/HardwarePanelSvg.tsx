import React, { useMemo } from 'react';
import {
  CircuitComponent,
  CircuitHatch,
  CircuitSolution,
  CircuitSwitch,
  FaultState,
  HardwarePanelSection,
  LevelDefinition,
  Point2D,
  ScenarioId,
} from '../types/circuit';
import { SCENARIOS } from '../data/scenarios';

interface HardwarePanelSvgProps {
  level: LevelDefinition;
  scenario: ScenarioId;
  activePanel?: HardwarePanelSection;
  switchStates: Record<string, boolean>;
  rheostatValues: Record<string, number>;
  unlockedHatches: Record<string, boolean>;
  solution: CircuitSolution;
  faultState: FaultState;
  showViBadges: boolean;
  isDark: boolean;
  /** Multimeter interaction props (Levels 6-10) */
  multimeterMode?: 'V' | 'A';
  redNodeId?: string | null;
  blackNodeId?: string | null;
  clampComponentId?: string | null;
  activeProbeSelection?: 'red' | 'black' | 'clamp' | null;
  onSelectTestPoint?: (nodeId: string) => void;
  onSelectShunt?: (componentId: string) => void;
  onToggleSwitch: (switchId: string) => void;
  onChangeRheostat: (componentId: string, ohms: number) => void;
  onOpenHatch: (hatch: CircuitHatch) => void;
}

/**
 * Resolve physical terminal coordinates for nodes visible on the current panel.
 * Nodes living on the other panel route neatly into a side cable-bus port.
 */
function buildPhysicalNodeAnchors(
  visibleSwitches: CircuitSwitch[],
  visibleComponents: CircuitComponent[],
  visibleTestNodes: LevelDefinition['nodes'],
): Record<string, Point2D> {
  const anchors: Record<string, Point2D> = {};

  for (const node of visibleTestNodes) {
    if (node.physicalTestPoint) {
      anchors[node.id] = { ...node.physicalTestPoint };
    }
  }

  for (const sw of visibleSwitches) {
    const { x, y } = sw.physical;
    const isUpper = y < 260;
    const lugY = isUpper ? y + 32 : y - 32;
    if (!anchors[sw.nodeA]) anchors[sw.nodeA] = { x: x - 16, y: lugY };
    if (!anchors[sw.nodeB]) anchors[sw.nodeB] = { x: x + 16, y: lugY };
  }

  for (const comp of visibleComponents) {
    const { x, y } = comp.physical;
    if (comp.type === 'battery') {
      if (!anchors[comp.nodeA]) anchors[comp.nodeA] = { x: x + 38, y: y - 40 };
      if (!anchors[comp.nodeB]) anchors[comp.nodeB] = { x: x + 38, y: y + 40 };
    } else {
      const isUpper = y < 260;
      const lugY = isUpper ? y + 34 : y - 34;
      if (!anchors[comp.nodeA]) anchors[comp.nodeA] = { x: x - 14, y: lugY };
      if (!anchors[comp.nodeB]) anchors[comp.nodeB] = { x: x + 14, y: lugY };
    }
  }

  return anchors;
}

/**
 * Generates a neat insulated Bezier path through the central cable-tie spine.
 */
function buildStructuredLoomPath(from: Point2D, to: Point2D, laneIndex: number): string {
  const spineY = 250 + (laneIndex % 10) * 5.2;
  const stubOffsetA = from.y < spineY ? 18 : -18;
  const stubOffsetB = to.y < spineY ? 18 : -18;

  const entryX = from.x;
  const exitX = to.x;

  const dx = exitX - entryX;
  const bend = Math.min(36, Math.abs(dx) * 0.35);
  const dir = dx >= 0 ? 1 : -1;

  if (Math.abs(dx) < 28) {
    const midX = (entryX + exitX) / 2 + (laneIndex % 2 === 0 ? 14 : -14);
    return `M ${from.x} ${from.y} C ${from.x} ${from.y + stubOffsetA}, ${midX} ${spineY}, ${midX} ${spineY} C ${midX} ${spineY}, ${to.x} ${to.y + stubOffsetB}, ${to.x} ${to.y}`;
  }

  return [
    `M ${from.x} ${from.y}`,
    `C ${from.x} ${from.y + stubOffsetA}, ${entryX} ${spineY}, ${entryX + dir * bend} ${spineY}`,
    `L ${exitX - dir * bend} ${spineY}`,
    `C ${exitX} ${spineY}, ${to.x} ${to.y + stubOffsetB}, ${to.x} ${to.y}`,
  ].join(' ');
}

export const HardwarePanelSvg: React.FC<HardwarePanelSvgProps> = ({
  level,
  scenario,
  activePanel,
  switchStates,
  rheostatValues,
  unlockedHatches,
  solution,
  faultState,
  showViBadges,
  isDark,
  multimeterMode,
  redNodeId,
  blackNodeId,
  clampComponentId,
  activeProbeSelection,
  onSelectTestPoint,
  onSelectShunt,
  onToggleSwitch,
  onChangeRheostat,
  onOpenHatch,
}) => {
  const scenarioMeta = SCENARIOS[scenario];

  // Filter items to the active modular panel when the level uses Front/Back Flip Box panels
  const visibleSwitches = useMemo(
    () =>
      activePanel
        ? level.switches.filter((sw) => activePanel.switchIds.includes(sw.id))
        : level.switches,
    [level.switches, activePanel],
  );

  const visibleComponents = useMemo(
    () =>
      activePanel
        ? level.components.filter((c) => activePanel.componentIds.includes(c.id))
        : level.components,
    [level.components, activePanel],
  );

  const visibleHatches = useMemo(
    () =>
      activePanel
        ? level.hatches.filter((h) => activePanel.hatchIds.includes(h.id))
        : level.hatches,
    [level.hatches, activePanel],
  );

  const visibleTestNodes = useMemo(
    () =>
      level.nodes.filter((n) => {
        if (!n.testPointLabel || !n.physicalTestPoint) return false;
        if (!activePanel) return true;
        return activePanel.testPointNodeIds?.includes(n.id) ?? false;
      }),
    [level.nodes, activePanel],
  );

  const visibleShuntComps = useMemo(
    () =>
      level.components.filter((c) => {
        if (!c.shuntLabel || !c.physicalShunt) return false;
        if (!activePanel) return true;
        return activePanel.shuntComponentIds?.includes(c.id) ?? false;
      }),
    [level.components, activePanel],
  );

  const anchors = useMemo(
    () => buildPhysicalNodeAnchors(visibleSwitches, visibleComponents, visibleTestNodes),
    [visibleSwitches, visibleComponents, visibleTestNodes],
  );

  const hasBatteryOnPanel = visibleComponents.some((c) => c.type === 'battery');
  const isBackPanel = Boolean(activePanel && !hasBatteryOnPanel);
  const loomLeftX = hasBatteryOnPanel ? 150 : 62;
  const loomWidth = hasBatteryOnPanel ? 655 : 743;

  const faultWireSet = new Set(faultState.highlightWireIds);
  const faultSwitchSet = new Set(faultState.highlightSwitchIds);
  const faultCompSet = new Set(faultState.highlightComponentIds);

  // Chassis visual tokens tuned to the active scenario theme
  const chassisBg = isDark ? scenarioMeta.bayTintDark : scenarioMeta.bayTintLight;
  const chassisBorder = faultState.locked ? '#dc2626' : scenarioMeta.chassisFrameBorder;
  const recessBg = isDark ? '#0d1320' : '#f4f6f9';
  const plateBg = isDark ? '#1c2434' : '#ffffff';
  const plateStroke = isDark ? '#475569' : '#64748b';
  const silkscreen = isDark ? '#94a3b8' : '#475569';
  const tagBg = '#0f172a';
  const tagText = '#f8fafc';

  const isVoltmeterMode = level.multimeterEnabled && multimeterMode === 'V';
  const isAmmeterMode = level.multimeterEnabled && multimeterMode === 'A';

  // Cable-bus anchor point for cross-panel wires (right edge on Front Panel, left edge on Back Panel)
  const crossPanelBusX = isBackPanel ? 52 : 812;

  return (
    <svg
      viewBox="0 0 860 540"
      className="w-full h-auto select-none block"
      role="group"
      aria-label={`Interactive hardware panel for Mission ${level.id}: ${level.title}`}
    >
      <defs>
        <filter id="led-glow-green" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="led-glow-amber" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="fault-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id="hatch-stripes" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="12" fill="#f59e0b" fillOpacity={0.26} />
          <rect x="6" width="6" height="12" fill="transparent" />
        </pattern>
      </defs>

      {/* Outer Field Enclosure Chassis */}
      <rect
        x={12}
        y={12}
        width={836}
        height={516}
        rx={12}
        fill={chassisBg}
        stroke={chassisBorder}
        strokeWidth={faultState.locked ? 3.5 : 2.5}
      />

      {/* Inner Recessed Component Bay */}
      <rect
        x={28}
        y={42}
        width={804}
        height={470}
        rx={8}
        fill={recessBg}
        stroke={isDark ? '#1e293b' : '#cbd5e1'}
        strokeWidth={1.5}
      />

      {/* Top Silkscreen Bay Header */}
      <text
        x={44}
        y={31}
        fontSize={10.5}
        fontWeight={700}
        fontFamily="IBM Plex Mono, monospace"
        fill={silkscreen}
        letterSpacing="0.06em"
      >
        {scenarioMeta.chassisCode} · MISSION {String(level.id).padStart(2, '0')}
        {activePanel ? ` · ${activePanel.label.toUpperCase()}` : ''}
      </text>
      <text
        x={816}
        y={31}
        textAnchor="end"
        fontSize={10}
        fontWeight={600}
        fontFamily="IBM Plex Mono, monospace"
        fill={silkscreen}
      >
        MATCH LABELS TO YOUR CIRCUIT MAP
      </text>

      {/* Corner Hex Bolts */}
      {[
        [24, 24],
        [836, 24],
        [24, 516],
        [836, 516],
      ].map(([bx, by], idx) => (
        <g key={idx} transform={`translate(${bx}, ${by})`}>
          <circle r={5.5} fill={isDark ? '#334155' : '#cbd5e1'} stroke={chassisBorder} strokeWidth={1.2} />
          <line x1={-3} y1={-3} x2={3} y2={3} stroke={isDark ? '#0f172a' : '#475569'} strokeWidth={1.3} />
        </g>
      ))}

      {/* Structured Central Cable-Tie Wire Bundle */}
      <rect
        x={loomLeftX}
        y={242}
        width={loomWidth}
        height={66}
        rx={6}
        fill={isDark ? '#0b1120' : '#e2e8f0'}
        fillOpacity={0.75}
        stroke={isDark ? '#1e293b' : '#cbd5e1'}
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      <text
        x={loomLeftX + 10}
        y={320}
        fontSize={9}
        fontWeight={600}
        fontFamily="IBM Plex Mono, monospace"
        fill={silkscreen}
      >
        WIRE BUNDLE (USE YOUR CIRCUIT MAP TO TRACE CONNECTIONS)
      </text>

      {/* Cross-Panel Cable Connector Port (shown only on 2-panel Flip Box levels) */}
      {activePanel && (
        <g transform={`translate(${isBackPanel ? 32 : 762}, 244)`}>
          <rect
            x={0}
            y={0}
            width={66}
            height={62}
            rx={6}
            fill="#1e293b"
            stroke="#64748b"
            strokeWidth={1.5}
          />
          <text
            x={33}
            y={24}
            textAnchor="middle"
            fontSize={8}
            fontWeight={700}
            fontFamily="IBM Plex Mono, monospace"
            fill="#fbbf24"
          >
            {isBackPanel ? '← FROM' : 'CABLE →'}
          </text>
          <text
            x={33}
            y={37}
            textAnchor="middle"
            fontSize={8}
            fontWeight={700}
            fontFamily="IBM Plex Mono, monospace"
            fill="#e2e8f0"
          >
            {isBackPanel ? 'FRONT' : 'BACK'}
          </text>
          <text
            x={33}
            y={49}
            textAnchor="middle"
            fontSize={7.5}
            fontFamily="IBM Plex Mono, monospace"
            fill="#94a3b8"
          >
            PANEL
          </text>
        </g>
      )}

      {/* Structured Bezier Insulated Wire Harness */}
      <g>
        {level.wires.map((wire, idx) => {
          const aFrom = anchors[wire.from];
          const aTo = anchors[wire.to];

          // On multi-panel devices, skip wires where NEITHER end is on this panel
          if (activePanel && !aFrom && !aTo) return null;

          const lane = wire.loomLane ?? idx % 10;
          const busPoint: Point2D = {
            x: crossPanelBusX,
            y: 250 + (lane % 10) * 5.2,
          };

          const pFrom = aFrom ?? (activePanel ? busPoint : wire.physicalFrom);
          const pTo = aTo ?? (activePanel ? busPoint : wire.physicalTo);
          if (!pFrom || !pTo) return null;

          const d = buildStructuredLoomPath(pFrom, pTo, lane);
          const isFault = faultWireSet.has(wire.id);

          return (
            <g key={wire.id}>
              <path
                d={d}
                fill="none"
                stroke={isDark ? '#020617' : '#ffffff'}
                strokeWidth={isFault ? 8 : 5.6}
                strokeLinecap="round"
                strokeOpacity={0.85}
              />
              <path
                d={d}
                fill="none"
                stroke={isFault ? '#ef4444' : wire.wireColour}
                strokeWidth={isFault ? 4.4 : 3.2}
                strokeLinecap="round"
                filter={isFault ? 'url(#fault-glow)' : undefined}
              />
            </g>
          );
        })}
      </g>

      {/* Nylon Cable-Tie Anchor Collars */}
      {(hasBatteryOnPanel ? [215, 365, 515, 665, 755] : [165, 315, 465, 615, 755]).map((cx) => (
        <g key={cx} transform={`translate(${cx}, 244)`}>
          <rect
            x={-4.5}
            y={0}
            width={9}
            height={62}
            rx={2}
            fill="#334155"
            stroke={isDark ? '#64748b' : '#0f172a'}
            strokeWidth={1}
          />
          <rect x={-6} y={26} width={12} height={10} rx={1.5} fill="#0f172a" />
        </g>
      ))}

      {/* Yellow Voltage Test Pins (TP1, TP2, TP3) — Voltmeter (V) Mode */}
      {level.multimeterEnabled &&
        visibleTestNodes.map((node) => {
          const pt = node.physicalTestPoint!;
          const isRed = redNodeId === node.id;
          const isBlack = blackNodeId === node.id;
          const highlight = isVoltmeterMode;

          return (
            <g
              key={node.id}
              transform={`translate(${pt.x}, ${pt.y})`}
              onClick={() => isVoltmeterMode && onSelectTestPoint?.(node.id)}
              className={isVoltmeterMode ? 'cursor-pointer' : 'cursor-default'}
              data-test-point={node.id}
            >
              {/* Clear clickable halo in Volts mode */}
              {highlight && (
                <circle
                  r={21}
                  fill={
                    isRed
                      ? 'rgba(220,38,38,0.22)'
                      : isBlack
                        ? 'rgba(15,23,42,0.24)'
                        : activeProbeSelection === 'red'
                          ? 'rgba(245,158,11,0.16)'
                          : 'rgba(245,158,11,0.16)'
                  }
                  stroke={isRed ? '#dc2626' : isBlack ? '#0f172a' : '#f59e0b'}
                  strokeWidth={isRed || isBlack ? 3 : 1.8}
                  strokeDasharray={isRed || isBlack ? undefined : '4 2.5'}
                />
              )}
              {/* Brass Volt Pin */}
              <circle r={12} fill="#f59e0b" stroke="#78350f" strokeWidth={1.8} />
              <circle r={5.5} fill="#fef3c7" stroke="#92400e" strokeWidth={1.2} />

              {/* Crisp Probe Marker Badge (+ RED or - BLK) right on the pin (zero messy leads!) */}
              {isRed && (
                <g transform="translate(13, -13)">
                  <circle r={8} fill="#dc2626" stroke="#ffffff" strokeWidth={1.8} />
                  <text y={3.5} textAnchor="middle" fontSize={11} fontWeight={800} fill="#ffffff" fontFamily="IBM Plex Mono, monospace">
                    +
                  </text>
                </g>
              )}
              {isBlack && (
                <g transform="translate(-13, -13)">
                  <circle r={8} fill="#0f172a" stroke="#ffffff" strokeWidth={1.8} />
                  <text y={3.5} textAnchor="middle" fontSize={11} fontWeight={800} fill="#ffffff" fontFamily="IBM Plex Mono, monospace">
                    −
                  </text>
                </g>
              )}

              <rect x={-19} y={14} width={38} height={16} rx={4} fill={tagBg} />
              <text
                x={0}
                y={25.5}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fontFamily="IBM Plex Mono, monospace"
                fill="#fde68a"
              >
                {node.testPointLabel}
              </text>
            </g>
          );
        })}

      {/* Blue Inline Amp Clips (A0, A1, A2...) — Ammeter (A) Mode */}
      {level.multimeterEnabled &&
        visibleShuntComps.map((comp) => {
          const pt = comp.physicalShunt!;
          const isClamped = clampComponentId === comp.id;
          const highlight = isAmmeterMode;
          const liveAmps = Math.abs(solution.branches[comp.id]?.currentAmps ?? 0);

          return (
            <g
              key={`shunt-${comp.id}`}
              transform={`translate(${pt.x}, ${pt.y})`}
              onClick={() => isAmmeterMode && onSelectShunt?.(comp.id)}
              className={isAmmeterMode ? 'cursor-pointer' : 'cursor-default'}
              data-shunt-point={comp.id}
            >
              {highlight && (
                <rect
                  x={-24}
                  y={-20}
                  width={48}
                  height={40}
                  rx={8}
                  fill={isClamped ? 'rgba(2,132,199,0.26)' : 'rgba(2,132,199,0.12)'}
                  stroke="#0284c7"
                  strokeWidth={isClamped ? 3 : 1.8}
                  strokeDasharray={isClamped ? undefined : '4 2.5'}
                />
              )}
              <rect
                x={-16}
                y={-12}
                width={32}
                height={24}
                rx={5}
                fill={isClamped ? '#0284c7' : isDark ? '#1e293b' : '#ffffff'}
                stroke="#0284c7"
                strokeWidth={2.2}
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                fontSize={11}
                fontWeight={800}
                fontFamily="IBM Plex Mono, monospace"
                fill={isClamped ? '#ffffff' : isDark ? '#7dd3fc' : '#0369a1'}
              >
                {comp.shuntLabel}
              </text>
              <text
                x={0}
                y={24}
                textAnchor="middle"
                fontSize={8.5}
                fontWeight={700}
                fontFamily="IBM Plex Mono, monospace"
                fill={isClamped ? '#38bdf8' : silkscreen}
              >
                {isClamped ? `${liveAmps.toFixed(2)} A` : 'AMP CLIP'}
              </text>
            </g>
          );
        })}

      {/* Physical Components */}
      {visibleComponents.map((comp: CircuitComponent) => {
        const { x, y } = comp.physical;
        const br = solution.branches[comp.id];
        const isEnergised = Boolean(br?.isEnergised);
        const isFault = faultCompSet.has(comp.id) || Boolean(br?.isOverloaded);
        const isUpper = y < 260;
        const lugY = isUpper ? 34 : -34;

        if (comp.type === 'battery') {
          return (
            <g key={comp.id} transform={`translate(${x}, ${y})`}>
              <circle cx={38} cy={-40} r={5} fill="#dc2626" stroke="#7f1d1d" strokeWidth={1.5} />
              <circle cx={38} cy={40} r={5} fill="#334155" stroke="#0f172a" strokeWidth={1.5} />
              <rect
                x={-36}
                y={-64}
                width={72}
                height={128}
                rx={6}
                fill="#1e293b"
                stroke={faultState.kind === 'short' ? '#ef4444' : '#475569'}
                strokeWidth={2.5}
              />
              <rect x={-20} y={-72} width={40} height={8} rx={2} fill="#94a3b8" />
              <text
                x={0}
                y={-34}
                textAnchor="middle"
                fontSize={11}
                fontWeight={700}
                fontFamily="IBM Plex Mono, monospace"
                fill="#f87171"
              >
                + {comp.voltageVolts}V
              </text>
              <text
                x={0}
                y={-6}
                textAnchor="middle"
                fontSize={16}
                fontWeight={800}
                fontFamily="IBM Plex Mono, monospace"
                fill="#f8fafc"
              >
                {comp.code}
              </text>
              <text
                x={0}
                y={14}
                textAnchor="middle"
                fontSize={8.5}
                fontFamily="IBM Plex Mono, monospace"
                fill="#94a3b8"
              >
                BATTERY
              </text>
              <text
                x={0}
                y={46}
                textAnchor="middle"
                fontSize={11}
                fontWeight={700}
                fontFamily="IBM Plex Mono, monospace"
                fill="#94a3b8"
              >
                − 0V
              </text>
            </g>
          );
        }

        const powerNorm = Math.min(1, Math.max(0.15, (br?.powerWatts ?? 0) / 14));
        const fanCurrent = Math.abs(br?.currentAmps ?? 0);
        const fanDuration = fanCurrent > 0.04 ? Math.max(0.22, 1.15 / (fanCurrent + 0.35)) : 0;

        const fuseLimit = comp.maxCurrentAmps ?? 5.0;
        const fuseRatio = Math.min(1.2, Math.abs(br?.currentAmps ?? 0) / fuseLimit);
        const isFuseBlown = Boolean(br?.isBlown);

        const rheoOhms = rheostatValues[comp.id] ?? comp.initialOhms ?? 30;
        const rheoMin = comp.minOhms ?? 10;
        const rheoMax = comp.maxOhms ?? 60;
        const rheoNorm = (rheoOhms - rheoMin) / Math.max(1, rheoMax - rheoMin);
        const dialAngle = -130 + rheoNorm * 260;

        return (
          <g key={comp.id} transform={`translate(${x}, ${y})`}>
            <circle cx={-14} cy={lugY} r={4} fill="#b45309" stroke="#78350f" strokeWidth={1.2} />
            <circle cx={14} cy={lugY} r={4} fill="#b45309" stroke="#78350f" strokeWidth={1.2} />

            {/* Mounting Baseplate */}
            <rect
              x={comp.type === 'rheostat' ? -58 : -46}
              y={-34}
              width={comp.type === 'rheostat' ? 116 : 92}
              height={comp.type === 'rheostat' ? 94 : 68}
              rx={7}
              fill={plateBg}
              stroke={isFault ? '#dc2626' : br?.isOverVoltage ? '#d97706' : plateStroke}
              strokeWidth={isFault || br?.isOverVoltage ? 2.4 : 1.5}
            />

            {/* LED LIGHT */}
            {comp.type === 'led' && (
              <g transform="translate(0, -6)">
                <circle r={16} fill={isDark ? '#0f172a' : '#cbd5e1'} stroke="#64748b" strokeWidth={2} />
                <circle
                  r={11.5}
                  fill={
                    isEnergised
                      ? comp.ledColour === 'red'
                        ? '#ef4444'
                        : comp.ledColour === 'amber'
                          ? '#f59e0b'
                          : '#10b981'
                      : isDark
                        ? '#1e293b'
                        : '#94a3b8'
                  }
                  fillOpacity={isEnergised ? 0.55 + powerNorm * 0.45 : 0.65}
                  filter={isEnergised ? 'url(#led-glow-green)' : undefined}
                />
                <circle cx={-3.5} cy={-3.5} r={3} fill="#ffffff" fillOpacity={isEnergised ? 0.75 : 0.25} />
              </g>
            )}

            {/* LAMP / LIGHT GLOBE */}
            {comp.type === 'lamp' && (
              <g transform="translate(0, -6)">
                <circle r={17} fill={isDark ? '#0f172a' : '#e2e8f0'} stroke="#64748b" strokeWidth={2} />
                <circle
                  r={13}
                  fill={
                    isEnergised
                      ? br?.isOverVoltage
                        ? '#ef4444'
                        : '#f59e0b'
                      : isDark
                        ? '#1e293b'
                        : '#cbd5e1'
                  }
                  fillOpacity={isEnergised ? 0.5 + powerNorm * 0.5 : 0.6}
                  filter={isEnergised ? 'url(#led-glow-amber)' : undefined}
                />
                <path
                  d="M -6,5 L -3,-4 L 0,2 L 3,-4 L 6,5"
                  fill="none"
                  stroke={isEnergised ? '#fffbeb' : '#475569'}
                  strokeWidth={1.8}
                />
              </g>
            )}

            {/* COOLING FAN */}
            {comp.type === 'fan' && (
              <g transform="translate(0, -6)">
                <circle r={18} fill={isDark ? '#0f172a' : '#e2e8f0'} stroke="#475569" strokeWidth={2} />
                <g
                  className={fanDuration > 0 ? 'fan-spinning' : ''}
                  style={fanDuration > 0 ? { animationDuration: `${fanDuration.toFixed(2)}s` } : undefined}
                >
                  {[0, 90, 180, 270].map((angle) => (
                    <path
                      key={angle}
                      d="M 0,0 C 5,-4 12,-9 13,-2 C 13,4 6,5 0,0 Z"
                      fill={isEnergised ? '#0284c7' : '#64748b'}
                      transform={`rotate(${angle})`}
                    />
                  ))}
                  <circle r={3.5} fill="#0f172a" />
                </g>
              </g>
            )}

            {/* ALARM SIREN */}
            {comp.type === 'siren' && (
              <g transform="translate(0, -6)" className={isEnergised ? 'siren-active' : ''}>
                <circle
                  r={16}
                  fill={isEnergised ? '#dc2626' : isDark ? '#1e293b' : '#cbd5e1'}
                  stroke={isEnergised ? '#991b1b' : '#475569'}
                  strokeWidth={2}
                />
                <circle r={9} fill="none" stroke={isEnergised ? '#fef2f2' : '#64748b'} strokeWidth={1.6} />
                <circle r={3.5} fill={isEnergised ? '#ffffff' : '#475569'} />
              </g>
            )}

            {/* RELAY / COIL */}
            {comp.type === 'relay' && (
              <g transform="translate(0, -6)">
                <rect
                  x={-20}
                  y={-13}
                  width={40}
                  height={26}
                  rx={3}
                  fill={isFault ? '#7f1d1d' : isEnergised ? '#0369a1' : isDark ? '#0f172a' : '#e2e8f0'}
                  stroke={isFault ? '#ef4444' : isEnergised ? '#38bdf8' : '#475569'}
                  strokeWidth={1.8}
                />
                {[-10, -4, 2, 8].map((wx) => (
                  <line
                    key={wx}
                    x1={wx}
                    y1={-11}
                    x2={wx + 2}
                    y2={11}
                    stroke={isEnergised ? '#fbbf24' : '#b45309'}
                    strokeWidth={2}
                  />
                ))}
              </g>
            )}

            {/* SAFETY FUSE */}
            {comp.type === 'fuse' && (
              <g transform="translate(0, -6)">
                <rect x={-30} y={-9} width={10} height={18} rx={2} fill="#94a3b8" stroke="#475569" strokeWidth={1.2} />
                <rect x={20} y={-9} width={10} height={18} rx={2} fill="#94a3b8" stroke="#475569" strokeWidth={1.2} />
                <rect
                  x={-20}
                  y={-8}
                  width={40}
                  height={16}
                  fill={isFuseBlown ? 'rgba(220,38,38,0.22)' : 'rgba(241,245,249,0.35)'}
                  stroke={isFuseBlown ? '#dc2626' : '#64748b'}
                  strokeWidth={1.5}
                />
                {isFuseBlown ? (
                  <g>
                    <path d="M -20,0 L -7,0 L -4,-5" fill="none" stroke="#dc2626" strokeWidth={2.2} />
                    <path d="M 4,5 L 7,0 L 20,0" fill="none" stroke="#dc2626" strokeWidth={2.2} />
                    <circle cx={0} cy={0} r={4} fill="#1f2937" fillOpacity={0.55} />
                  </g>
                ) : (
                  <line
                    x1={-20}
                    y1={0}
                    x2={20}
                    y2={0}
                    stroke={
                      fuseRatio > 0.78
                        ? '#f97316'
                        : fuseRatio > 0.5
                          ? '#f59e0b'
                          : isDark
                            ? '#cbd5e1'
                            : '#334155'
                    }
                    strokeWidth={fuseRatio > 0.65 ? 2.8 : 2}
                    filter={fuseRatio > 0.7 ? 'url(#led-glow-amber)' : undefined}
                  />
                )}
              </g>
            )}

            {/* FIXED RESISTOR */}
            {comp.type === 'resistor' && (
              <g transform="translate(0, -6)">
                <line x1={-30} y1={0} x2={30} y2={0} stroke="#64748b" strokeWidth={2.5} />
                <rect x={-18} y={-8} width={36} height={16} rx={5} fill="#fde68a" stroke="#92400e" strokeWidth={1.4} />
                <rect x={-11} y={-7.5} width={4} height={15} fill="#b91c1c" />
                <rect x={-3} y={-7.5} width={4} height={15} fill="#1d4ed8" />
                <rect x={6} y={-7.5} width={4} height={15} fill="#b45309" />
              </g>
            )}

            {/* ONE-WAY DIODE */}
            {comp.type === 'diode' && (
              <g transform="translate(0, -6)">
                <line x1={-32} y1={0} x2={32} y2={0} stroke="#64748b" strokeWidth={2.4} />
                <rect x={-20} y={-9} width={40} height={18} rx={3} fill="#1e293b" stroke="#475569" strokeWidth={1.4} />
                {/* Silver blocker bar */}
                <rect x={11} y={-8.5} width={4.5} height={17} fill="#e2e8f0" />
                <text
                  x={-4}
                  y={3.5}
                  textAnchor="middle"
                  fontSize={7.5}
                  fontWeight={800}
                  fontFamily="IBM Plex Mono, monospace"
                  fill={br?.isForwardBiased ? '#34d399' : '#fca5a5'}
                >
                  {br?.isForwardBiased ? 'PASS' : 'STOP'}
                </text>
              </g>
            )}

            {/* RESISTANCE DIAL (RHEOSTAT) */}
            {comp.type === 'rheostat' && (
              <g>
                <g transform="translate(0, -10)">
                  <circle r={17} fill={isDark ? '#0f172a' : '#e2e8f0'} stroke="#475569" strokeWidth={2} />
                  <circle r={12} fill="#334155" stroke="#0f172a" strokeWidth={1.5} />
                  <line
                    x1={0}
                    y1={0}
                    x2={0}
                    y2={-11}
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    transform={`rotate(${dialAngle})`}
                  />
                </g>
                <foreignObject x={-54} y={16} width={108} height={42}>
                  <div className="flex flex-col items-center gap-0.5 px-1">
                    <div className="flex items-center justify-between w-full text-[9.5px] font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      <span>Dial {comp.code}</span>
                      <span className="text-sky-700 dark:text-sky-300">{rheoOhms} Ω</span>
                    </div>
                    <input
                      type="range"
                      aria-label={`Turn ${comp.code} resistance dial`}
                      min={rheoMin}
                      max={rheoMax}
                      step={comp.stepOhms ?? 1}
                      value={rheoOhms}
                      disabled={faultState.locked}
                      onChange={(e) => onChangeRheostat(comp.id, Number(e.target.value))}
                      className="w-full h-3 accent-sky-600 cursor-pointer disabled:opacity-50"
                    />
                  </div>
                </foreignObject>
              </g>
            )}

            {/* Stamped Component Tag */}
            {comp.type !== 'rheostat' && (
              <g>
                <rect x={-40} y={14} width={80} height={16} rx={3} fill={tagBg} />
                <text
                  x={0}
                  y={25.5}
                  textAnchor="middle"
                  fontSize={9.5}
                  fontWeight={700}
                  fontFamily="IBM Plex Mono, monospace"
                  fill={isFault ? '#fca5a5' : tagText}
                >
                  {comp.code}
                </text>
                <text
                  x={0}
                  y={45}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={600}
                  fontFamily="DM Sans, sans-serif"
                  fill={isDark ? '#cbd5e1' : '#334155'}
                >
                  {comp.scenarioLabels[scenario].slice(0, 21)}
                </text>
              </g>
            )}

            {/* Over-voltage warning badge (Level 6) */}
            {br?.isOverVoltage && (
              <g transform="translate(0, -45)">
                <rect x={-44} y={0} width={88} height={16} rx={3} fill="#dc2626" />
                <text
                  x={0}
                  y={11}
                  textAnchor="middle"
                  fontSize={8.5}
                  fontWeight={700}
                  fontFamily="IBM Plex Mono, monospace"
                  fill="#ffffff"
                >
                  TOO HIGH ({Math.abs(br.voltageDropVolts).toFixed(1)}V)
                </text>
              </g>
            )}

            {/* Teacher Mode Live V/I Callout */}
            {showViBadges && br && (
              <g transform="translate(-34, -56)">
                <rect
                  x={0}
                  y={0}
                  width={68}
                  height={20}
                  rx={3}
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth={1.2}
                />
                <text
                  x={34}
                  y={13}
                  textAnchor="middle"
                  fontSize={8.5}
                  fontWeight={600}
                  fontFamily="IBM Plex Mono, monospace"
                  fill="#e0f2fe"
                >
                  {Math.abs(br.voltageDropVolts).toFixed(1)}V·{Math.abs(br.currentAmps).toFixed(2)}A
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Physical Knife / Toggle Switches */}
      {visibleSwitches.map((sw: CircuitSwitch) => {
        const { x, y } = sw.physical;
        const isClosed = Boolean(switchStates[sw.id]);
        const isFault = faultSwitchSet.has(sw.id);
        const isConcealed = Boolean(sw.hatchId && !unlockedHatches[sw.hatchId]);
        const isUpper = y < 260;
        const lugY = isUpper ? 32 : -32;
        const canInteract = !sw.jammed && !isConcealed && !faultState.locked;

        return (
          <g
            key={sw.id}
            transform={`translate(${x}, ${y})`}
            onClick={() => canInteract && onToggleSwitch(sw.id)}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && canInteract) {
                e.preventDefault();
                onToggleSwitch(sw.id);
              }
            }}
            role="switch"
            aria-checked={isClosed}
            aria-label={`Switch ${sw.label}, currently ${isClosed ? 'ON' : 'OFF'}${sw.jammed ? ', stuck' : ''}`}
            tabIndex={canInteract ? 0 : -1}
            className={canInteract ? 'cursor-pointer focus:outline-none' : 'cursor-not-allowed'}
          >
            <circle cx={-16} cy={lugY} r={4} fill="#b45309" stroke="#78350f" strokeWidth={1.2} />
            <circle cx={16} cy={lugY} r={4} fill="#b45309" stroke="#78350f" strokeWidth={1.2} />

            {/* Switch Plate */}
            <rect
              x={-38}
              y={-32}
              width={76}
              height={64}
              rx={7}
              fill={plateBg}
              stroke={
                isFault
                  ? '#dc2626'
                  : sw.jammed
                    ? '#dc2626'
                    : isClosed
                      ? '#0284c7'
                      : plateStroke
              }
              strokeWidth={isFault || sw.jammed ? 2.4 : isClosed ? 2.2 : 1.5}
            />

            <circle cx={-18} cy={-4} r={4.2} fill="#cbd5e1" stroke="#334155" strokeWidth={1.5} />
            <circle cx={18} cy={-4} r={4.2} fill="#cbd5e1" stroke="#334155" strokeWidth={1.5} />

            {/* Rotating Switch Arm */}
            <g
              style={{
                transformOrigin: '-18px -4px',
                transform: isClosed ? 'rotate(0deg)' : 'rotate(-36deg)',
                transition: 'transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <line
                x1={-18}
                y1={-4}
                x2={18}
                y2={-4}
                stroke={isFault ? '#dc2626' : isClosed ? '#0284c7' : '#64748b'}
                strokeWidth={4.2}
                strokeLinecap="round"
              />
              <rect
                x={12}
                y={-9}
                width={13}
                height={10}
                rx={3}
                fill={sw.jammed ? '#dc2626' : isClosed ? '#059669' : '#475569'}
              />
            </g>

            {/* Label Tag */}
            <rect x={-32} y={11} width={64} height={17} rx={3} fill={tagBg} />
            <text
              x={0}
              y={22.5}
              textAnchor="middle"
              fontSize={10}
              fontWeight={700}
              fontFamily="IBM Plex Mono, monospace"
              fill={tagText}
            >
              {sw.label} · {isClosed ? 'ON' : 'OFF'}
            </text>

            {/* Stuck / Jammed Badge */}
            {sw.jammed && (
              <g transform="translate(0, -40)">
                <rect x={-34} y={0} width={68} height={15} rx={3} fill="#dc2626" />
                <text
                  x={0}
                  y={10.5}
                  textAnchor="middle"
                  fontSize={8.5}
                  fontWeight={800}
                  fontFamily="IBM Plex Mono, monospace"
                  fill="#ffffff"
                >
                  STUCK {isClosed ? 'ON' : 'OFF'}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Sliding Steel Locked Hatches */}
      {visibleHatches.map((hatch) => {
        const isUnlocked = Boolean(unlockedHatches[hatch.id]);
        const { x, y, width, height } = hatch.physicalRect;

        return (
          <g key={hatch.id}>
            <line x1={x} y1={y + 6} x2={x + width + 24} y2={y + 6} stroke="#64748b" strokeWidth={2} strokeDasharray="3 3" opacity={0.5} />
            <line x1={x} y1={y + height - 6} x2={x + width + 24} y2={y + height - 6} stroke="#64748b" strokeWidth={2} strokeDasharray="3 3" opacity={0.5} />

            <g
              onClick={() => !isUnlocked && !faultState.locked && onOpenHatch(hatch)}
              role={isUnlocked ? undefined : 'button'}
              aria-label={isUnlocked ? `${hatch.label} unlocked` : `Unlock ${hatch.label}`}
              tabIndex={isUnlocked ? -1 : 0}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !isUnlocked && !faultState.locked) {
                  e.preventDefault();
                  onOpenHatch(hatch);
                }
              }}
              className={isUnlocked ? 'pointer-events-none' : 'cursor-pointer focus:outline-none'}
              style={{
                transform: isUnlocked ? `translateX(${width + 26}px)` : 'translateX(0px)',
                opacity: isUnlocked ? 0 : 1,
                transition: 'transform 420ms cubic-bezier(0.16, 1, 0.3, 1), opacity 320ms ease',
              }}
            >
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx={8}
                fill={isDark ? '#1e293b' : '#334155'}
                stroke="#f59e0b"
                strokeWidth={2.4}
              />
              <rect
                x={x + 4}
                y={y + 4}
                width={width - 8}
                height={height - 8}
                rx={5}
                fill="url(#hatch-stripes)"
              />
              {[
                [x + 10, y + 10],
                [x + width - 10, y + 10],
                [x + 10, y + height - 10],
                [x + width - 10, y + height - 10],
              ].map(([rx, ry], idx) => (
                <circle key={idx} cx={rx} cy={ry} r={3} fill="#94a3b8" />
              ))}
              <g transform={`translate(${x + width / 2}, ${y + height / 2 - 14})`}>
                <path
                  d="M -7,-2 L -7,-7 A 7,7 0 0 1 7,-7 L 7,-2"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth={2.4}
                />
                <rect x={-10} y={-2} width={20} height={15} rx={3} fill="#f59e0b" />
                <circle cx={0} cy={5.5} r={2.2} fill="#1e293b" />
              </g>
              <text
                x={x + width / 2}
                y={y + height / 2 + 18}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fontFamily="IBM Plex Mono, monospace"
                fill="#fef3c7"
              >
                {hatch.label}
              </text>
              <text
                x={x + width / 2}
                y={y + height / 2 + 32}
                textAnchor="middle"
                fontSize={9}
                fontWeight={600}
                fontFamily="DM Sans, sans-serif"
                fill="#cbd5e1"
              >
                Click to Unlock
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};
