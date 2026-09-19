import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Animated live vote bar
const MockPollBar = ({ label, pct, color, delay }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 600 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div className="flex items-center gap-3">
      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0" style={{ background: color }}>{label}</span>
      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${width}%`, background: color }} />
      </div>
      <span className="text-xs font-bold text-slate-500 w-8 text-right">{pct}%</span>
    </div>
  );
};

// Live vote counter
const LiveCounter = () => {
  const [count, setCount] = useState(82);
  useEffect(() => {
    const t = setInterval(() => {
      setCount(c => c >= 99 ? 82 : c + 1);
    }, 2000);
    return () => clearInterval(t);
  }, []);
  return <span className="font-black text-slate-900">{count}%</span>;
};

export const Home = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 40%, #f8fbff 100%)' }}>

      {/* Subtle grid pattern overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #bfdbfe 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.3 }} />

      {/* ── HERO ── */}
      <section className="relative max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left: Copy */}
          <div>
            {/* Status badges */}
            <div className="flex flex-wrap gap-2 mb-8">
              {['Live updates', 'Realtime voting', 'Responsive UI'].map(tag => (
                <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold border border-blue-200">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-6 tracking-tight">
              Turn every decision into a{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">shared moment.</span>
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M0 6 Q50 0 100 5 Q150 10 200 4" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4"/>
                </svg>
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-500 leading-relaxed mb-10 max-w-lg">
              Spark engagement with fast, polished polls that update in real time and let your audience vote without friction.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to={user ? "/create" : "/register"}
                className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md shadow-blue-200"
              >
                Create a poll
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              {user ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-blue-50 text-slate-700 font-bold text-sm border border-blue-200 transition-all"
                >
                  My Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-blue-50 text-slate-700 font-bold text-sm border border-blue-200 transition-all"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>

          {/* Right: Mock Poll Card */}
          <div className="relative">
            {/* Audience pulse badge */}
            <div className="absolute -top-4 -left-4 z-10 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center">
                <span className="text-white text-xs font-black">⚡</span>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Audience pulse</p>
                <p className="text-sm font-black text-slate-900"><LiveCounter /> engagement</p>
              </div>
            </div>

            {/* Main card */}
            <div className="bg-white rounded-3xl border border-blue-100 shadow-xl shadow-blue-100/50 p-6 relative">
              {/* Card header */}
              <div className="flex items-center justify-between mb-5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Open poll
                </span>
                <span className="text-xs text-slate-400 font-medium">24 votes</span>
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-5">What should we launch next?</h3>

              <div className="space-y-3.5 mb-6">
                <MockPollBar label="A" pct={54} color="#3b82f6" delay={0} />
                <MockPollBar label="B" pct={31} color="#8b5cf6" delay={200} />
                <MockPollBar label="C" pct={15} color="#10b981" delay={400} />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400">Live results · updates in real-time</span>
                <div className="flex -space-x-1.5">
                  {['#3b82f6','#8b5cf6','#10b981','#f59e0b'].map((c, i) => (
                    <div key={i} className="w-5 h-5 rounded-full border-2 border-white" style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating notification */}
            <div className="absolute -bottom-3 -right-4 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg flex items-center gap-2">
              <span className="text-base">🗳️</span>
              <div>
                <p className="text-xs font-bold text-slate-900">New vote!</p>
                <p className="text-[10px] text-slate-400">Option A · just now</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="border-t border-blue-100" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)' }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '✦',
                title: 'Launch a live poll',
                desc: 'Create instant, engaging questions and collect real-time responses from your audience.',
              },
              {
                icon: '✦',
                title: 'Track reactions',
                desc: 'Watch live updates and share the current momentum on the results view in real time.',
              },
              {
                icon: '✦',
                title: 'Keep it simple',
                desc: 'A clean polling flow for events, product feedback, classroom polls, and team decisions.',
              },
            ].map((f) => (
              <div key={f.title} className="group p-6 rounded-2xl bg-white border border-blue-100 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/60 transition-all duration-300">
                <span className="text-2xl mb-4 block text-blue-500">{f.icon}</span>
                <h3 className="font-black text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-black text-slate-900 mb-4">Ready to run your first poll?</h2>
        <p className="text-slate-500 mb-8">Free to use. No credit card. Start in 30 seconds.</p>
        <Link
          to={user ? "/create" : "/register"}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-200 transition-all"
        >
          {user ? "Create a poll" : "Get started free"} <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
};
