import React from 'react';
import { LevelDefinition, ScenarioId } from '../types/circuit';
import { SCENARIOS } from '../data/scenarios';
import { SchematicSvg } from './SchematicSvg';

interface PrintWorksheetProps {
  level: LevelDefinition;
  scenario: ScenarioId;
  includeTeacherAnswerKey: boolean;
}

/**
 * Dedicated monochrome A4 classroom worksheet rendered exclusively under @media print.
 * - Page 1: Strictly constrained single A4 portrait student sheet (break-inside: avoid).
 * - Page 2: Dedicated Teacher Answer Key (break-before: page) when Teacher Mode is unlocked.
 */
export const PrintWorksheet: React.FC<PrintWorksheetProps> = ({
  level,
  scenario,
  includeTeacherAnswerKey,
}) => {
  const scenarioMeta = SCENARIOS[scenario];

  return (
    <div className="hidden print-only bg-white text-black font-sans">
      {/* ================================================================= */}
      {/* PAGE 1 — STRICT SINGLE A4 PAGE STUDENT FIELD MANUAL WORKSHEET     */}
      {/* ================================================================= */}
      <section className="print-student-page">
        {/* Compact Header */}
        <div className="print-avoid-break border-b-2 border-black pb-2 mb-2.5 flex items-end justify-between gap-4">
          <div>
            <div className="text-[9pt] font-mono font-bold uppercase tracking-wider">
              Circuit Disarm · Circuit Map Sheet · {scenarioMeta.name}
            </div>
            <h1 className="text-[15pt] font-bold leading-tight mt-0.5">
              Mission {String(level.id).padStart(2, '0')}: {level.title}
            </h1>
            <div className="text-[8.5pt] font-mono mt-0.5">
              Use this map to find the right switch numbers (S1–S{level.switches.length}) on the box
            </div>
          </div>

          <div className="text-[8.5pt] font-mono space-y-1.5 text-right shrink-0">
            <div>Name: ________________________</div>
            <div>Class: _______ &nbsp; Date: ___/___/20__</div>
          </div>
        </div>

        {/* Mission Briefing */}
        <p className="print-avoid-break text-[8.8pt] leading-snug mb-2">
          <strong>Your Mission:</strong> {level.briefings[scenario]} Match the switch and part labels below to the box on screen.
        </p>

        {/* Explicit Level 5 Anti-Tamper Warning */}
        {level.antiTamperWarning && (
          <div className="print-avoid-break border-2 border-black px-2.5 py-1.5 mb-2 text-[8.5pt] font-bold leading-snug">
            ▲ {level.antiTamperWarning}
          </div>
        )}

        {/* Crisp Monochrome IEC/Australian Circuit Schematic */}
        <div className="print-avoid-break mb-2.5">
          <div className="flex items-center justify-between text-[8pt] font-mono font-bold mb-1">
            <span>CIRCUIT MAP</span>
            <span>
              {level.multimeterEnabled
                ? 'CHECK ZONES: VOLTS (V) ON TP PINS · AMPS (A) ON A CLIPS'
                : 'STARTING SWITCH POSITIONS SHOWN'}
            </span>
          </div>
          <div className="max-h-[104mm] overflow-hidden">
            <SchematicSvg level={level} scenario={scenario} monochrome />
          </div>
        </div>

        {/* Two-Column Target Table + Field Manual Keypad Box */}
        <div className="print-avoid-break grid grid-cols-12 gap-3 mb-2.5">
          {/* ON / OFF Target Table */}
          <div className="col-span-7">
            <div className="text-[8.5pt] font-mono font-bold mb-1 uppercase">
              Your Checklist
            </div>
            <table className="w-full border-collapse border border-black text-[8pt]">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="border border-black px-1.5 py-1 text-left font-mono">Tag</th>
                  <th className="border border-black px-1.5 py-1 text-left">Part</th>
                  <th className="border border-black px-1.5 py-1 text-center font-mono">Need</th>
                  <th className="border border-black px-1.5 py-1 text-center font-mono">Done</th>
                </tr>
              </thead>
              <tbody>
                {level.winConditions.map((wc) => {
                  const comp = level.components.find((c) => c.id === wc.componentId);
                  return (
                    <tr key={wc.id}>
                      <td className="border border-black px-1.5 py-0.5 font-mono font-bold">
                        {comp?.code ?? wc.componentId}
                      </td>
                      <td className="border border-black px-1.5 py-0.5">
                        {comp?.scenarioLabels[scenario] ?? wc.componentId}
                      </td>
                      <td className="border border-black px-1.5 py-0.5 text-center font-mono font-bold">
                        {wc.targetState === 'current_range'
                          ? `${wc.minCurrentAmps?.toFixed(2)}–${wc.maxCurrentAmps?.toFixed(2)} A`
                          : wc.targetState.toUpperCase()}
                      </td>
                      <td className="border border-black px-1.5 py-0.5 text-center font-mono">
                        [ &nbsp; ]
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Keypad Problem & Formula Box */}
          <div className="col-span-5 border border-black p-2 flex flex-col justify-between">
            <div>
              <div className="text-[8.5pt] font-mono font-bold uppercase mb-1">
                Locked Cover Code
              </div>
              <p className="text-[7.8pt] leading-snug">{level.worksheet.keypadSummary}</p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-black/40 text-[7.6pt] font-mono space-y-1">
              <div>V = I × R &nbsp;|&nbsp; I = V ÷ R &nbsp;|&nbsp; R = V ÷ I</div>
              <div>Efficiency = (Useful ÷ Total) × 100%</div>
              <div className="pt-1 font-bold">
                3-Digit Code(s): [ _ ][ _ ][ _ ]
                {level.hatches[0]?.stages.length === 2 ? '  →  [ _ ][ _ ][ _ ]' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* 3 Structured Analysis Questions */}
        <div className="print-avoid-break">
          <div className="text-[8.5pt] font-mono font-bold uppercase mb-1">
            Quick Check Questions
          </div>
          <ol className="list-decimal pl-4 space-y-2 text-[8.3pt] leading-snug">
            {level.worksheet.questions.map((q, idx) => (
              <li key={idx} className="print-avoid-break">
                <div className="font-medium mb-1">{q}</div>
                <div className="border-b border-black/60 h-[5.2mm]" />
                <div className="border-b border-black/60 h-[5.2mm]" />
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================================================================= */}
      {/* PAGE 2 — DEDICATED TEACHER ANSWER KEY (break-before: page)        */}
      {/* ================================================================= */}
      {includeTeacherAnswerKey && (
        <section className="print-teacher-key-page">
          <div className="border-b-2 border-black pb-2 mb-4 flex items-end justify-between">
            <div>
              <div className="text-[9pt] font-mono font-bold uppercase tracking-wider">
                TEACHER ANSWER KEY · CIRCUIT DISARM
              </div>
              <h2 className="text-[15pt] font-bold mt-0.5">
                Level {level.id}: {level.title} ({scenarioMeta.shortName})
              </h2>
              <div className="text-[8.5pt] font-mono mt-0.5">
                {level.worksheet.syllabusOutcome}
              </div>
            </div>
            <div className="text-[8.5pt] font-mono font-bold border border-black px-2 py-1">
              TEACHER COPY ONLY
            </div>
          </div>

          {/* Target Switch Configuration Table */}
          <div className="print-avoid-break mb-4">
            <h3 className="text-[10pt] font-mono font-bold uppercase mb-1.5">
              1. Safe Disarm Switch & Component Configuration
            </h3>
            <table className="w-full border-collapse border border-black text-[9pt] mb-2">
              <thead>
                <tr className="bg-neutral-100">
                  {Object.keys(level.worksheet.answerKey.switchStates).map((swId) => (
                    <th key={swId} className="border border-black px-2 py-1 font-mono text-center">
                      {swId}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {Object.entries(level.worksheet.answerKey.switchStates).map(([swId, state]) => (
                    <td
                      key={swId}
                      className="border border-black px-2 py-1 font-mono font-bold text-center"
                    >
                      {state}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            {level.worksheet.answerKey.rheostatSetting && (
              <p className="text-[9pt] font-mono mt-1">
                <strong>Rheostat Setting:</strong> {level.worksheet.answerKey.rheostatSetting}
              </p>
            )}
            <p className="text-[9pt] font-mono mt-1">
              <strong>Hatch Unlock Code(s):</strong>{' '}
              {level.worksheet.answerKey.hatchCodes.length > 0
                ? level.worksheet.answerKey.hatchCodes.join(' → ')
                : 'None on this level'}
            </p>
          </div>

          {/* Worked Model Solutions */}
          <div className="print-avoid-break mb-4">
            <h3 className="text-[10pt] font-mono font-bold uppercase mb-2">
              2. Worked Solutions — Stage 5 Analysis Questions
            </h3>
            <ol className="list-decimal pl-5 space-y-3 text-[9.5pt] leading-relaxed">
              {level.worksheet.questions.map((q, idx) => (
                <li key={idx}>
                  <div className="font-semibold">{q}</div>
                  <div className="mt-1 pl-2 border-l-2 border-black font-normal">
                    <strong>Model Answer:</strong> {level.worksheet.answerKey.workedSolutions[idx]}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Syllabus Debrief Summary */}
          <div className="print-avoid-break border border-black p-3 text-[9pt] leading-relaxed">
            <strong>Key Syllabus Takeaway:</strong> {level.debriefNote}
          </div>
        </section>
      )}
    </div>
  );
};
