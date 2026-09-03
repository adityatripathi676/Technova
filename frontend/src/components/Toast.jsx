import { useEffect, useRef } from 'react';

export function Toast({ toasts, remove }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} remove={remove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, remove }) {
  const timer = useRef(null);
  useEffect(() => {
    timer.current = setTimeout(() => remove(toast.id), 3800);
    return () => clearTimeout(timer.current);
  }, [toast.id, remove]);

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  return (
    <div className={`toast toast-${toast.type}`} onClick={() => remove(toast.id)}>
      <span>{icons[toast.type] || 'ℹ️'}</span>
      <span>{toast.message}</span>
    </div>
  );
}

let toastId = 0;
export function useToast() {
  const [toasts, setToasts] = (typeof window !== 'undefined')
    ? [[], () => {}] : [[], () => {}];
  // This is handled via state in App.jsx passed down
  return null;
}
