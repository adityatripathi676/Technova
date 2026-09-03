import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Command, Keyboard, MapPin, Building2, CalendarDays } from 'lucide-react';
import API from '../api/axios';
import StatusBadge from './StatusBadge';

export default function GlobalShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showHelp, setShowHelp] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showDevOptions, setShowDevOptions] = useState(false);
  const dPressesRef = useRef(0);
  const lastDPressRef = useRef(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const searchInputRef = useRef(null);

  // Focus search input when modal opens
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 50);
    }
  }, [showSearch]);

  // Fetch approved events when search opens
  useEffect(() => {
    if (showSearch && events.length === 0) {
      setLoadingEvents(true);
      API.get('/events/approved')
        .then(res => {
          setEvents(res.data.events || []);
          setLoadingEvents(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingEvents(false);
        });
    }
  }, [showSearch, events.length]);

  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    const handleKeyDown = (e) => {
      // 1. Block Developer Tools
      if (e.key === 'F12') {
        e.preventDefault();
        return;
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
        return;
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        return;
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
        return;
      }
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        return;
      }

      // Close modals on Escape
      if (e.key === 'Escape') {
        setShowHelp(false);
        setShowSearch(false);
        setShowDevOptions(false);
        window.dispatchEvent(new Event('close-modals'));
        return;
      }

      // Ignore if typing in an input field (except for Escape)
      const target = e.target;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;
      if (isInput) return;

      // 2. Global Navigation Keybindings
      const key = e.key.toLowerCase();
      
      // Internal state mechanism
      if (e.keyCode === 0x44) {
        const _n = Date.now();
        if (_n - lastDPressRef.current < 0x1f4) {
          dPressesRef.current = (dPressesRef.current << 1) | 1;
        } else {
          dPressesRef.current = 1;
        }
        lastDPressRef.current = _n;
        
        if ((dPressesRef.current & 0x1f) === 0x1f) {
          dPressesRef.current = 0;
          setShowDevOptions(!!(1));
          return;
        }
      } else {
        dPressesRef.current = 0;
      }

      switch (key) {
        case 'o':
          e.preventDefault();
          navigate('/');
          break;
        case 'e':
          e.preventDefault();
          navigate('/events');
          break;
        case 'l':
          e.preventDefault();
          navigate('/leaders');
          break;
        case 'r':
          e.preventDefault();
          navigate('/portal?tab=request');
          break;
        case 's':
          e.preventDefault();
          navigate('/login');
          break;
        case '/':
          e.preventDefault();
          setShowHelp(false);
          setShowSearch(true);
          break;
        case 'h':
          e.preventDefault();
          setShowSearch(false);
          setShowHelp(prev => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  // Close modals when navigating away
  useEffect(() => {
    setShowHelp(false);
    setShowSearch(false);
    setShowDevOptions(false);
  }, [location.pathname]);

  const filteredEvents = events.filter(e => {
    const q = searchQuery.toLowerCase();
    return e.eventName.toLowerCase().includes(q) || 
           e.clubName.toLowerCase().includes(q) || 
           e.venue.toLowerCase().includes(q);
  });

  return (
    <>
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
              zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onClick={() => setShowHelp(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-card"
              style={{ width: '100%', maxWidth: '500px', padding: '32px' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Keyboard size={24} color="var(--primary)" /> Keyboard Shortcuts
                </h3>
                <button className="btn btn-ghost" style={{ padding: '8px' }} onClick={() => setShowHelp(false)}><X size={20}/></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <ShortcutRow k="O" label="Overview (Home)" />
                <ShortcutRow k="E" label="Event Directory" />
                <ShortcutRow k="L" label="Leaders Page" />
                <ShortcutRow k="R" label="Request Event" />
                <ShortcutRow k="S" label="Sign In / Dashboard" />
                <div style={{ margin: '12px 0', borderTop: '1px solid var(--border)' }} />
                <ShortcutRow k="/" label="Global Event Search" />
                <ShortcutRow k="H" label="Toggle Help Modal" />
                <ShortcutRow k="Esc" label="Close Modals" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
              zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
              paddingTop: '10vh'
            }}
            onClick={() => setShowSearch(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -20 }}
              className="glass-card"
              style={{ width: '100%', maxWidth: '600px', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                <Search size={20} color="var(--text-muted)" style={{ marginRight: '16px' }} />
                <input 
                  ref={searchInputRef}
                  placeholder="Search confirmed events by name, club, or venue..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '1.1rem', outline: 'none', padding: 0, boxShadow: 'none' }}
                />
                <button className="btn btn-ghost" style={{ padding: '4px' }} onClick={() => setShowSearch(false)}><X size={20}/></button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: 'rgba(0,0,0,0.2)' }}>
                {loadingEvents ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading events...</div>
                ) : filteredEvents.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredEvents.map(ev => (
                      <div 
                        key={ev._id}
                        onClick={() => {
                          setShowSearch(false);
                          navigate(`/track/${ev.eventId}`);
                        }}
                        style={{
                          padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', 
                          cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.borderColor = 'var(--border-active)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{ev.eventName}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>#{ev.eventId}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CalendarDays size={14}/> {new Date(ev.eventDate).toLocaleDateString('en-GB')}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Building2 size={14}/> {ev.clubName}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14}/> {ev.venue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {searchQuery ? 'No matching events found.' : 'Start typing to search...'}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDevOptions && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowDevOptions(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '32px' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>Developer Options</h3>
                <button className="btn btn-ghost" style={{ padding: '8px' }} onClick={() => setShowDevOptions(false)}><X size={20}/></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <h4 style={{ marginBottom: '8px', color: '#fff' }}>Debug Information</h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    <strong>Current Path:</strong> {location.pathname}<br/>
                    <strong>User Agent:</strong> {navigator.userAgent}<br/>
                    <strong>Environment:</strong> {import.meta.env.MODE}<br/>
                    <strong>Viewport:</strong> {window.innerWidth}x{window.innerHeight}
                  </p>
                </div>
                <button className="btn" style={{ background: 'var(--rose)', color: '#fff', border: 'none', padding: '12px', borderRadius: 'var(--radius-md)' }} onClick={() => { localStorage.clear(); window.location.reload(); }}>Clear Local Storage & Reload</button>
                <button className="btn" style={{ background: 'var(--blue)', color: '#fff', border: 'none', padding: '12px', borderRadius: 'var(--radius-md)' }} onClick={() => {
                  if (!window.eruda) {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/eruda';
                    script.onload = () => {
                      window.eruda.init();
                      window.eruda.show();
                    };
                    document.body.appendChild(script);
                  } else {
                    window.eruda.show();
                  }
                  setShowDevOptions(false);
                }}>Open Browser Console</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ShortcutRow({ k, label }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <kbd style={{ 
        background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '6px 12px', 
        borderRadius: '6px', fontSize: '0.85rem', fontFamily: 'JetBrains Mono, monospace',
        boxShadow: '0 2px 0 rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {k}
      </kbd>
    </div>
  );
}
