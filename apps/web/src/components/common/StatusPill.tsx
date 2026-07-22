import React from 'react';

interface StatusPillProps {
  status: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  let styleClasses = 'bg-slate text-white';

  switch (status) {
    case 'Draft':
    case 'Lead':
      styleClasses = 'bg-amber text-white shadow-sm';
      break;
    case 'Confirmed':
    case 'Active':
      styleClasses = 'bg-ledger text-white shadow-sm';
      break;
    case 'Cancelled':
    case 'Inactive':
      styleClasses = 'bg-signal-red text-white shadow-sm';
      break;
    default:
      styleClasses = 'bg-slate text-white';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold font-mono tracking-wide ${styleClasses}`}>
      {status}
    </span>
  );
};
