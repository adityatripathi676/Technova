import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LogIn, Activity, Users, Calendar, FileText, Shield, Zap, Menu, X } from 'lucide-react';
import NotificationButton from './NotificationButton';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    setMobileOpen(false);
    if (user) navigate('/profile');
  };

  const getBrandLink = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'approver') return '/approver';
    return '/portal';
  };

  return (
    <header className="navbar-wrapper">
      <nav className="navbar">
        <Link to={getBrandLink()} className="navbar-brand">
          <div className="navbar-logo-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo-bw.png" alt="Technova Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          </div>
          <div>
            <span className="font-heading" style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff' }}>TECHNOVA</span>
            <span className="hide-on-tablet" style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', fontWeight: 700, marginTop: '-2px', letterSpacing: '0.05em' }}>MANAV RACHNA INTERNATIONAL INSTITUTE OF RESEARCH AND STUDIES</span>
          </div>
        </Link>

        <div className={`navbar-links ${mobileOpen ? 'mobile-open' : ''}`}>
          {/* Shared Links for Everyone */}
          <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
            <Activity size={16} /> Overview
          </Link>
          <Link to="/events" className={`navbar-link ${location.pathname === '/events' ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
            <Calendar size={16} /> Events Directory
          </Link>

          {/* Links for Guests / Unauthenticated Users */}
          {!user && (
            <>
              <Link to="/leaders" className={`navbar-link ${location.pathname === '/leaders' ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                <Users size={16} /> Our Leaders
              </Link>
              <Link to="/portal" className={`navbar-link ${location.pathname === '/portal' ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                <FileText size={16} /> Request Event
              </Link>
            </>
          )}

          {/* Role-specific Workspaces */}
          {user && user.role === 'approver' && (
            <Link to="/approver" className={`navbar-link ${location.pathname === '/approver' ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
              <Shield size={16} /> Approver Review Workspace
            </Link>
          )}

          {user && user.role === 'admin' && (
            <Link to="/admin" className={`navbar-link ${location.pathname === '/admin' ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
              <Shield size={16} /> Admin Command Center
            </Link>
          )}

          {/* Mobile Auth Section */}
          <div className="mobile-auth-section">
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ color: '#fff', fontWeight: 'bold' }}>{user.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.role.toUpperCase()}</div>
                  </div>
                </div>
                <button className="btn btn-ghost" style={{ width: '100%', padding: '12px', justifyContent: 'center', border: '1px solid var(--border)' }} onClick={handleProfile}>
                  My Profile <Users size={16} />
                </button>
                <button className="btn btn-primary" style={{ width: '100%', padding: '12px', justifyContent: 'center' }} onClick={() => { handleLogout(); setMobileOpen(false); }}>
                  Sign Out <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary" style={{ width: '100%', padding: '12px', justifyContent: 'center' }} onClick={() => setMobileOpen(false)}>
                Sign In <LogIn size={16} />
              </Link>
            )}
          </div>
        </div>

        <div className="navbar-right">
          {user && <NotificationButton />}
          
          <div className="desktop-auth-section" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user ? (
              <>
                <div 
                  className="navbar-user-badge" 
                  onClick={handleProfile}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '6px 14px 6px 6px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                  title="My Profile"
                >
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.name}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }}
                    />
                  ) : (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ffffff', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="navbar-user-name hide-on-tablet" style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>{user.name}</span>
                  <span className={`badge ${user.role === 'admin' ? 'badge-rejected' : 'badge-review'} hide-on-tablet`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                    {user.role}
                  </span>
                </div>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '8px 16px', borderRadius: '40px' }}
                  onClick={handleLogout}
                  title="Sign Out"
                >
                  <span className="hide-on-tablet">Sign Out</span> <LogOut size={16} />
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary" style={{ padding: '10px 24px', borderRadius: '40px' }}>
                Sign In <LogIn size={16} />
              </Link>
            )}
          </div>
          
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>
    </header>
  );
}

