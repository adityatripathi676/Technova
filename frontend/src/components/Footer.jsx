import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Activity, Users, Calendar, FileText, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <footer className="site-footer" style={{ background: '#2D2D2D', padding: '100px 0 40px', position: 'relative', zIndex: 10, marginTop: isHome ? '100px' : '0' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5vw' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '80px', marginBottom: '80px' }}>
          
          {/* Logo Column */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <img 
              src="/logo-bw.png" 
              alt="Technova Logo" 
              style={{ width: '160px', height: '160px', objectFit: 'contain', opacity: 0.9, marginBottom: '24px', filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.05))' }} 
            />
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', letterSpacing: '0.1em', marginBottom: '16px' }}>
              TECHNOVA
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '360px', lineHeight: '1.8' }}>
              The Official Technical Society of Manav Rachna International Institute of Research and Studies (MRIIRS). Building the future through innovation and technology.
            </p>
          </div>

          {/* Links Columns container */}
          <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap', alignContent: 'flex-start', paddingTop: '20px' }}>
            
            <div style={{ minWidth: '150px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.8 }}>Platform</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '10px' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}>
                  <Activity size={16}/> Overview
                </Link>
                <Link to="/leaders" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '10px' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}>
                  <Users size={16}/> Our Leaders
                </Link>
                <Link to="/events" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '10px' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}>
                  <Calendar size={16}/> Events Calendar
                </Link>
                <Link to="/portal" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '10px' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}>
                  <FileText size={16}/> Request Portal
                </Link>
              </div>
            </div>

            <div style={{ minWidth: '150px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.8 }}>System Access</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Link to="/login" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '10px' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}>
                  <Shield size={16}/> Sign In
                </Link>
              </div>
            </div>

          </div>
        </div>

        <div style={{ padding: '30px 0 0', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#64748b', flexWrap: 'wrap', gap: '20px' }}>
          <div>© {new Date().getFullYear()} Technova MRIIRS. All rights reserved.</div>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ background: 'transparent', border: 'none', color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: 0.8 }} onMouseOver={e => e.currentTarget.style.opacity = 1} onMouseOut={e => e.currentTarget.style.opacity = 0.8}>
            Back to Top <ArrowRight size={14} style={{ transform: 'rotate(-90deg)' }}/>
          </button>
        </div>
      </div>
    </footer>
  );
}
