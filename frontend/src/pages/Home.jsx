import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Search, Shield, Zap, Users, Crosshair, ChevronDown, Activity, FileText } from 'lucide-react';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import CinematicBackground from '../components/CinematicBackground';

const FAQS = [
  {
    q: 'What is Technova at Manav Rachna International Institute of Research and Studies?',
    a: 'Technova is the premier Technical Society of Manav Rachna International Institute of Research and Studies (MRIIRS), Faridabad under the Faculty of Engineering & Technology. It orchestrates hackathons, workshops, coding competitions, robotics expos, and society collaborations across all university departments.'
  },
  {
    q: 'How do club coordinators submit event logistics requests?',
    a: 'Coordinators simply navigate to the Event Request Portal, enter submitter details, select their associated MRIIRS club, specify line-item resources (IT support, Canopies, Seating, Electrical, Media), and submit the form. A unique 4-digit Event ID is instantly generated.'
  },
  {
    q: 'Can students track approval status without logging in?',
    a: 'Yes! Anyone can enter their 4-digit Event ID or submitter email in the tracking bar to get real-time telemetry on line-item approvals, assigned operational officers, and published announcements.'
  },
  {
    q: 'Who evaluates and approves campus event requests?',
    a: 'Authorized faculty approvers and department heads log into the Approver Workspace to review line items, assign operational personnel, approve logistics, and publish next-day bulletins.'
  }
];

// Reusable cinematic animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

export default function Home() {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [leadersPreview, setLeadersPreview] = useState([]);

  const [homeTrackInput, setHomeTrackInput] = useState('');
  const [homeTrackResult, setHomeTrackResult] = useState(null);
  const [homeTrackError, setHomeTrackError] = useState('');
  const [homeTracking, setHomeTracking] = useState(false);

  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    API.get('/clubs')
      .then(res => {
        // Backend already filters isActive — no need to double-check on client
        const real = (res.data || []).filter(c => !c.clubName.endsWith('(Society Root)'));
        setClubs(real);
        setLoadingClubs(false);
      })
      .catch(err => {
        console.error('Failed to load clubs:', err);
        setLoadingClubs(false);
      });

    API.get('/team')
      .then(res => setLeadersPreview((res.data || []).slice(0, 3)))
      .catch(() => {});
  }, []);

  const handleHomeTrack = async (e) => {
    e.preventDefault();
    if (!homeTrackInput.trim()) return;
    setHomeTracking(true);
    setHomeTrackError('');
    setHomeTrackResult(null);

    try {
      const input = homeTrackInput.trim();
      if (/^\d{4}$/.test(input)) {
        const { data } = await API.get(`/events/track/${input}`);
        setHomeTrackResult(data);
      } else {
        const { data } = await API.get(`/events/track-by-email?email=${encodeURIComponent(input)}`);
        if (Array.isArray(data) && data.length > 0) {
          setHomeTrackResult(data[0]);
        } else {
          setHomeTrackError('No event request record found for this email address.');
        }
      }
    } catch (err) {
      setHomeTrackError(err.response?.data?.message || 'Event request record not found.');
    } finally {
      setHomeTracking(false);
    }
  };

  return (
    <>
      <CinematicBackground />
      <Navbar />
      
      {/* Ensure content sits above the fixed background */}
      <div style={{ position: 'relative', zIndex: 1, padding: '100px 0 0' }}>
        
        {/* ── HERO BANNER ── */}
        <motion.div 
          className="container" 
          initial="hidden" 
          animate="visible" 
          variants={staggerContainer}
          style={{ minHeight: '85vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}
        >
          <motion.div variants={fadeUp} className="mono-label" style={{ marginBottom: '24px', letterSpacing: '0.2em' }}>
            MANAV RACHNA INTERNATIONAL INSTITUTE OF RESEARCH AND STUDIES · TECHNOVA TECH SOCIETY
          </motion.div>
          <motion.h1 variants={fadeUp} style={{ fontSize: '5rem', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: '32px', maxWidth: '1000px' }}>
            Empowering <span className="text-gradient">Technical</span> Excellence
          </motion.h1>
          <motion.p variants={fadeUp} style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '720px', lineHeight: 1.7, marginBottom: '48px' }}>
            The flagship technical operating system of Manav Rachna International Institute of Research and Studies. Streamlining student hackathons, logistics routing, faculty approvals, and real-time event telemetry.
          </motion.p>
          <motion.div variants={fadeUp} style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/portal" className="btn btn-primary" style={{ padding: '16px 36px', fontSize: '1.05rem', borderRadius: 'var(--radius-xl)' }}>
              <Zap size={20} /> Submit Event Request
            </Link>
            <Link to="/events" className="btn btn-dark" style={{ padding: '16px 36px', fontSize: '1.05rem', borderRadius: 'var(--radius-xl)' }}>
              <Calendar size={20} /> View Events Directory
            </Link>
          </motion.div>
        </motion.div>

        <div className="container">
          
          {/* ── EXPLAIN THE SOCIETY ── */}
          <motion.div 
            className="section"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className="mono-label" style={{ marginBottom: '12px' }}>// ABOUT TECHNOVA</motion.div>
            <motion.h2 variants={fadeUp} style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '24px' }}>
              What is Technova Tech Society?
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '900px', lineHeight: '1.8', marginBottom: '48px' }}>
              Technova is the premier student-led technical society under the <strong>Faculty of Engineering & Technology at Manav Rachna International Institute of Research and Studies (MRIIRS), Faridabad</strong>. Founded to foster a culture of algorithmic thinking, full-stack engineering, robotics innovation, and cyber security, Technova serves as the nerve center for all technical events, workshops, hackathons, and multi-club collaborations on campus.
            </motion.p>

            <motion.div variants={staggerContainer} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              <motion.div variants={fadeUp} className="glass-card card-interactive">
                <Crosshair size={36} color="var(--primary)" style={{ marginBottom: '24px' }} />
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px' }}>Our Mission</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  To empower MRIIRS engineering students with industry-aligned technical skills, hands-on hackathons, and seamless campus event management.
                </p>
              </motion.div>
              <motion.div variants={fadeUp} className="glass-card card-interactive">
                <Activity size={36} color="var(--primary)" style={{ marginBottom: '24px' }} />
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px' }}>Innovation & Growth</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  Connecting 25+ campus clubs, IEEE MRIIRS chapters, and competitive programming wings under one automated approval system.
                </p>
              </motion.div>
              <motion.div variants={fadeUp} className="glass-card card-interactive">
                <Zap size={36} color="var(--primary)" style={{ marginBottom: '24px' }} />
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px' }}>Logistics Automation</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  Eliminating manual paperwork through real-time line-item resource dispatch, designated contact officers, and instant telemetry.
                </p>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* ── LIVE SEARCH TELEMETRY QUERY ── */}
          <motion.div 
            className="section"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
          >
            <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                <Search size={40} color="var(--primary)" style={{ margin: '0 auto 24px', opacity: 0.8 }} />
                <div className="mono-label" style={{ marginBottom: '12px' }}>// REAL-TIME STATUS QUERY</div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '16px' }}>
                  Track Your Event Telemetry
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '32px' }}>
                  Enter any 4-digit Event ID or submitter email below to check approval status and assigned contact officers.
                </p>

                <form onSubmit={handleHomeTrack} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <input
                    placeholder="Enter 4-digit Event ID (e.g. 1024) or Email"
                    value={homeTrackInput}
                    onChange={e => setHomeTrackInput(e.target.value)}
                    style={{ flex: 1, padding: '18px 24px', fontSize: '1rem', borderRadius: 'var(--radius-xl)' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '18px 36px', borderRadius: 'var(--radius-xl)' }} disabled={homeTracking}>
                    {homeTracking ? 'Searching…' : 'Query Status'}
                  </button>
                </form>

                {homeTrackError && (
                  <p style={{ color: 'var(--rose)', marginTop: '20px', fontSize: '0.95rem', fontWeight: 600 }}>
                    {homeTrackError}
                  </p>
                )}

                {homeTrackResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="card" style={{ marginTop: '32px', textAlign: 'left', padding: '32px', background: 'rgba(30,30,30,0.8)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.4rem' }}>#{homeTrackResult.eventId}</span>
                      <StatusBadge status={homeTrackResult.overallStatus} />
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>{homeTrackResult.eventName}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '8px', display: 'flex', gap: '16px' }}>
                      <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}><Shield size={16}/> {homeTrackResult.clubName}</span>
                      <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}><Crosshair size={16}/> {homeTrackResult.venue}</span>
                    </div>
                    <button
                      className="btn btn-ghost"
                      style={{ marginTop: '24px', width: '100%', padding: '14px', borderRadius: 'var(--radius-lg)' }}
                      onClick={() => navigate(`/portal?tab=track`)}
                    >
                      View Full Details & Announcements <ArrowRight size={16} />
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── OUR LEADERS SPOTLIGHT SECTION ── */}
          <motion.div 
            className="section"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div className="mono-label" style={{ marginBottom: '12px' }}>// SOCIETY LEADERSHIP</div>
                <h2 style={{ fontSize: '2.8rem', fontWeight: 900 }}>Meet Our Leaders</h2>
              </div>
              <Link to="/leaders" className="btn btn-ghost" style={{ padding: '12px 28px', borderRadius: 'var(--radius-xl)' }}>
                View All Leaders <ArrowRight size={18} />
              </Link>
            </div>

            {leadersPreview.length === 0 ? (
              <div className="glass-card text-center" style={{ padding: '60px 40px', opacity: 0.7 }}>
                <Users size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }}/>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Leadership directory coming soon.</p>
              </div>
            ) : (
              <div className="leaders-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
                {leadersPreview.map(leader => (
                  <motion.div variants={fadeUp} key={leader._id} className="glass-card card-interactive" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ width: '100%', height: '280px', position: 'relative', overflow: 'hidden', background: '#111', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}>
                      {leader.image ? (
                        <img src={leader.image} alt={leader.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%) contrast(1.1) brightness(0.9)', mixBlendMode: 'luminosity', transition: 'all 0.5s ease' }} onMouseOver={e => { e.currentTarget.style.filter = 'grayscale(0%)'; e.currentTarget.style.transform = 'scale(1.05)'; }} onMouseOut={e => { e.currentTarget.style.filter = 'grayscale(100%) contrast(1.1) brightness(0.9)'; e.currentTarget.style.transform = 'scale(1)'; }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', fontWeight: 900, color: 'rgba(255,255,255,0.1)' }}>{leader.name.charAt(0)}</div>
                      )}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px', background: 'linear-gradient(to top, rgba(20,20,20,1), transparent)' }} />
                    </div>
                    <div style={{ padding: '24px 32px 32px', flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(20,20,20,0.8)' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', marginBottom: '6px', letterSpacing: '-0.02em' }}>{leader.name}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{leader.role}</div>
                      {leader.bio && <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7, flex: 1 }}>{leader.bio}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── REGISTERED MRIIRS CLUBS ── */}
          <motion.div 
            className="section"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <div className="mono-label" style={{ marginBottom: '12px' }}>// UNIVERSITY CLUBS DIRECTORY</div>
            <h2 style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: '40px' }}>
              Active Clubs Registered
            </h2>

            {loadingClubs ? (
              <p style={{ color: 'var(--text-secondary)' }}>Loading registered clubs…</p>
            ) : clubs.length === 0 ? (
              <div className="glass-card text-center" style={{ padding: '60px' }}>
                <p style={{ color: 'var(--text-muted)' }}>No active clubs registered in system database.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {clubs.map(c => (
                  <motion.div variants={fadeUp} key={c._id} className="glass-card card-interactive" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: '#ffffff', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 900 }}>
                      {c.clubName.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>{c.clubName}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>{c.societyName}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── SYSTEM FAQ ACCORDION ── */}
          <motion.div 
            className="section"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '60px' }}>
              <div>
                <div className="mono-label" style={{ marginBottom: '12px' }}>// FREQUENTLY ASKED QUESTIONS</div>
                <h2 style={{ fontSize: '2.8rem', fontWeight: 900, lineHeight: 1.1 }}>
                  Technical Guidelines
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '20px', fontSize: '1.05rem', lineHeight: 1.6 }}>
                  Detailed instructions & protocols for Manav Rachna International Institute of Research and Studies event coordination.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {FAQS.map((faq, idx) => (
                  <div
                    key={idx}
                    className="glass-card card-interactive"
                    style={{ padding: '24px', cursor: 'pointer', border: openFaq === idx ? '1px solid #fff' : undefined }}
                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>
                      <span>{faq.q}</span>
                      <ChevronDown size={20} style={{ transform: openFaq === idx ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                    </div>
                    {openFaq === idx && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '16px', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>
                        {faq.a}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>

        {/* ── FOOTER STRICTLY #2D2D2D COLOR REQUIREMENT ── */}
        <footer className="site-footer">
          <div className="container">
            <div className="footer-grid">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.4rem', fontWeight: 900, color: '#fff', marginBottom: '16px', letterSpacing: '-0.02em' }}>
                  <div className="navbar-logo-icon" style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}><Zap size={18} /></div> TECHNOVA
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '360px', lineHeight: '1.7' }}>
                  Technova — The Official Technical Society of Manav Rachna International Institute of Research and Studies (MRIIRS), Sector 43, Aravalli Hills, Delhi-Surajkund Road, Faridabad, Haryana 121004.
                </p>
              </div>

              <div>
                <div className="footer-title">Platform</div>
                <div className="footer-links">
                  <Link to="/" className="footer-link"><Activity size={16}/> Overview</Link>
                  <Link to="/leaders" className="footer-link"><Users size={16}/> Our Leaders</Link>
                  <Link to="/events" className="footer-link"><Calendar size={16}/> Events Calendar</Link>
                  <Link to="/portal" className="footer-link"><FileText size={16}/> Request Portal</Link>
                </div>
              </div>

              <div>
                <div className="footer-title">Authority</div>
                <div className="footer-links">
                  <Link to="/login" className="footer-link"><Shield size={16}/> Sign In</Link>
                  <Link to="/approver" className="footer-link"><Shield size={16}/> Approver Workspace</Link>
                  <Link to="/admin" className="footer-link"><Shield size={16}/> Command Center</Link>
                </div>
              </div>

              <div>
                <div className="footer-title">Campus Hub</div>
                <div className="footer-links" style={{ color: '#94a3b8' }}>
                  <span>Manav Rachna International Institute of Research and Studies</span>
                  <span>Faculty of Engg & Tech</span>
                  <span>Department of CST</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', marginTop: '8px', fontWeight: 600 }}>
                    <span style={{ width: '8px', height: '8px', background: '#34d399', borderRadius: '50%' }}/> Operational
                  </span>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px 0 0', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: '#94a3b8', flexWrap: 'wrap', gap: '16px' }}>
              <div>© 2026 Technova — Manav Rachna International Institute of Research and Studies Technical Society. All rights reserved.</div>
              <a href="#top" style={{ color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>Back to Top <ArrowRight size={14} style={{ transform: 'rotate(-90deg)' }}/></a>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}

