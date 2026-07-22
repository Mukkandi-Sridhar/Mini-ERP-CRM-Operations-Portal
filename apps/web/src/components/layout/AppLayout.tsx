import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  UserCheck,
  LogOut,
  Search,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CommandPalette } from '../common/CommandPalette';

export const AppLayout: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const [isCmdKOpen, setIsCmdKOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Sales', 'Warehouse', 'Accounts'] },
    { label: 'Customers', path: '/customers', icon: Users, roles: ['Admin', 'Sales', 'Accounts'] },
    { label: 'Products & Stock', path: '/products', icon: Package, roles: ['Admin', 'Sales', 'Warehouse', 'Accounts'] },
    { label: 'Delivery Challans', path: '/challans', icon: FileText, roles: ['Admin', 'Sales', 'Warehouse', 'Accounts'] },
    { label: 'User Management', path: '/settings/users', icon: UserCheck, roles: ['Admin'] },
  ];

  return (
    <div className="min-h-screen flex bg-paper text-ink">
      {/* Left Rail Sidebar */}
      <aside className="w-64 bg-ink text-white flex flex-col justify-between p-4 shrink-0 shadow-lg border-r border-slate-light/20">
        <div>
          {/* Header Brand */}
          <div className="flex items-center gap-3 px-2 py-4 border-b border-slate-light/20 mb-6">
            <div className="w-9 h-9 rounded bg-ledger flex items-center justify-center font-mono font-bold text-white text-xl">
              EP
            </div>
            <div>
              <h1 className="font-display font-bold text-base leading-tight tracking-wide">PAPER TRAIL</h1>
              <p className="text-[11px] font-mono text-slate-light">ERP + CRM Portal</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems
              .filter((item) => hasRole(...item.roles))
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded font-sans text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-ledger text-white font-semibold shadow-xs'
                          : 'text-slate-light hover:text-white hover:bg-ink-light'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
          </nav>
        </div>

        {/* User Card at bottom of left rail */}
        <div className="pt-4 border-t border-slate-light/20">
          <div className="flex items-center justify-between p-2 rounded bg-ink-light/50">
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <span className="inline-block mt-0.5 text-[10px] font-mono font-semibold uppercase bg-ledger-light/20 text-ledger-light px-2 py-0.5 rounded border border-ledger-light/30">
                {user?.role}
              </span>
            </div>
            <button
              onClick={() => logout()}
              title="Logout"
              className="p-2 text-slate-light hover:text-signal-red hover:bg-paper/10 rounded transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-border px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCmdKOpen(true)}
              className="flex items-center gap-3 px-3 py-1.5 bg-paper hover:bg-slate-border/50 text-slate rounded border border-slate-border text-xs font-mono transition"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search ledger...</span>
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-border text-[10px] font-semibold text-ink">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-slate">
              <Building2 className="w-4 h-4 text-ledger" />
              <span>Wholesale Enterprise Portal v1.0</span>
            </div>
          </div>
        </header>

        {/* Main View Container */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <CommandPalette isOpen={isCmdKOpen} onClose={() => setIsCmdKOpen(false)} />
    </div>
  );
};
