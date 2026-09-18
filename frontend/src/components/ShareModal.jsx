import React, { useState } from 'react';
import { X, Copy, Check, Share2, ExternalLink } from 'lucide-react';

export const ShareModal = ({ poll, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !poll) return null;

  const shareUrl = `${window.location.origin}/poll/${poll.slug || poll.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(`Vote on: "${poll.question}" on LivePoll!`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md p-6 glass-card rounded-2xl shadow-xl border border-slate-200 text-slate-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Share Live Poll</h3>
            <p className="text-xs text-slate-500">Anyone with this link can cast their vote</p>
          </div>
        </div>

        <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-1">Poll Question</p>
          <p className="text-sm font-semibold text-slate-900 line-clamp-2">{poll.question}</p>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-700 mb-2">Shareable Link</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono text-slate-800 select-all"
            />
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Quick Social Sharing */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-500">Quick Share</label>
          <div className="grid grid-cols-3 gap-2">
            <a
              href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-medium transition"
            >
              WhatsApp
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 text-xs font-medium transition"
            >
              Twitter / X
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-medium transition"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
