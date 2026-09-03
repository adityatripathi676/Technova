import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Upload, Check, ImageIcon } from 'lucide-react';
import Cropper from 'react-easy-crop';
import heic2any from 'heic2any';

const FILTERS = [
  { name: 'Normal', filter: 'none' },
  { name: 'Grayscale', filter: 'grayscale(100%)' },
  { name: 'Sepia', filter: 'sepia(100%)' },
  { name: 'Contrast', filter: 'contrast(150%)' },
  { name: 'Brighten', filter: 'brightness(120%)' }
];

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop, filter = 'none') {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.filter = filter;
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );

  const MAX_DIM = 800;
  if (canvas.width > MAX_DIM || canvas.height > MAX_DIM) {
    const scaleCanvas = document.createElement('canvas');
    let newW = canvas.width;
    let newH = canvas.height;
    if (newW > newH) { newH *= MAX_DIM / newW; newW = MAX_DIM; }
    else { newW *= MAX_DIM / newH; newH = MAX_DIM; }
    scaleCanvas.width = newW;
    scaleCanvas.height = newH;
    const scaleCtx = scaleCanvas.getContext('2d');
    scaleCtx.drawImage(canvas, 0, 0, newW, newH);
    return scaleCanvas.toDataURL('image/jpeg', 0.6);
  }

  return canvas.toDataURL('image/jpeg', 0.6);
}

export default function AddTeamWizard({ isOpen, onClose, onSubmit, initialData }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialData || { name: '', role: '', email: '', phone: '', department: '', bio: '', image: '', linkedinUrl: '', githubUrl: '' });
  
  // Image Step State
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setForm(initialData || { name: '', role: '', email: '', phone: '', department: '', bio: '', image: '', linkedinUrl: '', githubUrl: '' });
      setImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setSelectedFilter('none');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      let file = e.target.files[0];
      if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
        setIsProcessingImage(true);
        try {
          const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
          file = Array.isArray(converted) ? converted[0] : converted;
        } catch (err) { console.error('HEIC conversion error', err); }
        setIsProcessingImage(false);
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result));
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const saveImageAndNext = async () => {
    if (imageSrc && croppedAreaPixels) {
      try {
        const croppedBase64 = await getCroppedImg(imageSrc, croppedAreaPixels, selectedFilter);
        setForm(f => ({ ...f, image: croppedBase64 }));
      } catch (e) {
        console.error('Cropping error', e);
      }
    }
    handleNext();
  };

  const skipImage = () => {
    setImageSrc(null);
    setForm(f => ({ ...f, image: '' }));
    handleNext();
  };

  const finalSubmit = () => {
    onSubmit(form);
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div 
        className="modal-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', width: '90%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{initialData ? 'Edit' : 'Add'} Operational Officer</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <div style={{ padding: '20px', display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', background: 'var(--bg-body)' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ flex: 1, height: '4px', background: step >= i ? 'var(--primary)' : 'var(--border)', borderRadius: '2px', transition: 'all 0.3s ease' }} />
          ))}
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="form-grid form-grid-2">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}><h3 style={{ margin: '0 0 10px 0' }}>Basic Details</h3></div>
                <div className="form-group"><label className="form-label">Full Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
                <div className="form-group"><label className="form-label">Role *</label><input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required /></div>
                <div className="form-group"><label className="form-label">Email *</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
                <div className="form-group"><label className="form-label">Phone *</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required /></div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Department</label><input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Operations, Logistics" /></div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>Profile Image</h3>
                {!imageSrc ? (
                  <div style={{ flex: 1, border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <input type="file" accept="image/*,.heic" onChange={handleFileChange} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
                    <Upload size={32} color="var(--text-secondary)" style={{ marginBottom: '12px' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Click or drag image to upload</p>
                    {isProcessingImage && <p style={{ color: 'var(--primary)', marginTop: '8px' }}>Processing HEIC...</p>}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
                    <div style={{ position: 'relative', flex: 1, background: '#111', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        style={{ containerStyle: { filter: selectedFilter } }}
                      />
                    </div>
                    <div style={{ width: '120px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                      <label className="form-label">Filters</label>
                      {FILTERS.map(f => (
                        <button 
                          key={f.name}
                          onClick={() => setSelectedFilter(f.filter)}
                          style={{ padding: '8px', background: selectedFilter === f.filter ? 'var(--primary)' : 'var(--bg-card-hover)', border: '1px solid', borderColor: selectedFilter === f.filter ? 'var(--primary)' : 'var(--border)', borderRadius: 'var(--radius-sm)', color: selectedFilter === f.filter ? '#000' : 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                          {f.name}
                        </button>
                      ))}
                      <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                        <label className="form-label">Zoom</label>
                        <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={e => setZoom(e.target.value)} style={{ width: '100%' }} />
                      </div>
                      <button onClick={() => setImageSrc(null)} className="btn btn-secondary" style={{ marginTop: '12px', padding: '6px' }}>Replace</button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="form-grid form-grid-1">
                <div className="form-group"><h3 style={{ margin: '0 0 10px 0' }}>Additional Details</h3></div>
                <div className="form-group">
                  <label className="form-label">Bio / Description</label>
                  <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={4} placeholder="Write a short description..." />
                </div>
                <div className="form-group">
                  <label className="form-label">LinkedIn URL</label>
                  <input value={form.linkedinUrl} onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))} placeholder="https://linkedin.com/in/..." />
                </div>
                <div className="form-group">
                  <label className="form-label">GitHub URL</label>
                  <input value={form.githubUrl} onChange={e => setForm(f => ({ ...f, githubUrl: e.target.value }))} placeholder="https://github.com/..." />
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} style={{ textAlign: 'center', padding: '20px 0' }}>
                <Check size={48} color="var(--emerald)" style={{ marginBottom: '16px' }} />
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>Ready to Submit</h3>
                <p style={{ color: 'var(--text-secondary)' }}>You are about to {initialData ? 'update' : 'add'} <strong>{form.name}</strong>.</p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px' }}>
                  {form.image ? (
                    <img src={form.image} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
                  ) : (
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-card-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border)' }}><ImageIcon size={32} color="var(--text-secondary)" /></div>
                  )}
                  <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <strong>{form.name || 'Unnamed'}</strong>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{form.role || 'No Role'}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{form.department || 'No Dept'}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', background: 'var(--bg-body)' }}>
          {step > 1 ? (
            <button onClick={handlePrev} className="btn btn-secondary"><ChevronLeft size={16} /> Back</button>
          ) : <div></div>}
          
          <div style={{ display: 'flex', gap: '12px' }}>
            {step === 2 && !imageSrc && (
              <button onClick={skipImage} className="btn btn-secondary">Skip Image</button>
            )}
            {step < 4 ? (
              <button 
                onClick={step === 2 && imageSrc ? saveImageAndNext : handleNext} 
                className="btn btn-primary"
                disabled={step === 1 && (!form.name || !form.role || !form.email || !form.phone)}
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={finalSubmit} className="btn btn-primary" style={{ background: 'var(--emerald)', color: '#000' }}>
                <Check size={16} /> {initialData ? 'Save Changes' : 'Add Officer'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
