import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export default function Alert({ type = 'info', message, children, style }) {
  const icons = {
    info: <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />,
    success: <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />,
    warning: <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />,
    danger: <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />,
  };

  return (
    <div className={`alert alert-${type}`} style={style}>
      {icons[type] || icons.info}
      <div style={{ flex: 1 }}>{message || children}</div>
    </div>
  );
}
