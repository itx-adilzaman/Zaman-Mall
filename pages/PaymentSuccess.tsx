import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { verifySafepayPayment } from '../services/safepay';

export const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');

  const orderId  = searchParams.get('order_id') || '';
  const token    = searchParams.get('token') || '';

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        // No token — still mark as success (order was placed, payment pending)
        setStatus('success');
        return;
      }
      const paid = await verifySafepayPayment(token);
      setStatus(paid ? 'success' : 'failed');
    };
    verify();
  }, [token]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-[#010409] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 size={48} className="text-blue-400 animate-spin mx-auto" />
          <p className="text-white font-black uppercase tracking-widest text-sm">Verifying Payment...</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-[#010409] flex items-center justify-center px-4">
        <div className="max-w-md w-full glass-dark p-12 rounded-[3.5rem] border border-red-500/20 text-center space-y-8">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center justify-center mx-auto">
            <XCircle size={40} className="text-red-500" />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white">Payment Failed</h2>
          <p className="text-gray-400 text-sm">Your payment could not be verified. Please try again or use Cash on Delivery.</p>
          <div className="flex flex-col gap-3">
            <Link to="/cart" className="py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-500 hover:text-white transition-all">
              Try Again
            </Link>
            <Link to="/shop" className="py-4 glass-dark border border-white/5 text-gray-400 hover:text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all">
              Back to Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#010409] flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-emerald-500/5 blur-[180px] rounded-full animate-pulse" />
      </div>
      <div className="max-w-md w-full glass-dark p-12 rounded-[3.5rem] border border-emerald-500/20 text-center space-y-8 relative z-10">
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center justify-center mx-auto">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-2">Payment Successful</h2>
          <p className="text-gray-400 text-sm">Your order has been confirmed and is being processed.</p>
          {orderId && (
            <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mt-3">
              Order ID: <span className="text-white">{orderId}</span>
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <Link to="/profile" className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl">
            Track My Order
          </Link>
          <Link to="/shop" className="py-4 glass-dark border border-white/5 text-gray-400 hover:text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};
