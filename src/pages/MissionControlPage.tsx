import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Edit, Trash2, PlusCircle, RocketIcon } from 'lucide-react';
import { CustomSelect } from '../components/shared/CustomSelect';

interface Question {
  id: number;
  type: 'choice' | 'scale';
  title: string;
  options?: { label: string; color: string }[];
  min?: string;
  max?: string;
}

export const MissionControlPage = () => {
  const navigate = useNavigate();
  const [count, setCount] = useState('100');
  const [country, setCountry] = useState('United States');
  const [segment, setSegment] = useState('General Pop');
  const [editingId, setEditingId] = useState<number | null>(null);

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 1,
      type: 'choice',
      title: 'Which packaging aesthetic do you prefer?',
      options: [
        { label: 'Matte Black', color: '#1a1a1a' },
        { label: 'Silver', color: '#e2e2e2' },
      ],
    },
    {
      id: 2,
      type: 'scale',
      title: 'How likely are you to switch brands?',
      min: 'Not Likely',
      max: 'Very Likely',
    },
  ]);

  const updateQuestionTitle = (id: number, newTitle: string) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, title: newTitle } : q)));
  };

  const updateQuestionType = (id: number, newType: 'choice' | 'scale') => {
    setQuestions(
      questions.map((q) => {
        if (q.id === id) {
          const base = { ...q, type: newType };
          if (newType === 'choice' && !q.options) {
            return {
              ...base,
              options: [
                { label: 'Option A', color: '#111' },
                { label: 'Option B', color: '#333' },
              ],
            };
          }
          if (newType === 'scale' && !q.min) {
            return { ...base, min: 'Poor', max: 'Excellent' };
          }
          return base;
        }
        return q;
      })
    );
  };

  const updateOptionLabel = (qId: number, optIdx: number, newLabel: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId && q.options) {
          const newOptions = [...q.options];
          newOptions[optIdx] = { ...newOptions[optIdx], label: newLabel };
          return { ...q, options: newOptions };
        }
        return q;
      })
    );
  };

  const addQuestion = () => {
    const newId = Date.now();
    const newQ: Question = {
      id: newId,
      type: 'choice',
      title: 'New Research Question',
      options: [
        { label: 'Option A', color: '#111' },
        { label: 'Option B', color: '#333' },
      ],
    };
    setQuestions([...questions, newQ]);
    setEditingId(newId);
  };

  const removeQuestion = (id: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const refineWithAI = (id: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === id) {
          return {
            ...q,
            title: q.title + ' (AI Refined)',
            options: q.options ? q.options.map((o) => ({ ...o, label: 'AI: ' + o.label })) : q.options,
          };
        }
        return q;
      })
    );
  };

  return (
    <div className="min-h-[100dvh] bg-background-dark font-display text-white pb-40">
      <main className="px-4 sm:px-6 pt-6 pb-12 max-w-3xl mx-auto">
        <div className="text-center mb-12 px-4">
          <div className="text-3xl md:text-5xl font-black leading-[1.8] md:leading-[1.6] tracking-tight text-white flex flex-wrap justify-center items-baseline gap-y-4">
            <span className="opacity-40 mr-2">I want to survey </span>
            <CustomSelect
              value={count}
              onChange={setCount}
              options={['50', '100', '500', '1000', '2000']}
            />
            <span className="opacity-40 mx-2"> people in </span>
            <CustomSelect
              value={country}
              onChange={setCountry}
              options={['United States', 'UAE', 'UK', 'Canada']}
            />
            <span className="opacity-40 mx-2"> who are </span>
            <CustomSelect
              value={segment}
              onChange={setSegment}
              options={['General Pop', 'Founders', 'Gamers', 'Students']}
            />
            <span className="opacity-40 ml-2"> on how likely they are to switch to the new </span>
            <span className="text-primary ml-2 underline decoration-primary/30 underline-offset-8 decoration-2 italic">
              iPhone 18.
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="glass-panel p-6 rounded-[2rem] space-y-4 hover:border-primary/30 transition-colors relative group"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-primary tracking-widest">
                  Question {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => refineWithAI(q.id)}
                    className="flex items-center gap-1 px-3 py-1 bg-primary/10 hover:bg-primary/20 rounded-full border border-primary/20 transition-all group/ai"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-primary group-hover/ai:rotate-12 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-tighter text-primary">
                      AI Refine
                    </span>
                  </button>
                  <button
                    onClick={() => setEditingId(editingId === q.id ? null : q.id)}
                    className={`transition-colors ${
                      editingId === q.id ? 'text-primary' : 'text-white/20 hover:text-white'
                    }`}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeQuestion(q.id)}
                    className="text-white/10 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {editingId === q.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1 block">
                        Question Text
                      </label>
                      <input
                        autoFocus
                        className="w-full bg-white/5 border border-primary/30 rounded-xl p-3 text-lg font-bold text-white focus:ring-1 focus:ring-primary focus:border-primary"
                        value={q.title}
                        onChange={(e) => updateQuestionTitle(q.id, e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateQuestionType(q.id, 'choice')}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                          q.type === 'choice'
                            ? 'bg-primary border-primary text-white'
                            : 'border-white/10 text-white/40'
                        }`}
                      >
                        Pick Option
                      </button>
                      <button
                        onClick={() => updateQuestionType(q.id, 'scale')}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                          q.type === 'scale'
                            ? 'bg-primary border-primary text-white'
                            : 'border-white/10 text-white/40'
                        }`}
                      >
                        Sliding Scale
                      </button>
                    </div>
                  </div>
                ) : (
                  <h3 className="text-xl font-bold">{q.title}</h3>
                )}

                {q.type === 'choice' && q.options ? (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {q.options.map((opt, i) => (
                      <div key={i} className="relative group/opt">
                        <div
                          className="h-28 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-3 bg-white/5 transition-all"
                          style={{
                            backgroundColor: opt.color === '#1a1a1a' ? '#111' : opt.color,
                          }}
                        >
                          <div
                            className="w-8 h-8 rounded shadow-inner"
                            style={{ backgroundColor: opt.color }}
                          ></div>
                          {editingId === q.id ? (
                            <input
                              className="bg-transparent border-none text-center text-[10px] font-black uppercase tracking-tight text-white focus:ring-0 w-full p-0"
                              value={opt.label}
                              onChange={(e) => updateOptionLabel(q.id, i, e.target.value)}
                            />
                          ) : (
                            <span
                              className={`text-[10px] font-black uppercase tracking-tight ${
                                opt.color === '#e2e2e2' ? 'text-zinc-600' : 'text-white/50'
                              }`}
                            >
                              {opt.label}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pt-6 px-2 pb-2">
                    <input
                      type="range"
                      disabled
                      className="w-full h-2 bg-white/10 rounded-full appearance-none accent-primary/50 cursor-not-allowed"
                    />
                    <div className="flex justify-between mt-3 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                      {editingId === q.id ? (
                        <>
                          <input
                            className="bg-transparent border-none p-0 text-[10px] font-bold text-primary focus:ring-0 w-20"
                            value={q.min}
                            onChange={(e) =>
                              setQuestions(
                                questions.map((item) =>
                                  item.id === q.id ? { ...item, min: e.target.value } : item
                                )
                              )
                            }
                          />
                          <input
                            className="bg-transparent border-none p-0 text-[10px] font-bold text-primary focus:ring-0 w-20 text-right"
                            value={q.max}
                            onChange={(e) =>
                              setQuestions(
                                questions.map((item) =>
                                  item.id === q.id ? { ...item, max: e.target.value } : item
                                )
                              )
                            }
                          />
                        </>
                      ) : (
                        <>
                          <span>{q.min}</span>
                          <span>{q.max}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={addQuestion}
            className="w-full py-8 border-2 border-dashed border-white/5 rounded-[2rem] text-white/20 hover:text-primary hover:border-primary/30 transition-all flex flex-col items-center justify-center gap-2 group"
          >
            <PlusCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Add Research Question
            </span>
          </button>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full p-6 z-50">
        <div className="max-w-xl mx-auto glass-panel bg-[#0B0C15]/90 backdrop-blur-3xl p-6 rounded-[2rem] flex items-center justify-between border-t border-white/10 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.5)]">
          <div>
            <div className="flex gap-3 text-[10px] font-bold uppercase text-white/40 mb-1">
              <span>Base: $99</span>
              <span>Targeting: $49</span>
            </div>
            <div className="text-3xl font-black tracking-tighter text-white">$148</div>
          </div>
          <button
            onClick={() => navigate('/active')}
            className="bg-primary hover:bg-primary-hover text-white px-8 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/25 transition-transform active:scale-95 flex items-center gap-2"
          >
            Launch
            <RocketIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
