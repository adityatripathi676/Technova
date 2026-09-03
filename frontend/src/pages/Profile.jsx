import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Camera, Upload, X, Check, ZoomIn } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import CinematicBackground from '../components/CinematicBackground';
import getCroppedImg from '../utils/cropImage';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [msg, setMsg] = useState('');
  
  // Password state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Avatar state
  const [profilePic, setProfilePic] = useState(user?.profilePicture || '');

  // Cropper state
  const [selectedImage, setSelectedImage] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return setMsg('❌ Image exceeds 10MB limit');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target.result);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = null;
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const generateCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels);
      setProfilePic(croppedImage);
      setShowCropModal(false);
      setSelectedImage(null);
      // Reset zoom/crop
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } catch (e) {
      setMsg('❌ Failed to crop image');
    }
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
      
      {/* CROP MODAL */}
      <AnimatePresence>
        {showCropModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              style={{ background: '#0a0a0a', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '600px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Camera size={20} /> Adjust Avatar</h3>
                <button onClick={() => setShowCropModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              
              <div style={{ position: 'relative', width: '100%', height: '400px', background: '#000' }}>
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <ZoomIn size={20} color="var(--text-muted)" />
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(e.target.value)}
                    style={{ flex: 1, cursor: 'pointer' }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-dark" style={{ flex: 1, padding: '14px', borderRadius: 'var(--radius-xl)' }} onClick={() => setShowCropModal(false)}>Cancel</button>
                  <button className="btn btn-primary" style={{ flex: 1, padding: '14px', borderRadius: 'var(--radius-xl)' }} onClick={generateCroppedImage}><Check size={18} style={{ marginRight: '8px' }} /> Confirm Crop</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            
            {/* Identity Module - Moved to left/first for prominence */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="section-title"><Camera size={24}/> Identity Module</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '10px 0', flex: 1 }}>
                <div style={{ position: 'relative', marginTop: '10px' }}>
                  {profilePic ? (
                    <img src={profilePic} alt="Avatar" style={{ width: '160px', height: '160px', borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.1)', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }} />
                  ) : (
                    <div style={{ width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '3.5rem', fontWeight: 'bold', border: '4px solid rgba(255,255,255,0.1)', boxShadow: '0 0 30px rgba(0,0,0,0.3)' }}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.02em' }}>{user?.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 700, letterSpacing: '0.05em' }}>{user?.role.toUpperCase()}</div>
                </div>
                
                <div style={{ width: '100%', marginTop: 'auto', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                    <label className="btn btn-dark" style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-xl)', cursor: 'pointer', justifyContent: 'center', display: 'flex', alignItems: 'center' }}>
                      <Camera size={18} style={{ marginRight: '8px' }} /> Select New Image
                      <input type="file" accept="image/jpeg, image/png, image/webp" style={{ display: 'none' }} onChange={handleAvatarSelect} />
                    </label>
                    <button type="button" className="btn btn-primary" style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-xl)' }} onClick={commitAvatar} disabled={savingProfile || !profilePic || profilePic === user?.profilePicture}>
                      <Upload size={18} style={{ marginRight: '8px' }} /> Commit Updates
                    </button>
                  </div>
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '16px' }}>
                    Supported formats: JPEG, PNG, WEBP (Max 10MB)
                  </p>
                </div>
              </div>
            </div>

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
                <button type="submit" className="btn btn-dark" style={{ width: '100%', padding: '16px', fontSize: '1.05rem', borderRadius: 'var(--radius-xl)', marginTop: '8px' }} disabled={savingProfile}>
                  <Lock size={18} style={{ marginRight: '8px' }}/> Update Security Key
                </button>
              </form>
            </div>
            
          </motion.div>

        </div>
      </div>
    </>
  );
}
