const STATUS_MAP = {
  'Pending':           { cls: 'badge-pending',  icon: '⏳' },
  'Approved':          { cls: 'badge-approved', icon: '✅' },
  'Rejected':          { cls: 'badge-rejected', icon: '❌' },
  'In Review':         { cls: 'badge-review',   icon: '🔍' },
  'Partially Approved':{ cls: 'badge-partial',  icon: '⚡' },
};

export default function StatusBadge({ status }) {
  const { cls, icon } = STATUS_MAP[status] || { cls: 'badge-pending', icon: '⏳' };
  return (
    <span className={`badge ${cls}`}>
      {icon} {status}
    </span>
  );
}
