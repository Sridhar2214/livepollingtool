import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart2, Share2, Zap, Users, CheckCircle, ChevronRight, Play } from 'lucide-react';

const AnimatedCounter = ({ target, suffix = '' }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 20);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString()}{suffix}</span>;
};

const steps = [
  { num: '01', icon: BarChart2, title: 'Create Your Poll', desc: 'Design your question with multiple options in seconds. Set expiry, allow multiple choices — fully customizable.', color: 'from-blue-500 to-indigo-600' },
  { num: '02', icon: Share2, title: 'Share the Link', desc: 'Get a unique shareable link instantly. Send it via WhatsApp, email, or any platform — no app needed for voters.', color: 'from-violet-500 to-purple-600' },
  { num: '03', icon: Zap, title: 'Watch Live Results', desc: 'See votes roll in on your dashboard in real-time. Zero refreshes, zero delays — powered by WebSockets.', color: 'from-emerald-500 to-teal-600' },
];

const features = [
  { icon: Zap, title: 'Instant Live Updates', desc: 'Every vote reflects on your dashboard within milliseconds via WebSocket connections.', color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' },
  { icon: Share2, title: 'One-Click Sharing', desc: 'Share your poll with anyone via a simple link. Voters don\'t need to sign up or install anything.', color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
  { icon: Users, title: 'Anonymous Voting', desc: 'Voters stay anonymous. Our fingerprinting prevents duplicate votes while keeping privacy intact.', color: 'text-violet-500', bg: 'bg-violet-50 border-violet-200' },
  { icon: CheckCircle, title: 'Duplicate Prevention', desc: 'Each voter can only vote once per poll, ensuring your results are always accurate and trustworthy.', color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200' },
];

export const Home = () => {
  return (
    <div className="relative overflow-hidden">

      {/* ── HERO ── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-semibold mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Real-Time Live Polling Platform
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-tight mb-6">
            Create Polls.{' '}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Share Instantly.
            </span>
            <br className="hidden sm:block" />
            See Results{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Live.</span>
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" />
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-white/60 mb-10 leading-relaxed">
            Build a poll in 30 seconds, share the link with your audience, and watch votes appear on your dashboard in real-time — no refresh needed.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-bold text-sm shadow-2xl shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 hover:shadow-indigo-500/50"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm backdrop-blur-sm transition-all"
            >
              <Play className="w-4 h-4" />
              Sign In
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-xl mx-auto">
            {[
              { label: 'Polls Created', value: 1200, suffix: '+' },
              { label: 'Votes Cast', value: 48000, suffix: '+' },
              { label: 'Avg. Response Time', value: 50, suffix: 'ms' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-white">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs text-white/40 mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent" />
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-slate-50 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3 block">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">From idea to live poll in 3 steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.num} className="relative group">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[calc(100%_-_16px)] w-8 z-10">
                    <ChevronRight className="w-6 h-6 text-slate-300" />
                  </div>
                )}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg`}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-5xl font-black text-slate-100 absolute top-6 right-8 select-none">{step.num}</div>
                  <h3 className="text-lg font-black text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="bg-white py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3 block">Features</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Everything you need to run great polls</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.title} className="flex gap-5 p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-300 group">
                <div className={`shrink-0 w-12 h-12 rounded-2xl ${f.bg} border flex items-center justify-center`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10 text-center py-16 px-8">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to run your first poll?</h2>
              <p className="text-white/70 mb-8 text-base">Free to use. No credit card. Start in 30 seconds.</p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-indigo-700 font-bold text-sm shadow-xl hover:bg-slate-50 transition-all transform hover:-translate-y-0.5"
              >
                Create Your First Poll
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
