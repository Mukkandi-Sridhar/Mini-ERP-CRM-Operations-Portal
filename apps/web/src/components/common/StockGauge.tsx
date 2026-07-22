import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StockGaugeProps {
  currentStock: number;
  minStockAlert: number;
  showIcon?: boolean;
}

export const StockGauge: React.FC<StockGaugeProps> = ({
  currentStock,
  minStockAlert,
  showIcon = true,
}) => {
  const isLowStock = currentStock <= minStockAlert;
  // Calculate percentage relative to 2x min alert baseline
  const maxScale = Math.max(minStockAlert * 3, 50);
  const percentage = Math.min(Math.max((currentStock / maxScale) * 100, 4), 100);

  return (
    <div className="flex flex-col gap-1 min-w-[120px]">
      <div className="flex items-center justify-between font-mono text-sm font-semibold tabular-nums">
        <span className={isLowStock ? 'text-amber-600 font-bold' : 'text-ink'}>
          {currentStock} units
        </span>
        {showIcon && isLowStock && (
          <span className="inline-flex items-center text-xs text-amber-600 font-sans font-medium bg-amber-light px-1.5 py-0.5 rounded border border-amber/20">
            <AlertTriangle className="w-3 h-3 mr-1" /> Low Stock
          </span>
        )}
      </div>

      {/* Signature thin horizontal level bar gauge */}
      <div className="w-full h-1.5 bg-slate-border rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isLowStock ? 'bg-amber' : 'bg-ledger'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-slate font-mono">
        <span>Min Alert: {minStockAlert}</span>
      </div>
    </div>
  );
};
