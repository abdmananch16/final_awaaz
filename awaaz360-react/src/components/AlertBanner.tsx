import { X, WarningCircle, Info, CheckCircle } from '@phosphor-icons/react';
import { useState } from 'react';

interface AlertBannerProps {
  type?: 'info' | 'success' | 'warning';
  message: string;
  icon?: React.ReactNode;
  dismissible?: boolean;
}

export default function AlertBanner({ type = 'info', message, icon, dismissible = true }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const icons = {
    info: <Info size={16} weight="fill" style={{ color: 'var(--color-sky)' }} />,
    success: <CheckCircle size={16} weight="fill" style={{ color: 'var(--color-green)' }} />,
    warning: <WarningCircle size={16} weight="fill" style={{ color: 'var(--color-gold)' }} />,
  };

  const borders = {
    info: 'rgba(79, 195, 247, 0.2)',
    success: 'rgba(46, 213, 115, 0.2)',
    warning: 'rgba(255, 209, 102, 0.2)',
  };

  return (
    <div
      className="alert-banner"
      style={{ borderColor: borders[type] }}
    >
      {icon || icons[type]}
      <span className="flex-1">{message}</span>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="!p-1 !bg-transparent !shadow-none hover:!bg-white/5"
          style={{ minWidth: 28, height: 28 }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
