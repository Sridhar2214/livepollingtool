import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { apiClient, getWebSocketUrl } from '../api/client';
import { getVoterFingerprint } from '../utils/fingerprint';
import { LiveBadge } from '../components/LiveBadge';
import { ShareModal } from '../components/ShareModal';
import { Check, Vote, Share2, AlertCircle, Lock, BarChart3, Radio, Sparkles, TrendingUp, Users } from 'lucide-react';

export const PollView = () => {
  const { id } = useParams();

  const [poll, setPoll] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [showResultsPreview, setShowResultsPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [wsStatus, setWsStatus] = useState('connecting');
  const [isShareOpen, setIsShareOpen] = useState(false);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
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

  // 2. Real-Time WebSocket Connection to Go Backend + Redis Pub/Sub
  useEffect(() => {
    if (!poll?.id) return;

    let isMounted = true;

    const connectWebSocket = () => {
      const wsUrl = getWebSocketUrl(poll.id);
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (!isMounted) return;
        console.log("⚡ Realtime WebSocket connected to Poll room:", poll.id);
        setWsStatus('connected');
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'VOTE_UPDATE') {
            console.log("📡 Live Vote Event Received from Redis:", message);
            setPoll((prev) => {
              if (!prev) return prev;

              const updatedOptions = prev.options.map((opt) => ({
                ...opt,
                votes:
                  message.option_votes && message.option_votes[opt.id] !== undefined
                    ? message.option_votes[opt.id]
                    : opt.votes,
              }));

              return {
                ...prev,
                total_votes: message.total_votes !== undefined ? message.total_votes : prev.total_votes,
                options: updatedOptions,
                is_closed: message.is_closed !== undefined ? message.is_closed : prev.is_closed,
              };
            });
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      socket.onerror = (err) => {
        if (!isMounted) return;
        console.warn("WebSocket error:", err);
        setWsStatus('offline');
      };

      socket.onclose = () => {
        if (!isMounted) return;
        console.log("WebSocket disconnected. Retrying in 3 seconds...");
        setWsStatus('offline');
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMounted) connectWebSocket();
        }, 3000);
      };
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
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

      // Update state with response tallies immediately without page refresh
      setPoll((prev) => ({
        ...prev,
        total_votes: response.data.total_votes,
        options: prev.options.map((opt) => ({
          ...opt,
          votes:
            response.data.option_votes && response.data.option_votes[opt.id] !== undefined
              ? response.data.option_votes[opt.id]
              : opt.votes,
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
  // Determine if full live results (progress bars and percentages) should be rendered
  const showFullResults = hasVoted || isClosed || showResultsPreview;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Realtime Live Connection Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <LiveBadge status={wsStatus} />
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{totalVotes}</span>
            <span>{totalVotes === 1 ? 'total vote' : 'total votes'}</span>
          </span>
        </div>
        <button
          onClick={() => setIsShareOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold shadow-xs transition"
        >
          <Share2 className="w-3.5 h-3.5 text-blue-600" /> Share Poll
        </button>
      </div>

      {/* Main Poll Voting Card */}
      <div className="glass-card p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-xl relative overflow-hidden bg-white/95 backdrop-blur-md">
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

        {/* Creator Info */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          <span>Created by <strong className="text-slate-800 font-semibold">{poll.creator_name || 'Anonymous'}</strong></span>
          <span className="text-slate-400">Live tallying via Redis</span>
        </div>

        {/* Question Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 leading-snug">
          {poll.question}
        </h1>

        {poll.description && (
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">{poll.description}</p>
        )}

        {/* Post-vote success banner */}
        {hasVoted && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Your vote has been recorded! Live results are updating in real-time below without refresh.</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wider shrink-0 bg-emerald-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Options List with Realtime Updating Votes & Progress Bars */}
        <form onSubmit={handleSubmitVote} className="space-y-3.5 my-6">
          {poll.options.map((opt) => {
            const votes = opt.votes || 0;
            const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const isSelected = selectedOptions.includes(opt.id);

            return (
              <div
                key={opt.id}
                onClick={() => handleOptionToggle(opt.id)}
                className={`relative overflow-hidden p-4 sm:p-5 rounded-2xl border transition-all ${
                  hasVoted || isClosed
                    ? 'cursor-default border-slate-200/90 bg-white'
                    : isSelected
                    ? 'cursor-pointer border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                    : 'cursor-pointer border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                {/* Real-time Progress Bar Fill (visible once voted, closed, or preview enabled) */}
                {showFullResults && (
                  <div
                    className="absolute top-0 left-0 bottom-0 opacity-15 transition-all duration-700 ease-out"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: opt.color || '#3b82f6',
                    }}
                  />
                )}

                <div className="relative z-10 flex items-center justify-between gap-4">
                  {/* Option Left Details: Selection badge + Color dot + Text */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Checkbox / Radio Indicator (before voting) */}
                    {!isClosed && !hasVoted && (
                      <div
                        className={`w-5 h-5 rounded-${
                          poll.settings?.allow_multiple ? 'md' : 'full'
                        } border flex items-center justify-center transition shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    )}

                    {/* Voted check badge (after voting) */}
                    {hasVoted && isSelected && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-600 text-white text-xs font-bold shadow-xs shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Your vote
                      </span>
                    )}

                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: opt.color || '#3b82f6' }}
                    />
                    <span className="text-sm sm:text-base font-bold text-slate-900 truncate">{opt.text}</span>
                  </div>

                  {/* Realtime Live Vote Count & Percentage (updates without page refresh) */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-slate-800 font-extrabold text-sm sm:text-base tracking-tight">
                      {votes} <span className="text-xs text-slate-500 font-semibold">{votes === 1 ? 'vote' : 'votes'}</span>
                    </span>
                    {showFullResults && (
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60 min-w-[42px] text-center">
                        {pct}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Submit Vote Button (when user hasn't voted yet) */}
          {!hasVoted && !isClosed && (
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={submitting || selectedOptions.length === 0}
                className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md shadow-blue-600/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Vote className="w-4 h-4" />
                {submitting ? 'Submitting Vote...' : 'Submit Your Vote'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowResultsPreview(!showResultsPreview)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition inline-flex items-center gap-1.5"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  {showResultsPreview ? 'Hide live percentage bars' : 'Audience view: Show live percentage bars'}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer Info */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <span>{poll.settings?.allow_multiple ? '☑ Multiple options allowed' : '◉ Single vote selection'}</span>
          <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
            Live Redis Pub/Sub WebSocket
          </span>
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
