import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, getWebSocketUrl } from '../api/client';
import { PollCard } from '../components/PollCard';
import { ShareModal } from '../components/ShareModal';
import { Plus, BarChart3, Radio, CheckCircle, Search, RefreshCw, AlertCircle } from 'lucide-react';

export const Dashboard = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedSharePoll, setSelectedSharePoll] = useState(null);

  const fetchPolls = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/user/polls');
      setPolls(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch user polls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  // Live WebSocket updates for all active polls on the dashboard
  useEffect(() => {
    if (polls.length === 0) return;

    const activePollIds = polls.filter(p => !p.is_closed).map(p => p.id);
    if (activePollIds.length === 0) return;

    const sockets = activePollIds.map(pollId => {
      const socket = new WebSocket(getWebSocketUrl(pollId));

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'VOTE_UPDATE') {
            setPolls(prev => prev.map(poll => {
              if (poll.id !== pollId) return poll;
              const updatedOptions = (poll.options || []).map(opt => ({
                ...opt,
                votes: message.option_votes?.[opt.id] !== undefined
                  ? message.option_votes[opt.id]
                  : opt.votes,
              }));
              return {
                ...poll,
                total_votes: message.total_votes,
                options: updatedOptions,
                is_closed: message.is_closed ?? poll.is_closed,
              };
            }));
          }
        } catch (err) {
          console.error('Dashboard WS parse error:', err);
        }
      };

      return socket;
    });

    return () => {
      sockets.forEach(s => {
        if (s.readyState === WebSocket.OPEN || s.readyState === WebSocket.CONNECTING) {
          s.close();
        }
      });
    };
  }, [polls.map(p => p.id).join(',')]);


  const handleClosePoll = async (pollId) => {
    if (!window.confirm('Are you sure you want to close this poll? Voters will no longer be able to submit votes.')) return;
    try {
      await apiClient.post(`/user/polls/${pollId}/close`);
      fetchPolls();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to close poll');
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (!window.confirm('Are you sure you want to delete this poll? This action cannot be undone.')) return;
    try {
      await apiClient.delete(`/user/polls/${pollId}`);
      setPolls(polls.filter(p => p.id !== pollId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete poll');
    }
  };

  const filteredPolls = polls.filter(p =>
    p.question.toLowerCase().includes(search.toLowerCase())
  );

  const totalVotesCount = polls.reduce((acc, p) => acc + (p.total_votes || 0), 0);
  const activePollsCount = polls.filter(p => !p.is_closed).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Creator Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">Manage your active polls, monitor live results, and share shareable links</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPolls}
            title="Refresh List"
            className="p-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 shadow-xs transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/create"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create New Poll
          </Link>
        </div>
      </div>

      {/* Stats Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="glass-card p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Polls</p>
            <p className="text-2xl font-black text-slate-900">{polls.length}</p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Polls</p>
            <p className="text-2xl font-black text-slate-900">{activePollsCount}</p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Votes Received</p>
            <p className="text-2xl font-black text-slate-900">{totalVotesCount}</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search polls by question..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs font-medium"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
      </div>

      {/* Content Area */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-6">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 rounded-2xl border border-slate-200 animate-pulse h-64">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="h-6 bg-slate-200 rounded w-3/4 mb-6"></div>
              <div className="space-y-3">
                <div className="h-3 bg-slate-200 rounded"></div>
                <div className="h-3 bg-slate-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredPolls.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center border border-slate-200 shadow-sm max-w-lg mx-auto my-8">
          <div className="p-4 rounded-full bg-slate-100 border border-slate-200 text-slate-400 w-fit mx-auto mb-4">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Polls Found</h3>
          <p className="text-xs text-slate-500 mb-6">
            {search ? 'No polls match your search query.' : 'You haven\'t created any polls yet. Get started now!'}
          </p>
          <Link
            to="/create"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Create Your First Poll
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPolls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onShare={(p) => setSelectedSharePoll(p)}
              onClosePoll={handleClosePoll}
              onDeletePoll={handleDeletePoll}
            />
          ))}
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        poll={selectedSharePoll}
        isOpen={!!selectedSharePoll}
        onClose={() => setSelectedSharePoll(null)}
      />
    </div>
  );
};
