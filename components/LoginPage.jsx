import React, { useState } from 'react';

export const LoginPage = ({ onLogin, onBackToLanding }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = isRegistering ? '/api/register' : '/api/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (response.ok) {
        if (isRegistering) {
          setIsRegistering(false);
          setError('Account created! Please sign in.');
          setEmail('');
          setPassword('');
        } else {
          onLogin(data);
        }
      } else {
        setError(data.error || 'Operation failed');
      }
    } catch (err) {
      setError('Connection failed. Please check your server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-[#94a3b8] fade-in">
      {/* Navbar with back button */}
      <nav className="flex items-center px-8 py-6 w-full max-w-7xl mx-auto">
        <span
          onClick={onBackToLanding}
          className="text-xl font-bold tracking-tight text-white hover:opacity-80 transition-opacity cursor-pointer"
        >
          SecureCloud
        </span>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-12">
        <div className="w-full max-w-[440px] auth-card rounded-2xl p-10 relative">
          {/* Key Icon */}
          <div className="flex justify-center mb-6">
            <svg className="w-12 h-12 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">
              {isRegistering ? 'Create Your Account' : 'Welcome Back'}
            </h1>
            <p className="text-[#64748b] text-sm">
              {isRegistering ? 'Get started by creating a new account' : 'Enter your credentials to continue'}
            </p>
          </div>

          {error && (
            <div className={`mb-6 p-4 rounded-xl text-xs font-semibold text-center border ${error.includes('created') ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/5 text-rose-400 border-rose-500/20'}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#64748b] ml-1">Email</label>
              <input
                type="email"
                required
                className="w-full bg-[#1a1f2e] border border-white/10 px-4 py-3.5 rounded-xl outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all text-sm text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#64748b] ml-1">Password</label>
              <input
                type="password"
                required
                className="w-full bg-[#1a1f2e] border border-white/10 px-4 py-3.5 rounded-xl outline-none focus:ring-1 focus:ring-[#3b82f6] transition-all text-sm text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : (isRegistering ? 'Sign Up' : 'Login')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-[#64748b]">
              {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
              <button
                onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                className="text-[#3b82f6] hover:underline font-medium"
              >
                {isRegistering ? 'Login' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};