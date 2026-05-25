import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Link, useNavigate } from 'react-router-dom';
import Background3D from './Background3D';

export default function Signup() {
  const { signup } = useAuth();
  const { showNotification } = useNotification();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await signup(username, password);
    setLoading(false);
    if (res.success) {
      showNotification('Registration successful! Please log in.', 'success');
      navigate('/login');
    } else {
      showNotification(res.message, 'error');
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
      {/* 3D Animated Aurora Background */}
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
          <h2 style={{ fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(135deg, #ffffff 40%, var(--color-primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Create Account
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Join the Next-Gen AI Screening Platform
          </p>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ color: 'var(--text-muted)' }}>Choose Username</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. devops_pioneer" 
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
          <label className="form-label" style={{ color: 'var(--text-muted)' }}>Secure Password</label>
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
            marginTop: '0.5rem',
            background: 'linear-gradient(135deg, var(--color-accent), var(--color-primary))',
            boxShadow: '0 4px 15px rgba(217, 70, 239, 0.35)'
          }}
        >
          {loading ? 'Registering...' : 'Sign Up'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--color-secondary)', fontWeight: 600, textDecoration: 'none' }}>
            Login
          </Link>
        </div>
      </form>
    </div>
  );
}
