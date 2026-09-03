export default function ContactCard({ contact }) {
  if (!contact || !contact.name) return null;

  const initials = contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="contact-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
        <div className="avatar">{initials}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{contact.name}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{contact.role}</div>
        </div>
        <span className="badge badge-approved" style={{ marginLeft: 'auto' }}>Assigned</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        <div>📧 <a href={`mailto:${contact.email}`}>{contact.email}</a></div>
        <div>📞 <a href={`tel:${contact.phone}`}>{contact.phone}</a></div>
      </div>
    </div>
  );
}
