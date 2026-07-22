import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { StatusPill } from '../components/common/StatusPill';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Plus,
  FileText,
  Clock,
  ArrowLeft,
} from 'lucide-react';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New Follow-Up Form
  const [note, setNote] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const fetchCustomerDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/customers/${id}`);
      setCustomer(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCustomerDetail();
  }, [id]);

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post(`/api/customers/${id}/follow-ups`, {
        note,
        followUpDate: nextDate || null,
      });
      setNote('');
      setNextDate('');
      fetchCustomerDetail();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center font-mono text-sm text-slate">Loading customer profile...</div>;
  if (!customer) return <div className="p-8 text-center text-signal-red font-sans">Customer profile not found.</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/customers')}
          className="p-2 bg-white border border-slate-border rounded hover:bg-paper text-slate"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-2xl text-ink">{customer.name}</h1>
            <StatusPill status={customer.status} />
          </div>
          <p className="text-slate text-xs font-mono">{customer.businessName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer Information Manifest */}
        <div className="card-manifest bg-white p-6 shadow-manifest space-y-4">
          <h2 className="font-display font-bold text-base text-ink border-b border-slate-border pb-2">
            Account Profile
          </h2>

          <div className="space-y-3 text-sm font-sans">
            <div className="flex items-start gap-2">
              <Building className="w-4 h-4 text-slate mt-0.5" />
              <div>
                <span className="text-xs font-mono text-slate block">Business Name</span>
                <span className="font-medium text-ink">{customer.businessName}</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-slate mt-0.5" />
              <div>
                <span className="text-xs font-mono text-slate block">Mobile</span>
                <span className="font-mono text-ink">{customer.mobile}</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-slate mt-0.5" />
              <div>
                <span className="text-xs font-mono text-slate block">Email</span>
                <span className="text-ink">{customer.email}</span>
              </div>
            </div>

            {customer.gstNumber && (
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-slate mt-0.5" />
                <div>
                  <span className="text-xs font-mono text-slate block">GSTIN</span>
                  <span className="font-mono font-semibold text-ink">{customer.gstNumber}</span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate mt-0.5" />
              <div>
                <span className="text-xs font-mono text-slate block">Address</span>
                <span className="text-ink">{customer.address}</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-slate mt-0.5" />
              <div>
                <span className="text-xs font-mono text-slate block">Next Follow-Up Date</span>
                <span className="font-mono font-bold text-ledger">
                  {customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : 'None Scheduled'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Follow-Up Timeline & Creation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Follow-Up Card */}
          {hasRole('Admin', 'Sales') && (
            <div className="card-manifest bg-white p-6 shadow-manifest">
              <h2 className="font-display font-bold text-base text-ink mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-ledger" />
                Log Follow-Up Activity
              </h2>
              <form onSubmit={handleAddFollowUp} className="space-y-3 font-sans text-sm">
                <textarea
                  required
                  rows={2}
                  placeholder="Record client discussion, requirements, or next steps..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-3 bg-paper border border-slate-border rounded text-ink focus:outline-none focus:border-ledger"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-mono text-slate">Set Next Follow-Up Date:</label>
                    <input
                      type="datetime-local"
                      value={nextDate}
                      onChange={(e) => setNextDate(e.target.value)}
                      className="p-1.5 bg-paper border border-slate-border rounded text-xs font-mono text-ink"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-ledger hover:bg-ledger-hover text-white font-semibold rounded text-xs transition"
                  >
                    {isSubmitting ? 'Saving...' : 'Add Note to Timeline'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Follow-Up Timeline */}
          <div className="card-manifest bg-white p-6 shadow-manifest">
            <h2 className="font-display font-bold text-base text-ink mb-4">Follow-Up History Timeline</h2>
            {customer.followUps.length === 0 ? (
              <p className="text-sm text-slate font-sans py-4">No follow-ups recorded yet.</p>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-border">
                {customer.followUps.map((f: any) => (
                  <div key={f.id} className="relative pl-8">
                    <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-ledger border-2 border-white" />
                    <div className="p-3 bg-paper rounded border border-slate-border">
                      <div className="flex justify-between items-center text-xs font-mono text-slate mb-1">
                        <span className="font-semibold text-ink">{f.createdBy?.name}</span>
                        <span>{new Date(f.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-sans text-ink">{f.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked Delivery Challans */}
          <div className="card-manifest bg-white p-6 shadow-manifest">
            <h2 className="font-display font-bold text-base text-ink mb-4">Linked Delivery Challans</h2>
            {customer.challans.length === 0 ? (
              <p className="text-sm text-slate font-sans">No challans created for this customer yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-sans">
                  <thead>
                    <tr className="bg-paper font-mono text-xs text-slate uppercase border-b border-slate-border">
                      <th className="py-2.5 px-3">Challan #</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Total Qty</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-border">
                    {customer.challans.map((ch: any) => (
                      <tr key={ch.id} className="hover:bg-paper/60">
                        <td className="py-2.5 px-3 font-mono font-semibold text-ink">
                          {ch.challanNumber || 'Draft'}
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusPill status={ch.status} />
                        </td>
                        <td className="py-2.5 px-3 font-mono">{ch.totalQuantity}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold">₹{Number(ch.totalAmount).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => navigate(`/challans/${ch.id}`)}
                            className="text-xs font-mono text-ledger hover:underline"
                          >
                            Open Challan
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
