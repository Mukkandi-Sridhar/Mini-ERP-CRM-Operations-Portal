import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { UserCheck, Plus, Search, Shield, UserX, CheckCircle } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Sales',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/users');
      setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/api/users', form);
      setIsCreateOpen(false);
      setForm({ name: '', email: '', password: '', role: 'Sales' });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDeactivate = async (userId: string) => {
    try {
      await api.patch(`/api/users/${userId}/deactivate`);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deactivate user');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">User Administration</h1>
          <p className="text-slate text-sm">System accounts, roles & RBAC access controls.</p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-ledger hover:bg-ledger-hover text-white font-semibold rounded text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create User</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-signal-redLight border border-signal-red/30 text-signal-red rounded text-sm font-medium">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="card-manifest bg-white shadow-manifest overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate font-mono text-sm">Loading system user accounts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans border-collapse">
              <thead>
                <tr className="bg-paper border-b border-slate-border font-mono text-xs text-slate uppercase">
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-paper/60 transition">
                    <td className="py-3.5 px-4 font-semibold text-ink">{u.name}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate">{u.email}</td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <span className="inline-flex items-center gap-1 bg-paper px-2 py-0.5 rounded border border-slate-border font-bold text-ledger">
                        <Shield className="w-3 h-3 text-ledger" />
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-signal-green font-bold">
                          <CheckCircle className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-signal-red font-bold">
                          <UserX className="w-3.5 h-3.5" /> Deactivated
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {u.isActive && (
                        <button
                          onClick={() => handleDeactivate(u.id)}
                          className="px-2.5 py-1 text-xs font-mono text-signal-red hover:bg-signal-redLight rounded border border-signal-red/30 transition"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="card-manifest w-full max-w-md bg-white p-6 shadow-2xl">
            <h2 className="font-display font-bold text-xl text-ink mb-4">Create System User</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4 font-sans text-sm">
              <div>
                <label className="block text-xs font-mono text-slate uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2 bg-paper border border-slate-border rounded text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-2 bg-paper border border-slate-border rounded text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate uppercase mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full p-2 bg-paper border border-slate-border rounded text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate uppercase mb-1">System Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full p-2 bg-paper border border-slate-border rounded text-ink font-mono font-bold"
                >
                  <option value="Admin">Admin (Full System Control)</option>
                  <option value="Sales">Sales (CRM & Challans)</option>
                  <option value="Warehouse">Warehouse (Products & Stock)</option>
                  <option value="Accounts">Accounts (Read-Only & Invoices)</option>
                </select>
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
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
