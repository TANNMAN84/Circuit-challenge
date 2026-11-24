import React from 'react';
import { LevelDefinition, ScenarioId } from '../types/circuit';
import { SchematicSvg } from './SchematicSvg';

interface PrintWorksheetProps {
  levels: LevelDefinition[];
  scenario: ScenarioId;
  includeTeacherAnswerKey: boolean;
  /**
   * When printing multiple levels in Teacher Mode:
   * - 'grouped': All Student Circuit Maps first (Pages 1–10), then all Teacher Answer Keys (Pages 11–20)
   * - 'paired': Each level's Student Sheet immediately followed by its Teacher Answer Key
   */
  bulkLayout?: 'grouped' | 'paired';
}

const StudentWorksheetPage: React.FC<{
  level: LevelDefinition;
  scenario: ScenarioId;
  pageBreakBefore: boolean;
}> = ({ level, scenario, pageBreakBefore }) => {
  return (
    <section
      className={`print-student-page ${pageBreakBefore ? 'print-page-break' : ''}`}
    >
      {/* Compact Header */}
      <div className="print-avoid-break border-b-2 border-black pb-2 mb-2.5 flex items-end justify-between gap-4">
        <div>
          <div className="text-[9pt] font-mono font-bold uppercase tracking-wider">
            Circuit Disarm · Circuit Map Sheet
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
  );
};

const TeacherAnswerKeyPage: React.FC<{
  level: LevelDefinition;
}> = ({ level }) => {
  return (
    <section className="print-teacher-key-page">
      <div className="border-b-2 border-black pb-2 mb-4 flex items-end justify-between">
        <div>
          <div className="text-[9pt] font-mono font-bold uppercase tracking-wider">
            TEACHER ANSWER KEY · CIRCUIT DISARM
          </div>
          <h2 className="text-[15pt] font-bold mt-0.5">
            Mission {String(level.id).padStart(2, '0')}: {level.title}
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
          1. Safe Disarm Switch &amp; Component Configuration
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
            : 'None on this mission'}
        </p>
      </div>

      {/* Worked Model Solutions */}
      <div className="print-avoid-break mb-4">
        <h3 className="text-[10pt] font-mono font-bold uppercase mb-2">
          2. Worked Solutions — Analysis Questions
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
  );
};

/**
 * Dedicated monochrome A4 classroom worksheet layer rendered exclusively under @media print.
 * Supports single-mission printing as well as Teacher Mode bulk printing of all 10 missions.
 */
export const PrintWorksheet = React.forwardRef<HTMLDivElement, PrintWorksheetProps>(
  ({ levels, scenario, includeTeacherAnswerKey, bulkLayout = 'grouped' }, ref) => {
    if (levels.length === 0) return null;

    return (
      <div ref={ref} className="hidden print-only bg-white text-black font-sans">
        {bulkLayout === 'paired' || levels.length === 1 ? (
          levels.map((level, idx) => (
            <React.Fragment key={level.id}>
              <StudentWorksheetPage
                level={level}
                scenario={scenario}
                pageBreakBefore={idx > 0}
              />
              {includeTeacherAnswerKey && (
                <TeacherAnswerKeyPage level={level} />
              )}
            </React.Fragment>
          ))
        ) : (
          <>
            {/* Pages 1–10: All Student Circuit Maps & Questions */}
            {levels.map((level, idx) => (
              <StudentWorksheetPage
                key={`student-${level.id}`}
                level={level}
                scenario={scenario}
                pageBreakBefore={idx > 0}
              />
            ))}
            {/* Pages 11–20: All Teacher Answer Keys */}
            {includeTeacherAnswerKey &&
              levels.map((level) => (
                <TeacherAnswerKeyPage
                  key={`key-${level.id}`}
                  level={level}
                />
              ))}
          </>
        )}
      </div>
    );
  },
);

PrintWorksheet.displayName = 'PrintWorksheet';

/**
 * Exports the rendered monochrome A4 worksheet pack (with full crisp vector SVGs)
 * as a self-contained offline HTML document ready to print or save as PDF.
 */
export function buildStandaloneWorksheetHtml(
  innerHtml: string,
  title: string,
  pageCount: number,
): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    @page { size: A4 portrait; margin: 9mm 10mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background: #e2e8f0;
      color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 20px;
      background: #0f172a;
      color: #f8fafc;
      font-size: 13px;
    }
    .toolbar button {
      background: #f59e0b;
      color: #0f172a;
      border: none;
      border-radius: 8px;
      padding: 8px 14px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
    }
    .toolbar button:hover { background: #fbbf24; }
    .sheets {
      max-width: 210mm;
      margin: 18px auto 32px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .print-student-page,
    .print-teacher-key-page {
      background: #ffffff;
      padding: 10mm 11mm;
      box-shadow: 0 4px 18px rgba(15, 23, 42, 0.16);
    }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }
    .font-normal { font-weight: 400; }
    .uppercase { text-transform: uppercase; }
    .tracking-wider { letter-spacing: 0.05em; }
    .leading-tight { line-height: 1.2; }
    .leading-snug { line-height: 1.35; }
    .leading-relaxed { line-height: 1.5; }
    .text-left { text-align: left; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-end { align-items: flex-end; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .shrink-0 { flex-shrink: 0; }
    .grid { display: grid; }
    .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }
    .col-span-7 { grid-column: span 7 / span 7; }
    .col-span-5 { grid-column: span 5 / span 5; }
    .gap-3 { gap: 10px; }
    .gap-4 { gap: 14px; }
    .w-full { width: 100%; }
    .overflow-hidden { overflow: hidden; }
    .border { border: 1px solid #000; }
    .border-2 { border: 2px solid #000; }
    .border-b { border-bottom: 1px solid rgba(0,0,0,0.6); }
    .border-b-2 { border-bottom: 2px solid #000; }
    .border-t { border-top: 1px solid rgba(0,0,0,0.4); }
    .border-l-2 { border-left: 2px solid #000; }
    .border-collapse { border-collapse: collapse; }
    .bg-neutral-100 { background: #f5f5f5; }
    .p-2 { padding: 7px; }
    .p-3 { padding: 10px; }
    .px-1\\.5 { padding-left: 5px; padding-right: 5px; }
    .px-2 { padding-left: 7px; padding-right: 7px; }
    .px-2\\.5 { padding-left: 9px; padding-right: 9px; }
    .py-0\\.5 { padding-top: 2px; padding-bottom: 2px; }
    .py-1 { padding-top: 4px; padding-bottom: 4px; }
    .py-1\\.5 { padding-top: 5px; padding-bottom: 5px; }
    .pb-2 { padding-bottom: 7px; }
    .pt-1 { padding-top: 4px; }
    .pt-1\\.5 { padding-top: 5px; }
    .pl-2 { padding-left: 8px; }
    .pl-4 { padding-left: 16px; }
    .pl-5 { padding-left: 20px; }
    .mt-0\\.5 { margin-top: 2px; }
    .mt-1 { margin-top: 4px; }
    .mt-2 { margin-top: 7px; }
    .mb-1 { margin-bottom: 4px; }
    .mb-1\\.5 { margin-bottom: 5px; }
    .mb-2 { margin-bottom: 7px; }
    .mb-2\\.5 { margin-bottom: 9px; }
    .mb-4 { margin-bottom: 14px; }
    .space-y-1 > * + * { margin-top: 3px; }
    .space-y-1\\.5 > * + * { margin-top: 5px; }
    .space-y-2 > * + * { margin-top: 7px; }
    .space-y-3 > * + * { margin-top: 10px; }
    .list-decimal { list-style-type: decimal; }
    .text-\\[7\\.6pt\\] { font-size: 7.6pt; }
    .text-\\[7\\.8pt\\] { font-size: 7.8pt; }
    .text-\\[8pt\\] { font-size: 8pt; }
    .text-\\[8\\.3pt\\] { font-size: 8.3pt; }
    .text-\\[8\\.5pt\\] { font-size: 8.5pt; }
    .text-\\[8\\.8pt\\] { font-size: 8.8pt; }
    .text-\\[9pt\\] { font-size: 9pt; }
    .text-\\[9\\.5pt\\] { font-size: 9.5pt; }
    .text-\\[10pt\\] { font-size: 10pt; }
    .text-\\[15pt\\] { font-size: 15pt; }
    .max-h-\\[104mm\\] { max-height: 104mm; }
    .h-\\[5\\.2mm\\] { height: 5.2mm; }
    svg { max-width: 100%; height: auto; display: block; }
    h1, h2, h3, p, ol { margin-top: 0; }
    @media print {
      body { background: #ffffff; }
      .toolbar { display: none !important; }
      .sheets { max-width: none; margin: 0; gap: 0; display: block; }
      .print-student-page,
      .print-teacher-key-page {
        padding: 0;
        box-shadow: none;
      }
      .print-student-page {
        width: 100%;
        max-height: 277mm;
        overflow: hidden;
      }
      .print-avoid-break {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .print-teacher-key-page,
      .print-page-break {
        break-before: page;
        page-break-before: always;
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div><strong>${title}</strong> &middot; ${pageCount} A4 pages ready to print or save as PDF</div>
    <button type="button" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="sheets">${innerHtml}</div>
</body>
</html>`;
}
