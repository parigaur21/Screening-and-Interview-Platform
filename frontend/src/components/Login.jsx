import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Link, useNavigate } from 'react-router-dom';
import Background3D from './Background3D';

export default function Login() {
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(username, password);
    setLoading(false);
    if (!res.success) {
      showNotification(res.message, 'error');
    } else {
      showNotification('Login successful!', 'success');
      navigate('/');
    }
  };

  return (
    <div className="auth-page" style={{ 
      position: 'relative', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      overflow: 'hidden',
      backgroundColor: '#080C14'
    }}>
      {/* 3D Moving Mesh Background */}
      <Background3D />

      <form 
        onSubmit={handleSubmit} 
        className="glass-card" 
        style={{ 
          position: 'relative',
          zIndex: 10,
          padding: '3rem 2.5rem', 
          width: '100%',
          maxWidth: '420px', 
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(135deg, #ffffff 40%, var(--color-secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Welcome Back
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Access the AI Screening & Interview Portal
          </p>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ color: 'var(--text-muted)' }}>Username or Email</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Enter your username" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            required 
            style={{ 
              background: 'rgba(8, 12, 20, 0.8)',
              color: '#ffffff',
              border: '1px solid var(--border-glass)'
            }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ color: 'var(--text-muted)' }}>Password</label>
          <input 
            type="password" 
            className="form-input" 
            placeholder="••••••••" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            style={{ 
              background: 'rgba(8, 12, 20, 0.8)',
              color: '#ffffff',
              border: '1px solid var(--border-glass)'
            }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="btn btn-primary" 
          style={{ 
            width: '100%', 
            padding: '0.85rem', 
            fontSize: '1rem',
            marginTop: '0.5rem' 
          }}
        >
          {loading ? 'Logging in...' : 'Sign In'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Don't have an account? </span>
          <Link to="/signup" style={{ color: 'var(--color-secondary)', fontWeight: 600, textDecoration: 'none' }}>
            Create Account
          </Link>
        </div>
      </form>
    </div>
  );
}
