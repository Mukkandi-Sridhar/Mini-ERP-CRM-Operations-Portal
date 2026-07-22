import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { StatusPill } from '../components/common/StatusPill';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Search,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building,
} from 'lucide-react';

export const ChallansPage: React.FC = () => {
  const [challans, setChallans] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const fetchChallans = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '10');
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await api.get(`/api/challans?${params.toString()}`);
      setChallans(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans(1);
  }, [search, statusFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">Delivery Challans</h1>
          <p className="text-slate text-sm font-sans">Wholesale dispatch manifests, draft orders & confirmed invoices.</p>
        </div>

        {hasRole('Admin', 'Sales') && (
          <button
            onClick={() => navigate('/challans/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-ledger hover:bg-ledger-hover text-white font-semibold rounded text-sm transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Challan</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="card-manifest p-4 bg-white shadow-manifest flex flex-wrap items-center justify-between gap-4">
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search challan # or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-paper border border-slate-border rounded focus:outline-none focus:border-ledger font-sans text-ink"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-paper border border-slate-border rounded font-sans text-ink focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Challans Data Table */}
      <div className="card-manifest bg-white shadow-manifest overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate font-mono text-sm">Loading challans manifest...</div>
        ) : challans.length === 0 ? (
          <div className="p-12 text-center text-slate font-sans">
            <FileText className="w-8 h-8 mx-auto text-slate-light mb-2" />
            <p className="font-medium text-ink">No challans found</p>
            <p className="text-xs text-slate mt-1">Start by creating a new delivery draft challan above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans border-collapse">
              <thead>
                <tr className="bg-paper border-b border-slate-border font-mono text-xs text-slate uppercase">
                  <th className="py-3 px-4">Challan Number</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Items / Qty</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border">
                {challans.map((ch) => (
                  <tr key={ch.id} className="hover:bg-paper/60 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-ink">
                      {ch.challanNumber ? (
                        <span className="text-ledger">{ch.challanNumber}</span>
                      ) : (
                        <span className="text-amber italic">Draft (Pending)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-ink">{ch.customer?.name}</div>
                      <div className="text-xs text-slate">{ch.customer?.businessName}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusPill status={ch.status} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate">
                      {ch.items?.length || 0} lines ({ch.totalQuantity} units)
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-ink">
                      ₹{Number(ch.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate">
                      {new Date(ch.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/challans/${ch.id}`)}
                        className="p-1.5 text-ledger hover:bg-ledger-light rounded transition inline-flex items-center gap-1 text-xs font-semibold"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
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
              onClick={() => fetchChallans(meta.page - 1)}
              className="px-2.5 py-1 bg-white border border-slate-border rounded disabled:opacity-50 hover:bg-paper"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => fetchChallans(meta.page + 1)}
              className="px-2.5 py-1 bg-white border border-slate-border rounded disabled:opacity-50 hover:bg-paper"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
