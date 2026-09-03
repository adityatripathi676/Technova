import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import CinematicBackground from '../components/CinematicBackground';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(form.email, form.password);
    if (result.success) {
      if (result.role === 'admin') navigate('/admin');
      else navigate('/approver');
    } else {
      setError(result.message);
    }
  };

  return (
    <>
      <CinematicBackground />
      <Navbar />
      
      <div className="page" style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', paddingTop: '80px' }}>
        <div style={{ width: '100%', maxWidth: '440px', padding: '0 16px' }}>
          
          <motion.div 
            initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card" 
            style={{ padding: '40px 32px' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                width: '96px', height: '96px',
                margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <img src="/logo-color.png" alt="Technova Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Sign In
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.95rem' }}>
                Manav Rachna International Institute of Research and Studies Event Operating System
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} /> Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@technova.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  autoComplete="email"
                  style={{ borderRadius: 'var(--radius-lg)' }}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={14} /> Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="current-password"
                  style={{ borderRadius: 'var(--radius-lg)' }}
                />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{
                    padding: '14px 18px',
                    background: 'rgba(251, 113, 133, 0.1)',
                    border: '1px solid rgba(251, 113, 133, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--rose)',
                    fontSize: '0.9rem',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontWeight: 500
                  }}
                >
                  <AlertCircle size={18} /> {error}
                </motion.div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: '1rem', marginTop: '8px', borderRadius: 'var(--radius-xl)' }}
                disabled={loading}
              >
                {loading ? 'Authenticating…' : (
                  <>Sign In to Workspace <ArrowRight size={18} /></>
                )}
              </button>
            </form>

            <div className="divider" style={{ margin: '32px 0 24px' }} />
            
            <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Club Coordinator? <Link to="/portal" style={{ color: '#ffffff', fontWeight: 600 }}>Submit an event request →</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}

