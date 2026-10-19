import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { AlertProvider } from './context/AlertContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Payments from './pages/Payments';
import Returns from './pages/Returns';
import Messages from './pages/Messages';
import Users from './pages/Users';
import Banners from './pages/Banners';
import Versions from './pages/Versions';
import Categories from './pages/Categories';
import Brands from './pages/Brands';
import Zeels from './pages/Zeels';
import AffiliateBrands from './pages/AffiliateBrands';
import AffiliateProducts from './pages/AffiliateProducts';
import Downloads from './pages/Downloads';
import Notifications from './pages/Notifications';
import Inventory from './pages/Inventory';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthLoading } = useAdmin();
  const { isDark } = useTheme();

  if (isAuthLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg)' }}
      >
        <div className="text-center space-y-5">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-brand/20" />
            <div className="absolute inset-0 rounded-full border-2 border-t-brand border-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full bg-brand/10 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-brand animate-pulse" />
            </div>
          </div>
          <p className="section-title">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  const { currentUser } = useAdmin();
  return (
    <Routes>
      <Route
        path="/login"
        element={currentUser?.role === 'admin' ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="orders" element={<Orders />} />
        <Route path="payments" element={<Payments />} />
        <Route path="returns" element={<Returns />} />
        <Route path="messages" element={<Messages />} />
        <Route path="users" element={<Users />} />
        <Route path="banners" element={<Banners />} />
        <Route path="versions" element={<Versions />} />
        <Route path="categories" element={<Categories />} />
        <Route path="zeels" element={<Zeels />} />
        <Route path="affiliate-brands" element={<AffiliateBrands />} />
        <Route path="affiliate-products" element={<AffiliateProducts />} />
        <Route path="downloads" element={<Downloads />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="inventory" element={<Inventory />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AlertProvider>
          <AdminProvider>
            <AppRoutes />
          </AdminProvider>
        </AlertProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
