import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Edit2, Sparkles, Check, Filter, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { QUESTION_TYPES, QuestionTypeId, getQuestionTypeConfig } from '../../data/questionTypes';

export interface Question {
  id: string;
  text: string;
  type: QuestionTypeId;
  options: string[];
  aiRefined: boolean;
  isScreening?: boolean;
  /** Legacy single-value field — kept for backward compat with existing missions */
  qualifyingAnswer?: string;
  /** Bug 1/2 fix: multi-qualifying support. Multiple options can be green. */
  qualifying_answers?: string[];
  /** Kept in sync with qualifying_answers for backend screening gate */
  screening_continue_on?: string[];
  hasPIIError?: boolean;
}

interface QuestionEngineProps {
  initialQuestion: string;
  questions?: Question[];
  onQuestionsChange?: (questions: Question[]) => void;
  onScreeningChange?: (isActive: boolean) => void;
}

// Only flag questions that are literally ASKING for personal data — not questions that mention these words in context
const PII_REGEX = /\b(your email|your phone|your address|your full name|your first name|your last name|your date of birth|your dob|your birthday|your ssn|your social security|your credit card|your debit card|your password|your passcode|your bank account|your passport|your driver.?s? license|your national id|enter your|provide your|submit your|share your (email|phone|address|name|number))\b/i;

export const QuestionEngine = ({ initialQuestion, questions: propQuestions, onQuestionsChange, onScreeningChange }: QuestionEngineProps) => {
  const [questions, setQuestions] = useState<Question[]>(
    propQuestions && propQuestions.length > 0 && propQuestions[0].text !== ''
      ? propQuestions
      : [
          {
            id: '1',
            text: initialQuestion || 'What is your primary question?',
            type: 'rating',
            options: [],
            aiRefined: false,
            isScreening: false,
            qualifyingAnswer: undefined,
          }
        ]
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [refiningId, setRefiningId] = useState<string | null>(null);

  useEffect(() => {
    if (propQuestions && propQuestions.length > 0 && propQuestions[0].text !== '') {
      setQuestions(propQuestions);
    }
  }, [propQuestions]);

  useEffect(() => {
    const updatedQuestions = questions.map(q => ({
      ...q,
      hasPIIError: PII_REGEX.test(q.text)
    }));

    const hasChanges = updatedQuestions.some((q, index) =>
      q.hasPIIError !== questions[index].hasPIIError
    );

    if (hasChanges) {
      setQuestions(updatedQuestions);
      onQuestionsChange?.(updatedQuestions);
    }
  }, [questions.map(q => q.text).join('|')]);

  const handleEdit = (question: Question) => {
    setEditingId(question.id);
    setEditText(question.text);
  };

  const handleSave = (id: string) => {
    const updated = questions.map(q =>
      q.id === id ? { ...q, text: editText } : q
    );
    setQuestions(updated);
    setEditingId(null);
    setEditText('');
    onQuestionsChange?.(updated);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleTypeChange = (id: string, type: QuestionTypeId) => {
    const updated = questions.map(q => {
      if (q.id === id) {
        const config = getQuestionTypeConfig(type);
        let options = q.options;

        if (config.autoOptions) {
          options = config.autoOptions;
        } else if (config.requiresOptions) {
          options = options.length >= config.minOptions! ? options : ['Option A', 'Option B'];
        } else {
          options = [];
        }

        return { ...q, type, options };
      }
      return q;
    });
    setQuestions(updated);
    onQuestionsChange?.(updated);
  };

  const handleScreeningToggle = (id: string) => {
    const updated = questions.map(q => {
      if (q.id === id) {
        const newIsScreening = !q.isScreening;
        const newType: QuestionTypeId = newIsScreening ? 'single' : q.type;
        const newOptions = newIsScreening && q.options.length === 0 ? ['Yes', 'No'] : q.options;
        return {
          ...q,
          isScreening: newIsScreening,
          type: newType,
          options: newOptions,
          qualifyingAnswer: newIsScreening ? newOptions[0] : undefined,
        };
      }
      return q;
    });
    setQuestions(updated);
    onQuestionsChange?.(updated);
    onScreeningChange?.(updated[0]?.isScreening || false);
  };

  const handleQualifyingAnswerChange = (id: string, answer: string) => {
    const updated = questions.map(q => {
      if (q.id === id) {
        return { ...q, qualifyingAnswer: answer };
      }
      return q;
    });
    setQuestions(updated);
    onQuestionsChange?.(updated);
  };

  const handleOptionChange = (questionId: string, optionIndex: number, value: string) => {
    const updated = questions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    });
    setQuestions(updated);
    onQuestionsChange?.(updated);
  };

  const handleAddOption = (questionId: string) => {
    const updated = questions.map(q => {
      if (q.id === questionId) {
        const config = getQuestionTypeConfig(q.type);
        if (q.options.length < config.maxOptions!) {
          return { ...q, options: [...q.options, `Option ${String.fromCharCode(65 + q.options.length)}`] };
        }
      }
      return q;
    });
    setQuestions(updated);
    onQuestionsChange?.(updated);
  };

  const handleRemoveOption = (questionId: string, optionIndex: number) => {
    const updated = questions.map(q => {
      if (q.id === questionId) {
        const config = getQuestionTypeConfig(q.type);
        if (q.options.length > config.minOptions!) {
          const newOptions = q.options.filter((_, idx) => idx !== optionIndex);
          return { ...q, options: newOptions };
        }
      }
      return q;
    });
    setQuestions(updated);
    onQuestionsChange?.(updated);
  };

  const handleAIRefine = (id: string) => {
    setRefiningId(id);
    setTimeout(() => {
      const updated = questions.map((q, index) => {
        if (q.id === id) {
          if (index === 0) {
            const currentText = q.text.toLowerCase();
            let refined = q.text;
            let refinedType: QuestionTypeId = q.type;
            let refinedOptions = q.options;

            if (!currentText.includes('do you') && !currentText.includes('are you')) {
              const keywords = ['own', 'have', 'use', 'buy', 'interested in'];
              const matchedKeyword = keywords.find(kw => currentText.includes(kw));

              if (matchedKeyword) {
                refined = `Do you ${matchedKeyword} ${currentText.replace(/.*?(own|have|use|buy|interested in)\s+/i, '')}?`;
              } else {
                refined = `Are you ${currentText.replace('?', '')}?`;
              }

              refinedType = 'single';
              refinedOptions = ['Yes', 'No'];
            }

            return {
              ...q,
              text: refined.trim(),
              type: refinedType,
              options: refinedOptions,
              aiRefined: true
            };
          } else {
            const refined = q.text.includes('validate') || q.text.includes('evaluate')
              ? q.text
              : q.type === 'rating'
              ? `On a scale of 1-5, how ${q.text.toLowerCase().replace(/^how\s+/i, '').replace('?', '')}?`
              : q.text;
            return { ...q, text: refined, aiRefined: true };
          }
        }
        return q;
      });
      setQuestions(updated);
      setRefiningId(null);
      onQuestionsChange?.(updated);
      toast.success('Question optimized by AI ✨');
    }, 1500);
  };

  const handleAdd = () => {
    if (questions.length >= 10) return;
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: 'New question...',
      type: 'rating',
      options: [],
      aiRefined: false,
    };
    const updated = [...questions, newQuestion];
    setQuestions(updated);
    setEditingId(newQuestion.id);
    setEditText(newQuestion.text);
    onQuestionsChange?.(updated);
    toast.success('Question added to draft');
  };

  const handleRemove = (id: string) => {
    if (questions.length <= 1) return;
    const updated = questions.filter(q => q.id !== id);
    setQuestions(updated);
    onQuestionsChange?.(updated);
    toast.success('Question removed');
  };

  return (
    <div className="bg-[#0f172a]/80 border border-gray-800 rounded-2xl p-4 sm:p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-800/40 gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white whitespace-nowrap">Question Engine</h2>
          <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 bg-gray-900/60 border border-gray-800/60 rounded-md flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-[#DFFF00]"></div>
            <span className="text-[10px] sm:text-[11px] font-medium text-gray-400 whitespace-nowrap">{questions.length} Questions</span>
          </div>
        </div>

        {questions.length < 10 && (
          <button
            onClick={handleAdd}
            className="group inline-flex items-center gap-1 sm:gap-1.5 bg-[#DFFF00] text-black text-[11px] sm:text-xs md:text-[13px] font-bold px-2 sm:px-2.5 md:px-3 py-1.5 rounded-lg hover:bg-[#E5FF40] transition-all active:scale-95 whitespace-nowrap flex-shrink-0"
          >
            <Plus size={12} className="sm:w-3.5 sm:h-3.5 md:w-[14px] md:h-[14px] group-hover:rotate-90 transition-transform" strokeWidth={2.5} />
            <span className="hidden sm:inline">Add Question</span>
            <span className="sm:hidden">Add</span>
            <span className="text-black/40 text-[10px] sm:text-[11px]">
              {questions.length >= 5 ? '+$20' : 'Free'}
            </span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 pb-48 space-y-3">
        <AnimatePresence>
          {questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className={`bg-gradient-to-br from-gray-900/40 to-gray-900/20 border rounded-xl p-4 sm:p-5 transition-all ${
                question.hasPIIError
                  ? 'border-red-500/50 ring-1 ring-red-500/30'
                  : 'border-gray-800/60 hover:border-gray-700/80 hover:bg-gray-900/50'
              }`}>
                {question.hasPIIError && (
                  <div className="mb-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-400 text-xs font-semibold mb-1">
                        Policy Violation: Personal Data Detected
                      </p>
                      <p className="text-red-300/70 text-[11px] leading-relaxed">
                        You cannot ask for PII (Email, Phone, Names, Addresses, SSN, etc.). This question will be rejected.
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-800/80 border border-gray-700/60">
                      <span className="text-xs font-bold text-gray-300">Q{index + 1}</span>
                    </div>
                    {question.aiRefined && (
                      <div className="flex items-center gap-1 text-[10px] bg-[#DFFF00]/10 text-[#DFFF00] px-2 py-1 rounded-md font-semibold border border-[#DFFF00]/20">
                        <Sparkles className="w-3 h-3" />
                        AI Refined
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {questions.length > 1 && (
                      <button
                        onClick={() => handleRemove(question.id)}
                        className="p-1.5 bg-red-500/10 border border-red-500/20 rounded-md hover:bg-red-500/20 transition-colors"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    )}
                  </div>
                </div>

                {editingId === question.id ? (
                  <div className="space-y-3 mb-4">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      placeholder={index === 0 ? 'Example: Do you own a dog?' : 'Enter your question...'}
                      className="w-full bg-black/50 border border-gray-700/60 rounded-lg p-3 text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-[#DFFF00]/50 focus:border-[#DFFF00]/50 outline-none resize-none"
                      rows={2}
                      autoFocus
                    />
                    {index === 0 && (
                      <p className="text-[11px] text-blue-400/70 leading-relaxed">
                        Tip: Start with a qualifying question to screen your audience
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(question.id)}
                        className="p-2 bg-[#DFFF00] text-black rounded-lg hover:bg-[#E5FF40] transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-3 py-2 bg-gray-800/60 border border-gray-700/60 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors text-xs font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[15px] text-gray-100 font-medium leading-relaxed flex-1">
                        {question.text}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEdit(question)}
                          className="p-1.5 bg-gray-800/60 border border-gray-700/60 rounded-md hover:bg-gray-800 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-gray-300" />
                        </button>
                        <button
                          onClick={() => handleAIRefine(question.id)}
                          disabled={refiningId === question.id}
                          className="flex items-center gap-1 px-2 py-1.5 bg-[#DFFF00]/10 border border-[#DFFF00]/20 text-[#DFFF00] rounded-md hover:bg-[#DFFF00]/15 transition-colors text-[11px] font-semibold disabled:opacity-50"
                          title="AI Refine"
                        >
                          <Sparkles className="w-3 h-3" />
                          {refiningId === question.id ? 'Refining...' : 'Refine'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {index === 0 && (
                    <div className="bg-[#DFFF00]/5 border border-[#DFFF00]/20 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Filter className="w-3.5 h-3.5 text-[#DFFF00]" />
                          <label className="text-[13px] font-semibold text-[#DFFF00]">Use as Screening Question?</label>
                        </div>
                        <button
                          onClick={() => handleScreeningToggle(question.id)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            question.isScreening ? 'bg-[#DFFF00]' : 'bg-gray-700/60'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full transition-transform ${
                              question.isScreening ? 'bg-black translate-x-5' : 'bg-white translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-[11px] text-[#DFFF00]/70 leading-relaxed">
                        {question.isScreening
                          ? "Only respondents who select the qualifying answer will take the survey."
                          : "Filter your audience by asking a qualifying question first."}
                      </p>
                      {question.isScreening && question.options.length > 0 && (
                        <div className="mt-3">
                          <label className="block text-[11px] text-[#DFFF00] font-semibold mb-1.5">
                            Select Qualifying Answer
                          </label>
                          <select
                            value={question.qualifyingAnswer || question.options[0]}
                            onChange={(e) => handleQualifyingAnswerChange(question.id, e.target.value)}
                            className="w-full bg-black/50 border border-gray-700/60 rounded-lg p-2 text-xs text-white focus:ring-2 focus:ring-[#DFFF00]/50 focus:border-[#DFFF00]/50 outline-none"
                          >
                            {question.options.map((option, idx) => (
                              <option key={idx} value={option}>
                                {option} (Pass)
                              </option>
                            ))}
                          </select>
                          <p className="text-[10px] text-[#DFFF00]/60 mt-1.5">
                            Respondents must select "{question.qualifyingAnswer || question.options[0]}" to continue
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2 block">
                      Question Type
                    </label>
                    <div className="relative">
                      <select
                        value={question.type}
                        onChange={(e) => handleTypeChange(question.id, e.target.value as QuestionTypeId)}
                        className="w-full bg-black/50 border border-gray-700/60 rounded-lg p-2.5 pr-10 text-sm text-white focus:ring-2 focus:ring-[#DFFF00]/50 focus:border-[#DFFF00]/50 outline-none cursor-pointer appearance-none"
                        disabled={question.isScreening}
                      >
                        {Object.values(QUESTION_TYPES).map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.label} → {type.visual}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {(() => {
                          const Icon = getQuestionTypeConfig(question.type).icon;
                          return <Icon className="w-4 h-4 text-gray-400" />;
                        })()}
                      </div>
                    </div>
                    {question.isScreening ? (
                      <p className="text-[11px] text-gray-500 mt-1.5">Screening questions must be Single Choice</p>
                    ) : (
                      <p className="text-[11px] text-gray-500 mt-1.5">
                        {getQuestionTypeConfig(question.type).description}
                      </p>
                    )}
                  </div>

                  {getQuestionTypeConfig(question.type).requiresOptions && (
                    <div>
                      <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2 block">
                        Answer Options
                      </label>
                      <div className="space-y-2">
                        {question.options.map((option, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-[#DFFF00] text-sm font-mono flex-shrink-0 flex items-center justify-center">&gt;_</span>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionChange(question.id, idx, e.target.value)}
                              className="flex-1 bg-black/50 border border-gray-700/60 rounded-lg p-2 text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-[#DFFF00]/50 focus:border-[#DFFF00]/50 outline-none"
                              placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                            />
                            {question.options.length > getQuestionTypeConfig(question.type).minOptions! && (
                              <button
                                onClick={() => handleRemoveOption(question.id, idx)}
                                className="p-2 bg-red-500/10 border border-red-500/20 rounded-md hover:bg-red-500/20 transition-colors"
                              >
                                <X className="w-3.5 h-3.5 text-red-400" />
                              </button>
                            )}
                          </div>
                        ))}
                        {question.options.length < getQuestionTypeConfig(question.type).maxOptions! && (
                          <button
                            onClick={() => handleAddOption(question.id)}
                            className="w-full py-2 bg-gray-800/40 border border-gray-700/60 rounded-lg text-xs text-[#DFFF00] hover:bg-gray-800/60 hover:border-[#DFFF00]/40 transition-colors font-semibold"
                          >
                            + Add Option
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {getQuestionTypeConfig(question.type).autoOptions && (
                    <div>
                      <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2 block">
                        Answer Scale (Auto-Generated)
                      </label>
                      <div className="bg-black/30 border border-gray-800/60 rounded-lg p-3">
                        <div className="flex flex-wrap gap-2">
                          {getQuestionTypeConfig(question.type).autoOptions!.map((option, idx) => (
                            <div
                              key={idx}
                              className="px-2.5 py-1 bg-gray-800/60 border border-gray-700/60 rounded-md text-[11px] text-gray-300"
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Bottom Add Trigger */}
        {questions.length < 10 && (
          <button
            onClick={handleAdd}
            className="w-full py-5 border-2 border-dashed border-gray-800/60 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-[#DFFF00]/40 hover:text-[#DFFF00] hover:bg-[#DFFF00]/5 transition-all group"
          >
            <Plus className="w-6 h-6 mb-1.5 group-hover:rotate-90 transition-transform" />
            <span className="font-semibold text-xs">Add New Question</span>
            <span className="text-[10px] opacity-40 mt-0.5">
              {questions.length >= 5 ? '+$20 to Mission Cost' : 'Free'}
            </span>
          </button>
        )}

        {questions.length < 10 && (
          <p className="text-xs text-white/40 text-center">
            {questions.length < 5
              ? `${5 - questions.length} free question${5 - questions.length !== 1 ? 's' : ''} remaining`
              : `${10 - questions.length} more question${10 - questions.length !== 1 ? 's' : ''} available (+$20 each)`}
          </p>
        )}
      </div>
    </div>
  );
};
