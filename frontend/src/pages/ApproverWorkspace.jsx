import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { motion } from 'framer-motion';
import { ClipboardList, CalendarDays, Megaphone, UserCircle, Check, X, ArrowRight, ArrowLeft, Send, Save, Lock, Camera, MapPin, Building, Clock, Search, Briefcase } from 'lucide-react';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import ContactCard from '../components/ContactCard';
import CinematicBackground from '../components/CinematicBackground';
import { useAuth } from '../context/AuthContext';

const RESOURCE_LABELS = {
  itPerson: 'IT Support Person', discipline: 'Discipline Team', operations: 'Operations Support',
  bannerPrintings: 'Banner Printings', food: 'Catering / Food', canopy: 'Outdoor Canopies',
  chairs: 'Seating Chairs', electrician: 'Electrical Support', additionalMediaCoverage: 'Media Coverage',
};

const UPDATE_TYPES = ['Event Reminder', 'Meeting Notice', 'Venue Change', 'Time Change', 'Cancellation', 'General Announcement'];

export default function ApproverWorkspace() {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const initialTab = query.get('tab') || 'queue';
  
  const [tab, setTab] = useState(initialTab);
  
  // Sync tab state if URL changes
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get('tab')) setTab(q.get('tab'));
  }, [location.search]);
  const [events, setEvents] = useState([]);
  const [calEvents, setCalEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calDate, setCalDate] = useState(new Date());
  const [updates, setUpdates] = useState([]);
  const [updateForm, setUpdateForm] = useState({ eventId: '', updateType: 'Event Reminder', title: '', message: '', targetDate: '' });
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profilePic, setProfilePic] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/approver/queue?status=${statusFilter}`);
      setEvents(data.events || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [statusFilter]);

  const loadCalendar = useCallback(async () => {
    try {
      const m = calDate.getMonth() + 1;
      const y = calDate.getFullYear();
      const { data } = await API.get(`/approver/calendar?month=${m}&year=${y}`);
      setCalEvents(data || []);
    } catch (e) { console.error(e); }
  }, [calDate]);

  const loadUpdates = useCallback(async () => {
    try {
      const { data } = await API.get('/approver/updates');
      setUpdates(data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    loadQueue();
    API.get('/approver/team-members').then(r => setTeamMembers(r.data || []));
  }, [loadQueue]);

  useEffect(() => { if (tab === 'calendar') loadCalendar(); }, [tab, loadCalendar]);
  useEffect(() => { if (tab === 'updates') loadUpdates(); }, [tab, loadUpdates]);

  const openEvent = async (eventId) => {
    try {
      const { data } = await API.get(`/approver/event/${eventId}`);
      setSelectedEvent(data);
    } catch (e) {
      setMsg('❌ ' + (e.response?.data?.message || 'Failed to load event details'));
    }
  };

  const handleResourceDecision = (key, status) => {
    setSelectedEvent(ev => ({
      ...ev,
      resources: { ...ev.resources, [key]: { ...ev.resources[key], status } },
    }));
  };

  const handleResourceFeedback = (key, feedback) => {
    setSelectedEvent(ev => ({
      ...ev,
      resources: { ...ev.resources, [key]: { ...ev.resources[key], feedback } },
    }));
  };

  const submitReview = async () => {
    setSaving(true);
    try {
      const { data } = await API.patch(`/approver/review/${selectedEvent.eventId}`, {
        overallStatus: selectedEvent.overallStatus,
        resources: selectedEvent.resources,
        overallFeedback: selectedEvent.overallFeedback,
      });
      setMsg(`✅ Review saved — Status: ${data.overallStatus}`);
      if (data.event) setSelectedEvent(data.event);
      loadQueue();
      setTimeout(() => setMsg(''), 4000);
    } catch (e) { setMsg('❌ ' + (e.response?.data?.message || 'Save failed')); }
    setSaving(false);
  };

  const assignContact = async (memberId) => {
    try {
      const { data } = await API.post(`/approver/assign-contact/${selectedEvent.eventId}`, { memberId });
      setSelectedEvent(ev => ({ ...ev, assignedContact: data.contact }));
      setMsg('✅ Operational officer assigned');
      setTimeout(() => setMsg(''), 4000);
    } catch (e) { setMsg('❌ ' + (e.response?.data?.message || 'Assignment failed')); }
  };

  const postUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.post('/approver/updates', updateForm);
      setMsg('✅ Announcement posted successfully');
      setTimeout(() => setMsg(''), 4000);
      setUpdateForm({ eventId: '', updateType: 'Event Reminder', title: '', message: '', targetDate: '' });
      loadUpdates();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Failed to post update')); }
    setSaving(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10000000) {
      setMsg('❌ Image size must be less than 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setProfilePic(ev.target.result);
    reader.readAsDataURL(file);
  };

  const saveProfilePic = async () => {
    if (!profilePic) return;
    setSavingProfile(true);
    try {
      await API.patch('/auth/profile', { profilePicture: profilePic });
      updateUser({ profilePicture: profilePic });
      setMsg('✅ Profile picture updated successfully');
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Failed to update profile picture'));
    }
    setSavingProfile(false);
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setMsg('❌ Passwords do not match');
      return;
    }
    setSavingProfile(true);
    try {
      await API.post('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setMsg('✅ Password updated successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setMsg(''), 4000);
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Password update failed')); }
    setSavingProfile(false);
  };

  const eventsOnDate = (date) => {
    const d = date.toDateString();
    return calEvents.filter(e => e.eventDate && new Date(e.eventDate).toDateString() === d);
  };

  return (
    <>
      <CinematicBackground />
      <Navbar />
      <div className="page" style={{ position: 'relative', zIndex: 1 }}>
        <div className="container-full" style={{ padding: '0 40px' }}>

          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '24px' }}>
            <div>
              <h1 style={{ fontSize: '3rem', color: '#fff' }}>Approver Workspace</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Welcome back, <strong>{user?.name}</strong>. Evaluate campus logistics and orchestrate operations.</p>
            </div>
            <div className="tabs">
              <button className={`tab-btn ${tab === 'queue' ? 'active' : ''}`} onClick={() => setTab('queue')}>
                <ClipboardList size={18}/> Review Queue
              </button>
              <button className={`tab-btn ${tab === 'calendar' ? 'active' : ''}`} onClick={() => setTab('calendar')}>
                <CalendarDays size={18}/> Calendar
              </button>
              <button className={`tab-btn ${tab === 'updates' ? 'active' : ''}`} onClick={() => setTab('updates')}>
                <Megaphone size={18}/> Broadcast
              </button>
              <button className={`tab-btn ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
                <UserCircle size={18}/> My Profile
              </button>
            </div>
          </div>

          {msg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{
              padding: '16px 24px', marginBottom: '32px', borderRadius: 'var(--radius-md)',
              background: msg.startsWith('✅') ? 'rgba(52, 211, 153, 0.1)' : 'rgba(251, 113, 133, 0.1)',
              border: msg.startsWith('✅') ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(251, 113, 133, 0.3)',
              color: msg.startsWith('✅') ? 'var(--emerald)' : 'var(--rose)', fontWeight: 600,
            }}>
              {msg}
            </motion.div>
          )}

          {/* ─── REVIEW QUEUE ─── */}
          {tab === 'queue' && !selectedEvent && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
                {['Pending', 'In Review', 'Partially Approved', 'Approved', 'Rejected'].map(s => (
                  <button
                    key={s}
                    className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-dark'}`}
                    style={{ padding: '10px 24px', borderRadius: 'var(--radius-xl)' }}
                    onClick={() => setStatusFilter(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {loading ? (
                <p style={{ color: 'var(--text-secondary)' }}>Fetching telemetry stream…</p>
              ) : events.length === 0 ? (
                <div className="glass-card text-center" style={{ padding: '80px 20px' }}>
                  <Search size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No events found in "{statusFilter}" sector.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: '24px' }}>
                  {events.map(ev => (
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      key={ev._id}
                      className="glass-card card-interactive"
                      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                      onClick={() => openEvent(ev.eventId)}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <span style={{ color: '#fff', fontWeight: 900, fontSize: '1rem', letterSpacing: '0.05em' }}>#{ev.eventId}</span>
                          <StatusBadge status={ev.overallStatus} />
                        </div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>{ev.eventName}</h3>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '12px', display: 'flex', gap: '16px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Building size={14}/> {ev.clubName}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14}/> {ev.venue}</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Briefcase size={14}/> {ev.name} · {ev.department}
                        </div>
                      </div>
                      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}><Clock size={12} style={{ display: 'inline', marginRight: 4 }}/> {new Date(ev.createdAt).toLocaleDateString('en-IN')}</span>
                        <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>Evaluate <ArrowRight size={16}/></span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── EVENT REVIEW PANEL ─── */}
          {tab === 'queue' && selectedEvent && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <button className="btn btn-ghost" style={{ marginBottom: '32px', borderRadius: 'var(--radius-xl)' }} onClick={() => setSelectedEvent(null)}>
                <ArrowLeft size={18}/> Back to Queue Matrix
              </button>

              <div className="glass-card" style={{ padding: '48px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
                  <div>
                    <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.05em' }}>#{selectedEvent.eventId}</span>
                    <h2 style={{ fontWeight: 900, fontSize: '2.2rem', color: '#fff', marginTop: '8px' }}>{selectedEvent.eventName}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '8px', display: 'flex', gap: '20px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Building size={16}/> {selectedEvent.clubName}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16}/> {selectedEvent.venue}</span>
                      {selectedEvent.eventDate && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CalendarDays size={16}/> {new Date(selectedEvent.eventDate).toLocaleDateString('en-IN')}</span>}
                    </p>
                  </div>
                  <StatusBadge status={selectedEvent.overallStatus} />
                </div>

                <div className="form-grid form-grid-4" style={{ marginBottom: '32px', padding: '24px', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                  <div><span className="mono-label">Submitter</span><br /><strong style={{ color: '#fff', fontSize: '1.05rem' }}>{selectedEvent.name}</strong></div>
                  <div><span className="mono-label">Email</span><br /><strong style={{ color: '#fff', fontSize: '1.05rem' }}>{selectedEvent.email}</strong></div>
                  <div><span className="mono-label">Department</span><br /><strong style={{ color: '#fff', fontSize: '1.05rem' }}>{selectedEvent.department}</strong></div>
                  <div><span className="mono-label">Duration</span><br /><strong style={{ color: '#fff', fontSize: '1.05rem' }}>{selectedEvent.eventDuration}</strong></div>
                </div>

                <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', marginBottom: '40px', color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7 }}>
                  <div className="mono-label" style={{ marginBottom: '12px' }}>Event Overview</div>
                  {selectedEvent.eventDescription}
                </div>

                <div className="section-title"><Check size={20}/> Core Event Approval</div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '40px' }}>
                  {['Pending', 'In Review', 'Partially Approved', 'Approved', 'Rejected'].map(status => (
                    <button
                      key={status}
                      className={`btn ${selectedEvent.overallStatus === status ? 'btn-primary' : 'btn-dark'}`}
                      style={{ padding: '10px 24px', borderRadius: 'var(--radius-xl)' }}
                      onClick={() => setSelectedEvent(ev => ({ ...ev, overallStatus: status }))}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <div className="section-title"><Check size={20}/> Resource Line Item Approvals</div>
                {Object.entries(RESOURCE_LABELS).map(([key, label]) => {
                  const r = selectedEvent.resources?.[key];
                  if (!r?.checked) return null;
                  return (
                    <div key={key} style={{ marginBottom: '16px', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>{label}</span>
                          {r.count > 0 && <span style={{ color: '#fff', marginLeft: '16px', fontSize: '0.95rem', fontWeight: 600, background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '40px' }}>Qty: {r.count}</span>}
                        </div>
                        <div className="resource-actions" style={{ display: 'flex', gap: '12px' }}>
                          <button
                            className={`btn ${r.status === 'Approved' ? 'btn-success' : 'btn-dark'}`}
                            style={{ padding: '10px 20px', borderRadius: 'var(--radius-xl)' }}
                            onClick={() => handleResourceDecision(key, 'Approved')}
                          >
                            <Check size={16}/> Approve
                          </button>
                          <button
                            className={`btn ${r.status === 'Rejected' ? 'btn-danger' : 'btn-dark'}`}
                            style={{ padding: '10px 20px', borderRadius: 'var(--radius-xl)' }}
                            onClick={() => handleResourceDecision(key, 'Rejected')}
                          >
                            <X size={16}/> Reject
                          </button>
                        </div>
                      </div>
                      <input
                        placeholder={`Provide conditional feedback for ${label} (optional)`}
                        value={r.feedback || ''}
                        onChange={e => handleResourceFeedback(key, e.target.value)}
                        style={{ background: 'rgba(20,20,20,0.8)' }}
                      />
                    </div>
                  );
                })}

                <div className="form-group" style={{ marginTop: '40px', marginBottom: '32px' }}>
                  <label className="form-label" style={{ fontSize: '0.9rem' }}>Overall Evaluation / Committee Directives</label>
                  <textarea
                    rows={4}
                    placeholder="Enter summary notes or approval conditions…"
                    value={selectedEvent.overallFeedback || ''}
                    onChange={e => setSelectedEvent(ev => ({ ...ev, overallFeedback: e.target.value }))}
                  />
                </div>

                <button className="btn btn-primary" style={{ width: '100%', padding: '18px', fontSize: '1.1rem', borderRadius: 'var(--radius-xl)', marginBottom: '40px' }} onClick={submitReview} disabled={saving}>
                  {saving ? 'Transmitting Data…' : <><Save size={20}/> Commit Review Decisions</>}
                </button>

                <div className="divider" />

                <div className="section-title"><UserCircle size={20}/> Assign Operational Personnel</div>
                {selectedEvent.assignedContact?.name && (
                  <div style={{ marginBottom: '24px' }}><ContactCard contact={selectedEvent.assignedContact} /></div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {teamMembers.map(m => (
                    <button key={m._id} className="btn btn-dark" style={{ padding: '12px 24px', borderRadius: 'var(--radius-xl)' }} onClick={() => assignContact(m._id)}>
                      <UserCircle size={16}/> {m.name} <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({m.role})</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── CALENDAR VIEW ─── */}
          {tab === 'calendar' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-grid">
              <div>
                <Calendar
                  onChange={(d) => { setCalDate(d); }}
                  value={calDate}
                  onActiveStartDateChange={({ activeStartDate }) => setCalDate(activeStartDate)}
                  tileContent={({ date }) => {
                    const evs = eventsOnDate(date);
                    if (!evs.length) return null;
                    return (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '6px' }}>
                        {evs.slice(0, 3).map(e => (
                          <span key={e._id} style={{ width: 8, height: 8, borderRadius: '50%', background: e.overallStatus === 'Approved' ? 'var(--emerald)' : e.overallStatus === 'Rejected' ? 'var(--rose)' : e.overallStatus === 'In Review' ? 'var(--blue)' : 'var(--amber)' }} />
                        ))}
                      </div>
                    );
                  }}
                />
              </div>

              <div>
                <div style={{ fontWeight: 900, marginBottom: '24px', color: '#fff', fontSize: '1.4rem' }}>
                  Schedule for {calDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                {eventsOnDate(calDate).length === 0 ? (
                  <div className="glass-card empty-state" style={{ padding: '80px 20px' }}>
                    <CalendarDays size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                    <p>No events scheduled on this date.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {eventsOnDate(calDate).map(ev => (
                      <div key={ev._id} className="glass-card card-sm card-interactive" style={{ cursor: 'pointer' }} onClick={() => { setTab('queue'); openEvent(ev.eventId); }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ color: '#fff', fontWeight: 900, fontSize: '0.95rem' }}>#{ev.eventId}</span>
                          <StatusBadge status={ev.overallStatus} />
                        </div>
                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.2rem', marginBottom: '6px' }}>{ev.eventName}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}><Building size={14} style={{ display: 'inline', marginRight: 4 }}/> {ev.clubName} <MapPin size={14} style={{ display: 'inline', margin: '0 4px 0 10px' }}/> {ev.venue}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── POST UPDATE / BULLETIN ─── */}
          {tab === 'updates' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-grid">
              <div className="glass-card">
                <div className="section-title" style={{ marginBottom: '32px' }}><Megaphone size={24}/> Broadcast Bulletin</div>
                <form onSubmit={postUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="form-group">
                    <label className="form-label">Event ID Link (Optional)</label>
                    <input placeholder="4-digit ID" value={updateForm.eventId} onChange={e => setUpdateForm(f => ({ ...f, eventId: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select value={updateForm.updateType} onChange={e => setUpdateForm(f => ({ ...f, updateType: e.target.value }))} required>
                      {UPDATE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Headline *</label>
                    <input placeholder="e.g. Mandatory Coordination Meeting" value={updateForm.title} onChange={e => setUpdateForm(f => ({ ...f, title: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bulletin Details *</label>
                    <textarea rows={5} placeholder="Full message details…" value={updateForm.message} onChange={e => setUpdateForm(f => ({ ...f, message: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Effective Date *</label>
                    <input type="date" value={updateForm.targetDate} onChange={e => setUpdateForm(f => ({ ...f, targetDate: e.target.value }))} required />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '18px', fontSize: '1.05rem', borderRadius: 'var(--radius-xl)' }} disabled={saving}>
                    {saving ? 'Transmitting…' : <><Send size={18}/> Broadcast Across Network</>}
                  </button>
                </form>
              </div>

              <div>
                <div style={{ fontWeight: 900, marginBottom: '24px', color: '#fff', fontSize: '1.4rem' }}>Live Network Bulletins</div>
                {updates.length === 0 ? (
                  <div className="glass-card empty-state" style={{ padding: '80px 20px' }}>
                    <Megaphone size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }}/>
                    <p>No active bulletins in the network.</p>
                  </div>
                ) : updates.map(u => (
                  <div key={u._id} className="glass-card card-sm" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>{u.updateType}</span>
                      {u.visibleToEventId && <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 800 }}>#{u.visibleToEventId}</span>}
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 'auto' }}>
                        {new Date(u.targetDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div style={{ fontWeight: 900, color: '#fff', fontSize: '1.2rem' }}>{u.title}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '8px', lineHeight: 1.6 }}>{u.message}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>Authorized by {u.postedByName}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── MY PROFILE ─── */}
          {tab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-grid">
              <div className="glass-card">
                <div className="section-title"><Lock size={24}/> Security Settings</div>
                <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="form-group">
                    <label className="form-label">Current Keyphrase *</label>
                    <input type="password" placeholder="••••••••" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Keyphrase *</label>
                    <input type="password" placeholder="Min 8 characters" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} required minLength="8" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm Keyphrase *</label>
                    <input type="password" placeholder="Min 8 characters" value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} required minLength="8" />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '18px', fontSize: '1.05rem', borderRadius: 'var(--radius-xl)' }} disabled={savingProfile}>
                    {savingProfile ? 'Encrypting…' : <><Lock size={18}/> Update Security Key</>}
                  </button>
                </form>
              </div>

              <div className="glass-card">
                <div className="section-title"><Camera size={24}/> Identity Module</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center' }}>
                  <div style={{ width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: 'var(--shadow-raised)' }}>
                    {profilePic || user.profilePicture ? (
                      <img src={profilePic || user.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-muted)' }}>{user.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="form-group" style={{ width: '100%' }}>
                    <label className="form-label text-center" style={{ width: '100%', textAlign: 'center' }}>Upload Avatar (Max 10MB)</label>
                    <input type="file" accept="image/jpeg, image/png" onChange={handleFileChange} style={{ padding: '12px', fontSize: '0.95rem', borderRadius: 'var(--radius-md)', width: '100%' }} />
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', padding: '18px', fontSize: '1.05rem', borderRadius: 'var(--radius-xl)' }} onClick={saveProfilePic} disabled={!profilePic || savingProfile}>
                    {savingProfile ? 'Uploading to Core…' : <><Camera size={18}/> Commit Avatar Data</>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </>
  );
}
