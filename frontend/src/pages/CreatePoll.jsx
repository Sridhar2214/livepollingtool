import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Plus, Trash2, HelpCircle, Check, AlertCircle, Settings, Palette, Eye, ArrowLeft } from 'lucide-react';

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#64748B', // Slate
];

export const CreatePoll = () => {
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState([
    'React',
    'Vue.js',
    'Svelte',
    'Angular',
  ]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [showResultsBeforeVote, setShowResultsBeforeVote] = useState(true);
  const [expiryHours, setExpiryHours] = useState('0'); // 0 = never

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleAddOption = () => {
    if (options.length >= 10) {
      setError('Maximum 10 options allowed per poll');
      return;
    }
    setOptions([...options, '']);
  };

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) {
      setError('Poll must contain at least 2 options');
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side Validation
    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length < 5) {
      setError('Poll question must be at least 5 characters long');
      return;
    }

    const cleanedOptions = options.map(o => o.trim()).filter(o => o.length > 0);
    if (cleanedOptions.length < 2) {
      setError('Please provide at least 2 non-empty options');
      return;
    }

    let expiresAt = null;
    if (expiryHours !== '0') {
      const hours = parseInt(expiryHours, 10);
      expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    }

    setLoading(true);

    try {
      const response = await apiClient.post('/user/polls', {
        question: trimmedQuestion,
        description: description.trim(),
        options: cleanedOptions,
        settings: {
          allow_multiple: allowMultiple,
          show_results_before_vote: showResultsBeforeVote,
          expires_at: expiresAt,
        },
      });

      const newPoll = response.data;
      navigate(`/poll/${newPoll.slug || newPoll.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Creation Form Column */}
        <div className="lg:col-span-7">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-lg">
            <h1 className="text-2xl font-black text-slate-900 mb-1">Create a Live Poll</h1>
            <p className="text-xs text-slate-500 mb-6">Set up your question, options, and settings for real-time audience voting</p>

            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Question */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Poll Question *
                </label>
                <input
                  type="text"
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. What is your favorite programming language in 2026?"
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm font-semibold"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Description / Context (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any extra context or instructions for voters..."
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              {/* Options Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Poll Options * ({options.length})
                  </label>
                  <span className="text-[11px] text-slate-400">At least 2 required</span>
                </div>

                <div className="space-y-2.5">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div
                        className="w-3.5 h-8 rounded-lg shrink-0"
                        style={{ backgroundColor: DEFAULT_COLORS[idx % DEFAULT_COLORS.length] }}
                        title="Option Color Tag"
                      ></div>
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-medium"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddOption}
                  className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-blue-600 font-semibold text-xs transition"
                >
                  <Plus className="w-4 h-4" /> Add Option
                </button>
              </div>

              {/* Settings Toggle Options */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-blue-600" /> Poll Settings
                </h4>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Allow Multiple Choice</span>
                    <span className="text-[11px] text-slate-500">Voters can select more than one option</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowMultiple}
                    onChange={(e) => setAllowMultiple(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-white border-slate-300 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Show Live Results Before Voting</span>
                    <span className="text-[11px] text-slate-500">Allow voters to view live tally bars before submitting</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showResultsBeforeVote}
                    onChange={(e) => setShowResultsBeforeVote(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-white border-slate-300 focus:ring-blue-500"
                  />
                </label>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Poll Expiry Timer</label>
                  <select
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs font-medium"
                  >
                    <option value="0">Never (Always Active until manually closed)</option>
                    <option value="1">Expire in 1 Hour</option>
                    <option value="24">Expire in 24 Hours</option>
                    <option value="168">Expire in 7 Days</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
              >
                {loading ? 'Creating Poll...' : 'Publish & Launch Live Poll'}
              </button>
            </form>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5">
          <div className="sticky top-24">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Eye className="w-4 h-4 text-emerald-600" /> Audience Live Preview
            </div>

            <div className="glass-card p-6 rounded-3xl border border-slate-200/90 shadow-md">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE POLL PREVIEW
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {question.trim() || 'Your Poll Question Will Appear Here'}
              </h3>

              {description && (
                <p className="text-xs text-slate-500 mb-4">{description}</p>
              )}

              <div className="space-y-2.5 my-5">
                {options.map((opt, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: DEFAULT_COLORS[idx % DEFAULT_COLORS.length] }}
                      ></span>
                      <span>{opt.trim() || `Option ${idx + 1}`}</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">0 votes (0%)</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-400 flex justify-between">
                <span>{allowMultiple ? 'Multiple Choice Allowed' : 'Single Vote Only'}</span>
                <span>Realtime WebSocket Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
