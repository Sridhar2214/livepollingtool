import React from 'react';
import { Link } from 'react-router-dom';
import { Share2, Lock, Trash2, ExternalLink, BarChart2, Clock } from 'lucide-react';

export const PollCard = ({ poll, onShare, onClosePoll, onDeletePoll }) => {
  const totalVotes = poll.total_votes || 0;

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-200/90 flex flex-col justify-between shadow-xs">
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            {new Date(poll.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <div className="flex items-center gap-1.5">
            {poll.is_closed ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                <Lock className="w-3 h-3 text-rose-600" /> Closed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
              </span>
            )}
          </div>
        </div>

        {/* Question */}
        <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-2 leading-snug">
          {poll.question}
        </h3>
        {poll.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-4">{poll.description}</p>
        )}

        {/* Option Progress Bar Snippets */}
        <div className="space-y-2 mb-4 my-3">
          {poll.options.slice(0, 3).map((opt) => {
            const votes = opt.votes || 0;
            const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            return (
              <div key={opt.id} className="text-xs">
                <div className="flex justify-between text-slate-700 font-medium mb-1">
                  <span className="truncate pr-2 font-medium">{opt.text}</span>
                  <span className="font-semibold text-slate-500 shrink-0">{pct}% ({votes})</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: opt.color || '#2563eb',
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
          {poll.options.length > 3 && (
            <p className="text-[11px] text-slate-400 italic text-right">+ {poll.options.length - 3} more options</p>
          )}
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <BarChart2 className="w-4 h-4 text-blue-600" />
          <span>{totalVotes} total votes</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onShare(poll)}
            title="Share Poll"
            className="p-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600 hover:text-blue-600 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          {!poll.is_closed && (
            <button
              onClick={() => onClosePoll(poll.id)}
              title="Close Poll"
              className="p-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-amber-50 hover:border-amber-200 text-slate-600 hover:text-amber-600 transition"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onDeletePoll(poll.id)}
            title="Delete Poll"
            className="p-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-600 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <Link
            to={`/poll/${poll.slug || poll.id}`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-600 text-blue-700 hover:text-white text-xs font-semibold transition"
          >
            Live View <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
