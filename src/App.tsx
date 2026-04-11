import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Transactions from './pages/Transactions';
import Withdrawals from './pages/Withdrawals';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = sessionStorage.getItem('adminToken');
  if (!token) return <Navigate to="/" replace />;
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-sm md:text-base">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-8">{children}</div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLogin />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="/withdrawals" element={<ProtectedRoute><Withdrawals /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
