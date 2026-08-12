import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import Catalog from './pages/Catalog';
import Dashboard from './pages/Dashboard';
import Directories from './pages/Directories';
import Login from './pages/Login';
import Movements from './pages/Movements';
import PurchaseOrders from './pages/PurchaseOrders';
import Reports from './pages/Reports';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-muted">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="movements" element={<Movements />} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="directories" element={<Directories />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
