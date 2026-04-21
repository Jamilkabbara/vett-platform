import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Pencil, Plus, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';

import type { Question } from './QuestionEngine';
import { refineQuestion } from '../../services/aiService';

/**
 * MissionControlQuestions — Commit 6 of the redesign.
 *
 * Renders the question list panel inside Mission Control.  Visually modelled
 * on .design-reference/prototype.html `#q-list` (lines 1370-1420-ish): each
 * card shows a Q-number pill, the question text, and a row of actions
 * (Edit, ✦ Refine, ×).  Unlike the prototype, this is a React-controlled
 * component — the parent owns the canonical `Question[]` and gets every
 * change via `onChange`, so pricing (Commit 8) and persistence stay in
 * one place.
 *
 * ── Behaviour contract ──────────────────────────────────────────────
 *   - **Edit**: click ✎ → textarea replaces the static text.  Save on
 *     blur (per spec) and on explicit Save.  Escape cancels the edit
 *     without writing back.
 *   - **Refine**: ✦ button POSTs to /api/ai/refine-description via
 *     `refineQuestion`.  A single inflightRef keeps double-clicks /
 *     double-fires from stacking.  Failures surface as a toast; we do
 *     NOT replace the question text when the backend fails — the local
 *     heuristic inside `refineQuestion` still returns a usable result
 *     so the user always sees progress.
 *   - **Add**: appends `{ id: q<N>, text: '', type: 'rating', ... }`
 *     and drops the user straight into edit-mode on it.
 *   - **Remove**: shows an inline confirm popover ("Remove this
 *     question?  This can't be undone.") — no modal, no route change.
 *
 * ── Mobile (verified at 375px) ──────────────────────────────────────
 *   - Card padding tightens to 13px x-padding; the action row wraps
 *     below the body text when there's not enough room for both.
 *   - Edit textarea stretches full width; confirm popover anchors to
 *     the × button so it never hangs off the right edge.
 */

interface MissionControlQuestionsProps {
  /** Canonical list owned by the parent (DashboardPage). */
  questions: Question[];
  /** Called whenever the user edits, refines, adds, or removes. */
  onChange: (next: Question[]) => void;
  /** Mission goal id — threaded through to the refine endpoint so
   *  the AI can tune suggestions to the mission type. */
  goalId: string | null;
  /** Short brief / context shared with the refine endpoint. */
  context?: string;
  /** Set true while the parent is mid-save to disable destructive actions. */
  persisting?: boolean;
}

/** Human number ("Q1", "Q2", …) derived from array position, not id,
 *  so adds / removes always renumber cleanly. */
const qLabel = (index: number) => `Q${index + 1}`;

/**
 * Phase 5 — answer option floor & ceiling.
 * - Below 2 the question is degenerate (only one answer = not a choice).
 * - Above 6 respondents lose focus and the AI struggles to summarise.
 * Kept as module-level constants so tests and adjacent components (the
 * AI summariser, the payment breakdown) can import the same values and
 * never drift.
 */
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 6;

/** Types that carry answer options. `rating`/`opinion`/`text` don't. */
const HAS_OPTIONS = new Set(['single', 'multi']);

function generateId(existing: Question[]): string {
  // q<N> where N = max existing numeric suffix + 1.  Keeps ids stable
  // across refines but predictable when adding.
  let max = 0;
  for (const q of existing) {
    const m = /^q(\d+)$/i.exec(q.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `q${max + 1}`;
}

export const MissionControlQuestions = ({
  questions,
  onChange,
  goalId,
  context,
  persisting = false,
}: MissionControlQuestionsProps) => {
  // ── Edit state ────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const editTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // ── Refine state ──────────────────────────────────────────────────
  const [refiningId, setRefiningId] = useState<string | null>(null);
  /** Double-fire guard — same pattern as MissionSetupPage's handleGenerate. */
  const refineInflight = useRef(false);

  // ── Remove confirm state (one at a time) ─────────────────────────
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  // ── Phase 6 — Q1 auto-screening ──────────────────────────────────
  // Invariant: index 0 is ALWAYS the Screening question; everything
  // else is ALWAYS non-screening. We enforce this by normalising every
  // list before it leaves the component. Deleting Q1 auto-promotes Q2
  // (which was already at index 1 → becomes index 0 → gets the flag).
  // Emitting through `emit()` keeps the DB state eventually consistent
  // with the UI without requiring a separate save path.
  const emit = useCallback(
    (next: Question[]) => {
      onChange(
        next.map((q, i) => ({
          ...q,
          isScreening: i === 0,
        })),
      );
    },
    [onChange],
  );

  // One-shot normaliser: if the hydrated list from DB isn't already in
  // the invariant shape, fix it on first render. Guarded by a ref so
  // parent re-renders with a re-normalised list don't trigger an
  // infinite save loop.
  const didNormalizeRef = useRef(false);
  useEffect(() => {
    if (didNormalizeRef.current) return;
    if (questions.length === 0) return;
    const wrong = questions.some(
      (q, i) => (i === 0) !== !!q.isScreening,
    );
    if (wrong) emit(questions);
    didNormalizeRef.current = true;
  }, [questions, emit]);

  // ── Option edit state ────────────────────────────────────────────
  // Phase 5: click an answer chip to rename it inline. Only one chip
  // across the whole list can be in edit mode at a time — a second
  // click clobbers the first, matching the question-text editor.
  const [optionEdit, setOptionEdit] = useState<
    { qId: string; idx: number } | null
  >(null);
  const [optionEditText, setOptionEditText] = useState('');
  const optionInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!optionEdit) return;
    const t = window.setTimeout(() => {
      optionInputRef.current?.focus();
      optionInputRef.current?.select();
    }, 30);
    return () => window.clearTimeout(t);
  }, [optionEdit]);

  // When editingId changes to a real id, focus the textarea after the
  // motion frame settles so the cursor lands correctly on mobile.
  useEffect(() => {
    if (!editingId) return;
    const timer = window.setTimeout(() => {
      editTextareaRef.current?.focus();
      editTextareaRef.current?.setSelectionRange(
        editText.length,
        editText.length,
      );
    }, 40);
    return () => window.clearTimeout(timer);
  }, [editingId, editText.length]);

  // ── Handlers ──────────────────────────────────────────────────────

  const handleStartEdit = useCallback(
    (q: Question) => {
      setEditingId(q.id);
      setEditText(q.text);
      setConfirmRemoveId(null);
    },
    [],
  );

  const commitEdit = useCallback(
    (id: string, next: string) => {
      const trimmed = next.trim();
      const existing = questions.find((q) => q.id === id);
      if (!trimmed) {
        // Empty text means "cancel" rather than writing an empty question.
        // If the card itself was previously empty (i.e., just added via +
        // Add question and never saved), drop it so the list doesn't end
        // up littered with "Empty question" placeholders.
        if (existing && !existing.text.trim()) {
          emit(questions.filter((q) => q.id !== id));
        }
        setEditingId(null);
        setEditText('');
        return;
      }
      const nextList = questions.map((q) =>
        q.id === id ? { ...q, text: trimmed } : q,
      );
      emit(nextList);
      setEditingId(null);
      setEditText('');
    },
    [questions, emit],
  );

  const handleCancelEdit = useCallback(() => {
    // Mirror commitEdit's empty-text handling so cancelling a brand-new
    // Add-question card removes it instead of leaving a blank placeholder.
    if (editingId) {
      const existing = questions.find((q) => q.id === editingId);
      if (existing && !existing.text.trim()) {
        emit(questions.filter((q) => q.id !== editingId));
      }
    }
    setEditingId(null);
    setEditText('');
  }, [editingId, questions, emit]);

  const handleRefine = useCallback(
    async (q: Question) => {
      if (refineInflight.current) return;
      if (refiningId) return;
      // Phase 4 — idempotency. The refine heuristic appends "— and why?" as
      // its signature suffix; re-refining then just stacks the suffix and
      // confuses respondents. If we detect the suffix already, short-circuit
      // with a non-destructive toast.
      if (
        q.text
          .trim()
          .toLowerCase()
          .endsWith('— and why?')
      ) {
        toast('Question already refined', { icon: '✨' });
        return;
      }
      refineInflight.current = true;
      setRefiningId(q.id);

      try {
        const result = await refineQuestion(q, goalId, context);
        const nextList = questions.map((existing) =>
          existing.id === q.id
            ? {
                ...existing,
                text: result.text,
                type: result.type ?? existing.type,
                options:
                  result.options && result.options.length > 0
                    ? result.options
                    : existing.options,
                aiRefined: true,
              }
            : existing,
        );
        emit(nextList);
      } catch (err) {
        console.error('[MissionControlQuestions] refine failed', err);
        toast.error("Couldn't refine that question — try again in a sec.");
      } finally {
        refineInflight.current = false;
        setRefiningId(null);
      }
    },
    [questions, emit, goalId, context, refiningId],
  );

  // ── Option handlers (Phase 5) ────────────────────────────────────
  const commitOptionEdit = useCallback(
    (qId: string, idx: number, next: string) => {
      const trimmed = next.trim();
      const target = questions.find((q) => q.id === qId);
      if (!target) {
        setOptionEdit(null);
        setOptionEditText('');
        return;
      }
      // Empty = cancel. Don't write an empty option.
      if (!trimmed) {
        setOptionEdit(null);
        setOptionEditText('');
        return;
      }
      // Dedupe against existing options (case-insensitive) — silently
      // keep the existing value if the user typed a duplicate.
      const existsAt = target.options.findIndex(
        (o, i) => i !== idx && o.trim().toLowerCase() === trimmed.toLowerCase(),
      );
      if (existsAt !== -1) {
        setOptionEdit(null);
        setOptionEditText('');
        toast('That option already exists', { icon: '↩️' });
        return;
      }
      const nextOptions = target.options.map((o, i) => (i === idx ? trimmed : o));
      emit(
        questions.map((q) =>
          q.id === qId ? { ...q, options: nextOptions } : q,
        ),
      );
      setOptionEdit(null);
      setOptionEditText('');
    },
    [questions, emit],
  );

  const handleAddOption = useCallback(
    (qId: string) => {
      const target = questions.find((q) => q.id === qId);
      if (!target) return;
      if (target.options.length >= MAX_OPTIONS) {
        toast(`Maximum ${MAX_OPTIONS} options per question`, { icon: '🛑' });
        return;
      }
      const nextOptions = [...target.options, 'New option'];
      emit(
        questions.map((q) =>
          q.id === qId ? { ...q, options: nextOptions } : q,
        ),
      );
      // Drop the user straight into editing the new chip.
      setOptionEdit({ qId, idx: nextOptions.length - 1 });
      setOptionEditText('New option');
    },
    [questions, emit],
  );

  const handleRemoveOption = useCallback(
    (qId: string, idx: number) => {
      const target = questions.find((q) => q.id === qId);
      if (!target) return;
      if (target.options.length <= MIN_OPTIONS) {
        toast(`At least ${MIN_OPTIONS} options required`, { icon: '🛑' });
        return;
      }
      const nextOptions = target.options.filter((_, i) => i !== idx);
      emit(
        questions.map((q) =>
          q.id === qId ? { ...q, options: nextOptions } : q,
        ),
      );
      // If we were editing this chip, drop the editor.
      if (
        optionEdit &&
        optionEdit.qId === qId &&
        optionEdit.idx === idx
      ) {
        setOptionEdit(null);
        setOptionEditText('');
      }
    },
    [questions, emit, optionEdit],
  );

  const handleAdd = useCallback(() => {
    const id = generateId(questions);
    const nextList: Question[] = [
      ...questions,
      {
        id,
        text: '',
        type: 'rating',
        options: [],
        aiRefined: false,
        isScreening: false, // emit() will flip this if it lands at index 0
        qualifyingAnswer: undefined,
        hasPIIError: false,
      },
    ];
    emit(nextList);
    // Drop the user into edit mode on the new card.
    setEditingId(id);
    setEditText('');
  }, [questions, emit]);

  const handleRequestRemove = useCallback((id: string) => {
    setConfirmRemoveId(id);
  }, []);

  const handleCancelRemove = useCallback(() => {
    setConfirmRemoveId(null);
  }, []);

  const handleConfirmRemove = useCallback(
    (id: string) => {
      // emit() auto-promotes the new index-0 question to Screening if
      // Q1 was the one being deleted — that's the Phase 6 guarantee.
      const nextList = questions.filter((q) => q.id !== id);
      emit(nextList);
      setConfirmRemoveId(null);
      if (editingId === id) {
        setEditingId(null);
        setEditText('');
      }
    },
    [questions, emit, editingId],
  );

  // ── Render ────────────────────────────────────────────────────────
  const count = questions.length;

  return (
    <div
      className={[
        'bg-bg2 border border-b1 rounded-xl',
        'p-4 md:p-5',
      ].join(' ')}
      data-testid="mc-questions"
    >
      {/* Header — flex-wrap keeps it readable at 375px */}
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="font-display font-black text-[13px] md:text-[14px] text-white whitespace-nowrap">
            Question Engine
          </h2>
          <span
            className={[
              'inline-flex items-center gap-1 rounded-pill',
              'bg-lime/10 text-lime border border-lime/20',
              'px-2 py-0.5 whitespace-nowrap',
              'font-display font-bold text-[9px] uppercase tracking-[0.1em]',
            ].join(' ')}
          >
            ● {count} {count === 1 ? 'Q' : 'Qs'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={persisting}
          className={[
            'inline-flex items-center gap-1.5 rounded-lg whitespace-nowrap',
            'border border-lime/30 bg-lime/10 hover:bg-lime/15',
            'px-2.5 py-1.5',
            'font-display font-bold text-[11px] text-lime',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            'transition-colors',
          ].join(' ')}
        >
          <Plus className="w-3.5 h-3.5" aria-hidden />
          <span>Add question</span>
        </button>
      </div>

      {/* List */}
      {count === 0 ? (
        <EmptyState onAdd={handleAdd} />
      ) : (
        <ul className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {questions.map((q, i) => (
              <motion.li
                key={q.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4, height: 0, marginTop: 0 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className={[
                  'bg-bg3 border border-b1 rounded-lg',
                  'px-3.5 py-3',
                  'flex flex-col gap-2',
                ].join(' ')}
              >
                {/* Row 1: number + ai tag + × */}
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-[10px] text-t3 tracking-[0.08em]">
                    {qLabel(i)}
                  </span>
                  {q.aiRefined && (
                    <span
                      className={[
                        'inline-flex items-center gap-1 rounded-xs',
                        'bg-lime/10 text-lime border border-lime/20',
                        'px-1.5 py-0.5',
                        'font-display font-bold text-[8px] uppercase tracking-[0.1em]',
                      ].join(' ')}
                      aria-label="AI refined"
                    >
                      <Sparkles className="w-2.5 h-2.5" aria-hidden />
                      AI Refined
                    </span>
                  )}
                  {q.isScreening && (
                    <span
                      className={[
                        'inline-flex items-center rounded-xs',
                        'bg-bg4 text-t3 border border-b2',
                        'px-1.5 py-0.5',
                        'font-display font-bold text-[8px] uppercase tracking-[0.1em]',
                      ].join(' ')}
                    >
                      Screening
                    </span>
                  )}

                  <div className="flex-1" />

                  {/* Remove button + confirm popover */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => handleRequestRemove(q.id)}
                      disabled={persisting || refiningId === q.id}
                      aria-label={`Remove ${qLabel(i)}`}
                      className={[
                        'w-6 h-6 rounded-md',
                        'inline-flex items-center justify-center',
                        'text-t3 hover:text-red hover:bg-red/10',
                        'border border-transparent hover:border-red/20',
                        'transition-colors',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                      ].join(' ')}
                    >
                      <X className="w-3.5 h-3.5" aria-hidden />
                    </button>
                    <AnimatePresence>
                      {confirmRemoveId === q.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.96 }}
                          transition={{ duration: 0.14 }}
                          className={[
                            'absolute right-0 top-full mt-1.5 z-10',
                            'w-[232px] max-w-[calc(100vw-32px)]',
                            'bg-bg4 border border-b2 rounded-lg',
                            'shadow-[0_6px_24px_rgba(0,0,0,0.35)]',
                            'p-3',
                          ].join(' ')}
                          role="dialog"
                          aria-label="Confirm remove"
                        >
                          <p className="font-body text-[12px] text-t1 leading-snug mb-2.5">
                            Remove this question? This can't be undone.
                          </p>
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={handleCancelRemove}
                              className={[
                                'rounded-md px-2.5 py-1',
                                'font-display font-bold text-[11px]',
                                'bg-bg3 text-t2 border border-b2',
                                'hover:border-t3 transition-colors',
                              ].join(' ')}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConfirmRemove(q.id)}
                              className={[
                                'rounded-md px-2.5 py-1',
                                'font-display font-bold text-[11px]',
                                'bg-red/15 text-red border border-red/30',
                                'hover:bg-red/25 transition-colors',
                              ].join(' ')}
                            >
                              Remove
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Row 2: text or editor */}
                {editingId === q.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      ref={editTextareaRef}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={() => commitEdit(q.id, editText)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          handleCancelEdit();
                        }
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          commitEdit(q.id, editText);
                        }
                      }}
                      rows={3}
                      placeholder="What do you want to ask?"
                      className={[
                        'w-full rounded-md',
                        'bg-bg4 border border-b2 focus:border-lime',
                        'px-3 py-2',
                        'font-body text-[13px] text-t1 leading-[1.45]',
                        'placeholder:text-t4',
                        'outline-none resize-none',
                      ].join(' ')}
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          // Prevent blur before click fires.
                          e.preventDefault();
                        }}
                        onClick={() => commitEdit(q.id, editText)}
                        className={[
                          'rounded-md px-2.5 py-1',
                          'font-display font-bold text-[11px] text-black',
                          'bg-lime hover:bg-lime/90 transition-colors',
                        ].join(' ')}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleCancelEdit}
                        className={[
                          'rounded-md px-2.5 py-1',
                          'font-display font-bold text-[11px]',
                          'bg-bg3 text-t2 border border-b2',
                          'hover:border-t3 transition-colors',
                        ].join(' ')}
                      >
                        Cancel
                      </button>
                      <span className="ml-auto font-body text-[10px] text-t4">
                        Saves on blur · ⌘↵ to save · Esc to cancel
                      </span>
                    </div>
                  </div>
                ) : (
                  <p
                    className={[
                      'font-body text-[13px] md:text-[14px] leading-[1.45]',
                      q.text.trim()
                        ? 'text-t1'
                        : 'text-t4 italic',
                      q.hasPIIError ? 'text-red' : '',
                    ].join(' ')}
                  >
                    {q.text.trim() || 'Empty question — click Edit to add text.'}
                  </p>
                )}

                {/* Row 3: actions — hidden while editing */}
                {editingId !== q.id && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(q)}
                      disabled={persisting || refiningId === q.id}
                      className={[
                        'inline-flex items-center gap-1 rounded-md',
                        'bg-bg4 border border-b2 hover:border-t3',
                        'px-2 py-1',
                        'font-display font-bold text-[11px] text-t2',
                        'disabled:opacity-60 disabled:cursor-not-allowed',
                        'transition-colors',
                      ].join(' ')}
                    >
                      <Pencil className="w-3 h-3" aria-hidden />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRefine(q)}
                      disabled={
                        persisting ||
                        refiningId === q.id ||
                        (refiningId !== null && refiningId !== q.id) ||
                        !q.text.trim()
                      }
                      className={[
                        'inline-flex items-center gap-1 rounded-md',
                        'bg-lime/10 border border-lime/25 hover:bg-lime/15',
                        'px-2 py-1',
                        'font-display font-bold text-[11px] text-lime',
                        'disabled:opacity-60 disabled:cursor-not-allowed',
                        'transition-colors',
                      ].join(' ')}
                      aria-busy={refiningId === q.id}
                    >
                      {refiningId === q.id ? (
                        <>
                          <Loader2
                            className="w-3 h-3 animate-spin"
                            aria-hidden
                          />
                          Refining…
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" aria-hidden />
                          Refine
                        </>
                      )}
                    </button>

                  </div>
                )}

                {/* Row 4: editable options (Phase 5) — shown for
                    single/multi choice questions only. Click a chip to
                    edit inline, × to remove (blocked at MIN_OPTIONS),
                    + Add to extend (blocked at MAX_OPTIONS). Hidden
                    while the question-text editor is open so the user
                    isn't juggling two inputs at once. */}
                {editingId !== q.id && HAS_OPTIONS.has(q.type) && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {q.options.map((opt, idx) => {
                      const editing =
                        optionEdit?.qId === q.id && optionEdit.idx === idx;
                      const canRemove = q.options.length > MIN_OPTIONS;
                      return (
                        <div
                          key={`${q.id}-opt-${idx}`}
                          className={[
                            'inline-flex items-center rounded-md',
                            editing
                              ? 'bg-bg4 border border-lime'
                              : 'bg-bg4 border border-b2 hover:border-t3',
                            'transition-colors',
                          ].join(' ')}
                        >
                          {editing ? (
                            <input
                              ref={optionInputRef}
                              value={optionEditText}
                              onChange={(e) =>
                                setOptionEditText(e.target.value)
                              }
                              onBlur={() =>
                                commitOptionEdit(q.id, idx, optionEditText)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  commitOptionEdit(q.id, idx, optionEditText);
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  setOptionEdit(null);
                                  setOptionEditText('');
                                }
                              }}
                              maxLength={48}
                              size={Math.max(4, optionEditText.length)}
                              className={[
                                'bg-transparent outline-none',
                                'px-2 py-1',
                                'font-body text-[11px] text-t1',
                              ].join(' ')}
                              aria-label={`Edit option ${idx + 1}`}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setOptionEdit({ qId: q.id, idx });
                                setOptionEditText(opt);
                              }}
                              disabled={persisting || refiningId === q.id}
                              className={[
                                'px-2 py-1',
                                'font-body text-[11px] text-t1',
                                'disabled:opacity-60 disabled:cursor-not-allowed',
                              ].join(' ')}
                              aria-label={`Edit option ${idx + 1}: ${opt}`}
                            >
                              {opt || 'Empty'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(q.id, idx)}
                            disabled={
                              !canRemove || persisting || refiningId === q.id
                            }
                            title={
                              canRemove
                                ? 'Remove option'
                                : `At least ${MIN_OPTIONS} options required`
                            }
                            aria-label={`Remove option ${idx + 1}`}
                            className={[
                              'w-5 h-5 rounded-sm mr-0.5',
                              'inline-flex items-center justify-center',
                              'text-t4 hover:text-red hover:bg-red/10',
                              'transition-colors',
                              'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-t4',
                            ].join(' ')}
                          >
                            <X className="w-3 h-3" aria-hidden />
                          </button>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => handleAddOption(q.id)}
                      disabled={
                        q.options.length >= MAX_OPTIONS ||
                        persisting ||
                        refiningId === q.id
                      }
                      title={
                        q.options.length >= MAX_OPTIONS
                          ? `Maximum ${MAX_OPTIONS} options`
                          : 'Add option'
                      }
                      className={[
                        'inline-flex items-center gap-1 rounded-md',
                        'border border-dashed border-b2 hover:border-lime hover:text-lime',
                        'px-2 py-1',
                        'font-display font-bold text-[11px] text-t3',
                        'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:border-b2 disabled:hover:text-t3',
                        'transition-colors',
                      ].join(' ')}
                    >
                      <Plus className="w-3 h-3" aria-hidden />
                      Add option
                    </button>
                    <span className="ml-auto font-body text-[10px] text-t4">
                      {q.options.length}/{MAX_OPTIONS}
                    </span>
                  </div>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
};

/** Empty state shown when the mission row arrived with zero questions —
 *  rare once Commit 4 is wired, but possible if the AI generation
 *  silently returned an empty array.  Give the user a way forward. */
const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <div
    className={[
      'rounded-lg border border-dashed border-b1',
      'px-4 py-8 text-center',
      'flex flex-col items-center gap-3',
    ].join(' ')}
  >
    <p className="font-body text-[13px] text-t3 max-w-[280px]">
      No questions yet. The AI usually drafts 5 — if you're seeing this,
      something broke on the way here.
    </p>
    <button
      type="button"
      onClick={onAdd}
      className={[
        'inline-flex items-center gap-1.5 rounded-lg',
        'bg-lime text-black',
        'px-3 py-2',
        'font-display font-bold text-[12px]',
        'hover:bg-lime/90 transition-colors shadow-lime-soft',
      ].join(' ')}
    >
      <Plus className="w-3.5 h-3.5" aria-hidden />
      Add your first question
    </button>
  </div>
);

export default MissionControlQuestions;
