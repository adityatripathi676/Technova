import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, ShieldCheck, Landmark, FormInput, ScrollText, 
  UserPlus, Key, UserX, UserCheck, Edit2, Check, X, 
  Trash2, PlusCircle, Building2, BookType, ToggleLeft, ToggleRight,
  Filter, Search, Calendar, Briefcase, Code, Mail
} from 'lucide-react';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import CinematicBackground from '../components/CinematicBackground';
import DragDropImageUpload from '../components/DragDropImageUpload';
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
  const [editTeam, setEditTeam] = useState(null);
  const [editTeamForm, setEditTeamForm] = useState({ name: '', role: '', email: '', phone: '', department: '', bio: '', image: '', linkedinUrl: '', githubUrl: '' });

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
  const [fieldForm, setFieldForm] = useState({ fieldKey: '', fieldLabel: '', fieldType: 'text', required: false, enabled: true, options: '' });
  const [fieldDropdownOpen, setFieldDropdownOpen] = useState(false);

  // Audit Logs
  const [logs, setLogs] = useState([]);
  const [logTotal, setLogTotal] = useState(0);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [activePopup, setActivePopup] = useState(null);
  const [colFilters, setColFilters] = useState({ email: '', role: '', action: '', details: '' });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const flash = useCallback((m) => {
    setMsg(m);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setMsg(''), 4500);
  }, []);

  const load = useCallback(async () => {
    try {
      if (tab === 'users') { const r = await API.get('/admin/users'); setUsers(r.data || []); }
      if (tab === 'team')  { const r = await API.get('/admin/team');  setTeam(r.data || []); }
      if (tab === 'clubs') { const r = await API.get('/admin/clubs'); setClubs(r.data || []); }
      if (tab === 'fields') { const r = await API.get('/admin/fields'); setFields(r.data || []); }
      if (tab === 'logs')  { const r = await API.get('/admin/audit-logs?limit=100'); setLogs(r.data.logs || []); setLogTotal(r.data.total || 0); }
    } catch (e) { flash('❌ ' + (e.response?.data?.message || 'Failed to load system data')); }
  }, [tab, flash]);

  useEffect(() => { load(); }, [load]);

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
    } catch (err) { 
      const backendMsg = err.response?.data?.message;
      const status = err.response?.status;
      const sysMsg = err.message;
      flash(`❌ Add failed: ${backendMsg || `[Status: ${status}] ${sysMsg}`}`);
      console.error('Add team error:', err);
    }
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

  const handleImageUpload = (e, setFormFunc) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      flash('❌ Image size must be less than 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormFunc(f => ({ ...f, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const startEditTeam = (m) => {
    setEditTeam(m._id);
    setEditTeamForm({
      name: m.name, role: m.role, email: m.email, phone: m.phone,
      department: m.department || '', bio: m.bio || '', image: m.image || '',
      linkedinUrl: m.linkedinUrl || '', githubUrl: m.githubUrl || ''
    });
  };

  const submitEditTeam = async (e, id) => {
    e.preventDefault();
    try {
      await API.patch(`/admin/team/${id}`, editTeamForm);
      flash('✅ Team member details updated');
      setEditTeam(null);
      load();
    } catch (err) { 
      const backendMsg = err.response?.data?.message;
      const status = err.response?.status;
      const sysMsg = err.message;
      flash(`❌ Update failed: ${backendMsg || `[Status: ${status}] ${sysMsg}`}`);
      console.error('Update error:', err);
    }
  };

  const removeTeam = async (id) => {
    if (!window.confirm('Permanently remove this team member from directory?')) return;
    try { await API.delete(`/admin/team/${id}`); flash('✅ Team member permanently removed'); load(); }
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
    try { 
      const payload = { ...fieldForm };
      if (['dropdown', 'multiselect'].includes(payload.fieldType) && typeof payload.options === 'string') {
        payload.options = payload.options.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        payload.options = [];
      }
      await API.post('/admin/fields', payload); 
      flash('✅ Custom form field added'); 
      setFieldForm({ fieldKey: '', fieldLabel: '', fieldType: 'text', required: false, enabled: true, options: '' }); 
      load(); 
    }
    catch (err) { flash('❌ ' + (err.response?.data?.message || 'Failed to add field')); }
  };
  const removeField = async (id) => {
    if (!window.confirm('Delete this form field? This may affect existing event requests.')) return;
    try { await API.delete(`/admin/fields/${id}`); flash('✅ Field deleted'); load(); }
    catch (err) { flash('❌ Delete failed'); }
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
      <div className="page" style={{ position: 'relative', zIndex: 1, paddingTop: '100px' }}>
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
                    <div className="form-group"><label className="form-label">Profile Image (Max 10MB)</label><DragDropImageUpload value={teamForm.image || ''} onChange={(val) => setTeamForm(f => ({ ...f, image: val }))} /></div>
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
                {team.filter(m => m.isActive).length === 0 ? (
                  <div className="empty-state" style={{ padding: '60px 20px' }}><Users size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }}/><p>No operational personnel added yet.</p></div>
                ) : (
                  team.filter(m => m.isActive).map(m => (
                    <div key={m._id} style={{ padding: '20px 0', borderBottom: '1px solid var(--border)' }}>
                      {editTeam === m._id ? (
                        <form onSubmit={(e) => submitEditTeam(e, m._id)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '8px' }}>Edit Team Member</div>
                          <div className="form-grid form-grid-2">
                            <div className="form-group"><label className="form-label">Full Name *</label><input value={editTeamForm.name} onChange={e => setEditTeamForm(f => ({ ...f, name: e.target.value }))} required /></div>
                            <div className="form-group"><label className="form-label">Role Title *</label><input value={editTeamForm.role} onChange={e => setEditTeamForm(f => ({ ...f, role: e.target.value }))} required /></div>
                            <div className="form-group"><label className="form-label">Email Address *</label><input type="email" value={editTeamForm.email} onChange={e => setEditTeamForm(f => ({ ...f, email: e.target.value }))} required /></div>
                            <div className="form-group"><label className="form-label">Phone Number *</label><input value={editTeamForm.phone} onChange={e => setEditTeamForm(f => ({ ...f, phone: e.target.value }))} required /></div>
                            <div className="form-group"><label className="form-label">Department</label><input value={editTeamForm.department} onChange={e => setEditTeamForm(f => ({ ...f, department: e.target.value }))} /></div>
                            <div className="form-group">
                              <label className="form-label">Profile Image (Max 10MB)</label>
                              <DragDropImageUpload value={editTeamForm.image || ''} onChange={(val) => setEditTeamForm(f => ({ ...f, image: val }))} />
                            </div>
                          </div>
                          <div className="form-group"><label className="form-label">Short Bio</label><textarea rows={2} value={editTeamForm.bio} onChange={e => setEditTeamForm(f => ({ ...f, bio: e.target.value }))} /></div>
                          <div className="form-grid form-grid-2">
                            <div className="form-group"><label className="form-label">LinkedIn URL</label><input value={editTeamForm.linkedinUrl} onChange={e => setEditTeamForm(f => ({ ...f, linkedinUrl: e.target.value }))} /></div>
                            <div className="form-group"><label className="form-label">GitHub URL</label><input value={editTeamForm.githubUrl} onChange={e => setEditTeamForm(f => ({ ...f, githubUrl: e.target.value }))} /></div>
                          </div>
                          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px', borderRadius: 'var(--radius-lg)' }}><Check size={16}/> Save Changes</button>
                            <button type="button" className="btn" style={{ padding: '8px 20px', borderRadius: 'var(--radius-lg)' }} onClick={() => setEditTeam(null)}><X size={16}/> Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {m.image ? (
                              <img src={m.image} alt={m.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}><Users size={20}/></div>
                            )}
                            <div>
                              <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>{m.name}</div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600 }}>{m.role} {m.department && `· ${m.department}`}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span><Mail size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }}/>{m.email}</span>
                                <span>·</span>
                                <span>📞 {m.phone}</span>
                                {m.linkedinUrl && (
                                  <>
                                    <span>·</span>
                                    <a href={m.linkedinUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }} title="LinkedIn"><Briefcase size={14}/></a>
                                  </>
                                )}
                                {m.githubUrl && (
                                  <>
                                    <span>·</span>
                                    <a href={m.githubUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }} title="GitHub"><Code size={14}/></a>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          {m.isActive ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button className="btn" style={{ padding: '8px', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit" onClick={() => startEditTeam(m)}><Edit2 size={16}/></button>
                              <button className="btn btn-danger" style={{ padding: '8px', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Remove" onClick={() => removeTeam(m._id)}><Trash2 size={16}/></button>
                            </div>
                          ) : (
                            <span className="badge" style={{ background: 'rgba(251, 113, 133, 0.1)', color: 'var(--rose)' }}>Removed</span>
                          )}
                        </div>
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
                    <div style={{ position: 'relative' }}>
                      <div 
                        onClick={() => setFieldDropdownOpen(!fieldDropdownOpen)}
                        style={{ 
                          width: '100%', padding: '16px', background: 'rgba(0,0,0,0.4)', 
                          border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                          color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                      >
                        {fieldForm.fieldType}
                        <span style={{ transform: fieldDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                      </div>
                      {fieldDropdownOpen && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
                          background: '#1a1a1a', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                          zIndex: 10, overflow: 'hidden'
                        }}>
                          {['text', 'textarea', 'checkbox', 'dropdown', 'multiselect', 'number', 'date'].map(t => (
                            <div 
                              key={t}
                              onClick={() => { setFieldForm(f => ({ ...f, fieldType: t })); setFieldDropdownOpen(false); }}
                              style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', background: fieldForm.fieldType === t ? 'rgba(255,255,255,0.1)' : 'transparent' }}
                              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                              onMouseLeave={(e) => e.target.style.background = fieldForm.fieldType === t ? 'rgba(255,255,255,0.1)' : 'transparent'}
                            >
                              {t}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {['dropdown', 'multiselect'].includes(fieldForm.fieldType) && (
                    <div className="form-group" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                      <label className="form-label">Options (comma separated) *</label>
                      <textarea 
                        placeholder="Option 1, Option 2, Option 3" 
                        value={fieldForm.options} 
                        onChange={e => setFieldForm(f => ({ ...f, options: e.target.value }))} 
                        required 
                        style={{ width: '100%', padding: '16px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', color: '#fff', minHeight: '80px', resize: 'vertical' }}
                      />
                    </div>
                  )}
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
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button className={`btn ${f.enabled ? 'btn-dark' : 'btn-primary'}`} style={{ padding: '8px 16px', borderRadius: 'var(--radius-xl)' }} onClick={() => toggleField(f._id, f.enabled)}>
                          {f.enabled ? <><ToggleRight size={16}/> Disable</> : <><ToggleLeft size={16}/> Enable</>}
                        </button>
                        <button className="btn btn-danger" style={{ padding: '8px 16px', borderRadius: 'var(--radius-xl)' }} onClick={() => removeField(f._id)}>
                          <Trash2 size={16}/> Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ── AUDIT LOG TAB ── */}
          {tab === 'logs' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div className="section-title" style={{ margin: 0 }}><ScrollText size={24}/> System Immutable Audit Log</div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: showGlobalSearch ? 250 : 0, opacity: showGlobalSearch ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      autoFocus={showGlobalSearch}
                      value={globalSearch} 
                      onChange={e => setGlobalSearch(e.target.value)} 
                      style={{ width: '100%', padding: '8px 16px', borderRadius: '40px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.9rem' }} 
                    />
                  </motion.div>
                  <button className="btn btn-dark" style={{ padding: '8px', borderRadius: '50%' }} onClick={() => setShowGlobalSearch(!showGlobalSearch)}>
                    <Search size={16} />
                  </button>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: '40px', whiteSpace: 'nowrap' }}>{logTotal} Total Audit Entries</span>
                </div>
              </div>

              <div style={{ overflowX: 'auto', paddingBottom: '100px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: '#fff' }}>
                      <th style={{ padding: '16px 12px', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          Timestamp
                          <Filter size={14} style={{ cursor: 'pointer', opacity: activePopup === 'timestamp' || dateRange.start || dateRange.end ? 1 : 0.5 }} onClick={() => setActivePopup(activePopup === 'timestamp' ? null : 'timestamp')} />
                        </div>
                        {activePopup === 'timestamp' && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>From:</label>
                            <input type="datetime-local" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: '#fff', borderRadius: '4px', padding: '6px' }} />
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>To:</label>
                            <input type="datetime-local" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: '#fff', borderRadius: '4px', padding: '6px' }} />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                              <button className="btn btn-dark" onClick={() => { setDateRange({start: '', end: ''}); setActivePopup(null); }} style={{ padding: '4px 8px', flex: 1, fontSize: '0.8rem' }}>Clear</button>
                              <button className="btn btn-primary" onClick={() => setActivePopup(null)} style={{ padding: '4px 8px', flex: 1, fontSize: '0.8rem' }}>Apply</button>
                            </div>
                          </div>
                        )}
                      </th>
                      <th style={{ padding: '16px 12px', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          Actor Email
                          <Search size={14} style={{ cursor: 'pointer', opacity: activePopup === 'email' || colFilters.email ? 1 : 0.5 }} onClick={() => setActivePopup(activePopup === 'email' ? null : 'email')} />
                        </div>
                        {activePopup === 'email' && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', zIndex: 10, display: 'flex', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                            <input type="text" placeholder="Search Email..." autoFocus value={colFilters.email} onChange={e => setColFilters({...colFilters, email: e.target.value})} onKeyDown={e => { if (e.key === 'Enter') setActivePopup(null); }} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: '#fff', borderRadius: '4px', padding: '6px 8px' }} />
                          </div>
                        )}
                      </th>
                      <th style={{ padding: '16px 12px', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          Role
                          <Filter size={14} style={{ cursor: 'pointer', opacity: activePopup === 'role' || colFilters.role ? 1 : 0.5 }} onClick={() => setActivePopup(activePopup === 'role' ? null : 'role')} />
                        </div>
                        {activePopup === 'role' && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                            <select value={colFilters.role} onChange={e => { setColFilters({...colFilters, role: e.target.value}); setActivePopup(null); }} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: '#fff', borderRadius: '4px', padding: '6px 8px' }}>
                              <option value="">All Roles</option>
                              <option value="admin">Admin</option>
                              <option value="approver">Approver</option>
                            </select>
                          </div>
                        )}
                      </th>
                      <th style={{ padding: '16px 12px', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          Action
                          <Search size={14} style={{ cursor: 'pointer', opacity: activePopup === 'action' || colFilters.action ? 1 : 0.5 }} onClick={() => setActivePopup(activePopup === 'action' ? null : 'action')} />
                        </div>
                        {activePopup === 'action' && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', zIndex: 10, display: 'flex', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                            <input type="text" placeholder="Search Action..." autoFocus value={colFilters.action} onChange={e => setColFilters({...colFilters, action: e.target.value})} onKeyDown={e => { if (e.key === 'Enter') setActivePopup(null); }} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: '#fff', borderRadius: '4px', padding: '6px 8px' }} />
                          </div>
                        )}
                      </th>
                      <th style={{ padding: '16px 12px' }}>Event Ref</th>
                      <th style={{ padding: '16px 12px', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          Details
                          <Search size={14} style={{ cursor: 'pointer', opacity: activePopup === 'details' || colFilters.details ? 1 : 0.5 }} onClick={() => setActivePopup(activePopup === 'details' ? null : 'details')} />
                        </div>
                        {activePopup === 'details' && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', zIndex: 10, display: 'flex', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                            <input type="text" placeholder="Search Details..." autoFocus value={colFilters.details} onChange={e => setColFilters({...colFilters, details: e.target.value})} onKeyDown={e => { if (e.key === 'Enter') setActivePopup(null); }} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: '#fff', borderRadius: '4px', padding: '6px 8px' }} />
                          </div>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs
                      .filter(l => {
                        if (globalSearch) {
                          const s = globalSearch.toLowerCase();
                          if (!l.actorEmail?.toLowerCase().includes(s) && !l.action?.toLowerCase().includes(s) && !l.details?.toLowerCase().includes(s)) return false;
                        }
                        if (colFilters.email && !l.actorEmail?.toLowerCase().includes(colFilters.email.toLowerCase())) return false;
                        if (colFilters.role && l.actorRole !== colFilters.role) return false;
                        if (colFilters.action && !l.action?.toLowerCase().includes(colFilters.action.toLowerCase())) return false;
                        if (colFilters.details && !l.details?.toLowerCase().includes(colFilters.details.toLowerCase())) return false;
                        
                        if (dateRange.start && new Date(l.createdAt) < new Date(dateRange.start)) return false;
                        if (dateRange.end && new Date(l.createdAt) > new Date(dateRange.end)) return false;
                        
                        return true;
                      })
                      .map(l => (
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
                    {logs.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px' }}>No audit records indexed.</td></tr>
                    )}
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

