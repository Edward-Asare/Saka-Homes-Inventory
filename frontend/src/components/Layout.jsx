import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/catalog', label: 'Catalog' },
  { to: '/movements', label: 'Dispatches' },
  { to: '/purchase-orders', label: 'Purchase Orders' },
  { to: '/directories', label: 'Categories & Suppliers' },
  { to: '/reports', label: 'Reports' },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
          <div className="border-b border-border px-5 py-6">
            <p className="font-display text-2xl tracking-tight text-ink">Saka Homes</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-muted">
              Warehouse
            </p>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-auto p-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-accent-soft text-accent'
                      : 'text-muted hover:bg-canvas hover:text-ink',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-border p-4">
            <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
            <button
              type="button"
              onClick={logout}
              className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-left text-sm text-muted transition-colors duration-150 hover:border-ink/20 hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-border bg-surface px-4 py-3 md:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-xl text-ink">Saka Homes</p>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                  Warehouse
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
              >
                Sign out
              </button>
            </div>
            <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    [
                      'whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                      isActive
                        ? 'border-accent/30 bg-accent-soft text-accent'
                        : 'border-border text-muted',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </header>

          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
