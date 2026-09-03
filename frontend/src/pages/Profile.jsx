import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Camera, Upload, X, Check, ZoomIn, RotateCw, User as UserIcon, Phone, Briefcase, RefreshCw } from 'lucide-react';
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
  
  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    designation: user?.designation || ''
  });

  const [savingProfile, setSavingProfile] = useState(false);
  
  // Avatar state
  const [profilePic, setProfilePic] = useState(user?.profilePicture || '');

  // Cropper state
  const [selectedImage, setSelectedImage] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Sync profile form when user context updates (on reload/login)
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        designation: user.designation || ''
      });
      setProfilePic(user.profilePicture || '');
    }
  }, [user]);

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
      const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels, rotation);
      setProfilePic(croppedImage);
      setShowCropModal(false);
      setSelectedImage(null);
      // Reset zoom/crop/rotation
      setZoom(1);
      setRotation(0);
      setCrop({ x: 0, y: 0 });
    } catch (e) {
      setMsg('❌ Failed to crop image');
    }
  };

  const commitProfileUpdates = async () => {
    setSavingProfile(true);
    try {
      const payload = {
        profilePicture: profilePic,
        name: profileForm.name,
        phone: profileForm.phone,
        designation: profileForm.designation
      };
      await API.patch('/auth/profile', payload);
      updateUser(payload);
      setMsg('✅ Profile updated successfully');
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Failed to update profile'));
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
                  rotation={rotation}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                />
              </div>
              
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <ZoomIn size={20} color="var(--text-muted)" />
                    <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      aria-labelledby="Zoom"
                      onChange={(e) => setZoom(e.target.value)}
                      style={{ flex: 1, cursor: 'pointer', accentColor: 'var(--blue)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <RotateCw size={20} color="var(--text-muted)" />
                    <input
                      type="range"
                      value={rotation}
                      min={0}
                      max={360}
                      step={1}
                      aria-labelledby="Rotation"
                      onChange={(e) => setRotation(e.target.value)}
                      style={{ flex: 1, cursor: 'pointer', accentColor: 'var(--blue)' }}
                    />
                  </div>

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
        <div className="container-full" style={{ padding: '0 40px', maxWidth: '1200px', margin: '0 auto' }}>
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h1 style={{ fontSize: '3rem', color: '#fff' }}>My Profile</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Manage your personal details, security settings, and identity module.</p>
            </div>
            
            <button type="button" className="btn btn-primary" style={{ padding: '14px 28px', borderRadius: 'var(--radius-xl)', minWidth: '200px', boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)' }} onClick={commitProfileUpdates} disabled={savingProfile}>
              {savingProfile ? <RefreshCw size={18} className="spin" style={{ marginRight: '8px' }} /> : <Upload size={18} style={{ marginRight: '8px' }} />}
              Save All Changes
            </button>
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

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'start' }}>
            
            {/* Identity Module */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="section-title"><Camera size={24}/> Identity Module</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '20px 0', flex: 1 }}>
                
                {/* Avatar with Edit Icon */}
                <div style={{ position: 'relative', marginTop: '10px' }}>
                  {profilePic ? (
                    <img src={profilePic} alt="Avatar" style={{ width: '180px', height: '180px', borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.1)', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }} />
                  ) : (
                    <div style={{ width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '4rem', fontWeight: 'bold', border: '4px solid rgba(255,255,255,0.1)', boxShadow: '0 0 30px rgba(0,0,0,0.3)' }}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <label 
                    style={{ position: 'absolute', bottom: '5px', right: '5px', background: 'var(--blue)', color: '#fff', padding: '12px', borderRadius: '50%', cursor: 'pointer', border: '4px solid #050505', boxShadow: '0 4px 15px rgba(0,0,0,0.4)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} 
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Camera size={22} />
                    <input type="file" accept="image/jpeg, image/png, image/webp" style={{ display: 'none' }} onChange={handleAvatarSelect} />
                  </label>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.02em' }}>{user?.name}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 700, letterSpacing: '0.05em', background: 'rgba(255,255,255,0.05)', display: 'inline-block', padding: '4px 12px', borderRadius: '20px' }}>{user?.role.toUpperCase()}</div>
                </div>
                
              </div>
            </div>

            {/* Personal Information Form */}
            <div className="glass-card">
              <div className="section-title"><UserIcon size={24}/> Personal Information</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><UserIcon size={18} /></div>
                    <input type="text" placeholder="John Doe" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} required style={{ paddingLeft: '44px' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Phone size={18} /></div>
                    <input type="tel" placeholder="+91 9876543210" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} style={{ paddingLeft: '44px' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Designation / Role</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Briefcase size={18} /></div>
                    <input type="text" placeholder="e.g. Core Team Member, Secretary" value={profileForm.designation} onChange={e => setProfileForm(f => ({ ...f, designation: e.target.value }))} style={{ paddingLeft: '44px' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Security Settings Form */}
            <div className="glass-card">
              <div className="section-title"><Lock size={24}/> Security Settings</div>
              <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Current Keyphrase *</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Lock size={18} /></div>
                    <input type="password" placeholder="••••••••" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} required style={{ paddingLeft: '44px' }} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">New Keyphrase *</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Lock size={18} /></div>
                    <input type="password" placeholder="Min 8 characters" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} required minLength="8" style={{ paddingLeft: '44px' }} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Keyphrase *</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Lock size={18} /></div>
                    <input type="password" placeholder="Min 8 characters" value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} required minLength="8" style={{ paddingLeft: '44px' }} />
                  </div>
                </div>
                <button type="submit" className="btn btn-dark" style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-xl)', marginTop: '8px' }} disabled={savingProfile}>
                  Update Security Key
                </button>
              </form>
            </div>
            
          </motion.div>

        </div>
      </div>
    </>
  );
}
