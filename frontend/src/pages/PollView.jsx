import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { apiClient, getWebSocketUrl } from '../api/client';
import { getVoterFingerprint } from '../utils/fingerprint';
import { LiveBadge } from '../components/LiveBadge';
import { ShareModal } from '../components/ShareModal';
import { Check, Vote, Share2, AlertCircle, Lock, BarChart3, Radio, Clock, Sparkles } from 'lucide-react';

export const PollView = () => {
  const { id } = useParams();

  const [poll, setPoll] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [wsStatus, setWsStatus] = useState('connecting');
  const [isShareOpen, setIsShareOpen] = useState(false);

  const wsRef = useRef(null);
  const voterFp = getVoterFingerprint();

  // 1. Initial Poll Fetch
  const fetchPoll = async () => {
    try {
      const response = await apiClient.get(`/polls/${id}`);
      setPoll(response.data);
      // Check local storage if voter has voted on this poll
      const votedState = localStorage.getItem(`voted_${response.data.id}`);
      if (votedState) {
        setHasVoted(true);
        setSelectedOptions(JSON.parse(votedState));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Poll not found or unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoll();
  }, [id]);

  // 2. Real-Time WebSocket Connection to Go Backend
  useEffect(() => {
    if (!poll?.id) return;

    const wsUrl = getWebSocketUrl(poll.id);
    let socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log("⚡ WebSocket connected to Poll room:", poll.id);
      setWsStatus('connected');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'VOTE_UPDATE') {
          console.log("📡 Live Vote Event Received:", message);
          setPoll((prev) => {
            if (!prev) return prev;

            const updatedOptions = prev.options.map((opt) => ({
              ...opt,
              votes: message.option_votes[opt.id] !== undefined ? message.option_votes[opt.id] : opt.votes,
            }));

            return {
              ...prev,
              total_votes: message.total_votes,
              options: updatedOptions,
              is_closed: message.is_closed,
            };
          });
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    socket.onerror = (err) => {
      console.warn("WebSocket error:", err);
      setWsStatus('offline');
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setWsStatus('offline');
    };

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [poll?.id]);

  // 3. Option Selection Handler
  const handleOptionToggle = (optId) => {
    if (hasVoted || poll?.is_closed) return;

    if (poll?.settings?.allow_multiple) {
      if (selectedOptions.includes(optId)) {
        setSelectedOptions(selectedOptions.filter((o) => o !== optId));
      } else {
        setSelectedOptions([...selectedOptions, optId]);
      }
    } else {
      setSelectedOptions([optId]);
    }
  };

  // 4. Vote Submission
  const handleSubmitVote = async (e) => {
    e.preventDefault();
    if (selectedOptions.length === 0) {
      setError('Please select at least one option to submit your vote.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const response = await apiClient.post('/votes', {
        poll_id: poll.id,
        option_ids: selectedOptions,
        voter_fingerprint: voterFp,
      });

      // Update state with response tallies
      setPoll((prev) => ({
        ...prev,
        total_votes: response.data.total_votes,
        options: prev.options.map((opt) => ({
          ...opt,
          votes: response.data.option_votes[opt.id] !== undefined ? response.data.option_votes[opt.id] : opt.votes,
        })),
      }));

      setHasVoted(true);
      localStorage.setItem(`voted_${poll.id}`, JSON.stringify(selectedOptions));

      // Trigger Celebration Confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="glass-card p-12 rounded-3xl border border-slate-200 animate-pulse shadow-sm">
          <div className="h-4 bg-slate-200 rounded w-1/4 mx-auto mb-4"></div>
          <div className="h-8 bg-slate-200 rounded w-3/4 mx-auto mb-8"></div>
          <div className="space-y-4">
            <div className="h-12 bg-slate-200 rounded-xl"></div>
            <div className="h-12 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="glass-card p-8 rounded-3xl border border-slate-200 shadow-md">
          <div className="p-3 rounded-full bg-rose-50 text-rose-600 w-fit mx-auto mb-4 border border-rose-200">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Poll Unavailable</h2>
          <p className="text-xs text-slate-500 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const totalVotes = poll.total_votes || 0;
  const isExpired = poll.settings?.expires_at && new Date() > new Date(poll.settings.expires_at);
  const isClosed = poll.is_closed || isExpired;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Realtime Live Connection Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <LiveBadge status={wsStatus} />
        <button
          onClick={() => setIsShareOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold shadow-xs transition"
        >
          <Share2 className="w-3.5 h-3.5 text-blue-600" /> Share Poll
        </button>
      </div>

      {/* Main Poll Voting Card */}
      <div className="glass-card p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-xl relative overflow-hidden">
        {/* Closed Banner */}
        {isClosed && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <Lock className="w-4 h-4 text-rose-600" />
              <span>This poll is closed. Voting has ended.</span>
            </div>
            <span className="text-[11px] uppercase tracking-wider text-rose-700 font-bold">Final Results</span>
          </div>
        )}

        {/* Creator & Expiry Info */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          <span>Created by <strong className="text-slate-800 font-semibold">{poll.creator_name || 'Anonymous'}</strong></span>
          <span className="font-semibold text-slate-600">{totalVotes} total votes</span>
        </div>

        {/* Question Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 leading-snug">
          {poll.question}
        </h1>

        {poll.description && (
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">{poll.description}</p>
        )}

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Options List with Animated Live Bar Graphs */}
        <form onSubmit={handleSubmitVote} className="space-y-3.5 my-6">
          {poll.options.map((opt) => {
            const votes = opt.votes || 0;
            const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const isSelected = selectedOptions.includes(opt.id);

            return (
              <div
                key={opt.id}
                onClick={() => handleOptionToggle(opt.id)}
                className={`relative overflow-hidden p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-500/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                } ${isClosed ? 'cursor-default' : ''}`}
              >
                {/* Live Progress Bar Background */}
                <div
                  className="absolute top-0 left-0 bottom-0 opacity-15 transition-all duration-700 ease-out"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: opt.color || '#2563eb',
                  }}
                ></div>

                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Checkbox / Radio Indicator */}
                    {!isClosed && !hasVoted && (
                      <div
                        className={`w-5 h-5 rounded-${
                          poll.settings?.allow_multiple ? 'md' : 'full'
                        } border flex items-center justify-center transition ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    )}
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: opt.color || '#2563eb' }}
                    ></span>
                    <span className="text-sm font-bold text-slate-900">{opt.text}</span>
                  </div>

                  {/* Percentage & Vote Count Tally */}
                  <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
                    <span className="text-slate-900 font-bold text-sm">{pct}%</span>
                    <span className="text-slate-500 text-[11px]">({votes})</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Submit Vote Button */}
          {!hasVoted && !isClosed && (
            <button
              type="submit"
              disabled={submitting || selectedOptions.length === 0}
              className="w-full mt-4 py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md shadow-blue-600/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Vote className="w-4 h-4" />
              {submitting ? 'Submitting Vote...' : 'Submit Your Vote'}
            </button>
          )}

          {hasVoted && (
            <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center font-semibold flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Your vote has been cast! Real-time results will automatically update below.</span>
            </div>
          )}
        </form>

        {/* Footer Settings Info */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>{poll.settings?.allow_multiple ? 'Multiple options allowed' : 'Single vote selection'}</span>
          <span>Updates live via WebSocket</span>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        poll={poll}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
};
