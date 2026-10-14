import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { useState } from 'react';

const VARIANTS = {
  success: { icon: CheckCircle2, classes: 'bg-green-50 border-green-200 text-green-800' },
  error: { icon: XCircle, classes: 'bg-red-50 border-red-200 text-red-800' },
  warning: { icon: AlertCircle, classes: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
  info: { icon: Info, classes: 'bg-blue-50 border-blue-200 text-blue-800' },
};

export default function Alert({ variant = 'info', message, onClose, className = '' }) {
  const [visible, setVisible] = useState(true);
  if (!message || !visible) return null;

  const { icon: Icon, classes } = VARIANTS[variant] || VARIANTS.info;

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${classes} ${className}`} role="alert">
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={handleClose} className="ml-auto flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
