import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, User, Package, Plus, Trash2, CheckCircle, ArrowRight } from 'lucide-react';

export const NewChallanPage: React.FC = () => {
  const [step, setStep] = useState(1); // 1: Customer, 2: Items, 3: Review
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [lineItems, setLineItems] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          api.get('/api/customers?pageSize=50'),
          api.get('/api/products?pageSize=100'),
        ]);
        setCustomers(cRes.data.data);
        setProducts(pRes.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadMasterData();
  }, []);

  const handleAddLineItem = () => {
    if (products.length > 0) {
      setLineItems([...lineItems, { productId: products[0].id, quantity: 1 }]);
    }
  };

  const handleRemoveLineItem = (index: number) => {
    const updated = [...lineItems];
    updated.splice(index, 1);
    setLineItems(updated);
  };

  const handleUpdateItem = (index: number, field: 'productId' | 'quantity', val: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: val };
    setLineItems(updated);
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const computedItems = lineItems.map((item) => {
    const p = products.find((prod) => prod.id === item.productId);
    const unitPrice = p ? Number(p.unitPrice) : 0;
    const lineTotal = unitPrice * item.quantity;
    return {
      ...item,
      product: p,
      unitPrice,
      lineTotal,
    };
  });

  const grandTotal = computedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const grandQty = computedItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmitDraft = async () => {
    if (!selectedCustomerId || lineItems.length === 0) {
      setError('Please select a customer and at least one item');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await api.post('/api/challans', {
        customerId: selectedCustomerId,
        items: lineItems.map((i) => ({ productId: i.productId, quantity: Number(i.quantity) })),
      });
      navigate(`/challans/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create challan draft');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-border pb-4">
        <button
          onClick={() => navigate('/challans')}
          className="p-2 bg-white border border-slate-border rounded hover:bg-paper text-slate"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">Create Delivery Challan Draft</h1>
          <p className="text-slate text-xs font-mono">Multi-step wholesale manifest builder.</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-signal-redLight border border-signal-red/30 text-signal-red rounded text-sm font-medium">
          {error}
        </div>
      )}

      {/* Step Indicator */}
      <div className="flex items-center justify-between card-manifest bg-white p-4 font-mono text-xs shadow-xs">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-ledger font-bold' : 'text-slate'}`}>
          <span className="w-6 h-6 rounded-full bg-paper flex items-center justify-center border border-current">1</span>
          <span>1. Select Customer</span>
        </div>
        <div className="w-12 h-0.5 bg-slate-border" />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-ledger font-bold' : 'text-slate'}`}>
          <span className="w-6 h-6 rounded-full bg-paper flex items-center justify-center border border-current">2</span>
          <span>2. Add Line Items</span>
        </div>
        <div className="w-12 h-0.5 bg-slate-border" />
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-ledger font-bold' : 'text-slate'}`}>
          <span className="w-6 h-6 rounded-full bg-paper flex items-center justify-center border border-current">3</span>
          <span>3. Review & Save</span>
        </div>
      </div>

      {/* STEP 1: Select Customer */}
      {step === 1 && (
        <div className="card-manifest bg-white p-6 shadow-manifest space-y-4">
          <h2 className="font-display font-bold text-lg text-ink">Select Customer Account</h2>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full p-3 bg-paper border border-slate-border rounded text-sm text-ink font-sans focus:outline-none focus:border-ledger"
          >
            <option value="">-- Select a Customer Account --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.businessName}) — {c.type}
              </option>
            ))}
          </select>

          {selectedCustomer && (
            <div className="p-4 bg-paper rounded border border-slate-border text-sm space-y-1 mt-4">
              <p className="font-bold text-ink">{selectedCustomer.name}</p>
              <p className="text-slate text-xs">{selectedCustomer.businessName}</p>
              <p className="text-slate text-xs font-mono">{selectedCustomer.address}</p>
              <p className="text-slate text-xs font-mono">Mobile: {selectedCustomer.mobile}</p>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              disabled={!selectedCustomerId}
              onClick={() => setStep(2)}
              className="px-5 py-2.5 bg-ledger hover:bg-ledger-hover text-white font-semibold text-sm rounded disabled:opacity-50 inline-flex items-center gap-2"
            >
              <span>Next: Add Line Items</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Add Line Items */}
      {step === 2 && (
        <div className="card-manifest bg-white p-6 shadow-manifest space-y-6">
          <div className="flex justify-between items-center border-b border-slate-border pb-3">
            <h2 className="font-display font-bold text-lg text-ink">Add Dispatch Line Items</h2>
            <button
              onClick={handleAddLineItem}
              className="px-3 py-1.5 bg-ledger text-white text-xs font-semibold rounded inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Line Item</span>
            </button>
          </div>

          {lineItems.length === 0 ? (
            <div className="p-8 text-center text-slate font-sans bg-paper rounded border border-dashed border-slate-border">
              No items added to draft yet. Click 'Add Line Item' above to choose products.
            </div>
          ) : (
            <div className="space-y-3">
              {lineItems.map((item, idx) => {
                const selectedP = products.find((p) => p.id === item.productId);
                return (
                  <div key={idx} className="p-4 bg-paper rounded border border-slate-border flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-[10px] font-mono text-slate uppercase mb-1">Product Item *</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleUpdateItem(idx, 'productId', e.target.value)}
                        className="w-full p-2 bg-white border border-slate-border rounded text-sm text-ink font-sans"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.sku}] {p.name} — ₹{Number(p.unitPrice).toFixed(2)} (Stock: {p.currentStock})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-28">
                      <label className="block text-[10px] font-mono text-slate uppercase mb-1">Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full p-2 bg-white border border-slate-border rounded font-mono font-bold text-sm text-ink"
                      />
                    </div>

                    <div className="w-32 font-mono text-right">
                      <span className="block text-[10px] text-slate uppercase">Line Total</span>
                      <span className="font-bold text-sm text-ink">
                        ₹{selectedP ? (Number(selectedP.unitPrice) * item.quantity).toFixed(2) : '0.00'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveLineItem(idx)}
                      className="p-2 text-signal-red hover:bg-signal-redLight rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-border">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-paper text-slate font-medium text-sm rounded"
            >
              Back to Customer
            </button>
            <button
              disabled={lineItems.length === 0}
              onClick={() => setStep(3)}
              className="px-5 py-2.5 bg-ledger hover:bg-ledger-hover text-white font-semibold text-sm rounded disabled:opacity-50 inline-flex items-center gap-2"
            >
              <span>Next: Review & Draft</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Review & Save Draft */}
      {step === 3 && (
        <div className="card-manifest bg-white p-6 shadow-manifest space-y-6">
          <h2 className="font-display font-bold text-lg text-ink">Review Draft Challan Summary</h2>

          {/* Customer Card */}
          <div className="p-4 bg-paper rounded border border-slate-border text-sm">
            <p className="text-xs font-mono text-slate uppercase">Customer Account</p>
            <p className="font-bold text-base text-ink">{selectedCustomer?.name}</p>
            <p className="text-xs text-slate">{selectedCustomer?.businessName} — {selectedCustomer?.address}</p>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans border-collapse">
              <thead>
                <tr className="bg-paper border-b border-slate-border font-mono text-xs text-slate uppercase">
                  <th className="py-2.5 px-3">Item Details</th>
                  <th className="py-2.5 px-3">Unit Price</th>
                  <th className="py-2.5 px-3">Qty</th>
                  <th className="py-2.5 px-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border">
                {computedItems.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-xs text-ledger">[{item.product?.sku}]</span>{' '}
                      <span className="font-medium text-ink">{item.product?.name}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">₹{item.unitPrice.toFixed(2)}</td>
                    <td className="py-2.5 px-3 font-mono font-bold">{item.quantity}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-right">₹{item.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-paper font-mono font-bold text-sm text-ink border-t border-slate-border">
                  <td colSpan={2} className="py-3 px-3">Total Manifest Quantities & Amount</td>
                  <td className="py-3 px-3">{grandQty} units</td>
                  <td className="py-3 px-3 text-right text-ledger text-base">₹{grandTotal.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-border">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-paper text-slate font-medium text-sm rounded"
            >
              Back to Edit Items
            </button>
            <button
              disabled={submitting}
              onClick={handleSubmitDraft}
              className="px-6 py-2.5 bg-ledger hover:bg-ledger-hover text-white font-bold text-sm rounded shadow-sm inline-flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{submitting ? 'Creating Draft...' : 'Save Draft Challan'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
