import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Edit2, AlertTriangle } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  hasPIIError?: boolean;
}

interface QuestionEditorProps {
  initialQuestion: string;
  onQuestionsChange?: (questions: Question[]) => void;
}

const PII_REGEX = /(email|e-mail|phone|mobile number|cell number|telephone|address|street|home address|credit card|debit card|ssn|social security|password|passcode|name|first name|last name|full name|date of birth|dob|birthday|driver license|passport|bank account|routing number|zip code|postal code|national id|identification number)/i;

export const QuestionEditor = ({ initialQuestion, onQuestionsChange }: QuestionEditorProps) => {
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', text: initialQuestion || 'What is your primary question?' }
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

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

  const handleAdd = () => {
    if (questions.length >= 3) return;
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: 'New question...'
    };
    const updated = [...questions, newQuestion];
    setQuestions(updated);
    setEditingId(newQuestion.id);
    setEditText(newQuestion.text);
    onQuestionsChange?.(updated);
  };

  const handleRemove = (id: string) => {
    if (questions.length <= 1) return;
    const updated = questions.filter(q => q.id !== id);
    setQuestions(updated);
    onQuestionsChange?.(updated);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-white">Refine Your Questions</h3>
        {questions.length < 3 && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-neon-lime/20 text-neon-lime rounded-lg hover:bg-neon-lime/30 transition-colors text-sm font-bold"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        )}
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative"
          >
            {editingId === question.id ? (
              <div className="space-y-3">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full bg-black/40 border border-primary/40 rounded-lg p-4 text-white focus:ring-2 focus:ring-primary outline-none resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(question.id)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-bold"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className={`bg-white/5 border rounded-lg p-4 transition-all group-hover:bg-white/[0.07] ${
                question.hasPIIError
                  ? 'border-red-500 ring-2 ring-red-500/20'
                  : 'border-white/10 hover:border-white/20'
              }`}>
                {question.hasPIIError && (
                  <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-400 text-sm font-bold mb-1">
                        POLICY VIOLATION: Personal Data Detected
                      </p>
                      <p className="text-red-300/80 text-xs leading-relaxed">
                        You cannot ask for PII (Email, Phone, Names, Addresses, SSN, etc.). This question will be rejected and must be removed before launch.
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-xs text-white/40 font-bold mb-2">
                      QUESTION {index + 1}
                    </div>
                    <p className="text-white font-medium leading-relaxed">
                      {question.text}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(question)}
                      className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-white" />
                    </button>
                    {questions.length > 1 && (
                      <button
                        onClick={() => handleRemove(question.id)}
                        className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                        title="Remove"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {questions.length < 3 && (
        <p className="text-xs text-white/40 mt-4 text-center">
          You can add up to {3 - questions.length} more question{3 - questions.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};
