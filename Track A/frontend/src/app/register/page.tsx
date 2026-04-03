'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, UserPlus, Loader2, Eye, EyeOff } from 'lucide-react';
import { api, setAuth } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (emailError || !email) {
      setError('Please provide a valid Gmail address.');
      return;
    }
    
    setIsLoading(true);

    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      setAuth(data.accessToken, data.refreshToken);
      localStorage.setItem('userName', data.user.name);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-card">
        <div className="auth-header">
          <h1 className="title">Create Account</h1>
          <p className="subtitle">Sign up to get started</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              required
              className="input-field"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              required
              className="input-field"
              placeholder="you@gmail.com"
              value={email}
              onChange={(e) => {
                const val = e.target.value;
                setEmail(val);
                if (val && !/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(val)) {
                  setEmailError('Please enter a valid Gmail address (@gmail.com)');
                } else {
                  setEmailError('');
                }
              }}
              style={emailError ? { borderColor: 'var(--danger-color)' } : {}}
            />
            {emailError && (
              <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {emailError}
              </span>
            )}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                className="input-field"
                placeholder="••••••••"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '2.5rem', width: '100%' }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPassword(!showPassword);
                }}
                style={{ 
                  position: 'absolute', right: '0.75rem', top: '50%', 
                  transform: 'translateY(-50%)', background: 'transparent', 
                  border: 'none', color: 'var(--text-primary)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 20, padding: '0.25rem'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={18} />}
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link href="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
