import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Activity, Users, Calendar, FileText, Shield, Mail, ExternalLink } from 'lucide-react';

const InstagramIcon = ({ size = 24, color = "currentColor", strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const LinkedinIcon = ({ size = 24, color = "currentColor", strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

export default function Footer() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <footer className="site-footer" style={{ background: '#1A1A1A', padding: '120px 0 40px', position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: isHome ? '100px' : '0' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5vw' }}>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '80px', justifyContent: 'space-between', marginBottom: '100px' }}>
          
          {/* Logo & Description Column */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: '1 1 350px' }}>
            <img 
              src="/logo-bw.png" 
              alt="Technova Logo" 
              loading="lazy"
              style={{ width: '220px', height: '220px', objectFit: 'contain', opacity: 0.95, marginBottom: '24px', filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.08))' }} 
            />
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', letterSpacing: '0.12em', marginBottom: '20px' }}>
              TECHNOVA
            </div>
            <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: '420px', lineHeight: '1.8', textAlign: 'justify' }}>
              The Official Technical Society of Manav Rachna International Institute of Research and Studies (MRIIRS). Fostering an environment of innovation, development, and technological excellence among students.
            </p>
          </div>

          {/* Links Columns container */}
          <div style={{ display: 'flex', gap: '80px', flexWrap: 'wrap', paddingTop: '10px', flex: '2 1 500px', justifyContent: 'flex-end' }}>
            
            <div style={{ minWidth: '160px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.8 }}>Platform</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <Link to="/" className="footer-link">
                  <Activity size={16}/> Overview
                </Link>
                <Link to="/leaders" className="footer-link">
                  <Users size={16}/> Our Leaders
                </Link>
                <Link to="/events" className="footer-link">
                  <Calendar size={16}/> Events Calendar
                </Link>
                <Link to="/portal" className="footer-link">
                  <FileText size={16}/> Request Portal
                </Link>
              </div>
            </div>

            <div style={{ minWidth: '160px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.8 }}>Connect</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <a href="https://instagram.com/technova_mriirs" target="_blank" rel="noreferrer" className="footer-link">
                  <InstagramIcon size={16}/> Instagram
                </a>
                <a href="https://linkedin.com/company/technova-mriirs" target="_blank" rel="noreferrer" className="footer-link">
                  <LinkedinIcon size={16}/> LinkedIn
                </a>
                <a href="mailto:technova@mriirs.edu.in" className="footer-link">
                  <Mail size={16}/> Contact Us
                </a>
              </div>
            </div>

            <div style={{ minWidth: '160px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.8 }}>System Access</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <Link to="/login" className="footer-link">
                  <Shield size={16}/> Admin Sign In
                </Link>
                <a href="https://mriirs.edu.in" target="_blank" rel="noreferrer" className="footer-link">
                  <ExternalLink size={16}/> MRIIRS Website
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ padding: '30px 0 0', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#64748b', flexWrap: 'wrap', gap: '20px' }}>
          <div>© {new Date().getFullYear()} Technova MRIIRS. All rights reserved. Designed for excellence.</div>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ background: 'transparent', border: 'none', color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: 0.8 }} onMouseOver={e => e.currentTarget.style.opacity = 1} onMouseOut={e => e.currentTarget.style.opacity = 0.8}>
            Back to Top <ArrowRight size={14} style={{ transform: 'rotate(-90deg)' }}/>
          </button>
        </div>

        <style>{`
          .footer-link {
            color: #94a3b8;
            text-decoration: none;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .footer-link:hover {
            color: #ffffff;
            transform: translateX(4px);
          }
        `}</style>
      </div>
    </footer>
  );
}
