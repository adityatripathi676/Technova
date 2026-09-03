import React, { useState, useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import heic2any from 'heic2any';

export default function DragDropImageUpload({ value, onChange, maxSizeMB = 10 }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const processAndCompressImage = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Max dimensions
        const MAX_DIM = 800;
        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.5 quality to guarantee it's small enough for Vercel/MongoDB limits
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
        setIsProcessing(false);
        onChange(compressedBase64);
      };
      img.onerror = () => {
        setIsProcessing(false);
        setError('Failed to process image');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFile = async (file) => {
    setError('');
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image size must be less than ${maxSizeMB}MB`);
      return;
    }

    setIsProcessing(true);

    try {
      let processFile = file;

      // Convert HEIC/HEIF to JPEG first
      if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
        const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
        // heic2any might return an array of blobs if it's an animated image, just take the first one
        processFile = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      } else if (!file.type.startsWith('image/')) {
        setIsProcessing(false);
        setError('Please upload a valid image file');
        return;
      }

      processAndCompressImage(processFile);
    } catch (err) {
      console.error('Image processing error:', err);
      setIsProcessing(false);
      setError('Failed to process image. Try a standard JPG/PNG.');
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const triggerSelect = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  const removeImage = (e) => {
    e.stopPropagation(); // prevent clicking the dropzone
    onChange('');
    setError('');
  };

  return (
    <div style={{ width: '100%' }}>
      {value ? (
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          height: '160px', 
          borderRadius: 'var(--radius-lg)', 
          overflow: 'hidden',
          border: '1px solid var(--border)',
          background: 'rgba(0,0,0,0.5)'
        }}>
          <img src={value} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button 
            type="button" 
            onClick={removeImage}
            style={{
              position: 'absolute', top: '8px', right: '8px',
              background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff',
              borderRadius: '50%', width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10
            }}
            title="Remove image"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div 
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={triggerSelect}
          style={{
            border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)',
            background: isDragging ? 'rgba(99, 102, 241, 0.1)' : 'rgba(0, 0, 0, 0.2)',
            height: '160px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            color: isDragging ? 'var(--primary)' : 'var(--text-secondary)'
          }}
        >
          <input 
            type="file" 
            accept="image/*,.heic,.heif" 
            ref={fileInputRef} 
            onChange={onFileChange} 
            style={{ display: 'none' }} 
          />
          
          {isProcessing ? (
            <>
              <Loader2 size={32} className="spin" style={{ marginBottom: '12px', opacity: 0.8 }} />
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>
                Optimizing image...
              </div>
            </>
          ) : (
            <>
              <UploadCloud size={32} style={{ marginBottom: '12px', opacity: 0.8 }} />
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>
                Click or drag image here
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                JPG, PNG, HEIC (max. {maxSizeMB}MB)
              </div>
            </>
          )}
        </div>
      )}
      
      {error && (
        <div style={{ color: 'var(--rose)', fontSize: '0.85rem', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <X size={14} /> {error}
        </div>
      )}
    </div>
  );
}
