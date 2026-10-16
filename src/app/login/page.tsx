'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Film, Eye, EyeOff, Sparkles, KeyRound, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const DEMO_USERS = [
  { name: 'Alex Rivera', email: 'alex@cineverse.io', role: 'Filmmaker & Cinephile' },
  { name: 'Sophia Chen', email: 'sophia@cineverse.io', role: 'Film Critic' },
  { name: 'Marcus Vance', email: 'marcus@cineverse.io', role: 'Screenwriter' },
];

export default function LoginPage() {
  const { user, login, register, isLoading: isAuthLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    displayName: ''
  });

  useEffect(() => {
    if (!isAuthLoading && user) {
      router.push('/');
    }
  }, [user, isAuthLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setError('');
    setLoading(true);
    setFormData(prev => ({ ...prev, email: demoEmail, password: 'password123' }));
    
    const result = await login(demoEmail, 'password123');
    setLoading(false);
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Demo login failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await login(formData.email, formData.password);
        if (res.success) {
          router.push('/');
        } else {
          setError(res.error || 'Login failed');
        }
      } else {
        const res = await register({
          username: formData.username,
          displayName: formData.displayName,
          email: formData.email,
          password: formData.password,
        });
        if (res.success) {
          router.push('/');
        } else {
          setError(res.error || 'Registration failed');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Cinematic Background Backdrop */}
      <div 
        className="absolute inset-0 z-0 opacity-30 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=3270&auto=format&fit=crop")',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/80 to-black z-0" />

      {/* Header */}
      <header className="relative z-10 px-6 py-8 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <Film className="w-7 h-7" />
          <span className="text-2xl font-bold tracking-tighter">CINEVERSE.</span>
        </div>
        <div className="text-xs text-gray-400 font-mono hidden sm:block">
          PostgreSQL 16 Academic Relational Platform
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-12">
        <div className="w-full max-w-[460px] bg-gray-950/90 backdrop-blur-2xl border border-gray-900 rounded-3xl p-7 sm:p-10 shadow-2xl space-y-6">
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {isLogin ? 'Enter your credentials or choose a 1-click evaluation profile.' : 'Join the community to track films, write reviews, and build lists.'}
            </p>
          </div>

          {/* Academic 1-Click Evaluation Demo Accounts */}
          {isLogin && (
            <div className="p-3.5 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-white">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Evaluation Demo Accounts
                </span>
                <span className="text-[10px] text-gray-500 font-mono">pwd: password123</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {DEMO_USERS.map((u) => (
                  <button
                    key={u.email}
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemoLogin(u.email)}
                    className="p-2 rounded-xl bg-black hover:bg-gray-800 border border-gray-800 hover:border-gray-600 transition-all text-left flex flex-col justify-between group disabled:opacity-50"
                  >
                    <span className="text-[11px] font-bold text-white group-hover:text-white truncate">
                      {u.name.split(' ')[0]}
                    </span>
                    <span className="text-[9px] text-gray-500 truncate">{u.role}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    placeholder="e.g. christopher_nolan"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Display Name</label>
                  <input
                    type="text"
                    name="displayName"
                    placeholder="e.g. Chris Nolan"
                    value={formData.displayName}
                    onChange={handleChange}
                    className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="alex@cineverse.io"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-rose-400 text-xs py-2.5 px-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl font-mono">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-white text-black font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLogin ? 'Sign In to CineVerse' : 'Create Account'}</span>
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-gray-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-white hover:underline font-semibold"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
