import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { StockGauge } from '../components/common/StockGauge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Search,
  Plus,
  ArrowDownUp,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Tag,
  Warehouse,
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Create Product Form State
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: 'Electrical',
    unitPrice: 100,
    currentStock: 10,
    minStockAlert: 5,
    warehouseLocation: 'Rack A-1',
  });

  // Stock Movement Form State
  const [adjustForm, setAdjustForm] = useState({
    quantityChanged: 5,
    movementType: 'IN',
    reason: 'Manual warehouse audit adjustment',
  });

  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '10');
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      if (lowStockOnly) params.set('lowStockOnly', 'true');

      const res = await api.get(`/api/products?${params.toString()}`);
      setProducts(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [search, categoryFilter, lowStockOnly]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/api/products', {
        ...form,
        unitPrice: Number(form.unitPrice),
        currentStock: Number(form.currentStock),
        minStockAlert: Number(form.minStockAlert),
      });
      setIsCreateOpen(false);
      fetchProducts(1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create product');
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    setError(null);
    try {
      await api.post(`/api/products/${adjustTarget.id}/stock-movements`, {
        quantityChanged: Number(adjustForm.quantityChanged),
        movementType: adjustForm.movementType,
        reason: adjustForm.reason,
      });
      setAdjustTarget(null);
      fetchProducts(meta.page);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record stock movement');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/products/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchProducts(meta.page);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete product');
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">Inventory & Stock Ledger</h1>
          <p className="text-slate text-sm font-sans">Product catalog, pricing, warehouse locations & stock gauges.</p>
        </div>

        {hasRole('Admin', 'Warehouse') && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-ledger hover:bg-ledger-hover text-white font-semibold rounded text-sm transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-signal-redLight border border-signal-red/30 text-signal-red rounded text-sm font-medium flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs underline font-mono">Dismiss</button>
        </div>
      )}

      {/* Filter & Low Stock Toggle Bar */}
      <div className="card-manifest p-4 bg-white shadow-manifest flex flex-wrap items-center justify-between gap-4">
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search SKU, product name, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-paper border border-slate-border rounded focus:outline-none focus:border-ledger font-sans text-ink"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer font-sans text-xs font-semibold text-ink bg-paper px-3 py-2 rounded border border-slate-border">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded text-amber focus:ring-amber"
            />
            <AlertTriangle className="w-3.5 h-3.5 text-amber" />
            <span>Low Stock Alert Filter</span>
          </label>

          <input
            type="text"
            placeholder="Category filter..."
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-paper border border-slate-border rounded font-sans text-ink focus:outline-none"
          />
        </div>
      </div>

      {/* Product Data Table */}
      <div className="card-manifest bg-white shadow-manifest overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate font-mono text-sm">Loading inventory ledger...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate font-sans">
            <Package className="w-8 h-8 mx-auto text-slate-light mb-2" />
            <p className="font-medium text-ink">No products found</p>
            <p className="text-xs text-slate mt-1">Try resetting search filters or create a product above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans border-collapse">
              <thead>
                <tr className="bg-paper border-b border-slate-border font-mono text-xs text-slate uppercase">
                  <th className="py-3 px-4">SKU / Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4 min-w-[160px]">Current Stock Gauge</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-paper/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-xs text-ledger">[{p.sku}]</div>
                      <div className="font-semibold text-ink">{p.name}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate">{p.category}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-ink">
                      ₹{Number(p.unitPrice).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      {/* Signature StockGauge Component */}
                      <StockGauge currentStock={p.currentStock} minStockAlert={p.minStockAlert} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate">
                      <span className="inline-flex items-center gap-1 bg-paper px-2 py-0.5 rounded border border-slate-border">
                        <Warehouse className="w-3 h-3 text-slate-light" />
                        {p.warehouseLocation}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {hasRole('Admin', 'Warehouse') && (
                        <button
                          onClick={() => setAdjustTarget(p)}
                          className="p-1.5 text-ledger hover:bg-ledger-light rounded transition inline-flex items-center gap-1 text-xs font-semibold"
                          title="Adjust Stock (IN/OUT)"
                        >
                          <ArrowDownUp className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/products/${p.id}`)}
                        className="p-1.5 text-slate hover:text-ink hover:bg-paper rounded transition inline-flex items-center"
                        title="View Details & Movement Ledger"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {hasRole('Admin') && (
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 text-signal-red hover:bg-signal-redLight rounded transition inline-flex items-center"
                          title="Soft Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 bg-paper border-t border-slate-border flex items-center justify-between font-mono text-xs text-slate">
          <span>
            Showing Page {meta.page} of {meta.totalPages} ({meta.total} records total)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={meta.page <= 1}
              onClick={() => fetchProducts(meta.page - 1)}
              className="px-2.5 py-1 bg-white border border-slate-border rounded disabled:opacity-50 hover:bg-paper"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => fetchProducts(meta.page + 1)}
              className="px-2.5 py-1 bg-white border border-slate-border rounded disabled:opacity-50 hover:bg-paper"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Manual Stock Adjustment Modal */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="card-manifest w-full max-w-md bg-white p-6 shadow-2xl">
            <h2 className="font-display font-bold text-lg text-ink mb-1">
              Manual Stock Adjustment
            </h2>
            <p className="text-xs font-mono text-slate mb-4">
              Item: [{adjustTarget.sku}] {adjustTarget.name} (Current Stock: {adjustTarget.currentStock})
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 font-sans text-sm">
              <div>
                <label className="block text-xs font-mono text-slate uppercase mb-1">Movement Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, movementType: 'IN' })}
                    className={`py-2 rounded font-mono font-bold text-xs ${
                      adjustForm.movementType === 'IN'
                        ? 'bg-ledger text-white'
                        : 'bg-paper text-slate border border-slate-border'
                    }`}
                  >
                    + IN (Stock Addition)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, movementType: 'OUT' })}
                    className={`py-2 rounded font-mono font-bold text-xs ${
                      adjustForm.movementType === 'OUT'
                        ? 'bg-signal-red text-white'
                        : 'bg-paper text-slate border border-slate-border'
                    }`}
                  >
                    - OUT (Stock Removal)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate uppercase mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustForm.quantityChanged}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantityChanged: Number(e.target.value) })}
                  className="w-full p-2 bg-paper border border-slate-border rounded font-mono text-ink font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate uppercase mb-1">Reason / Note *</label>
                <textarea
                  required
                  rows={2}
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  placeholder="e.g. Physical inventory count correction, damaged goods removal..."
                  className="w-full p-2 bg-paper border border-slate-border rounded text-ink"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-border">
                <button
                  type="button"
                  onClick={() => setAdjustTarget(null)}
                  className="px-4 py-2 bg-paper text-slate rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-ledger hover:bg-ledger-hover text-white font-semibold rounded"
                >
                  Record Stock Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="card-manifest w-full max-w-lg bg-white p-6 shadow-2xl">
            <h2 className="font-display font-bold text-xl text-ink mb-4">Add New Product</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4 font-sans text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate uppercase mb-1">SKU (Unique) *</label>
                  <input
                    type="text"
                    required
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                    placeholder="e.g. CAB-IND-10M"
                    className="w-full p-2 bg-paper border border-slate-border rounded text-ink font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate uppercase mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-2 bg-paper border border-slate-border rounded text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate uppercase mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2 bg-paper border border-slate-border rounded text-ink"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate uppercase mb-1">Unit Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.unitPrice}
                    onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                    className="w-full p-2 bg-paper border border-slate-border rounded font-mono text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate uppercase mb-1">Initial Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.currentStock}
                    onChange={(e) => setForm({ ...form, currentStock: Number(e.target.value) })}
                    className="w-full p-2 bg-paper border border-slate-border rounded font-mono text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate uppercase mb-1">Min Alert *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.minStockAlert}
                    onChange={(e) => setForm({ ...form, minStockAlert: Number(e.target.value) })}
                    className="w-full p-2 bg-paper border border-slate-border rounded font-mono text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate uppercase mb-1">Warehouse Location *</label>
                <input
                  type="text"
                  required
                  value={form.warehouseLocation}
                  onChange={(e) => setForm({ ...form, warehouseLocation: e.target.value })}
                  placeholder="e.g. Rack A-12, Bin F-09"
                  className="w-full p-2 bg-paper border border-slate-border rounded text-ink font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-border">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-paper text-slate rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-ledger hover:bg-ledger-hover text-white font-semibold rounded"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        isDanger={true}
        title={`Soft Delete Product '[${deleteTarget?.sku}] ${deleteTarget?.name}'?`}
        message="If this product is referenced in active Draft challans, deletion will be blocked."
        confirmLabel="Delete Product"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
