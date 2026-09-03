import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, ShieldCheck, Landmark, FormInput, ScrollText, 
  UserPlus, Key, UserX, UserCheck, Edit2, Check, X, 
  Trash2, PlusCircle, Building2, BookType, ToggleLeft, ToggleRight
} from 'lucide-react';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import CinematicBackground from '../components/CinematicBackground';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('users');
  const [msg, setMsg] = useState('');
  const flashTimer = useRef(null);

  // Users
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '' });
  const [pwForm, setPwForm] = useState({ targetEmail: '', newPassword: '' });
  const [editUser, setEditUser] = useState(null); // id of user being edited
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '' });

  const [team, setTeam] = useState([]);
  const [teamForm, setTeamForm] = useState({ name: '', role: '', email: '', phone: '', department: '', bio: '', image: '', linkedinUrl: '', githubUrl: '' });

  // Clubs & Societies (separate)
  const [clubs, setClubs] = useState([]);
  const [clubsSubTab, setClubsSubTab] = useState('societies'); // 'societies' | 'clubs'

  // Society form
  const [societyForm, setSocietyForm] = useState({ societyName: '' });

  // Club form — progressive
  const [clubForm, setClubForm] = useState({
    societyName: '',
    clubName: '',
    coordinatorName: '',
    coordinatorEmail: '',
    coordinatorPhone: '',
  });

  // Form Fields
  const [fields, setFields] = useState([]);
  const [fieldForm, setFieldForm] = useState({ fieldKey: '', fieldLabel: '', fieldType: 'text', required: false, enabled: true });

  // Audit Logs
  const [logs, setLogs] = useState([]);
  const [logTotal, setLogTotal] = useState(0);

  const load = useCallback(async () => {
    try {
      if (tab === 'users') { const r = await API.get('/admin/users'); setUsers(r.data || []); }
      if (tab === 'team')  { const r = await API.get('/admin/team');  setTeam(r.data || []); }
      if (tab === 'clubs') { const r = await API.get('/admin/clubs'); setClubs(r.data || []); }
      if (tab === 'fields') { const r = await API.get('/admin/fields'); setFields(r.data || []); }
      if (tab === 'logs')  { const r = await API.get('/admin/audit-logs?limit=100'); setLogs(r.data.logs || []); setLogTotal(r.data.total || 0); }
    } catch (e) { flash('❌ ' + (e.response?.data?.message || 'Failed to load system data')); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const flash = (m) => {
    setMsg(m);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setMsg(''), 4500);
  };

  // ── USERS ──
  const addUser = async (e) => {
    e.preventDefault();
    try { await API.post('/admin/users', userForm); flash('✅ New Approver account provisioned'); setUserForm({ name: '', email: '', password: '' }); load(); }
    catch (err) { flash('❌ ' + (err.response?.data?.message || 'Failed to add approver')); }
  };
  const deactivateUser = async (id) => {
    if (!window.confirm('Deactivate this authority account?')) return;
    try { await API.patch(`/admin/users/${id}/deactivate`); flash('✅ User account deactivated'); load(); }
    catch (err) { flash('❌ ' + (err.response?.data?.message || 'Deactivation failed')); }
  };
  const startEditUser = (u) => {
    setEditUser(u._id);
    setEditUserForm({ name: u.name, email: u.email });
  };
  const submitEditUser = async (e, id) => {
    e.preventDefault();
    try {
      await API.patch(`/admin/users/${id}`, editUserForm);
      flash('✅ Approver details updated');
      setEditUser(null);
      load();
    } catch (err) { flash('❌ ' + (err.response?.data?.message || 'Update failed')); }
  };
  const changePassword = async (e) => {
    e.preventDefault();
    try { await API.post('/auth/change-password', pwForm); flash('✅ Password updated successfully'); setPwForm({ targetEmail: '', newPassword: '' }); }
    catch (err) { flash('❌ ' + (err.response?.data?.message || 'Password reset failed')); }
  };

  const addTeam = async (e) => {
    e.preventDefault();
    try { await API.post('/admin/team', teamForm); flash('✅ Operational team member added'); setTeamForm({ name: '', role: '', email: '', phone: '', department: '', bio: '', image: '', linkedinUrl: '', githubUrl: '' }); load(); }
    catch (err) { flash('❌ ' + (err.response?.data?.message || 'Failed to add team member')); }
  };
  const removeTeam = async (id) => {
    if (!window.confirm('Remove this team member from directory?')) return;
    try { await API.delete(`/admin/team/${id}`); flash('✅ Team member removed'); load(); }
    catch (err) { flash('❌ Delete failed'); }
  };

  // ── SOCIETIES ──
  const uniqueSocieties = [...new Set(clubs.map(c => c.societyName).filter(Boolean))];
  const addSociety = async (e) => {
    e.preventDefault();
    const sName = societyForm.societyName.trim();
    if (!sName) return;
    if (uniqueSocieties.includes(sName)) { flash('❌ A society with this name already exists.'); return; }
    try {
      await API.post('/admin/clubs', {
        societyName: sName, clubName: `${sName} (Society Root)`, coordinatorName: 'TBD', coordinatorEmail: 'admin@technova.mru.ac.in', coordinatorPhone: '+91 0000000000',
      });
      flash(`✅ Society "${sName}" registered successfully`);
      setSocietyForm({ societyName: '' });
      load();
    } catch (err) { flash('❌ ' + (err.response?.data?.message || 'Failed to register society')); }
  };

  // ── CLUBS ──
  const addClub = async (e) => {
    e.preventDefault();
    try {
      await API.post('/admin/clubs', clubForm);
      flash('✅ Club & Associated Coordinator registered');
      setClubForm({ societyName: '', clubName: '', coordinatorName: '', coordinatorEmail: '', coordinatorPhone: '' });
      load();
    } catch (err) { flash('❌ ' + (err.response?.data?.message || 'Failed to add club')); }
  };
  const removeClub = async (id) => {
    if (!window.confirm('Deactivate this club entry? Existing event records remain intact.')) return;
    try { await API.delete(`/admin/clubs/${id}`); flash('✅ Club removed'); load(); }
    catch (err) { flash('❌ Delete failed'); }
  };

  // ── FIELDS ──
  const addField = async (e) => {
    e.preventDefault();
    try { await API.post('/admin/fields', fieldForm); flash('✅ Custom form field added'); setFieldForm({ fieldKey: '', fieldLabel: '', fieldType: 'text', required: false, enabled: true }); load(); }
    catch (err) { flash('❌ ' + (err.response?.data?.message || 'Failed to add field')); }
  };
  const toggleField = async (id, enabled) => {
    try { await API.patch(`/admin/fields/${id}`, { enabled: !enabled }); load(); }
    catch { flash('❌ Toggle failed'); }
  };

  const showCoordinatorFields = clubForm.societyName && clubForm.clubName.trim().length > 0;
  const realClubs = clubs.filter(c => !c.clubName.endsWith('(Society Root)'));

  return (
    <>
      <CinematicBackground />
      <Navbar />
      <div className="page" style={{ position: 'relative', zIndex: 1 }}>
        <div className="container-full" style={{ padding: '0 40px' }}>

          {/* HEADER */}
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h1 style={{ fontSize: '3rem', color: '#fff' }}>Admin Command Center</h1>
              <p style={{ color: 'var(--text-secondary)' }}>System Governance: Authority Accounts · Operational Personnel · Societies & Clubs · Form Schema · Audit Logs</p>
            </div>
            <div className="tabs">
              <button className={`tab-btn ${tab === 'users'  ? 'active' : ''}`} onClick={() => setTab('users')}><ShieldCheck size={18}/> Approvers</button>
              <button className={`tab-btn ${tab === 'team'   ? 'active' : ''}`} onClick={() => setTab('team')}><Users size={18}/> Ops Team</button>
              <button className={`tab-btn ${tab === 'clubs'  ? 'active' : ''}`} onClick={() => setTab('clubs')}><Landmark size={18}/> Societies & Clubs</button>
              <button className={`tab-btn ${tab === 'fields' ? 'active' : ''}`} onClick={() => setTab('fields')}><FormInput size={18}/> Form Schema</button>
              <button className={`tab-btn ${tab === 'logs'   ? 'active' : ''}`} onClick={() => setTab('logs')}><ScrollText size={18}/> Audit Records</button>
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

          {/* ── USERS TAB ── */}
          {tab === 'users' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-grid">
              <div>
                <div className="glass-card" style={{ marginBottom: '32px' }}>
                  <div className="section-title"><UserPlus size={20}/> Provision Approver Account</div>
                  <form onSubmit={addUser} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group"><label className="form-label">Full Name *</label><input placeholder="Full Name" value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} required /></div>
                    <div className="form-group"><label className="form-label">Email Address *</label><input type="email" placeholder="approver@technova.com" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} required /></div>
                    <div className="form-group"><label className="form-label">Initial Password *</label><input type="password" placeholder="••••••••" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} required /></div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', borderRadius: 'var(--radius-xl)' }}>➕ Provision Account</button>
                  </form>
                </div>

                <div className="glass-card">
                  <div className="section-title"><Key size={20}/> Security Password Override</div>
                  <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group"><label className="form-label">Target Account *</label>
                      <select value={pwForm.targetEmail} onChange={e => setPwForm(f => ({ ...f, targetEmail: e.target.value }))} required>
                        <option value="">Select authority account</option>
                        {users.map(u => <option key={u._id} value={u.email}>{u.name} ({u.email})</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">New Password *</label><input type="password" placeholder="Enter new strong password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} required /></div>
                    <button type="submit" className="btn btn-dark" style={{ width: '100%', padding: '16px', borderRadius: 'var(--radius-xl)' }}>🔐 Override Password</button>
                  </form>
                </div>
              </div>

              <div className="glass-card">
                <div className="section-title"><ShieldCheck size={20}/> Authority Roster ({users.length})</div>
                {users.length === 0 ? (
                  <div className="empty-state" style={{ padding: '60px 20px' }}><ShieldCheck size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }}/><p>No approvers provisioned yet.</p></div>
                ) : (
                  users.map(u => (
                    <div key={u._id} style={{ borderBottom: '1px solid var(--border)', padding: '20px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                          <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>{u.name}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{u.email}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Role: {u.role?.toUpperCase()}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span className="badge" style={{ background: u.isActive ? 'rgba(52, 211, 153, 0.1)' : 'rgba(251, 113, 133, 0.1)', color: u.isActive ? 'var(--emerald)' : 'var(--rose)' }}>{u.isActive ? 'Active' : 'Disabled'}</span>
                          {u.isActive && u.role === 'approver' && (
                            <button className="btn btn-dark" style={{ padding: '8px 16px', borderRadius: 'var(--radius-xl)' }} onClick={() => startEditUser(u)}><Edit2 size={16}/></button>
                          )}
                          {u.isActive && (
                            <button className="btn btn-danger" style={{ padding: '8px 16px', borderRadius: 'var(--radius-xl)' }} onClick={() => deactivateUser(u._id)}><UserX size={16}/></button>
                          )}
                        </div>
                      </div>

                      {editUser === u._id && (
                        <div style={{ padding: '24px', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-lg)', marginTop: '20px', border: '1px solid var(--border)', animation: 'fadeIn 0.2s ease-out' }}>
                          <form onSubmit={(e) => submitEditUser(e, u._id)} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                            <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
                              <label className="form-label">Name</label>
                              <input value={editUserForm.name} onChange={e => setEditUserForm(f => ({ ...f, name: e.target.value }))} required />
                            </div>
                            <div className="form-group" style={{ flex: 1, minWidth: '240px', marginBottom: 0 }}>
                              <label className="form-label">Email</label>
                              <input type="email" value={editUserForm.email} onChange={e => setEditUserForm(f => ({ ...f, email: e.target.value }))} required />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <button type="submit" className="btn btn-primary" style={{ padding: '12px 20px', borderRadius: 'var(--radius-xl)' }}><Check size={16}/></button>
                              <button type="button" className="btn btn-dark" style={{ padding: '12px 20px', borderRadius: 'var(--radius-xl)' }} onClick={() => setEditUser(null)}><X size={16}/></button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ── TEAM TAB ── */}
          {tab === 'team' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-grid">
              <div className="glass-card">
                <div className="section-title"><UserPlus size={20}/> Add Operational Officer</div>
                <form onSubmit={addTeam} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-grid form-grid-2">
                    <div className="form-group"><label className="form-label">Full Name *</label><input placeholder="Full Name" value={teamForm.name} onChange={e => setTeamForm(f => ({ ...f, name: e.target.value }))} required /></div>
                    <div className="form-group"><label className="form-label">Role Title *</label><input placeholder="President / Tech Lead / VP" value={teamForm.role} onChange={e => setTeamForm(f => ({ ...f, role: e.target.value }))} required /></div>
                    <div className="form-group"><label className="form-label">Email Address *</label><input type="email" placeholder="officer@technova.com" value={teamForm.email} onChange={e => setTeamForm(f => ({ ...f, email: e.target.value }))} required /></div>
                    <div className="form-group"><label className="form-label">Phone Number *</label><input placeholder="+91 9876543210" value={teamForm.phone} onChange={e => setTeamForm(f => ({ ...f, phone: e.target.value }))} required /></div>
                    <div className="form-group"><label className="form-label">Department</label><input placeholder="CSE / IT / Operations" value={teamForm.department} onChange={e => setTeamForm(f => ({ ...f, department: e.target.value }))} /></div>
                    <div className="form-group"><label className="form-label">Profile Image URL</label><input placeholder="https://i.imgur.com/example.jpg" value={teamForm.image} onChange={e => setTeamForm(f => ({ ...f, image: e.target.value }))} /></div>
                  </div>
                  <div className="form-group"><label className="form-label">Short Bio (shown on Leaders page)</label><textarea rows={3} placeholder="Brief 1-2 sentence bio visible on the public Leaders Directory…" value={teamForm.bio} onChange={e => setTeamForm(f => ({ ...f, bio: e.target.value }))} /></div>
                  <div className="form-grid form-grid-2">
                    <div className="form-group"><label className="form-label">LinkedIn URL</label><input placeholder="https://linkedin.com/in/username" value={teamForm.linkedinUrl} onChange={e => setTeamForm(f => ({ ...f, linkedinUrl: e.target.value }))} /></div>
                    <div className="form-group"><label className="form-label">GitHub URL</label><input placeholder="https://github.com/username" value={teamForm.githubUrl} onChange={e => setTeamForm(f => ({ ...f, githubUrl: e.target.value }))} /></div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', borderRadius: 'var(--radius-xl)' }}>➕ Register Leader / Officer</button>
                </form>
              </div>

              <div className="glass-card">
                <div className="section-title"><Users size={20}/> Personnel Directory ({team.filter(m => m.isActive).length} Active)</div>
                {team.length === 0 ? (
                  <div className="empty-state" style={{ padding: '60px 20px' }}><Users size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }}/><p>No operational personnel added yet.</p></div>
                ) : (
                  team.map(m => (
                    <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid var(--border)', gap: '16px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>{m.name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600 }}>{m.role}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>📧 {m.email} · 📞 {m.phone}</div>
                      </div>
                      {m.isActive ? (
                        <button className="btn btn-danger" style={{ padding: '8px 16px', borderRadius: 'var(--radius-xl)' }} onClick={() => removeTeam(m._id)}><Trash2 size={16}/> Remove</button>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(251, 113, 133, 0.1)', color: 'var(--rose)' }}>Removed</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ── SOCIETIES & CLUBS TAB ── */}
          {tab === 'clubs' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                <div className="tabs">
                  <button className={`tab-btn ${clubsSubTab === 'societies' ? 'active' : ''}`} onClick={() => setClubsSubTab('societies')}>
                    <Landmark size={18}/> Societies
                  </button>
                  <button className={`tab-btn ${clubsSubTab === 'clubs' ? 'active' : ''}`} onClick={() => setClubsSubTab('clubs')}>
                    <Users size={18}/> Clubs
                  </button>
                </div>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                  Societies and Clubs are separate entities. Add a Society first, then register Clubs under it.
                </span>
              </div>

              {clubsSubTab === 'societies' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-grid">
                  <div className="glass-card">
                    <div className="section-title"><Landmark size={20}/> Register a New Society</div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.6 }}>
                      A Society is the parent body. Clubs belong to a Society. Register the Society name first before adding any clubs under it.
                    </p>
                    <form onSubmit={addSociety} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="form-group">
                        <label className="form-label">Society Name *</label>
                        <input placeholder="e.g. Technova, IEEE MRIIRS, ACM MRIIRS Chapter" value={societyForm.societyName} onChange={e => setSocietyForm({ societyName: e.target.value })} required />
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', borderRadius: 'var(--radius-xl)' }}>
                        <Landmark size={18} style={{ marginRight: 8 }}/> Register Society
                      </button>
                    </form>
                  </div>

                  <div className="glass-card">
                    <div className="section-title"><ShieldCheck size={20}/> Registered Societies ({uniqueSocieties.length})</div>
                    {uniqueSocieties.length === 0 ? (
                      <div className="empty-state" style={{ padding: '60px 20px' }}><Landmark size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }}/><p>No societies registered yet.</p></div>
                    ) : (
                      uniqueSocieties.map((soc, i) => {
                        const clubCount = realClubs.filter(c => c.societyName === soc && c.isActive).length;
                        return (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff' }}>{soc}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>{clubCount} club{clubCount !== 1 ? 's' : ''} registered</div>
                            </div>
                            <span className="badge" style={{ background: 'rgba(52, 211, 153, 0.1)', color: 'var(--emerald)' }}>Active</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}

              {clubsSubTab === 'clubs' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-grid">
                  <div className="glass-card">
                    <div className="section-title"><Users size={20}/> Register a New Club</div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.6 }}>
                      Select a parent Society, then enter the Club name. Coordinator details will appear once the Club name is entered.
                    </p>
                    {uniqueSocieties.length === 0 && (
                      <div style={{ padding: '16px 20px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-lg)', color: 'var(--amber)', fontSize: '0.95rem', marginBottom: '24px', fontWeight: 600 }}>
                        ⚠️ No societies registered yet. Please add a Society first.
                      </div>
                    )}
                    <form onSubmit={addClub} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="form-group">
                        <label className="form-label">Step 1 — Parent Society *</label>
                        <select value={clubForm.societyName} onChange={e => setClubForm(f => ({ ...f, societyName: e.target.value, clubName: '', coordinatorName: '', coordinatorEmail: '', coordinatorPhone: '' }))} required disabled={uniqueSocieties.length === 0}>
                          <option value="">Select a Society</option>
                          {uniqueSocieties.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      {clubForm.societyName && (
                        <div className="form-group" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                          <label className="form-label">Step 2 — Club Name *</label>
                          <input placeholder={`e.g. ${clubForm.societyName} AI Lab`} value={clubForm.clubName} onChange={e => setClubForm(f => ({ ...f, clubName: e.target.value }))} required />
                        </div>
                      )}
                      {showCoordinatorFields && (
                        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                          <div style={{ padding: '24px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', marginBottom: '8px' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 3 — Coordinator Details</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <div className="form-group"><label className="form-label">Coordinator Full Name *</label><input value={clubForm.coordinatorName} onChange={e => setClubForm(f => ({ ...f, coordinatorName: e.target.value }))} required /></div>
                              <div className="form-group"><label className="form-label">Coordinator Email *</label><input type="email" value={clubForm.coordinatorEmail} onChange={e => setClubForm(f => ({ ...f, coordinatorEmail: e.target.value }))} required /></div>
                              <div className="form-group"><label className="form-label">Coordinator Phone *</label><input value={clubForm.coordinatorPhone} onChange={e => setClubForm(f => ({ ...f, coordinatorPhone: e.target.value }))} required /></div>
                            </div>
                          </div>
                        </div>
                      )}
                      {showCoordinatorFields && (
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', borderRadius: 'var(--radius-xl)' }}>
                          <Users size={18} style={{ marginRight: 8 }}/> Register Club
                        </button>
                      )}
                    </form>
                  </div>

                  <div className="glass-card">
                    <div className="section-title"><Building2 size={20}/> Registered Clubs ({realClubs.filter(c => c.isActive).length} Active)</div>
                    {realClubs.length === 0 ? (
                      <div className="empty-state" style={{ padding: '60px 20px' }}><Users size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }}/><p>No clubs registered yet.</p></div>
                    ) : (
                      realClubs.map(c => (
                        <div key={c._id} style={{ padding: '20px 0', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.15rem' }}>{c.clubName}</div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 700, marginTop: '4px' }}><Landmark size={14} style={{ display: 'inline', marginRight: 4 }}/> {c.societyName}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '12px' }}><Users size={14} style={{ display: 'inline', marginRight: 4 }}/> <strong>Coordinator:</strong> {c.coordinatorName}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>📧 {c.coordinatorEmail} · 📞 {c.coordinatorPhone}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
                              <span className="badge" style={{ background: c.isActive ? 'rgba(52, 211, 153, 0.1)' : 'rgba(251, 113, 133, 0.1)', color: c.isActive ? 'var(--emerald)' : 'var(--rose)' }}>{c.isActive ? 'Active' : 'Inactive'}</span>
                              {c.isActive && <button className="btn btn-danger" style={{ padding: '8px 16px', borderRadius: 'var(--radius-xl)' }} onClick={() => removeClub(c._id)}><Trash2 size={16}/> Remove</button>}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── FORM FIELDS TAB ── */}
          {tab === 'fields' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-grid">
              <div className="glass-card">
                <div className="section-title"><BookType size={20}/> Add Custom Form Field</div>
                <form onSubmit={addField} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-group"><label className="form-label">Field Key (Unique Identifier) *</label><input placeholder="customEquipment1" value={fieldForm.fieldKey} onChange={e => setFieldForm(f => ({ ...f, fieldKey: e.target.value }))} required /></div>
                  <div className="form-group"><label className="form-label">Display Label *</label><input placeholder="Display Title" value={fieldForm.fieldLabel} onChange={e => setFieldForm(f => ({ ...f, fieldLabel: e.target.value }))} required /></div>
                  <div className="form-group"><label className="form-label">Input Control Type *</label>
                    <select value={fieldForm.fieldType} onChange={e => setFieldForm(f => ({ ...f, fieldType: e.target.value }))}>
                      {['text', 'textarea', 'checkbox', 'dropdown', 'multiselect', 'number', 'date'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <label className="checkbox-row" style={{ color: 'var(--text-secondary)' }}>
                    <input type="checkbox" checked={fieldForm.required} onChange={e => setFieldForm(f => ({ ...f, required: e.target.checked }))} />
                    <span className="checkbox-label" style={{ marginLeft: '12px' }}>Mandatory Field</span>
                  </label>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', borderRadius: 'var(--radius-xl)' }}>➕ Register Form Field</button>
                </form>
              </div>

              <div className="glass-card">
                <div className="section-title"><FormInput size={20}/> Active Form Fields ({fields.length})</div>
                {fields.length === 0 ? (
                  <div className="empty-state" style={{ padding: '60px 20px' }}><FormInput size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }}/><p>No custom dynamic fields configured.</p></div>
                ) : (
                  fields.map(f => (
                    <div key={f._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid var(--border)', gap: '16px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>{f.fieldLabel}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>Key: {f.fieldKey} · Type: {f.fieldType} {f.required ? '(Required)' : ''}</div>
                      </div>
                      <button className={`btn ${f.enabled ? 'btn-dark' : 'btn-primary'}`} style={{ padding: '8px 16px', borderRadius: 'var(--radius-xl)' }} onClick={() => toggleField(f._id, f.enabled)}>
                        {f.enabled ? <><ToggleRight size={16}/> Disable</> : <><ToggleLeft size={16}/> Enable</>}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ── AUDIT LOG TAB ── */}
          {tab === 'logs' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div className="section-title" style={{ margin: 0 }}><ScrollText size={24}/> System Immutable Audit Log</div>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: '40px' }}>{logTotal} Total Audit Entries</span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: '#fff' }}>
                      <th style={{ padding: '16px 12px' }}>Timestamp</th>
                      <th style={{ padding: '16px 12px' }}>Actor Email</th>
                      <th style={{ padding: '16px 12px' }}>Role</th>
                      <th style={{ padding: '16px 12px' }}>Action</th>
                      <th style={{ padding: '16px 12px' }}>Event Ref</th>
                      <th style={{ padding: '16px 12px' }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px' }}>No audit records indexed.</td></tr>
                    ) : logs.map(l => (
                      <tr key={l._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s ease', cursor: 'default' }}>
                        <td style={{ padding: '16px 12px', color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                          {new Date(l.createdAt).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '16px 12px', fontWeight: 600, color: '#fff' }}>{l.actorEmail}</td>
                        <td style={{ padding: '16px 12px' }}>
                          <span className="badge" style={{ background: l.actorRole === 'admin' ? 'rgba(251, 113, 133, 0.1)' : 'rgba(52, 211, 153, 0.1)', color: l.actorRole === 'admin' ? 'var(--rose)' : 'var(--emerald)' }}>{l.actorRole}</span>
                        </td>
                        <td style={{ padding: '16px 12px', fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                          {l.action}
                        </td>
                        <td style={{ padding: '16px 12px', fontWeight: 800 }}>{l.targetEventId ? `#${l.targetEventId}` : '—'}</td>
                        <td style={{ padding: '16px 12px', fontSize: '0.9rem' }}>{l.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </>
  );
}

