import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { StatusPill } from '../components/common/StatusPill';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Search,
  Plus,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Phone,
  Building,
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal & Delete state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    type: 'Wholesale',
    address: '',
    status: 'Lead',
    followUpDate: '',
    notes: '',
  });

  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const fetchCustomers = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '10');
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);

      const res = await api.get(`/api/customers?${params.toString()}`);
      setCustomers(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, [search, statusFilter, typeFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/api/customers', form);
      setIsCreateOpen(false);
      setForm({
        name: '',
        mobile: '',
        email: '',
        businessName: '',
        gstNumber: '',
        type: 'Wholesale',
        address: '',
        status: 'Lead',
        followUpDate: '',
        notes: '',
      });
      fetchCustomers(1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create customer');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/customers/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchCustomers(meta.page);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete customer');
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">Customers Directory</h1>
          <p className="text-slate text-sm font-sans">CRM contacts, wholesale accounts & follow-up leads.</p>
        </div>

        {hasRole('Admin', 'Sales') && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-ledger hover:bg-ledger-hover text-white font-semibold rounded text-sm transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-signal-redLight border border-signal-red/30 text-signal-red rounded text-sm font-medium flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs underline font-mono">Dismiss</button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="card-manifest p-4 bg-white shadow-manifest flex flex-wrap items-center justify-between gap-4">
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search name, mobile, business..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-paper border border-slate-border rounded focus:outline-none focus:border-ledger font-sans text-ink"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-paper border border-slate-border rounded font-sans text-ink focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Lead">Lead</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-paper border border-slate-border rounded font-sans text-ink focus:outline-none"
          >
            <option value="">All Account Types</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Distributor">Distributor</option>
            <option value="Retail">Retail</option>
          </select>
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="card-manifest bg-white shadow-manifest overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate font-mono text-sm">Loading customer records...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate font-sans">
            <Users className="w-8 h-8 mx-auto text-slate-light mb-2" />
            <p className="font-medium text-ink">No customers found</p>
            <p className="text-xs text-slate mt-1">Try adjusting search filters or add your first customer above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans border-collapse">
              <thead>
                <tr className="bg-paper border-b border-slate-border font-mono text-xs text-slate uppercase">
                  <th className="py-3 px-4">Customer / Business</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Follow-Up</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-paper/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-ink">{c.name}</div>
                      <div className="text-xs text-slate flex items-center gap-1 font-mono">
                        <Building className="w-3 h-3 text-slate-light" />
                        {c.businessName}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-light" />
                        {c.mobile}
                      </div>
                      <div>{c.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">{c.type}</td>
                    <td className="py-3.5 px-4">
                      <StatusPill status={c.status} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate">
                      {c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => navigate(`/customers/${c.id}`)}
                        className="p-1.5 text-ledger hover:bg-ledger-light rounded transition inline-flex items-center gap-1 text-xs font-semibold"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {hasRole('Admin') && (
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="p-1.5 text-signal-red hover:bg-signal-redLight rounded transition inline-flex items-center"
                          title="Soft Delete Customer"
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
              onClick={() => fetchCustomers(meta.page - 1)}
              className="px-2.5 py-1 bg-white border border-slate-border rounded disabled:opacity-50 hover:bg-paper"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => fetchCustomers(meta.page + 1)}
              className="px-2.5 py-1 bg-white border border-slate-border rounded disabled:opacity-50 hover:bg-paper"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Customer Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="card-manifest w-full max-w-lg bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="font-display font-bold text-xl text-ink mb-4">Add New Customer</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4 font-sans text-sm">
              <div>
                <label className="block text-xs font-mono text-slate uppercase mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2 bg-paper border border-slate-border rounded text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate uppercase mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    className="w-full p-2 bg-paper border border-slate-border rounded text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate uppercase mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full p-2 bg-paper border border-slate-border rounded text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate uppercase mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  className="w-full p-2 bg-paper border border-slate-border rounded text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate uppercase mb-1">GST Number (Optional)</label>
                  <input
                    type="text"
                    value={form.gstNumber}
                    onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                    className="w-full p-2 bg-paper border border-slate-border rounded text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate uppercase mb-1">Account Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full p-2 bg-paper border border-slate-border rounded text-ink"
                  >
                    <option value="Wholesale">Wholesale</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Retail">Retail</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate uppercase mb-1">Billing / Delivery Address *</label>
                <textarea
                  required
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full p-2 bg-paper border border-slate-border rounded text-ink"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-border">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-paper hover:bg-slate-border/50 text-slate rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-ledger hover:bg-ledger-hover text-white font-semibold rounded"
                >
                  Create Customer
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
        title={`Soft Delete Customer '${deleteTarget?.name}'?`}
        message={`Are you sure you want to soft delete ${deleteTarget?.businessName}? If active (Draft/Confirmed) challans exist, deletion will be blocked.`}
        confirmLabel="Delete Customer"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
