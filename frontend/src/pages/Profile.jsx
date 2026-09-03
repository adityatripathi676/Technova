import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Camera, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import CinematicBackground from '../components/CinematicBackground';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [msg, setMsg] = useState('');
  
  // Password state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Avatar state
  const [profilePic, setProfilePic] = useState(user?.profilePicture || '');

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return setMsg('❌ Image exceeds 10MB limit');
    const reader = new FileReader();
    reader.onload = (event) => setProfilePic(event.target.result);
    reader.readAsDataURL(file);
  };

  const commitAvatar = async () => {
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
    } catch (err) { 
      setMsg('❌ ' + (err.response?.data?.message || 'Password update failed')); 
    }
    setSavingProfile(false);
  };

  return (
    <>
      <CinematicBackground />
      <Navbar />
      <div className="page" style={{ position: 'relative', zIndex: 1 }}>
        <div className="container-full" style={{ padding: '0 40px', maxWidth: '1000px', margin: '0 auto' }}>
          <div className="page-header">
            <h1 style={{ fontSize: '3rem', color: '#fff' }}>My Profile</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Manage your security settings and identity module.</p>
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
                  <Lock size={18}/> Update Security Key
                </button>
              </form>
            </div>
            
            <div className="glass-card">
              <div className="section-title"><Camera size={24}/> Identity Module</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '20px 0' }}>
                <div style={{ position: 'relative' }}>
                  {profilePic ? (
                    <img src={profilePic} alt="Avatar" style={{ width: '160px', height: '160px', borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.1)', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }} />
                  ) : (
                    <div style={{ width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '3rem', fontWeight: 'bold', border: '4px solid rgba(255,255,255,0.1)' }}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <label style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--blue)', color: '#000', padding: '12px', borderRadius: '50%', cursor: 'pointer', border: '3px solid #050505', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <Camera size={20} />
                    <input type="file" accept="image/jpeg, image/png, image/webp" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                  </label>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{user?.name}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>{user?.role.toUpperCase()}</div>
                </div>
                <div style={{ width: '100%', marginTop: '16px' }}>
                  <label className="form-label" style={{ marginBottom: '12px', display: 'block', textAlign: 'center' }}>UPLOAD AVATAR (MAX 10MB)</label>
                  <input type="file" accept="image/jpeg, image/png, image/webp" className="file-input" onChange={handleAvatarUpload} style={{ marginBottom: '16px' }} />
                  <button type="button" className="btn btn-ghost" style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-xl)' }} onClick={commitAvatar} disabled={savingProfile || !profilePic}>
                    <Upload size={18}/> Commit Avatar Data
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
}
