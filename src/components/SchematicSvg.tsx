import React from 'react';
import {
  CircuitComponent,
  CircuitSolution,
  CircuitSwitch,
  LevelDefinition,
  ScenarioId,
} from '../types/circuit';

interface SchematicSvgProps {
  level: LevelDefinition;
  scenario: ScenarioId;
  switchStates?: Record<string, boolean>;
  rheostatValues?: Record<string, number>;
  solution?: CircuitSolution | null;
  unlockedHatches?: Record<string, boolean>;
  showViBadges?: boolean;
  monochrome?: boolean;
  className?: string;
}

function pointsToSvg(pts: { x: number; y: number }[]): string {
  return pts.map((p) => `${p.x},${p.y}`).join(' ');
}

export const SchematicSvg: React.FC<SchematicSvgProps> = ({
  level,
  scenario,
  switchStates,
  rheostatValues,
  solution,
  unlockedHatches,
  showViBadges = false,
  monochrome = false,
  className = '',
}) => {
  const ink = monochrome ? '#000000' : 'currentColor';
  const mutedInk = monochrome ? '#333333' : '#64748b';
  const faultStroke = monochrome ? '#000000' : '#dc2626';
  const accentStroke = monochrome ? '#000000' : '#0284c7';
  const bgFill = monochrome ? '#ffffff' : 'transparent';

  const faultWireSet = new Set(solution?.shortCircuit.faultWireIds ?? []);
  const faultSwitchSet = new Set(solution?.shortCircuit.faultSwitchIds ?? []);

  const renderSwitch = (sw: CircuitSwitch) => {
    const isClosed = monochrome
      ? sw.initialClosed
      : Boolean(switchStates?.[sw.id] ?? sw.initialClosed);
    const isFault = !monochrome && faultSwitchSet.has(sw.id);
    const stroke = isFault ? faultStroke : ink;
    const { x, y, orientation } = sw.schematic;
    const isHoriz = orientation === 'horizontal';

    const rot = isHoriz ? 0 : 90;
    const bladeAngle = isClosed ? 0 : -32;

    return (
      <g key={sw.id}>
        <g transform={`translate(${x}, ${y}) rotate(${rot})`}>
          {/* Lead stubs */}
          <line x1={-36} y1={0} x2={-18} y2={0} stroke={stroke} strokeWidth={2} />
          <line x1={18} y1={0} x2={36} y2={0} stroke={stroke} strokeWidth={2} />
          {/* Terminal circles */}
          <circle cx={-18} cy={0} r={3.2} fill={monochrome ? '#fff' : '#f8fafc'} stroke={stroke} strokeWidth={2} />
          <circle cx={18} cy={0} r={3.2} fill={monochrome ? '#fff' : '#f8fafc'} stroke={stroke} strokeWidth={2} />
          {/* Hinged blade */}
          <line
            x1={-16}
            y1={0}
            x2={17}
            y2={0}
            stroke={stroke}
            strokeWidth={2.4}
            strokeLinecap="round"
            transform={`rotate(${bladeAngle}, -18, 0)`}
          />
        </g>

        {/* Crisp stamped label */}
        <text
          x={isHoriz ? x : x + 22}
          y={isHoriz ? y - 16 : y + 4}
          textAnchor={isHoriz ? 'middle' : 'start'}
          fontSize={12}
          fontWeight={700}
          fontFamily="IBM Plex Mono, monospace"
          fill={isFault ? faultStroke : ink}
        >
          {sw.label}
          {sw.jammed ? (sw.initialClosed ? ' [JAMMED ON]' : ' [JAMMED OFF]') : ''}
        </text>
      </g>
    );
  };

  const renderComponent = (comp: CircuitComponent) => {
    const { x, y, orientation } = comp.schematic;
    const isHoriz = orientation === 'horizontal';
    const rot = isHoriz ? 0 : 90;
    const br = solution?.branches[comp.id];
    const isBlown = Boolean(br?.isBlown);
    const stroke = ink;

    const currentOhms =
      comp.type === 'rheostat'
        ? rheostatValues?.[comp.id] ?? comp.initialOhms ?? 30
        : comp.resistanceOhms;

    // Determine diode orientation relative to schematic nodeA (anode) and nodeB (cathode)
    let diodeFlip = false;
    if (comp.type === 'diode') {
      const nA = level.nodes.find((n) => n.id === comp.nodeA)?.schematic;
      const nB = level.nodes.find((n) => n.id === comp.nodeB)?.schematic;
      if (nA && nB) {
        if (isHoriz && nA.x > nB.x) diodeFlip = true;
        if (!isHoriz && nA.y > nB.y) diodeFlip = true;
      }
    }

    return (
      <g key={comp.id}>
        {comp.type === 'battery' && (
          <g transform={`translate(${x}, ${y})`}>
            {/* Vertical IEC DC battery symbol */}
            <line x1={0} y1={-40} x2={0} y2={-12} stroke={stroke} strokeWidth={2} />
            <line x1={-16} y1={-12} x2={16} y2={-12} stroke={stroke} strokeWidth={2.2} />
            <line x1={-8} y1={-3} x2={8} y2={-3} stroke={stroke} strokeWidth={3.8} />
            <line x1={-16} y1={6} x2={16} y2={6} stroke={stroke} strokeWidth={2.2} />
            <line x1={-8} y1={15} x2={8} y2={15} stroke={stroke} strokeWidth={3.8} />
            <line x1={0} y1={15} x2={0} y2={40} stroke={stroke} strokeWidth={2} />
            <text x={-22} y={-14} fontSize={12} fontWeight={700} fill={stroke} fontFamily="IBM Plex Mono, monospace">
              +
            </text>
            <text x={-21} y={24} fontSize={12} fontWeight={700} fill={stroke} fontFamily="IBM Plex Mono, monospace">
              −
            </text>
            <text
              x={-22}
              y={4}
              textAnchor="end"
              fontSize={11}
              fontWeight={700}
              fill={stroke}
              fontFamily="IBM Plex Mono, monospace"
            >
              {comp.voltageVolts}V
            </text>
          </g>
        )}

        {comp.type === 'resistor' && (
          <g transform={`translate(${x}, ${y}) rotate(${rot})`}>
            <line x1={-40} y1={0} x2={-20} y2={0} stroke={stroke} strokeWidth={2} />
            <rect
              x={-20}
              y={-9}
              width={40}
              height={18}
              fill={monochrome ? '#ffffff' : 'var(--tw-bg-opacity, #f8fafc)'}
              className={monochrome ? '' : 'fill-white dark:fill-slate-900'}
              stroke={stroke}
              strokeWidth={2}
            />
            <line x1={20} y1={0} x2={40} y2={0} stroke={stroke} strokeWidth={2} />
          </g>
        )}

        {comp.type === 'rheostat' && (
          <g transform={`translate(${x}, ${y}) rotate(${rot})`}>
            <line x1={-35} y1={0} x2={-20} y2={0} stroke={stroke} strokeWidth={2} />
            <rect
              x={-20}
              y={-9}
              width={40}
              height={18}
              fill={monochrome ? '#ffffff' : undefined}
              className={monochrome ? '' : 'fill-white dark:fill-slate-900'}
              stroke={stroke}
              strokeWidth={2}
            />
            <line x1={20} y1={0} x2={35} y2={0} stroke={stroke} strokeWidth={2} />
            {/* Diagonal IEC variable resistor arrow */}
            <line x1={-16} y1={16} x2={16} y2={-16} stroke={stroke} strokeWidth={2} />
            <polygon points="16,-16 8,-14 14,-8" fill={stroke} />
          </g>
        )}

        {comp.type === 'fuse' && (
          <g transform={`translate(${x}, ${y}) rotate(${rot})`}>
            <line x1={-35} y1={0} x2={35} y2={0} stroke={stroke} strokeWidth={2} strokeDasharray={isBlown && !monochrome ? '6 6' : undefined} />
            <rect
              x={-18}
              y={-9}
              width={36}
              height={18}
              fill="none"
              stroke={isBlown && !monochrome ? faultStroke : stroke}
              strokeWidth={2}
            />
          </g>
        )}

        {comp.type === 'lamp' && (
          <g transform={`translate(${x}, ${y}) rotate(${rot})`}>
            <line x1={-40} y1={0} x2={-15} y2={0} stroke={stroke} strokeWidth={2} />
            <circle
              cx={0}
              cy={0}
              r={15}
              fill={monochrome ? '#ffffff' : undefined}
              className={monochrome ? '' : 'fill-white dark:fill-slate-900'}
              stroke={stroke}
              strokeWidth={2}
            />
            <line x1={-10.5} y1={-10.5} x2={10.5} y2={10.5} stroke={stroke} strokeWidth={1.8} />
            <line x1={10.5} y1={-10.5} x2={-10.5} y2={10.5} stroke={stroke} strokeWidth={1.8} />
            <line x1={15} y1={0} x2={40} y2={0} stroke={stroke} strokeWidth={2} />
          </g>
        )}

        {comp.type === 'led' && (
          <g transform={`translate(${x}, ${y}) rotate(${rot})`}>
            <line x1={-40} y1={0} x2={-11} y2={0} stroke={stroke} strokeWidth={2} />
            <polygon
              points="-11,-11 -11,11 10,0"
              fill={monochrome ? '#ffffff' : undefined}
              className={monochrome ? '' : 'fill-white dark:fill-slate-900'}
              stroke={stroke}
              strokeWidth={2}
            />
            <line x1={10} y1={-11} x2={10} y2={11} stroke={stroke} strokeWidth={2.4} />
            <line x1={10} y1={0} x2={40} y2={0} stroke={stroke} strokeWidth={2} />
            {/* IEC LED emission arrows */}
            <line x1={-2} y1={-15} x2={7} y2={-23} stroke={stroke} strokeWidth={1.5} />
            <polygon points="7,-23 2,-22 6,-18" fill={stroke} />
            <line x1={6} y1={-13} x2={15} y2={-21} stroke={stroke} strokeWidth={1.5} />
            <polygon points="15,-21 10,-20 14,-16" fill={stroke} />
          </g>
        )}

        {comp.type === 'diode' && (
          <g transform={`translate(${x}, ${y}) rotate(${rot + (diodeFlip ? 180 : 0)})`}>
            <line x1={-26} y1={0} x2={-10} y2={0} stroke={stroke} strokeWidth={2} />
            <polygon
              points="-10,-10 -10,10 10,0"
              fill={monochrome ? '#ffffff' : undefined}
              className={monochrome ? '' : 'fill-white dark:fill-slate-900'}
              stroke={stroke}
              strokeWidth={2}
            />
            <line x1={10} y1={-10} x2={10} y2={10} stroke={stroke} strokeWidth={2.6} />
            <line x1={10} y1={0} x2={26} y2={0} stroke={stroke} strokeWidth={2} />
          </g>
        )}

        {comp.type === 'fan' && (
          <g transform={`translate(${x}, ${y})`}>
            <line x1={0} y1={-36} x2={0} y2={-16} stroke={stroke} strokeWidth={2} />
            <circle
              cx={0}
              cy={0}
              r={16}
              fill={monochrome ? '#ffffff' : undefined}
              className={monochrome ? '' : 'fill-white dark:fill-slate-900'}
              stroke={stroke}
              strokeWidth={2}
            />
            <text
              x={0}
              y={5}
              textAnchor="middle"
              fontSize={13}
              fontWeight={700}
              fontFamily="IBM Plex Mono, monospace"
              fill={stroke}
            >
              M
            </text>
            <line x1={0} y1={16} x2={0} y2={36} stroke={stroke} strokeWidth={2} />
          </g>
        )}

        {comp.type === 'siren' && (
          <g transform={`translate(${x}, ${y}) rotate(${rot})`}>
            <line x1={-40} y1={0} x2={-14} y2={0} stroke={stroke} strokeWidth={2} />
            <path
              d="M -14,-11 L 14,-11 A 14,14 0 0 1 -14,-11 Z"
              fill="none"
            />
            <rect
              x={-14}
              y={-12}
              width={28}
              height={24}
              rx={5}
              fill={monochrome ? '#ffffff' : undefined}
              className={monochrome ? '' : 'fill-white dark:fill-slate-900'}
              stroke={stroke}
              strokeWidth={2}
            />
            <line x1={14} y1={0} x2={40} y2={0} stroke={stroke} strokeWidth={2} />
            <text
              x={0}
              y={4}
              textAnchor="middle"
              fontSize={9}
              fontWeight={700}
              fontFamily="IBM Plex Mono, monospace"
              fill={stroke}
              transform={`rotate(${-rot})`}
            >
              BZ
            </text>
          </g>
        )}

        {comp.type === 'relay' && (
          <g transform={`translate(${x}, ${y}) rotate(${rot})`}>
            <line x1={-36} y1={0} x2={-18} y2={0} stroke={stroke} strokeWidth={2} />
            <rect
              x={-18}
              y={-10}
              width={36}
              height={20}
              fill={monochrome ? '#ffffff' : undefined}
              className={monochrome ? '' : 'fill-white dark:fill-slate-900'}
              stroke={stroke}
              strokeWidth={2}
            />
            <line x1={-12} y1={-10} x2={12} y2={10} stroke={stroke} strokeWidth={1.6} />
            <line x1={18} y1={0} x2={36} y2={0} stroke={stroke} strokeWidth={2} />
          </g>
        )}

        {/* Component code & rating label */}
        {comp.type !== 'battery' && (
          <g>
            <text
              x={isHoriz ? x : x + 22}
              y={isHoriz ? y - 16 : y - 2}
              textAnchor={isHoriz ? 'middle' : 'start'}
              fontSize={11}
              fontWeight={700}
              fontFamily="IBM Plex Mono, monospace"
              fill={ink}
            >
              {comp.code}
            </text>
            <text
              x={isHoriz ? x : x + 22}
              y={isHoriz ? y + 26 : y + 11}
              textAnchor={isHoriz ? 'middle' : 'start'}
              fontSize={9.5}
              fontFamily="DM Sans, sans-serif"
              fill={mutedInk}
            >
              {comp.type === 'rheostat'
                ? monochrome
                  ? `${comp.minOhms}–${comp.maxOhms} Ω`
                  : `${currentOhms} Ω`
                : comp.scenarioLabels[scenario].slice(0, 22)}
            </text>
          </g>
        )}

        {/* Inline Ammeter Shunt Symbol (A1, A2...) */}
        {comp.shuntLabel && comp.schematicShunt && (
          <g transform={`translate(${comp.schematicShunt.x}, ${comp.schematicShunt.y})`}>
            <circle
              cx={0}
              cy={0}
              r={10}
              fill={monochrome ? '#ffffff' : '#eff6ff'}
              stroke={monochrome ? '#000000' : accentStroke}
              strokeWidth={1.8}
            />
            <text
              x={0}
              y={3.5}
              textAnchor="middle"
              fontSize={8.5}
              fontWeight={700}
              fontFamily="IBM Plex Mono, monospace"
              fill={monochrome ? '#000000' : accentStroke}
            >
              {comp.shuntLabel}
            </text>
          </g>
        )}

        {/* Teacher Mode Live V/I Badge (screen only) */}
        {showViBadges && !monochrome && br && comp.type !== 'battery' && (
          <g transform={`translate(${isHoriz ? x - 34 : x - 62}, ${isHoriz ? y + 26 : y - 11})`}>
            <rect
              x={0}
              y={0}
              width={56}
              height={24}
              rx={3}
              fill="#0f172a"
              fillOpacity={0.92}
              stroke="#38bdf8"
              strokeWidth={1}
            />
            <text
              x={28}
              y={10}
              textAnchor="middle"
              fontSize={8.5}
              fontFamily="IBM Plex Mono, monospace"
              fill="#e0f2fe"
            >
              {Math.abs(br.voltageDropVolts).toFixed(1)}V
            </text>
            <text
              x={28}
              y={20}
              textAnchor="middle"
              fontSize={8.5}
              fontFamily="IBM Plex Mono, monospace"
              fill="#38bdf8"
            >
              {Math.abs(br.currentAmps).toFixed(2)}A
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <svg
      viewBox="0 0 800 410"
      className={`w-full h-auto select-none ${className}`}
      role="img"
      aria-label={`IEC circuit schematic for Level ${level.id}: ${level.title}`}
      style={{ backgroundColor: bgFill }}
    >
      {/* Subtle monochrome frame for print clarity */}
      {monochrome && (
        <rect
          x={6}
          y={6}
          width={788}
          height={398}
          fill="#ffffff"
          stroke="#000000"
          strokeWidth={1.2}
        />
      )}

      {/* Orthogonal IEC Wires */}
      {level.wires.map((wire) => {
        const isFault = !monochrome && faultWireSet.has(wire.id);
        return (
          <polyline
            key={wire.id}
            points={pointsToSvg(wire.schematicPoints)}
            fill="none"
            stroke={isFault ? faultStroke : ink}
            strokeWidth={isFault ? 3.5 : 2}
            strokeLinejoin="miter"
          />
        );
      })}

      {/* Junction dots where multiple wires meet */}
      {level.nodes.map((node) => {
        const degree =
          level.wires.filter((w) => w.from === node.id || w.to === node.id).length +
          level.switches.filter((s) => s.nodeA === node.id || s.nodeB === node.id).length +
          level.components.filter((c) => c.nodeA === node.id || c.nodeB === node.id).length;
        if (degree < 3 && !node.testPointLabel) return null;
        return (
          <g key={node.id}>
            {degree >= 3 && (
              <circle cx={node.schematic.x} cy={node.schematic.y} r={3.5} fill={ink} />
            )}
            {node.testPointLabel && (
              <g transform={`translate(${node.schematic.x}, ${node.schematic.y})`}>
                <circle
                  cx={0}
                  cy={0}
                  r={5.5}
                  fill={monochrome ? '#ffffff' : '#fef3c7'}
                  stroke={monochrome ? '#000000' : '#d97706'}
                  strokeWidth={2}
                />
                <text
                  x={-11}
                  y={-8}
                  textAnchor="end"
                  fontSize={10}
                  fontWeight={700}
                  fontFamily="IBM Plex Mono, monospace"
                  fill={monochrome ? '#000000' : '#b45309'}
                >
                  {node.testPointLabel}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Compartment Hatch Outlines */}
      {level.hatches.map((hatch) => {
        const isUnlocked = !monochrome && Boolean(unlockedHatches?.[hatch.id]);
        return (
          <g key={hatch.id}>
            <rect
              x={hatch.schematicRect.x}
              y={hatch.schematicRect.y}
              width={hatch.schematicRect.width}
              height={hatch.schematicRect.height}
              fill={monochrome ? 'none' : isUnlocked ? 'rgba(5, 150, 105, 0.06)' : 'rgba(217, 119, 6, 0.08)'}
              stroke={monochrome ? '#000000' : isUnlocked ? '#059669' : '#d97706'}
              strokeWidth={1.5}
              strokeDasharray="5 3"
              rx={4}
            />
            <text
              x={hatch.schematicRect.x + hatch.schematicRect.width / 2}
              y={hatch.schematicRect.y - 5}
              textAnchor="middle"
              fontSize={9}
              fontWeight={700}
              fontFamily="IBM Plex Mono, monospace"
              fill={monochrome ? '#000000' : isUnlocked ? '#059669' : '#b45309'}
            >
              {hatch.label}
            </text>
          </g>
        );
      })}

      {/* Switches */}
      {level.switches.map(renderSwitch)}

      {/* Components */}
      {level.components.map(renderComponent)}
    </svg>
  );
};
