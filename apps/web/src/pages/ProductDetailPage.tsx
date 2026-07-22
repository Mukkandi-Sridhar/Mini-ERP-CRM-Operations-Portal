import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { StockGauge } from '../components/common/StockGauge';
import { ArrowLeft, Package, ArrowDownUp, Warehouse, Tag, Calendar, User } from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  if (loading) return <div className="p-8 text-center font-mono text-sm text-slate">Loading product data...</div>;
  if (!product) return <div className="p-8 text-center text-signal-red font-sans">Product not found.</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/products')}
          className="p-2 bg-white border border-slate-border rounded hover:bg-paper text-slate"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-xs bg-ledger-light text-ledger px-2 py-0.5 rounded border border-ledger/20">
              {product.sku}
            </span>
            <h1 className="font-display font-bold text-2xl text-ink">{product.name}</h1>
          </div>
          <p className="text-slate text-xs font-mono">{product.category} Category</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Details Manifest */}
        <div className="card-manifest bg-white p-6 shadow-manifest space-y-4">
          <h2 className="font-display font-bold text-base text-ink border-b border-slate-border pb-2">
            Product Specifications
          </h2>

          <div className="space-y-4 text-sm font-sans">
            <div>
              <span className="text-xs font-mono text-slate block uppercase">Unit Price</span>
              <span className="font-mono font-bold text-xl text-ink">₹{Number(product.unitPrice).toFixed(2)}</span>
            </div>

            <div>
              <span className="text-xs font-mono text-slate block uppercase mb-1">Current Stock Level</span>
              <StockGauge currentStock={product.currentStock} minStockAlert={product.minStockAlert} />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-border">
              <Warehouse className="w-4 h-4 text-slate" />
              <div>
                <span className="text-xs font-mono text-slate block">Warehouse Location</span>
                <span className="font-mono font-bold text-ink">{product.warehouseLocation}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate" />
              <div>
                <span className="text-xs font-mono text-slate block">Min Stock Alert Threshold</span>
                <span className="font-mono text-slate-dark">{product.minStockAlert} units</span>
              </div>
            </div>
          </div>
        </div>

        {/* Append-Only Stock Movement Ledger History */}
        <div className="lg:col-span-2 card-manifest bg-white p-6 shadow-manifest">
          <h2 className="font-display font-bold text-base text-ink mb-4 flex items-center gap-2">
            <ArrowDownUp className="w-4 h-4 text-ledger" />
            Append-Only Stock Movement Ledger
          </h2>

          {!product.stockMovements || product.stockMovements.length === 0 ? (
            <p className="text-sm text-slate font-sans py-4">No stock movements recorded for this product.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-sans border-collapse">
                <thead>
                  <tr className="bg-paper border-b border-slate-border font-mono text-xs text-slate uppercase">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3">Reason / Ref</th>
                    <th className="py-2.5 px-3">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-border">
                  {product.stockMovements.map((m: any) => (
                    <tr key={m.id} className="hover:bg-paper/60 font-mono text-xs">
                      <td className="py-2.5 px-3 text-slate">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            m.movementType === 'IN'
                              ? 'bg-signal-greenLight text-signal-green'
                              : 'bg-signal-redLight text-signal-red'
                          }`}
                        >
                          {m.movementType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-ink">
                        {m.movementType === 'IN' ? `+${m.quantityChanged}` : `-${m.quantityChanged}`}
                      </td>
                      <td className="py-2.5 px-3 text-ink font-sans">{m.reason}</td>
                      <td className="py-2.5 px-3 text-slate">{m.createdBy?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
