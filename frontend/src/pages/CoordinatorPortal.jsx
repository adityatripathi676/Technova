import { useState, useEffect } from 'react';
import { useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, Search, CheckCircle, Package, Send, Building2, MapPin, 
  CalendarDays, Clock, LayoutDashboard, UserCircle, AlertCircle, MessageCircle, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import ContactCard from '../components/ContactCard';
import CinematicBackground from '../components/CinematicBackground';

const RESOURCE_LABELS = {
  itPerson: 'IT Person',
  discipline: 'Discipline',
  operations: 'Operations',
  bannerPrintings: 'Banner Printings',
  food: 'Food',
  canopy: 'Canopy',
  chairs: 'Chairs',
  electrician: 'Electrician',
  additionalMediaCoverage: 'Additional Media Coverage',
};

const INITIAL_RESOURCES = Object.fromEntries(
  Object.keys(RESOURCE_LABELS).map(k => [k, { checked: false, count: 0 }])
);

export default function CoordinatorPortal() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(searchParams.get('tab') === 'track' ? 'track' : 'request');
  const [clubs, setClubs] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [form, setForm] = useState({
    empId: '', name: '', email: '', department: '',
    clubName: '', clubCoordinator: '',
    eventName: '', eventDescription: '', eventDuration: '', eventDate: '', venue: '',
    resources: INITIAL_RESOURCES,
    additionalRequirement: '',
    selectedSocieties: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [submitError, setSubmitError] = useState('');
  
  const [trackInput, setTrackInput] = useState('');
  const [trackMode, setTrackMode] = useState('id'); // 'id' | 'email'
  const [trackedEvent, setTrackedEvent] = useState(null);
  const [trackedList, setTrackedList] = useState([]);
  const [tracking, setTracking] = useState(false);
  const [trackError, setTrackError] = useState('');

  // 🛡️ SECURITY & ROLE ISOLATION
  if (user && user.role === 'approver') return <Navigate to="/approver" replace />;
  if (user && user.role === 'admin') return <Navigate to="/admin" replace />;

  useEffect(() => {
    API.get('/clubs').then(r => {
      const real = (r.data || []).filter(c => !c.clubName.endsWith('(Society Root)'));
      setClubs(real);
      const uniqueSocieties = [...new Set(real.map(c => c.societyName))];
      setSocieties(uniqueSocieties);
    });
  }, []);

  const handleClubChange = (clubName) => {
    const club = clubs.find(c => c.clubName === clubName);
    setForm(f => ({ ...f, clubName, clubCoordinator: club ? club.coordinatorName : '' }));
  };

  const handleResourceCheck = (key, checked) => {
    setForm(f => ({ ...f, resources: { ...f.resources, [key]: { ...f.resources[key], checked } } }));
  };

  const handleResourceCount = (key, count) => {
    setForm(f => ({ ...f, resources: { ...f.resources, [key]: { ...f.resources[key], count: Number(count) } } }));
  };

  const handleSocietyToggle = (soc) => {
    setForm(f => ({
      ...f,
      selectedSocieties: f.selectedSocieties.includes(soc)
        ? f.selectedSocieties.filter(s => s !== soc)
        : [...f.selectedSocieties, soc],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = { ...form };
      const { data } = await API.post('/events/submit', payload);
      setSubmitted(data.eventId);
      setForm({ empId: '', name: '', email: '', department: '', clubName: '', clubCoordinator: '', eventName: '', eventDescription: '', eventDuration: '', eventDate: '', venue: '', resources: INITIAL_RESOURCES, additionalRequirement: '', selectedSocieties: [] });
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Submission failed. Please check all fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async (idOverride) => {
    setTrackError('');
    setTrackedEvent(null);
    setTrackedList([]);
    setTracking(true);
    const input = idOverride ?? trackInput;
    try {
      if (trackMode === 'id') {
        const { data } = await API.get(`/events/track/${input.trim()}`);
        setTrackedEvent(data);
      } else {
        const { data } = await API.get(`/events/track-by-email?email=${encodeURIComponent(input.trim())}`);
        setTrackedList(data);
      }
    } catch (err) {
      setTrackError(err.response?.data?.message || 'Event request record not found');
    } finally {
      setTracking(false);
    }
  };

  return (
    <>
      <CinematicBackground />
      <Navbar />
      <div className="page" style={{ position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div className="page-header text-center" style={{ maxWidth: '800px', margin: '0 auto 40px' }}>
            <h1 style={{ fontSize: '3rem', color: '#fff', marginBottom: '16px' }}>Event Request Portal</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Configure logistics, submit requirements, and follow real-time approval status across the campus network.</p>

            <div className="tabs" style={{ justifyContent: 'center', marginTop: '32px' }}>
              <button className={`tab-btn ${tab === 'submit' ? 'active' : ''}`} onClick={() => setTab('submit')}>
                <FileText size={18}/> Submit Request
              </button>
              <button className={`tab-btn ${tab === 'track' ? 'active' : ''}`} onClick={() => setTab('track')}>
                <Search size={18}/> Track Status
              </button>
            </div>
          </div>

          {/* ─── SUBMIT FORM ─── */}
          {tab === 'submit' && (
            submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card text-center" style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 40px' }}>
                <CheckCircle size={64} color="var(--emerald)" style={{ margin: '0 auto 24px' }}/>
                <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '16px', color: '#fff' }}>Application Transmitted</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '1.1rem' }}>Please save your unique reference ID to monitor approval progress.</p>
                <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.1em', margin: '32px 0', textShadow: '0 0 40px rgba(139,92,246,0.3)' }}>
                  #{submitted}
                </div>
                <button className="btn btn-primary" style={{ padding: '16px 32px', borderRadius: 'var(--radius-xl)' }} onClick={() => { setSubmitted(null); setTab('track'); setTrackInput(submitted); setTrackMode('id'); }}>
                  <Search size={18} style={{ marginRight: 8 }}/> Track Status Now
                </button>
              </motion.div>
            ) : (
              <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {/* SUBMITTER INFO */}
                <div className="glass-card">
                  <div className="section-title"><UserCircle size={20}/> Submitter Identity</div>
                  <div className="form-grid form-grid-2">
                    <div className="form-group"><label className="form-label">Employee ID *</label><input placeholder="EMP-001" value={form.empId} onChange={e => setForm(f => ({ ...f, empId: e.target.value }))} required /></div>
                    <div className="form-group"><label className="form-label">Full Name *</label><input placeholder="Your full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
                    <div className="form-group"><label className="form-label">Email Address *</label><input type="email" placeholder="you@college.edu" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
                    <div className="form-group"><label className="form-label">Department *</label><input placeholder="CSE / IT / ECE" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} required /></div>
                    <div className="form-group"><label className="form-label">Associated Club *</label>
                      <select value={form.clubName} onChange={e => handleClubChange(e.target.value)} required>
                        <option value="">Select Club</option>
                        {clubs.map(c => <option key={c._id} value={c.clubName}>{c.clubName}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Club Coordinator</label><input value={form.clubCoordinator} readOnly placeholder="Autofilled" style={{ opacity: 0.6, cursor: 'not-allowed' }} /></div>
                  </div>
                </div>

                {/* EVENT DETAILS */}
                <div className="glass-card">
                  <div className="section-title"><LayoutDashboard size={20}/> Event Specification</div>
                  <div className="form-grid form-grid-2">
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Event Name *</label><input placeholder="Annual Tech Fest 2026" value={form.eventName} onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))} required /></div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Event Description *</label><textarea rows={4} placeholder="Objectives, itinerary, target audience…" value={form.eventDescription} onChange={e => setForm(f => ({ ...f, eventDescription: e.target.value }))} required /></div>
                    <div className="form-group"><label className="form-label">Event Duration *</label><input placeholder="e.g. 4 Hours / 2 Days" value={form.eventDuration} onChange={e => setForm(f => ({ ...f, eventDuration: e.target.value }))} required /></div>
                    <div className="form-group"><label className="form-label">Event Date</label><input type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} /></div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Proposed Venue *</label><input placeholder="Main Auditorium" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} required /></div>
                  </div>
                </div>

                {/* RESOURCE REQUIREMENTS */}
                <div className="glass-card">
                  <div className="section-title"><Package size={20}/> Resource Line Items</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                    {Object.entries(RESOURCE_LABELS).map(([key, label]) => (
                      <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="checkbox-row" style={{ color: '#fff' }}>
                          <input type="checkbox" checked={form.resources[key].checked} onChange={e => handleResourceCheck(key, e.target.checked)} />
                          <span className="checkbox-label">{label}</span>
                          {key === 'additionalMediaCoverage' && <span className="badge" style={{ marginLeft: 'auto', fontSize: '0.7rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--amber)' }}>Strict Approval</span>}
                        </label>
                        {key === 'canopy' && form.resources.canopy.checked && (
                          <div style={{ marginTop: '12px', animation: 'fadeIn 0.2s ease-out' }}>
                            <input type="number" min="1" placeholder="Quantity" value={form.resources.canopy.count || ''} onChange={e => handleResourceCount('canopy', e.target.value)} required style={{ background: 'rgba(255,255,255,0.05)' }} />
                          </div>
                        )}
                        {key === 'chairs' && form.resources.chairs.checked && (
                          <div style={{ marginTop: '12px', animation: 'fadeIn 0.2s ease-out' }}>
                            <input type="number" min="1" placeholder="Quantity" value={form.resources.chairs.count || ''} onChange={e => handleResourceCount('chairs', e.target.value)} required style={{ background: 'rgba(255,255,255,0.05)' }}/>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ADDITIONAL REQUIREMENTS */}
                <div className="glass-card">
                  <div className="section-title"><MessageCircle size={20}/> Collaboration & Notes</div>
                  <div className="form-group">
                    <label className="form-label">Special Instructions / Additional Requirements</label>
                    <textarea rows={3} placeholder="Provide any special instructions regarding logistics…" value={form.additionalRequirement} onChange={e => setForm(f => ({ ...f, additionalRequirement: e.target.value }))} />
                  </div>
                  {societies.length > 0 && (
                    <div className="form-group">
                      <label className="form-label">Collaborating Societies</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
                        {societies.map(s => (
                          <button key={s} type="button" className={`btn ${form.selectedSocieties.includes(s) ? 'btn-primary' : 'btn-dark'}`} style={{ padding: '10px 20px', borderRadius: '40px' }} onClick={() => handleSocietyToggle(s)}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <button type="submit" className="btn btn-primary" style={{ padding: '20px', fontSize: '1.1rem', borderRadius: 'var(--radius-xl)' }} disabled={submitting}>
                  {submitting ? 'Transmitting…' : <><Send size={20}/> Submit Event Application</>}
                </button>

                {submitError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '16px 20px', background: 'rgba(225, 29, 72, 0.1)', border: '1px solid rgba(225, 29, 72, 0.3)', borderRadius: 'var(--radius-md)', color: 'var(--rose)', fontWeight: 600 }}>
                    <AlertCircle size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }}/>
                    {submitError}
                  </motion.div>
                )}
              </motion.form>
            )
          )}

          {/* ─── TRACK STATUS ─── */}
          {tab === 'track' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '820px', margin: '0 auto' }}>
              <div className="glass-card" style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <button className={`btn ${trackMode === 'id' ? 'btn-primary' : 'btn-dark'}`} style={{ borderRadius: '40px' }} onClick={() => setTrackMode('id')}>By Event ID</button>
                  <button className={`btn ${trackMode === 'email' ? 'btn-primary' : 'btn-dark'}`} style={{ borderRadius: '40px' }} onClick={() => setTrackMode('email')}>By Email</button>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <input
                    placeholder={trackMode === 'id' ? 'Enter 4-digit ID (e.g. 1024)' : 'Enter submitter email address'}
                    value={trackInput}
                    onChange={e => setTrackInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleTrack(null)}
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-primary" style={{ padding: '0 32px', borderRadius: 'var(--radius-lg)' }} onClick={() => handleTrack(null)} disabled={tracking || !trackInput.trim()}>
                    {tracking ? 'Searching…' : <><Search size={18}/> Search</>}
                  </button>
                </div>
                {trackError && <p style={{ color: 'var(--rose)', marginTop: '16px', fontWeight: 600 }}><AlertCircle size={16} style={{ display: 'inline', marginRight: 6 }}/>{trackError}</p>}
              </div>

              {trackedEvent && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reference</div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>#{trackedEvent.eventId}</div>
                      <div style={{ fontWeight: 800, fontSize: '1.4rem', marginTop: '8px', color: '#fff' }}>{trackedEvent.eventName}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '8px', display: 'flex', gap: '16px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Building2 size={16}/> {trackedEvent.clubName}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16}/> {trackedEvent.venue}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
                      <StatusBadge status={trackedEvent.overallStatus} />
                      {trackedEvent.reviewedBy && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Reviewer: {trackedEvent.reviewedBy}</span>}
                    </div>
                  </div>

                  <button
                    className="btn btn-ghost"
                    style={{ marginTop: '24px', width: '100%', padding: '14px', borderRadius: 'var(--radius-lg)' }}
                    onClick={() => navigate(`/track/${trackedEvent.eventId}`)}
                  >
                    View Full Details & Announcements <ArrowRight size={16} />
                  </button>
                </motion.div>
              )}

              {trackedList.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {trackedList.map(ev => (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      key={ev._id}
                      className="glass-card card-interactive"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => { setTrackMode('id'); setTrackInput(ev.eventId); setTrackedList([]); handleTrack(ev.eventId); }}
                    >
                      <div>
                        <div style={{ fontWeight: 900, color: '#fff', fontSize: '1rem', marginBottom: '4px' }}>#{ev.eventId}</div>
                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.2rem' }}>{ev.eventName}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px', display: 'flex', gap: '12px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Building2 size={14}/> {ev.clubName}</span>
                        </div>
                      </div>
                      <StatusBadge status={ev.overallStatus} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </>
  );
}
