import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { StockGauge } from '../components/common/StockGauge';
import { StatusPill } from '../components/common/StatusPill';
import {
  Users,
  AlertTriangle,
  FileCheck2,
  Clock,
  TrendingUp,
  Plus,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sumRes, trendRes, lowStockRes] = await Promise.all([
          api.get('/api/dashboard/summary'),
          api.get('/api/dashboard/sales-trend?range=30d'),
          api.get('/api/products?lowStockOnly=true&pageSize=5'),
        ]);
        setSummary(sumRes.data);
        setTrend(trendRes.data);
        setLowStockProducts(lowStockRes.data.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-border/50 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 card-manifest bg-white animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Active Customers',
      value: summary?.activeCustomersCount || 0,
      subtext: 'Registered business accounts',
      icon: Users,
      color: 'border-l-4 border-l-ledger',
      path: '/customers',
    },
    {
      title: 'Low Stock Alerts',
      value: summary?.lowStockProductsCount || 0,
      subtext: 'Products below min threshold',
      icon: AlertTriangle,
      color: 'border-l-4 border-l-amber',
      path: '/products?lowStockOnly=true',
    },
    {
      title: "Today's Confirmed Sales",
      value: `₹${(summary?.todayConfirmedRevenue || 0).toLocaleString()}`,
      subtext: `${summary?.todayConfirmedChallansCount || 0} confirmed challan(s)`,
      icon: FileCheck2,
      color: 'border-l-4 border-l-ledger',
      path: '/challans?status=Confirmed',
    },
    {
      title: 'Pending Follow-Ups',
      value: summary?.pendingFollowUpsCount || 0,
      subtext: 'Overdue or due today',
      icon: Clock,
      color: 'border-l-4 border-l-slate',
      path: '/customers',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">Operations Dashboard</h1>
          <p className="text-slate text-sm font-sans">Live metrics and wholesale ledger status.</p>
        </div>

        <button
          onClick={() => navigate('/challans/new')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-ledger hover:bg-ledger-hover text-white font-semibold rounded text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Delivery Challan</span>
        </button>
      </div>

      {/* KPI Cards with Staggered Load Animation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              onClick={() => navigate(kpi.path)}
              style={{ animationDelay: `${idx * 80}ms` }}
              className={`card-manifest p-5 bg-white shadow-manifest hover:shadow-md cursor-pointer transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${kpi.color}`}
            >
              <div className="flex items-center justify-between text-slate">
                <span className="text-xs font-mono uppercase tracking-wider">{kpi.title}</span>
                <Icon className="w-5 h-5 text-slate-light" />
              </div>
              <div className="mt-3 font-mono font-bold text-2xl text-ink tabular-nums">{kpi.value}</div>
              <p className="mt-1 text-xs text-slate font-sans">{kpi.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Sales Trend & Low Stock Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 30-Day Sales Trend (2 cols) */}
        <div className="lg:col-span-2 card-manifest bg-white p-6 shadow-manifest">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-bold text-lg text-ink flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-ledger" />
                30-Day Sales Trend
              </h2>
              <p className="text-xs text-slate">Confirmed challan revenue over time</p>
            </div>
          </div>

          {/* Simple Clean Bar Chart Representation */}
          <div className="h-64 flex items-end gap-1.5 pt-8 pb-2 px-2 border-b border-slate-border overflow-x-auto">
            {trend.map((d, i) => {
              const maxRev = Math.max(...trend.map((t) => t.revenue), 1000);
              const heightPct = Math.max((d.revenue / maxRev) * 100, 4);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center group relative min-w-[12px]">
                  {/* Tooltip */}
                  <div className="hidden group-hover:block absolute bottom-full mb-2 p-2 bg-ink text-white text-[10px] font-mono rounded shadow-lg z-10 whitespace-nowrap">
                    <div>{d.date}</div>
                    <div className="font-bold">₹{d.revenue.toLocaleString()}</div>
                    <div className="text-slate-light">{d.count} challan(s)</div>
                  </div>
                  <div
                    className="w-full bg-ledger/80 group-hover:bg-ledger rounded-t transition-all"
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate pt-2 px-2">
            <span>{trend[0]?.date}</span>
            <span>{trend[trend.length - 1]?.date}</span>
          </div>
        </div>

        {/* Low Stock Watchlist (1 col) */}
        <div className="card-manifest bg-white p-6 shadow-manifest flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-base text-ink flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber" />
                Low Stock Alert
              </h2>
              <button
                onClick={() => navigate('/products?lowStockOnly=true')}
                className="text-xs font-mono text-ledger hover:underline flex items-center"
              >
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="p-6 text-center text-slate text-sm font-sans bg-paper rounded border border-dashed border-slate-border">
                All inventory items are currently above minimum alert thresholds.
              </div>
            ) : (
              <div className="divide-y divide-slate-border">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/products/${p.id}`)}
                    className="py-3 hover:bg-paper px-2 rounded cursor-pointer transition"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-xs text-ink line-clamp-1">{p.name}</span>
                      <span className="font-mono text-[11px] text-slate">[{p.sku}]</span>
                    </div>
                    <StockGauge currentStock={p.currentStock} minStockAlert={p.minStockAlert} showIcon={false} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-border">
            <button
              onClick={() => navigate('/products')}
              className="w-full py-2 bg-paper hover:bg-slate-border/50 text-slate font-medium text-xs rounded transition flex items-center justify-center gap-1"
            >
              <span>Open Stock Ledger</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
