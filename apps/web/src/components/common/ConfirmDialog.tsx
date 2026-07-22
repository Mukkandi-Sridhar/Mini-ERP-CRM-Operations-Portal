import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
      <div className="card-manifest w-full max-w-md bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-150">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${isDanger ? 'bg-signal-redLight text-signal-red' : 'bg-ledger-light text-ledger'}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-ink">{title}</h3>
            <p className="mt-2 text-sm text-slate">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate bg-paper hover:bg-slate-border/50 rounded transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white rounded transition shadow-sm ${
              isDanger
                ? 'bg-signal-red hover:bg-signal-red/90'
                : 'bg-ledger hover:bg-ledger-hover'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
