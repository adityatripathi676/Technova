import React, { useState, useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';

export default function DragDropImageUpload({ value, onChange, maxSizeMB = 10 }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    setError('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image size must be less than ${maxSizeMB}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result);
    };
    reader.readAsDataURL(file);
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
    fileInputRef.current?.click();
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
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            color: isDragging ? 'var(--primary)' : 'var(--text-secondary)'
          }}
        >
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={onFileChange} 
            style={{ display: 'none' }} 
          />
          <UploadCloud size={32} style={{ marginBottom: '12px', opacity: 0.8 }} />
          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>
            Click or drag image here
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
            SVG, PNG, JPG or GIF (max. {maxSizeMB}MB)
          </div>
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
