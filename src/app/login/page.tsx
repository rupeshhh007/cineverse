'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Film, Eye, EyeOff, Sparkles, KeyRound, Loader2, Database, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const DEMO_USERS = [
  { name: 'Alex Rivera', email: 'alex@cineverse.io', role: 'Filmmaker & Cinephile', initials: 'AR' },
  { name: 'Sophia Chen', email: 'sophia@cineverse.io', role: 'Film Critic', initials: 'SC' },
  { name: 'Marcus Vance', email: 'marcus@cineverse.io', role: 'Screenwriter', initials: 'MV' },
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
    <div className="min-h-screen bg-[#0b0e0a] text-[#efece3] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans selection:bg-[#3d4c38] selection:text-[#efece3]">
      
      {/* Framed Split Canvas */}
      <div className="w-full max-w-5xl h-auto min-h-[640px] bg-[#161d15] rounded-[24px] sm:rounded-[32px] border border-[#3e4c3a]/50 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Column: Cinematic Editorial Art Panel (6 cols on lg) */}
        <div className="lg:col-span-6 relative p-8 sm:p-12 flex flex-col justify-between overflow-hidden bg-[#101710] min-h-[320px] lg:min-h-full">
          {/* Cinematic Background Poster Art */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105 pointer-events-none"
            style={{ 
              backgroundImage: 'url("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=3270&auto=format&fit=crop")',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101710] via-[#101710]/70 to-[#101710]/40 pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10 flex items-center gap-2">
            <span className="font-serif font-black tracking-tight text-xl text-[#efece3]">
              CINEVERSE<span className="text-[#f2685e]">.</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#222d22] border border-[#3e4c3a]/50 text-[#aeb9a8]">
              Private Screening Room
            </span>
          </div>

          {/* Center Editorial Title & Quote */}
          <div className="relative z-10 my-auto py-8 space-y-4">
            <div className="text-[11px] font-mono uppercase tracking-widest text-[#a9cc92]">
              The Private Screening Room
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#efece3] leading-tight">
              Stories stay.<br />
              <span className="italic font-normal text-[#aeb9a8]">So do we.</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#aeb9a8] max-w-md leading-relaxed">
              A private platform for cinephiles, critics, and collectors. Curate collections, explore relational analytics, and verify database triggers in real time.
            </p>
          </div>

          {/* Bottom Engine Badge */}
          <div className="relative z-10 pt-4 border-t border-[#3e4c3a]/30 flex items-center justify-between text-[11px] font-mono text-[#aeb9a8]">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#a9cc92]" />
              <span>PostgreSQL 16 Architecture</span>
            </span>
            <span className="text-[#aeb9a8]/70">3NF Schema</span>
          </div>
        </div>

        {/* Right Column: Credential Form & Demo Profiles (6 cols on lg) */}
        <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-[#161d15] border-t lg:border-t-0 lg:border-l border-[#3e4c3a]/40">
          
          <div className="space-y-6">
            {/* Header Switcher */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#efece3]">
                  {isLogin ? 'Welcome back' : 'Create an account'}
                </h1>
                <p className="text-xs text-[#aeb9a8] mt-0.5">
                  {isLogin ? 'Sign in to access your screening room.' : 'Join Cineverse to start rating films.'}
                </p>
              </div>

              {/* Mode Toggle Pills */}
              <div className="flex items-center p-1 rounded-xl bg-[#222d22] border border-[#3e4c3a]/50 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setError(''); }}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    isLogin ? 'bg-[#a9cc92] text-[#0b0e0a] font-bold' : 'text-[#aeb9a8] hover:text-[#efece3]'
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setError(''); }}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    !isLogin ? 'bg-[#a9cc92] text-[#0b0e0a] font-bold' : 'text-[#aeb9a8] hover:text-[#efece3]'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Academic 1-Click Evaluation Demo Accounts */}
            {isLogin && (
              <div className="p-3.5 rounded-2xl bg-[#222d22]/70 border border-[#3e4c3a]/40 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="flex items-center gap-1.5 text-[#efece3] font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-[#a9cc92]" />
                    <span>Evaluation Demo Accounts</span>
                  </span>
                  <span className="text-[10px] text-[#aeb9a8]/70">pwd: password123</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {DEMO_USERS.map((u) => (
                    <button
                      key={u.email}
                      type="button"
                      disabled={loading}
                      onClick={() => handleDemoLogin(u.email)}
                      className="p-2 rounded-xl bg-[#152016] hover:bg-[#1f2c1d] border border-[#3e4c3a]/40 hover:border-[#a9cc92]/50 transition-all text-left group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-[#222d22] border border-[#3e4c3a]/50 text-[9px] font-mono font-bold flex items-center justify-center text-[#a9cc92]">
                          {u.initials}
                        </div>
                        <span className="text-[11px] font-bold text-[#efece3] group-hover:text-[#a9cc92] truncate">
                          {u.name.split(' ')[0]}
                        </span>
                      </div>
                      <div className="text-[9px] text-[#aeb9a8]/70 truncate mt-1">
                        {u.role.split(' ')[0]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-[#d56b70]/10 border border-[#d56b70]/20 text-xs text-[#d56b70] font-mono">
                {error}
              </div>
            )}

            {/* Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#efece3] mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      required
                      placeholder="e.g. Maya Lin"
                      value={formData.displayName}
                      onChange={handleChange}
                      className="w-full bg-[#152016] border border-[#3e4c3a]/50 rounded-xl px-3.5 py-2 text-xs text-[#efece3] placeholder-[#aeb9a8]/40 focus:outline-none focus:border-[#a9cc92] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#efece3] mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      required
                      placeholder="e.g. mayalin"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full bg-[#152016] border border-[#3e4c3a]/50 rounded-xl px-3.5 py-2 text-xs text-[#efece3] placeholder-[#aeb9a8]/40 focus:outline-none focus:border-[#a9cc92] font-mono"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#efece3] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="alex@cineverse.io"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-[#152016] border border-[#3e4c3a]/50 rounded-xl px-3.5 py-2 text-xs text-[#efece3] placeholder-[#aeb9a8]/40 focus:outline-none focus:border-[#a9cc92] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#efece3] mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-[#152016] border border-[#3e4c3a]/50 rounded-xl pl-3.5 pr-10 py-2 text-xs text-[#efece3] placeholder-[#aeb9a8]/40 focus:outline-none focus:border-[#a9cc92] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aeb9a8] hover:text-[#efece3]"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#a9cc92] hover:bg-[#a9cc92]/90 text-[#0b0e0a] font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>{isLogin ? 'Sign In to Screening Room' : 'Create Member Account'}</span>
                )}
              </button>
            </form>

          </div>

          {/* Subdued Footer */}
          <div className="pt-6 text-center text-[11px] font-mono text-[#aeb9a8]/60">
            Cineverse • Academic Relational DBMS Project
          </div>

        </div>

      </div>

    </div>
  );
}
