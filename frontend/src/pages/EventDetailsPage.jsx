import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Shield, LayoutGrid, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StatusBadge from '../components/StatusBadge';
import CinematicBackground from '../components/CinematicBackground';

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get(`/events/track/${eventId}`)
      .then(res => {
        setEvent(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.response?.data?.message || 'Event not found.');
        setLoading(false);
      });
  }, [eventId]);

  const getStatusIcon = (status) => {
    if (status === 'Approved') return <CheckCircle size={16} color="var(--emerald)" />;
    if (status === 'Rejected') return <XCircle size={16} color="var(--rose)" />;
    if (status === 'Pending') return <AlertCircle size={16} color="var(--amber)" />;
    return <Info size={16} color="var(--blue)" />;
  };

  return (
    <>
      <CinematicBackground />
      <Navbar />
      
      <div style={{ position: 'relative', zIndex: 1, padding: '120px 0 60px', minHeight: '80vh' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '32px', width: 'fit-content' }}>
            <ArrowLeft size={16} /> Back to Search
          </Link>

          {loading ? (
            <div className="glass-card" style={{ height: '400px', animation: 'pulse 2s infinite', opacity: 0.5 }} />
          ) : error ? (
            <div className="glass-card text-center" style={{ padding: '60px 20px' }}>
              <AlertCircle size={48} color="var(--rose)" style={{ margin: '0 auto 20px' }} />
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px' }}>Event Not Found</h2>
              <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
            </div>
          ) : event ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="glass-card" style={{ padding: '40px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <div className="mono-label" style={{ marginBottom: '8px' }}>EVENT ID #{event.eventId}</div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.2 }}>{event.eventName}</h1>
                  </div>
                  <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Overall Status</span>
                    <StatusBadge status={event.overallStatus} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Shield size={20} color="var(--primary)" />
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Organizing Club</div>
                      <div style={{ fontWeight: 600 }}>{event.clubName}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Calendar size={20} color="var(--primary)" />
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date</div>
                      <div style={{ fontWeight: 600 }}>{new Date(event.eventDate).toLocaleDateString('en-GB')}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Clock size={20} color="var(--primary)" />
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Time</div>
                      <div style={{ fontWeight: 600 }}>{event.startTime} - {event.endTime}</div>
                    </div>
                  </div>
                  {event.venue && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <MapPin size={20} color="var(--primary)" />
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Venue</div>
                        <div style={{ fontWeight: 600 }}>{event.venue}</div>
                      </div>
                    </div>
                  )}
                  {event.expectedFootfall && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Users size={20} color="var(--primary)" />
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Footfall</div>
                        <div style={{ fontWeight: 600 }}>{event.expectedFootfall}</div>
                      </div>
                    </div>
                  )}
                </div>

                {event.description && (
                  <div style={{ padding: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-lg)', marginBottom: '32px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Description</div>
                    <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)', textAlign: 'justify' }}>{event.description}</p>
                  </div>
                )}

                {event.resources && Object.keys(event.resources).length > 0 && (
                  <>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LayoutGrid size={20} /> Resource Logistics
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                      {Object.entries(event.resources).map(([dept, data]) => {
                        if (!data.requested) return null;
                        return (
                          <div key={dept} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{dept.replace(/([A-Z])/g, ' $1').trim()}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                              {getStatusIcon(data.status)}
                              <span style={{ 
                                color: data.status === 'Approved' ? 'var(--emerald)' : data.status === 'Rejected' ? 'var(--rose)' : 'var(--amber)',
                                fontWeight: 600
                              }}>
                                {data.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {event.updates && event.updates.length > 0 && (
                <div className="glass-card" style={{ padding: '40px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Public Announcements</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {event.updates.map(update => (
                      <div key={update._id} style={{ paddingLeft: '20px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{new Date(update.createdAt).toLocaleString()}</span>
                          {update.type && (
                            <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', textTransform: 'uppercase' }}>
                              {update.type}
                            </span>
                          )}
                        </div>
                        <p style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>{update.message}</p>
                        {update.author && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '8px', fontWeight: 500 }}>
                            — {update.author}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : null}
        </div>
      </div>
      <Footer />
    </>
  );
}
