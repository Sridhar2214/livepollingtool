import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Plus, Trash2, AlertCircle, Settings, Eye, ArrowLeft, Zap } from 'lucide-react';

const COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#64748B'];

export const CreatePoll = () => {
  const [question, setQuestion]         = useState('');
  const [description, setDescription]   = useState('');
  const [options, setOptions]            = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [expiryHours, setExpiryHours]   = useState('0');
  const [loading, setLoading]            = useState(false);
  const [error, setError]                = useState('');
  const navigate = useNavigate();

  const addOption = () => {
    if (options.length >= 8) return;
    setOptions([...options, '']);
  };
  const updateOption = (i, v) => { const o = [...options]; o[i] = v; setOptions(o); };
  const removeOption = (i) => { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const q = question.trim();
    if (q.length < 5) return setError('Question must be at least 5 characters.');
    const clean = options.map(o => o.trim()).filter(Boolean);
    if (clean.length < 2) return setError('Please fill at least 2 options.');
    let expiresAt = null;
    if (expiryHours !== '0') expiresAt = new Date(Date.now() + parseInt(expiryHours) * 3600000).toISOString();
    setLoading(true);
    try {
      const res = await apiClient.post('/user/polls', {
        question: q, description: description.trim(),
        options: clean,
        settings: { allow_multiple: allowMultiple, show_results_before_vote: false, expires_at: expiresAt },
      });
      navigate(`/poll/${res.data.slug || res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create poll.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 50%, #f8fbff 100%)' }}>
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #bfdbfe 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.25 }} />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white border border-blue-100 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900">Create a Live Poll</h1>
            <p className="text-xs text-slate-500 mt-0.5">Set up your question and share it instantly</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── FORM ── */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">

            {/* Question */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Poll Question *</label>
              <input
                type="text" required value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="e.g. What feature should we build next?"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              />
              <textarea
                rows={2} value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional: add context or instructions for voters..."
                className="w-full mt-3 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-600 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition resize-none"
              />
            </div>

            {/* Options */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Options *</label>
                <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{options.length}/8 max</span>
              </div>

              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-9 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <input
                      type="text" value={opt}
                      onChange={e => updateOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                    />
                    {options.length > 2 && (
                      <button type="button" onClick={() => removeOption(i)}
                        className="p-2 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {options.length < 8 && (
                <button type="button" onClick={addOption}
                  className="mt-3 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 font-semibold text-xs transition">
                  <Plus className="w-3.5 h-3.5" /> Add Option
                </button>
              )}
            </div>

            {/* Settings */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
              <div className="flex items-center gap-1.5 mb-3">
                <Settings className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Settings</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-blue-200 hover:bg-blue-50 transition">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Multiple Choice</span>
                    <span className="text-[10px] text-slate-400">Allow multiple selections</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${allowMultiple ? 'bg-blue-500' : 'bg-slate-200'}`}
                    onClick={() => setAllowMultiple(!allowMultiple)}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${allowMultiple ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </label>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Poll Expiry</label>
                  <select value={expiryHours} onChange={e => setExpiryHours(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-blue-400 transition">
                    <option value="0">Never expires</option>
                    <option value="1">1 Hour</option>
                    <option value="24">24 Hours</option>
                    <option value="168">7 Days</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-200 transition disabled:opacity-60 flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              {loading ? 'Creating...' : 'Publish & Launch Poll'}
            </button>
          </form>

          {/* ── LIVE PREVIEW ── */}
          <div className="lg:col-span-5">
            <div className="sticky top-6">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Preview</span>
              </div>

              <div className="bg-white rounded-2xl border border-blue-100 shadow-md p-5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE POLL
                </div>

                <h3 className="text-base font-black text-slate-900 mb-1 min-h-[1.5rem]">
                  {question.trim() || <span className="text-slate-300">Your question appears here...</span>}
                </h3>

                {description && <p className="text-xs text-slate-500 mb-3">{description}</p>}

                <div className="space-y-2 my-4">
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-xs font-semibold text-slate-700">{opt.trim() || `Option ${i + 1}`}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{allowMultiple ? 'Multiple choice' : 'Single vote'}</span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                    WebSocket live
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
