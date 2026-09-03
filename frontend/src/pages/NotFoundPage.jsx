import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar';
import CinematicBackground from '../components/CinematicBackground';

export default function NotFoundPage() {
  return (
    <>
      <CinematicBackground />
      <Navbar />
      
      <div className="page" style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', paddingTop: '80px', paddingBottom: '40px' }}>
        
        <div style={{ textAlign: 'center', maxWidth: '600px', padding: '0 20px' }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '24px' }}>
              <AlertTriangle size={80} style={{ color: 'var(--primary-color)', opacity: 0.8 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'var(--primary-color)', filter: 'blur(30px)', opacity: 0.2, zIndex: -1, borderRadius: '50%' }}></div>
            </div>
            <h1 className="font-heading" style={{ fontSize: '4rem', fontWeight: 900, marginBottom: '16px', color: '#fff', letterSpacing: '-0.02em' }}>404</h1>
            <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px', color: '#e2e8f0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Page Not Found</h2>
            <p style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '40px', maxWidth: '480px', margin: '0 auto 40px' }}>
              The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            
            <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', padding: '14px 32px', fontSize: '1rem', letterSpacing: '0.05em' }}>
              Return to Overview <ArrowRight size={18} style={{ marginLeft: '8px' }} />
            </Link>
          </motion.div>
        </div>
      </div>
    </>
  );
}
