import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { StatusPill } from '../components/common/StatusPill';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  XCircle,
  Building,
  User,
  Calendar,
  FileText,
  ShieldCheck,
} from 'lucide-react';

export const ChallanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [challan, setChallan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const fetchChallanDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/challans/${id}`);
      setChallan(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load challan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchChallanDetail();
  }, [id]);

  const handleConfirmAction = async () => {
    setShowConfirmModal(false);
    setError(null);
    setActionPending(true);
    try {
      await api.post(`/api/challans/${id}/confirm`);
      await fetchChallanDetail();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to confirm challan');
    } finally {
      setActionPending(false);
    }
  };

  const handleCancelAction = async () => {
    setShowCancelModal(false);
    setError(null);
    setActionPending(true);
    try {
      await api.post(`/api/challans/${id}/cancel`);
      await fetchChallanDetail();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel challan');
    } finally {
      setActionPending(false);
    }
  };

  if (loading) return <div className="p-8 text-center font-mono text-sm text-slate">Loading delivery manifest...</div>;
  if (!challan) return <div className="p-8 text-center text-signal-red font-sans">Challan document not found.</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-border pb-4 print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/challans')}
            className="p-2 bg-white border border-slate-border rounded hover:bg-paper text-slate"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display font-bold text-2xl text-ink font-mono">
                {challan.challanNumber || 'DRAFT CHALLAN'}
              </h1>
              <StatusPill status={challan.status} />
            </div>
            <p className="text-slate text-xs font-mono">Created on {new Date(challan.createdAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white border border-slate-border hover:bg-paper text-ink font-medium text-xs rounded shadow-xs inline-flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate" />
            <span>Print Manifest / PDF</span>
          </button>

          {hasRole('Admin', 'Sales') && challan.status === 'Draft' && (
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={actionPending}
              className="px-4 py-2 bg-ledger hover:bg-ledger-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded shadow-xs inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionPending ? 'Processing...' : 'Confirm & Deduct Stock'}</span>
            </button>
          )}

          {hasRole('Admin', 'Sales') && challan.status !== 'Cancelled' && (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={actionPending}
              className="px-3.5 py-2 bg-white border border-signal-red/30 text-signal-red hover:bg-signal-redLight disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs rounded inline-flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>{actionPending ? 'Processing...' : 'Cancel Challan'}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-signal-redLight border border-signal-red/30 text-signal-red rounded text-sm font-medium print:hidden">
          {error}
        </div>
      )}

      {/* PHYSICAL DELIVERY CHALLAN MANIFEST DOCUMENT */}
      <div className="card-manifest bg-white p-8 shadow-2xl space-y-8 font-sans border-2 border-ink/10 print:shadow-none print:border-none print:p-0">
        {/* Document Header */}
        <div className="flex justify-between items-start border-b-2 border-ink pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded bg-ledger flex items-center justify-center font-mono font-bold text-white text-sm">
                EP
              </div>
              <h2 className="font-display font-extrabold text-xl tracking-tight text-ink">PAPER TRAIL DISTRIBUTORS</h2>
            </div>
            <p className="text-xs text-slate font-mono">102 Commerce Park, MIDC Industrial Zone, Mumbai - 400093</p>
            <p className="text-xs text-slate font-mono">GSTIN: 27AAAAA0000A1Z5 | Phone: +91 22 5550 1234</p>
          </div>

          <div className="text-right">
            <h3 className="font-display font-black text-2xl tracking-wide uppercase text-ink">DELIVERY CHALLAN</h3>
            <div className="font-mono font-bold text-lg text-ledger mt-1">
              {challan.challanNumber || 'DRAFT MANIFEST'}
            </div>
            <div className="text-xs font-mono text-slate mt-1">
              Date: {new Date(challan.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Customer & Shipping Info */}
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div className="p-4 bg-paper rounded border border-slate-border space-y-1">
            <span className="text-xs font-mono text-slate uppercase block font-bold mb-1">DISPATCH TO (CONSIGNEE)</span>
            <p className="font-bold text-ink text-base">{challan.customer?.name}</p>
            <p className="font-medium text-slate text-xs">{challan.customer?.businessName}</p>
            <p className="text-xs text-slate font-mono">{challan.customer?.address}</p>
            <p className="text-xs text-slate font-mono">Mobile: {challan.customer?.mobile}</p>
            {challan.customer?.gstNumber && (
              <p className="text-xs font-mono font-bold text-ink pt-1">GSTIN: {challan.customer?.gstNumber}</p>
            )}
          </div>

          <div className="p-4 bg-paper rounded border border-slate-border space-y-2">
            <span className="text-xs font-mono text-slate uppercase block font-bold">MANIFEST METADATA</span>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate">Document Status:</span>
              <StatusPill status={challan.status} />
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate">Created By:</span>
              <span className="font-semibold text-ink">{challan.createdBy?.name} ({challan.createdBy?.role})</span>
            </div>
            {challan.confirmedAt && (
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate">Confirmed Date:</span>
                <span className="text-ink">{new Date(challan.confirmedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table with Price Snapshots */}
        <div>
          <h4 className="font-mono text-xs font-bold uppercase text-slate mb-2">Itemized Dispatch Schedule</h4>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-paper border-y-2 border-ink font-mono text-xs text-slate uppercase">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Item Description (Snapshot)</th>
                <th className="py-2.5 px-3 text-right">Unit Price</th>
                <th className="py-2.5 px-3 text-right">Qty</th>
                <th className="py-2.5 px-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-border font-mono text-xs">
              {challan.items?.map((item: any, idx: number) => (
                <tr key={item.id}>
                  <td className="py-3 px-3 text-slate">{idx + 1}</td>
                  <td className="py-3 px-3 font-bold text-ledger">{item.skuSnapshot}</td>
                  <td className="py-3 px-3 font-sans font-medium text-ink">{item.productNameSnapshot}</td>
                  <td className="py-3 px-3 text-right">₹{Number(item.unitPriceSnapshot).toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-bold text-ink">{item.quantity}</td>
                  <td className="py-3 px-3 text-right font-bold text-ink">₹{Number(item.lineTotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-ink font-mono font-bold text-sm bg-paper">
                <td colSpan={4} className="py-3 px-3 uppercase text-slate text-xs">Total Manifest Quantities & Amount</td>
                <td className="py-3 px-3 text-right text-ink">{challan.totalQuantity} units</td>
                <td className="py-3 px-3 text-right text-ledger text-base">₹{Number(challan.totalAmount).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Signatures & Terms */}
        <div className="pt-12 grid grid-cols-2 gap-12 font-mono text-xs">
          <div>
            <p className="text-slate mb-12">Received the goods in good condition & order:</p>
            <div className="border-t border-slate-border pt-1 text-slate uppercase">Receiver's Signature & Stamp</div>
          </div>
          <div className="text-right">
            <p className="text-slate mb-12">For PAPER TRAIL DISTRIBUTORS:</p>
            <div className="border-t border-slate-border pt-1 text-slate uppercase">Authorized Signatory</div>
          </div>
        </div>
      </div>

      {/* Confirm Action Modal */}
      <ConfirmDialog
        isOpen={showConfirmModal}
        title="Confirm Delivery Challan & Deduct Stock?"
        message="This action will atomically deduct product stock levels in the warehouse, assign a gapless challan number (CH-YYYYMM-00000X), and lock the document."
        confirmLabel="Confirm & Deduct Stock"
        onConfirm={handleConfirmAction}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* Cancel Action Modal */}
      <ConfirmDialog
        isOpen={showCancelModal}
        isDanger={true}
        title="Cancel Delivery Challan?"
        message="If this challan was already Confirmed, cancelling it will automatically create offsetting IN stock movements and restore inventory back to the warehouse."
        confirmLabel="Cancel Challan"
        onConfirm={handleCancelAction}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
};
