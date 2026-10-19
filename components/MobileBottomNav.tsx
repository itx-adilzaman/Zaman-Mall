/**
 * MobileBottomNav — dark minimal tab bar.
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { useStore } from '../store/StoreContext';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { cart, currentUser } = useStore();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const tabs = [
    { path: '/',                              label: 'Home',    Icon: Home        },
    { path: '/shop',                          label: 'Shop',    Icon: ShoppingBag },
    { path: '/cart',                          label: 'Cart',    Icon: ShoppingCart, badge: cartCount },
    { path: currentUser ? '/profile' : '/login', label: currentUser ? 'Account' : 'Login', Icon: User },
  ];

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60,
      background: '#0d0d0d',
      borderTop: '1px solid #2a2a2a',
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom)',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
    }}>
      {tabs.map(({ path, label, Icon, badge }) => {
        const isActive = location.pathname === path;
        return (
          <Link key={path} to={path} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '8px 0 10px', textDecoration: 'none',
            color: isActive ? '#6366f1' : '#666',
            position: 'relative',
          }}>
            {/* Active top line */}
            {isActive && (
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 28, height: 2, background: '#6366f1', borderRadius: '0 0 2px 2px',
              }} />
            )}
            <div style={{ position: 'relative' }}>
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              {badge != null && badge > 0 && (
                <span style={{
                  position: 'absolute', top: -5, right: -7,
                  minWidth: 15, height: 15, background: '#ef4444', color: '#fff',
                  borderRadius: 8, fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
                }}>{badge}</span>
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, marginTop: 3 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
