import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Lock, Mail, ShieldCheck, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/api/auth/login', { email, password });
      login(res.data.accessToken, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string) => {
    setEmail(userEmail);
    setPassword('Password@123');
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email: userEmail, password: 'Password@123' });
      login(res.data.accessToken, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-paper p-4">
      <div className="card-manifest w-full max-w-md bg-white p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded bg-ledger mx-auto flex items-center justify-center font-mono font-bold text-white text-2xl mb-3 shadow-sm">
            EP
          </div>
          <h1 className="font-display font-extrabold text-2xl text-ink">PAPER TRAIL ERP</h1>
          <p className="text-slate text-xs font-mono mt-1">Wholesale & Distribution Operations Portal</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-signal-redLight border border-signal-red/30 rounded text-signal-red text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate uppercase mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@minierp.com"
                className="w-full pl-9 pr-3 py-2 text-sm bg-paper border border-slate-border rounded focus:outline-none focus:border-ledger font-sans text-ink"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate uppercase mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-paper border border-slate-border rounded focus:outline-none focus:border-ledger font-sans text-ink"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-ledger hover:bg-ledger-hover text-white font-semibold rounded text-sm transition shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Evaluator Demo Test Logins */}
        <div className="mt-8 pt-6 border-t border-slate-border">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate mb-3">
            <ShieldCheck className="w-4 h-4 text-ledger" />
            <span>Test Role Quick Logins (Shared Pass: Password@123):</span>
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <button
              onClick={() => handleQuickLogin('admin@minierp.com')}
              className="p-2 border border-slate-border rounded bg-paper hover:bg-ledger-light/30 hover:border-ledger text-left transition"
            >
              <span className="font-bold block text-ink">Admin</span>
              <span className="text-[10px] text-slate">admin@minierp.com</span>
            </button>
            <button
              onClick={() => handleQuickLogin('sales@minierp.com')}
              className="p-2 border border-slate-border rounded bg-paper hover:bg-ledger-light/30 hover:border-ledger text-left transition"
            >
              <span className="font-bold block text-ink">Sales</span>
              <span className="text-[10px] text-slate">sales@minierp.com</span>
            </button>
            <button
              onClick={() => handleQuickLogin('warehouse@minierp.com')}
              className="p-2 border border-slate-border rounded bg-paper hover:bg-ledger-light/30 hover:border-ledger text-left transition"
            >
              <span className="font-bold block text-ink">Warehouse</span>
              <span className="text-[10px] text-slate">warehouse@...</span>
            </button>
            <button
              onClick={() => handleQuickLogin('accounts@minierp.com')}
              className="p-2 border border-slate-border rounded bg-paper hover:bg-ledger-light/30 hover:border-ledger text-left transition"
            >
              <span className="font-bold block text-ink">Accounts</span>
              <span className="text-[10px] text-slate">accounts@...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
