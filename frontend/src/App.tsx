import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';

import WalletsPage from './pages/wallets/Wallets';
import SavingsPage from './pages/savings/Savings';
import InvestmentsPage from './pages/investments/Investments';
import GroupBuyPage from './pages/group-buy/GroupBuy';
import EventsPage from './pages/events/Events';
import SettingsPage from './pages/settings/Settings';
import AdminPage from './pages/admin/Admin';
import LoansPage from './pages/loans/Loans';
import KycPage from './pages/kyc/Kyc';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

// Temp Placeholder Logic for Dashboard (Keep DashboardHome as is or move to own file)
const DashboardHome = () => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
    <div className="glass rounded-xl p-6 transition-all hover:scale-[1.02]">
      <h3 className="text-sm font-medium tracking-tight text-muted-foreground">Total Balance</h3>
      <div className="mt-2 text-3xl font-bold text-foreground">₦2,450,000.00</div>
      <div className="mt-1 text-xs text-pumpkit font-medium">+15% from last month</div>
    </div>
    <div className="glass rounded-xl p-6 transition-all hover:scale-[1.02]">
      <h3 className="text-sm font-medium tracking-tight text-muted-foreground">Savings</h3>
      <div className="mt-2 text-3xl font-bold text-foreground">₦850,000.00</div>
      <div className="mt-1 text-xs text-muted-foreground">Target: ₦1,000,000</div>
    </div>
    <div className="glass rounded-xl p-6 transition-all hover:scale-[1.02]">
      <h3 className="text-sm font-medium tracking-tight text-muted-foreground">Active Loans</h3>
      <div className="mt-2 text-3xl font-bold text-foreground">₦0.00</div>
      <div className="mt-1 text-xs text-muted-foreground">No active loans</div>
    </div>
    <div className="glass rounded-xl p-6 transition-all hover:scale-[1.02]">
      <h3 className="text-sm font-medium tracking-tight text-muted-foreground">Investments</h3>
      <div className="mt-2 text-3xl font-bold text-foreground">₦500,000.00</div>
      <div className="mt-1 text-xs text-pumpkit font-medium">ROI +12%</div>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardHome />} />
            <Route path="wallets" element={<WalletsPage />} />
            <Route path="savings" element={<SavingsPage />} />
            <Route path="loans" element={<LoansPage />} />
            <Route path="investments" element={<InvestmentsPage />} />
            <Route path="group-buy" element={<GroupBuyPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="kyc" element={<KycPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
