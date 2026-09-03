import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault(); // Prevent default browser mini-infobar
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also show if PWA is installable via manual detection
    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setIsInstalled(true);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || !isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '32px',
        right: '32px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '12px',
      }}
    >
      {/* Tooltip label */}
      <div
        style={{
          background: 'rgba(20,20,20,0.95)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '12px',
          padding: '10px 16px',
          color: '#fff',
          fontSize: '0.85rem',
          fontWeight: 600,
          backdropFilter: 'blur(20px)',
          whiteSpace: 'nowrap',
          boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
          animation: 'fadeIn 0.3s ease',
        }}
      >
        Install Technova App
      </div>

      {/* Circle install button */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {/* Dismiss button */}
        <button
          onClick={() => setIsVisible(false)}
          title="Dismiss"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'rgba(30,30,30,0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(50,50,50,0.9)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(30,30,30,0.8)'}
        >
          <X size={16} />
        </button>

        {/* Main install button */}
        <button
          onClick={handleInstall}
          title="Install App"
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#ffffff',
            color: '#000000',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(255,255,255,0.25), 0 4px 12px rgba(0,0,0,0.4)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            animation: 'pulse-ring 2s ease-in-out infinite',
          }}
          onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(255,255,255,0.4), 0 6px 16px rgba(0,0,0,0.5)'; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,255,255,0.25), 0 4px 12px rgba(0,0,0,0.4)'; }}
        >
          <Download size={24} />
        </button>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 8px 32px rgba(255,255,255,0.25), 0 0 0 0 rgba(255,255,255,0.3); }
          50% { box-shadow: 0 8px 32px rgba(255,255,255,0.25), 0 0 0 12px rgba(255,255,255,0); }
        }
      `}</style>
    </div>
  );
}
