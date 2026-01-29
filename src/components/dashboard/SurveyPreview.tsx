import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question } from './QuestionEngine';
import { Smartphone, Battery, Wifi, Signal, Sparkles, ChevronRight, Star, Check } from 'lucide-react';
import { getQuestionTypeConfig } from '../../data/questionTypes';

interface SurveyPreviewProps {
  questions: Question[];
  missionObjective: string;
}

export const SurveyPreview = ({ questions, missionObjective }: SurveyPreviewProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[] | number | null>(null);
  const [starHover, setStarHover] = useState<number | null>(null);

  const cleanPreviewText = missionObjective
    .replace(/validate\s+product:?\s*/gi, '')
    .replace(/^(validate|verify|check)\s+(product|idea|concept)?:?\s*/i, '')
    .replace(/^i want to validate:?\s*/i, '')
    .replace(/^:\s*/, '')
    .trim();

  const currentQuestion = questions[currentStep];
  const totalQuestions = questions.length;
  const progress = ((currentStep + 1) / totalQuestions) * 100;

  const handleNext = () => {
    if (currentStep < totalQuestions - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedAnswer(null);
    }
  };

  const handleSingleChoice = (option: string) => {
    setSelectedAnswer(option);
  };

  const handleMultipleChoice = (option: string) => {
    const current = (selectedAnswer as string[]) || [];
    if (current.includes(option)) {
      setSelectedAnswer(current.filter(o => o !== option));
    } else {
      setSelectedAnswer([...current, option]);
    }
  };

  const handleRating = (value: number) => {
    setSelectedAnswer(value);
  };

  const handleStarRating = (value: number) => {
    setSelectedAnswer(value);
  };

  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    const config = getQuestionTypeConfig(currentQuestion.type);

    switch (currentQuestion.type) {
      case 'text':
      case 'short_text':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <input
              type="text"
              placeholder="Type your answer..."
              value={(selectedAnswer as string) || ''}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              className="w-full bg-gray-900/50 border-2 border-gray-700/60 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ccff00] transition-all"
            />
          </motion.div>
        );

      case 'long_text':
      case 'opinion':
      case 'open_text':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <textarea
              placeholder="Type your answer..."
              value={(selectedAnswer as string) || ''}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              rows={4}
              className="w-full bg-gray-900/50 border-2 border-gray-700/60 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ccff00] transition-all resize-none"
            />
          </motion.div>
        );

      case 'single':
      case 'single_choice':
        return (
          <div className="space-y-2.5">
            {(currentQuestion.options && currentQuestion.options.length > 0
              ? currentQuestion.options
              : ['Yes', 'No']
            ).map((option, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                onClick={() => handleSingleChoice(option)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-3 ${
                  selectedAnswer === option
                    ? 'bg-[#ccff00]/10 border-[#ccff00] text-[#ccff00]'
                    : 'bg-gray-900/50 border-gray-700/60 text-gray-300 hover:border-gray-600'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedAnswer === option
                    ? 'border-[#ccff00] bg-[#ccff00]'
                    : 'border-gray-600'
                }`}>
                  {selectedAnswer === option && (
                    <div className="w-2 h-2 rounded-full bg-black"></div>
                  )}
                </div>
                <span>{option}</span>
              </motion.button>
            ))}
          </div>
        );

      case 'multi':
      case 'multiple_choice':
        return (
          <div className="space-y-2.5">
            {(currentQuestion.options && currentQuestion.options.length > 0
              ? currentQuestion.options
              : ['Option 1', 'Option 2']
            ).map((option, idx) => {
              const isSelected = (selectedAnswer as string[] || []).includes(option);
              return (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  onClick={() => handleMultipleChoice(option)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-[#ccff00]/10 border-[#ccff00] text-[#ccff00]'
                      : 'bg-gray-900/50 border-gray-700/60 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-[#ccff00] bg-[#ccff00]'
                      : 'border-gray-600'
                  }`}>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />
                    )}
                  </div>
                  <span>{option}</span>
                </motion.button>
              );
            })}
          </div>
        );

      case 'rating':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-2.5 justify-between"
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => handleRating(num)}
                className={`flex-1 aspect-square rounded-xl border-2 font-bold text-base transition-all ${
                  selectedAnswer === num
                    ? 'bg-[#ccff00] border-[#ccff00] text-black scale-110'
                    : 'bg-gray-900/50 border-gray-700/60 text-gray-400 hover:border-gray-600 hover:scale-105'
                }`}
              >
                {num}
              </button>
            ))}
          </motion.div>
        );

      case 'star':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-3 justify-center"
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => handleStarRating(num)}
                onMouseEnter={() => setStarHover(num)}
                onMouseLeave={() => setStarHover(null)}
                className="transition-transform hover:scale-125"
              >
                <Star
                  className={`w-10 h-10 transition-all ${
                    (starHover !== null ? num <= starHover : num <= (selectedAnswer as number || 0))
                      ? 'fill-[#ccff00] text-[#ccff00]'
                      : 'text-gray-600'
                  }`}
                />
              </button>
            ))}
          </motion.div>
        );

      case 'boolean':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-3"
          >
            <button
              onClick={() => setSelectedAnswer('yes')}
              className={`py-4 rounded-xl border-2 text-sm font-bold transition-all ${
                selectedAnswer === 'yes'
                  ? 'bg-[#ccff00] border-[#ccff00] text-black'
                  : 'bg-gray-900/50 border-gray-700/60 text-gray-300 hover:border-gray-600'
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => setSelectedAnswer('no')}
              className={`py-4 rounded-xl border-2 text-sm font-bold transition-all ${
                selectedAnswer === 'no'
                  ? 'bg-[#ccff00] border-[#ccff00] text-black'
                  : 'bg-gray-900/50 border-gray-700/60 text-gray-300 hover:border-gray-600'
              }`}
            >
              No
            </button>
          </motion.div>
        );

      default:
        return (
          <div className="text-center py-6 text-gray-500 text-sm">
            Preview for "{config.label}" type
          </div>
        );
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 md:p-8 lg:p-10 border border-white/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8 sm:mb-10 md:mb-12">
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.div
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/10 flex items-center justify-center border border-white/20"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white">Live Preview</h3>
              <p className="text-xs sm:text-sm text-white/50 flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Respondent experience
              </p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full flex justify-center items-center py-4 sm:py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative max-h-full w-auto"
          >
            <div className="absolute inset-0 bg-[#ccff00]/20 blur-3xl opacity-30 rounded-[3rem]" />

            <div className="relative bg-black border-[12px] sm:border-[14px] border-black rounded-[2.5rem] w-[280px] sm:w-[300px] max-h-full aspect-[9/19] shadow-2xl overflow-hidden mx-auto">
              {/* Status Bar */}
              <div className="absolute top-0 left-0 w-full h-8 bg-gray-900 z-20 flex justify-between items-center px-5 sm:px-6 pt-2">
                <p className="text-[10px] font-semibold text-white">9:41</p>
                <div className="h-[24px] w-[75px] sm:w-[80px] bg-black rounded-full absolute left-1/2 transform -translate-x-1/2 top-2"></div>
                <div className="flex gap-1 items-center">
                  <Signal className="w-3 h-2.5 text-white" />
                  <Wifi className="w-3 h-2.5 text-white" />
                  <Battery className="w-4 h-2.5 text-white" />
                </div>
              </div>

              {/* Phone Content */}
              <div className="w-full h-full bg-[#0a0a0a] flex flex-col relative overflow-hidden pt-8">
                {/* Progress Bar Header */}
                <div className="shrink-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-md">
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-gray-500 font-mono">
                        Question {currentStep + 1} of {totalQuestions}
                      </span>
                      <span className="text-[10px] text-[#ccff00] font-mono font-bold">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[#ccff00]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <div className="px-4 pb-3 border-b border-gray-800/40">
                    <div className="text-center text-[9px] text-gray-500 font-mono">
                      {cleanPreviewText || 'Survey Preview'}
                    </div>
                  </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto px-4 pt-6 pb-6 scrollbar-hide">
                  {totalQuestions === 0 || !currentQuestion || currentQuestion.text === '' ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                      <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
                        <Smartphone className="w-8 h-8 text-gray-600" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium mb-1">No questions yet</p>
                      <p className="text-[10px] text-gray-600">Add questions to see preview</p>
                    </div>
                  ) : (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-5"
                      >
                        {/* Question Text */}
                        <div>
                          <h3 className="text-base font-bold text-white leading-snug mb-1">
                            {currentQuestion.text}
                          </h3>
                          {currentQuestion.isScreening && (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#ccff00]/10 border border-[#ccff00]/30 rounded text-[9px] text-[#ccff00] font-semibold mt-2">
                              Screening Question
                            </div>
                          )}
                        </div>

                        {/* Question Input */}
                        {renderQuestionInput()}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>

                {/* Footer with Next Button */}
                {totalQuestions > 0 && currentQuestion && currentQuestion.text !== '' && (
                  <div className="shrink-0 bg-[#0a0a0a]/90 backdrop-blur-md border-t border-gray-800/40 px-4 py-4">
                    <button
                      onClick={handleNext}
                      disabled={currentStep >= totalQuestions - 1}
                      className="w-full bg-[#ccff00] text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span className="text-sm">
                        {currentStep >= totalQuestions - 1 ? 'Complete' : 'Next'}
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 sm:mt-8 text-center px-4"
        >
          <p className="text-xs sm:text-sm md:text-base text-white/50 font-medium">
            Step-by-step survey experience • Real-time updates
          </p>
        </motion.div>
      </div>
    </div>
  );
};
