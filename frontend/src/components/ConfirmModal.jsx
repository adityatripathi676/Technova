import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', type = 'danger' }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 9999
        }}
      >
        <motion.div 
          className="modal-content"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            width: '90%', maxWidth: '400px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            textAlign: 'center'
          }}
        >
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            {type === 'danger' ? (
              <div style={{ background: 'rgba(251,113,133,0.1)', padding: '16px', borderRadius: '50%' }}>
                <AlertCircle size={32} color="var(--rose)" />
              </div>
            ) : (
              <div style={{ background: 'rgba(52,211,153,0.1)', padding: '16px', borderRadius: '50%' }}>
                <CheckCircle size={32} color="var(--emerald)" />
              </div>
            )}
          </div>
          
          <h3 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', color: 'var(--text-primary)' }}>{title}</h3>
          <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{message}</p>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={onCancel}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '10px' }}
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
              style={{ flex: 1, padding: '10px', background: type === 'danger' ? 'var(--rose)' : 'var(--primary)', color: type === 'danger' ? '#fff' : '#000', border: 'none' }}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
