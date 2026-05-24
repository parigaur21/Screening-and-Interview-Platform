import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Link, useNavigate } from 'react-router-dom';

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
    <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #6366f1 0%, #22c55e 100%)' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '2.5rem 2rem', borderRadius: 12, boxShadow: '0 4px 32px rgba(0,0,0,0.08)', minWidth: 320 }}>
        <h2 style={{ marginBottom: 24, color: '#222', fontWeight: 800, fontSize: 28 }}>Login</h2>
        <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required style={{ width: '100%', marginBottom: 16, padding: 10, borderRadius: 6, border: '1px solid #ddd' }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', marginBottom: 20, padding: 10, borderRadius: 6, border: '1px solid #ddd' }} />
        <button type="submit" disabled={loading} style={{ width: '100%', background: '#6366f1', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 6, padding: 12, fontSize: 16, cursor: 'pointer', marginBottom: 10 }}>{loading ? 'Logging in...' : 'Login'}</button>
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <span>Don't have an account? <Link to="/signup" style={{ color: '#22c55e', fontWeight: 600 }}>Sign Up</Link></span>
        </div>
      </form>
    </div>
  );
}
