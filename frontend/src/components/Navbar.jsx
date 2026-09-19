import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Plus, LayoutDashboard, LogOut, User, LogIn, UserPlus } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">
            Live<span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Poll</span>
          </span>
        </Link>

        {/* Right Navigation */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/create"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Create Poll
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 font-medium text-xs transition"
              >
                <LayoutDashboard className="w-4 h-4 text-blue-600" />
                Dashboard
              </Link>
              <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 pl-1">
                <span className="p-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                </span>
                <span className="hidden sm:inline font-semibold text-slate-800">{user.username}</span>
                <button
                  onClick={handleLogout}
                  title="Log Out"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 font-medium text-xs transition"
              >
                <LogIn className="w-4 h-4 text-blue-600" />
                Log In
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-sm shadow-indigo-600/20 transition"
              >
                <UserPlus className="w-4 h-4" />
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
