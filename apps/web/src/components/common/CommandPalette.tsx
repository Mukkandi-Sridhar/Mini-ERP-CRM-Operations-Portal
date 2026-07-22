import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Package, FileText, PlusCircle, X } from 'lucide-react';
import { api } from '../../lib/api';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ customers: any[]; products: any[]; challans: any[] }>({
    customers: [],
    products: [],
    challans: [],
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or state trigger
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !query.trim()) {
      setResults({ customers: [], products: [], challans: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [cRes, pRes, chRes] = await Promise.all([
          api.get(`/api/customers?search=${encodeURIComponent(query)}&pageSize=3`),
          api.get(`/api/products?search=${encodeURIComponent(query)}&pageSize=3`),
          api.get(`/api/challans?search=${encodeURIComponent(query)}&pageSize=3`),
        ]);
        setResults({
          customers: cRes.data.data || [],
          products: pRes.data.data || [],
          challans: chRes.data.data || [],
        });
      } catch {
        // Ignore search errors in palette
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-ink/50 backdrop-blur-xs p-4">
      <div className="card-manifest w-full max-w-2xl bg-white shadow-2xl overflow-hidden rounded-lg animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 border-b border-slate-border">
          <Search className="w-5 h-5 text-slate mr-3" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search customers, products, challans... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-4 text-base bg-transparent text-ink placeholder-slate focus:outline-none font-sans"
          />
          <button onClick={onClose} className="text-slate hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!query && (
            <div className="space-y-2">
              <p className="text-xs font-mono text-slate uppercase tracking-wider">Quick Actions</p>
              <div
                onClick={() => handleSelect('/challans/new')}
                className="flex items-center gap-3 p-3 rounded hover:bg-paper cursor-pointer text-ink font-medium"
              >
                <PlusCircle className="w-4 h-4 text-ledger" />
                <span>Create New Delivery Challan</span>
              </div>
              <div
                onClick={() => handleSelect('/customers')}
                className="flex items-center gap-3 p-3 rounded hover:bg-paper cursor-pointer text-ink"
              >
                <User className="w-4 h-4 text-slate" />
                <span>View All Customers</span>
              </div>
              <div
                onClick={() => handleSelect('/products')}
                className="flex items-center gap-3 p-3 rounded hover:bg-paper cursor-pointer text-ink"
              >
                <Package className="w-4 h-4 text-slate" />
                <span>View Inventory Products</span>
              </div>
            </div>
          )}

          {loading && <p className="text-sm text-slate p-2">Searching live ledger...</p>}

          {results.customers.length > 0 && (
            <div>
              <p className="text-xs font-mono text-slate uppercase tracking-wider mb-1">Customers</p>
              {results.customers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelect(`/customers/${c.id}`)}
                  className="flex items-center justify-between p-2.5 rounded hover:bg-paper cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-ledger" />
                    <span className="font-medium text-ink">{c.name}</span>
                    <span className="text-xs text-slate">({c.businessName})</span>
                  </div>
                  <span className="font-mono text-xs text-slate">{c.mobile}</span>
                </div>
              ))}
            </div>
          )}

          {results.products.length > 0 && (
            <div>
              <p className="text-xs font-mono text-slate uppercase tracking-wider mb-1">Products</p>
              {results.products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelect(`/products/${p.id}`)}
                  className="flex items-center justify-between p-2.5 rounded hover:bg-paper cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber" />
                    <span className="font-medium text-ink">{p.name}</span>
                    <span className="font-mono text-xs text-slate">[{p.sku}]</span>
                  </div>
                  <span className="font-mono text-xs text-slate">₹{Number(p.unitPrice).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {results.challans.length > 0 && (
            <div>
              <p className="text-xs font-mono text-slate uppercase tracking-wider mb-1">Challans</p>
              {results.challans.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => handleSelect(`/challans/${ch.id}`)}
                  className="flex items-center justify-between p-2.5 rounded hover:bg-paper cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-ledger" />
                    <span className="font-mono font-medium text-ink">{ch.challanNumber || 'Draft Challan'}</span>
                    <span className="text-xs text-slate">{ch.customer?.name}</span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-ink">₹{Number(ch.totalAmount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
