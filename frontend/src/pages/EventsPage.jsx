import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin, Building2, Search, Clock, CalendarX2 } from 'lucide-react';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import CinematicBackground from '../components/CinematicBackground';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  useEffect(() => {
    // Fetch approved events from public API
    API.get('/events/approved')
      .then(res => {
        setEvents(res.data.events || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const filtered = events.filter(e => {
    const matchSearch = e.eventName.toLowerCase().includes(search.toLowerCase()) ||
                        e.clubName.toLowerCase().includes(search.toLowerCase()) ||
                        e.venue.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <>
      <CinematicBackground />
      <Navbar />
      <div className="page" style={{ position: 'relative', zIndex: 1, paddingBottom: '100px' }}>
        <div className="container">
          
          <div className="page-header text-center" style={{ maxWidth: '800px', margin: '0 auto 60px' }}>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mono-label" style={{ marginBottom: '16px', display: 'inline-block', padding: '6px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.1)' }}>
              // MANAV RACHNA INTERNATIONAL INSTITUTE OF RESEARCH AND STUDIES CAMPUS EVENTS
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ fontSize: '3.5rem', fontWeight: 900, color: '#fff', marginBottom: '24px', lineHeight: 1.1 }}>
              Event Calendar <span style={{ color: 'var(--text-muted)' }}>& Directory</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: 1.6 }}>
              Explore upcoming hackathons, technical workshops, cultural fests, and society seminars across the campus network.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '40px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)' }}/>
                <input
                  placeholder="Search by event title, club name, or venue…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '20px 20px 20px 52px', fontSize: '1.1rem', borderRadius: 'var(--radius-xl)', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
              </div>
            </motion.div>
          </div>

          {loading ? (
            <div className="text-center" style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Synchronizing with campus directory…</div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card empty-state" style={{ maxWidth: '600px', margin: '0 auto', padding: '80px 40px' }}>
              <CalendarX2 size={64} color="var(--text-muted)" style={{ margin: '0 auto 24px' }}/>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>No events found matching your search parameters.</p>
            </motion.div>
          ) : (
            <motion.div initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="events-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px' }}>
              {filtered.map(ev => (
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} whileHover={{ y: -5 }} key={ev._id} className="glass-card card-interactive" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '32px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ color: '#fff', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.05em' }}>#{ev.eventId}</span>
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', marginBottom: '12px', lineHeight: 1.3 }}>{ev.eventName}</h3>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Building2 size={16}/> <strong>{ev.clubName}</strong></span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={16}/> {ev.venue}</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, lineClamp: 3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {ev.eventDescription}
                    </p>
                  </div>

                  <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CalendarDays size={16}/> {ev.eventDate ? new Date(ev.eventDate).toLocaleDateString('en-IN') : 'Date TBD'}
                    </span>
                    <span style={{ color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={16}/> {ev.eventDuration}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

        </div>
      </div>
    </>
  );
}

