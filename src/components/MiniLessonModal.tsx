import React, { useState } from 'react';
import { LessonDefinition } from '../data/lessons';
import { LessonAnimationStage } from './LessonAnimations';
import { soundEngine } from '../engine/sound';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  HelpCircle,
  X,
  XCircle,
} from 'lucide-react';

interface MiniLessonModalProps {
  lesson: LessonDefinition;
  alreadyCompleted: boolean;
  onCompleteLesson: (lessonId: LessonDefinition['id']) => void;
  onLaunchMission?: (levelId: number) => void;
  onClose: () => void;
}

export const MiniLessonModal: React.FC<MiniLessonModalProps> = ({
  lesson,
  alreadyCompleted,
  onCompleteLesson,
  onLaunchMission,
  onClose,
}) => {
  const [step, setStep] = useState<'explore' | 'quiz'>('explore');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);

  const allAnswered = lesson.quiz.every((q) => selectedAnswers[q.id] !== undefined);
  const correctCount = lesson.quiz.filter(
    (q) => selectedAnswers[q.id] === q.correctIndex,
  ).length;
  const allCorrect = correctCount === lesson.quiz.length;

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    soundEngine.playKeypadBeep(optionIdx + 1);
    setChecked(false);
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleCheckQuiz = () => {
    setChecked(true);
    if (allCorrect) {
      soundEngine.playDisarmSuccess();
      setJustUnlocked(true);
      onCompleteLesson(lesson.id);
    } else {
      soundEngine.playErrorBuzz();
    }
  };

  const isCleared = alreadyCompleted || justUnlocked;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-5 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mini-lesson-title"
    >
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#101726] text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
              <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Mini-Lesson 0{lesson.number}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-amber-700 dark:text-amber-300">
                {lesson.unlocksLabel}
              </span>
              {isCleared && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    Cleared
                  </span>
                </>
              )}
            </div>
            <h2
              id="mini-lesson-title"
              className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white truncate mt-0.5"
            >
              {lesson.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close mini-lesson"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Switcher Bar */}
        <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101726] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStep('explore')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${
                step === 'explore'
                  ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              1. Interactive Model
            </button>
            <button
              type="button"
              onClick={() => setStep('quiz')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${
                step === 'quiz'
                  ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              2. Quick Quiz ({lesson.quiz.length} Qs)
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 hidden sm:block">
            {step === 'explore'
              ? 'Play with the controls below, then pass the 3-question quiz to unlock the next stage.'
              : 'Get all 3 right to unlock the next missions (unlimited retries).'}
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {step === 'explore' ? (
            <>
              {/* Key Symbols & Units Reference Strip (V, I, R, etc.) */}
              <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {lesson.symbols.map((item) => (
                  <div
                    key={item.symbol}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-3 space-y-1"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-sm font-extrabold text-amber-700 dark:text-amber-400">
                        {item.symbol}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {item.unit}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.name}
                    </div>
                    <p className="text-[11.5px] leading-snug text-slate-600 dark:text-slate-300">
                      {item.analogy}
                    </p>
                  </div>
                ))}
              </div>

              {/* Animated Interactive Analogy Stage */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  {lesson.analogyHeadline}
                </div>
                <LessonAnimationStage lessonId={lesson.id} />
              </div>

              {/* Guided "Try This" Mini-Experiments */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Try this before the quiz:
                </div>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {lesson.tryPrompts.map((prompt, i) => (
                    <li key={i}>{prompt}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {justUnlocked && (
                <div className="animate-stamp-pop rounded-xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                        Clearance Earned! {lesson.unlocksLabel}
                      </div>
                      <div className="text-xs text-emerald-800 dark:text-emerald-300">
                        All 3 answers correct — you are ready for the next circuit challenge.
                      </div>
                    </div>
                  </div>
                  {onLaunchMission && (
                    <button
                      type="button"
                      onClick={() => onLaunchMission(lesson.firstUnlockedLevelId)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-colors whitespace-nowrap"
                    >
                      Start Mission {String(lesson.firstUnlockedLevelId).padStart(2, '0')}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {lesson.quiz.map((q, qIdx) => {
                const chosen = selectedAnswers[q.id];
                const isRight = checked && chosen === q.correctIndex;
                const isWrong = checked && chosen !== undefined && chosen !== q.correctIndex;

                return (
                  <div
                    key={q.id}
                    className={`rounded-xl border p-4 space-y-2.5 transition-colors ${
                      isRight
                        ? 'border-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/25'
                        : isWrong
                          ? 'border-red-500/80 bg-red-50/50 dark:bg-red-950/25'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {qIdx + 1}. {q.question}
                      </p>
                      {isRight && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                      {isWrong && (
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {q.options.map((opt, optIdx) => {
                        const selected = chosen === optIdx;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm transition-colors ${
                              selected
                                ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/50 text-sky-950 dark:text-sky-100 font-semibold'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {checked && chosen !== undefined && (
                      <p
                        className={`text-xs leading-relaxed pt-1 ${
                          isRight
                            ? 'text-emerald-800 dark:text-emerald-300'
                            : 'text-red-800 dark:text-red-300'
                        }`}
                      >
                        <strong>{isRight ? 'Correct:' : 'Try again:'}</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {step === 'explore' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setStep('quiz')}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold transition-colors shadow-sm"
              >
                Take Quick Unlock Quiz
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('explore')}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Back to Interactive Model
              </button>

              <div className="flex items-center gap-2">
                {checked && !allCorrect && (
                  <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
                    {correctCount} / {lesson.quiz.length} right — fix any red question and re-check
                  </span>
                )}
                {!justUnlocked ? (
                  <button
                    type="button"
                    disabled={!allAnswered}
                    onClick={handleCheckQuiz}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 text-xs font-extrabold transition-colors disabled:opacity-40"
                  >
                    Check Answers &amp; Unlock
                  </button>
                ) : (
                  onLaunchMission && (
                    <button
                      type="button"
                      onClick={() => onLaunchMission(lesson.firstUnlockedLevelId)}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-colors"
                    >
                      Launch Mission {String(lesson.firstUnlockedLevelId).padStart(2, '0')}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
