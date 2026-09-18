import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ShieldCheck, Database, Radio, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export const Home = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-blue-500/10 blur-[120px] pointer-events-none rounded-full"></div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          GUVI-HCL Full-Stack Live Polling Engine
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-none mb-6">
          Instant Audience Feedback <br />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
            Powered by Redis & Go
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 font-normal mb-10 leading-relaxed">
          Create custom polls, share shareable links, and watch audience votes update in real-time with zero page refresh required. Powered by Redis Pub/Sub, Go (Gin), and MongoDB.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <Link
            to="/create"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all transform hover:-translate-y-0.5"
          >
            Create Your First Poll
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/register"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm border border-slate-300 shadow-sm transition-all"
          >
            Sign Up as Creator
          </Link>
        </div>
      </section>

      {/* Tech Stack Integration Badge Row */}
      <section className="max-w-5xl mx-auto px-4 py-8 relative z-10 border border-slate-200 bg-white/90 backdrop-blur-md my-8 rounded-3xl shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Frontend</span>
            <span className="text-base font-bold text-sky-600">React + Tailwind</span>
          </div>
          <div className="p-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Backend</span>
            <span className="text-base font-bold text-emerald-600">Go (Gin)</span>
          </div>
          <div className="p-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Realtime Layer</span>
            <span className="text-base font-bold text-rose-600">Redis Pub/Sub</span>
          </div>
          <div className="p-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Database</span>
            <span className="text-base font-bold text-amber-600">MongoDB</span>
          </div>
        </div>
      </section>

      {/* Core Architectural Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">Built for High Performance & Accuracy</h2>
          <p className="text-sm text-slate-500 mt-2">Strict separation of concerns, active Redis tallying, and robust backend validation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 w-fit mb-4">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Redis Pub/Sub Real-time</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Votes execute atomic increments in Redis and broadcast immediately via WebSockets to all connected client screens.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 w-fit mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Server-Side Validation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Client inputs are strictly validated on the Go backend. Prevents vote manipulation, duplicate submissions, and invalid payload formats.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 w-fit mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Persistent MongoDB Audit</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every vote event is persisted to MongoDB audit logs while Redis keeps live results ultra-fast and resilient against failures.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
