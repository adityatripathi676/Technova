import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Code, Mail, MapPin, Users } from 'lucide-react';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import CinematicBackground from '../components/CinematicBackground';

export default function LeadersPage() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/team')
      .then(res => { setLeaders(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <CinematicBackground />
      <Navbar />
      <div className="page" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="container" style={{ flex: 1, paddingBottom: '100px' }}>

          <div className="page-header text-center" style={{ maxWidth: '800px', margin: '0 auto 60px' }}>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mono-label" style={{ marginBottom: '16px', display: 'inline-block', padding: '6px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.1)' }}>
              // TECHNOVA LEADERSHIP DIRECTORY
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ fontSize: '3.5rem', fontWeight: 900, color: '#fff', marginBottom: '24px', lineHeight: 1.1 }}>
              Executive Leaders <span style={{ color: 'var(--text-muted)' }}>& Coordinators</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: 1.6 }}>
              Meet the student leaders, technical heads, and coordinators driving innovation across Manav Rachna International Institute of Research and Studies.
            </motion.p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '40px' }}>
              {[1,2,3].map(i => (
                <div key={i} className="glass-card" style={{ height: '480px', opacity: 0.4, animation: 'pulse 2s infinite', flex: '1 1 300px', maxWidth: '350px' }} />
              ))}
            </div>
          ) : leaders.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card text-center" style={{ maxWidth: '600px', margin: '80px auto', padding: '80px 40px' }}>
              <Users size={64} color="var(--text-muted)" style={{ margin: '0 auto 24px' }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>No Leaders Listed Yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
                The leadership directory will be populated by the admin team shortly.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden" animate="show"
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.15 } } }}
              style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '40px' }}
            >
              {leaders.map(leader => (
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                  whileHover={{ y: -8 }}
                  key={leader._id}
                  className="glass-card"
                  style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-lg)', flex: '1 1 300px', maxWidth: '350px' }}
                >
                  <div style={{ width: '100%', height: '280px', position: 'relative', overflow: 'hidden', background: '#111' }}>
                    {leader.image ? (
                      <img
                        src={leader.image}
                        alt={leader.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%) contrast(1.1) brightness(0.9)', mixBlendMode: 'luminosity', transition: 'all 0.5s ease' }}
                        onMouseOver={e => { e.currentTarget.style.filter = 'grayscale(0%)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseOut={e => { e.currentTarget.style.filter = 'grayscale(100%) contrast(1.1) brightness(0.9)'; e.currentTarget.style.transform = 'scale(1)'; }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', fontWeight: 900, color: 'rgba(255,255,255,0.1)' }}>
                        {leader.name.charAt(0)}
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px', background: 'linear-gradient(to top, rgba(18,18,18,0.95), transparent)' }} />
                  </div>
                  <div style={{ padding: '24px 32px 32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', marginBottom: '6px', letterSpacing: '-0.02em' }}>{leader.name}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{leader.role}</div>
                    {leader.department && (
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16}/> {leader.department}
                      </div>
                    )}
                    {leader.bio && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '32px', flex: 1 }}>{leader.bio}</p>
                    )}
                    <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
                      {leader.linkedinUrl && (
                        <a href={leader.linkedinUrl} className="btn btn-dark" style={{ width: '44px', height: '44px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} target="_blank" rel="noreferrer"><Briefcase size={18}/></a>
                      )}
                      {leader.githubUrl && (
                        <a href={leader.githubUrl} className="btn btn-dark" style={{ width: '44px', height: '44px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} target="_blank" rel="noreferrer"><Code size={18}/></a>
                      )}
                      <a href={`mailto:${leader.email || ''}`} className="btn btn-dark" style={{ width: '44px', height: '44px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Mail size={18}/>
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* ── FOOTER STRICTLY #2D2D2D ── */}
        <footer style={{ background: '#2D2D2D', padding: '80px 0 30px', position: 'relative', zIndex: 10 }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '60px', marginBottom: '60px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginBottom: '20px', letterSpacing: '-0.02em' }}>
                  <img src="/logo-bw.png" alt="Technova Logo BW" style={{ width: '48px', height: '48px', objectFit: 'contain' }} /> TECHNOVA
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '400px', lineHeight: '1.7', marginBottom: '32px' }}>
                  Technova — The Official Technical Society of Manav Rachna International Institute of Research and Studies (MRIIRS), Sector 43, Aravalli Hills, Delhi-Surajkund Road, Faridabad, Haryana 121004.
                </p>
              </div>

              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', marginBottom: '24px', letterSpacing: '0.05em' }}>Platform</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[['/', 'Overview'], ['/leaders', 'Our Leaders'], ['/events', 'Events Calendar'], ['/portal', 'Request Portal']].map(([href, label]) => (
                    <a key={href} href={href} style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}>{label}</a>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', marginBottom: '24px', letterSpacing: '0.05em' }}>Authority</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[['/login', 'Sign In'], ['/approver', 'Approver Workspace'], ['/admin', 'Command Center']].map(([href, label]) => (
                    <a key={href} href={href} style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}>{label}</a>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '24px 0 0', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: '#64748b', flexWrap: 'wrap', gap: '10px' }}>
              <div>© 2026 Technova — Manav Rachna International Institute of Research and Studies Technical Society. All rights reserved.</div>
              <a href="#top" style={{ color: '#64748b', textDecoration: 'none', fontWeight: 600 }}>Back to Top ↑</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
