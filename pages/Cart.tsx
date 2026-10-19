import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart, Trash2, Plus, Minus, ShoppingBag, ArrowRight, CheckCircle2,
  ShieldCheck, MapPin, User, Banknote, Zap,
  Lock, Activity, Globe, Info, Fingerprint, Cpu, ShieldAlert,
  ChevronRight, BadgeCheck, Truck, XCircle, Crown, Sparkles, Award,
  Terminal, Landmark, Key, Eye, Phone, Mail, Home, Briefcase, Loader2, Package,
  ArrowLeft, CreditCard as PaymentIcon, ClipboardList, Clock
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { Link, useNavigate } from 'react-router-dom';
import { OnlinePaymentModal } from '../components/OnlinePaymentModal';
import { useIsMobile } from '../hooks/useIsMobile';

type CheckoutStep = 'CART' | 'ADDRESS' | 'PAYMENT' | 'REVIEW';

// ── Mobile Cart ────────────────────────────────────────────────────────────────
const bg = '#0d0d0d'; const surface = '#1a1a1a'; const border = '#2a2a2a'; const text = '#f0f0f0'; const sub = '#888'; const accent = '#6366f1';

const MobileCartView: React.FC = () => {
  const { cart, removeFromCart, updateCartQuantity, totalCartPrice, placeOrder, currentUser, addresses, products } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<CheckoutStep>('CART');
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [addr, setAddr] = useState('');
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null);
  const [payment, setPayment] = useState<'cod' | 'easypaisa' | 'jazzcash'>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [updatingQty, setUpdatingQty] = useState<Set<string>>(new Set());

  const subtotal = totalCartPrice;
  const shipping = 300;
  const total = subtotal + shipping;

  const hasChina = useMemo(() => cart.some(item => {
    const c = item.country || products.find(p => String(p.id) === String(item.baseProductId || item.id))?.country;
    return c === 'china';
  }), [cart, products]);

  useEffect(() => { if (hasChina && payment === 'cod') setPayment('easypaisa'); }, [hasChina]);

  useEffect(() => {
    if (addresses.length && !selectedAddrId) {
      const def = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddrId(def.id);
      setName(def.fullName); setPhone(def.phone);
      setAddr([def.streetAddress, def.tehsil, def.district, def.province].filter(Boolean).join(', '));
    }
  }, [addresses]);

  const handleQty = async (id: string, change: number) => {
    if (updatingQty.has(id)) return;
    setUpdatingQty(prev => new Set(prev).add(id));
    await updateCartQuantity(id, change);
    setUpdatingQty(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleCheckout = async () => {
    if (!name || !addr || !phone || !email || isSubmitting) return;
    if (payment === 'easypaisa' || payment === 'jazzcash') { setShowPayModal(true); return; }
    setIsSubmitting(true);
    await placeOrder({ name, phone, email, address: addr }, total, payment, undefined, () => navigate(`/order-confirmed?method=${payment}&name=${encodeURIComponent(name)}`));
    setIsSubmitting(false);
  };

  const handleReceipt = async (url: string) => {
    setShowPayModal(false);
    setIsSubmitting(true);
    await placeOrder({ name, phone, email, address: addr }, total, payment, url, () => navigate(`/order-confirmed?method=${payment}&name=${encodeURIComponent(name)}`));
    setIsSubmitting(false);
  };

  if (cart.length === 0 && !isSubmitting) return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <ShoppingCart size={56} style={{ color: '#333', marginBottom: 14 }} />
      <p style={{ fontWeight: 700, fontSize: 18, color: text, marginBottom: 6 }}>Cart is empty</p>
      <p style={{ fontSize: 13, color: sub, marginBottom: 18, textAlign: 'center' }}>Add products to get started.</p>
      <Link to="/shop" style={{ background: accent, color: '#fff', padding: '10px 22px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Browse Shop</Link>
    </div>
  );

  // Step indicators
  const steps = ['CART', 'ADDRESS', 'PAYMENT', 'REVIEW'] as CheckoutStep[];
  const stepIdx = steps.indexOf(step);

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', background: bg, border: `1px solid ${border}`, borderRadius: 9, fontSize: 14, color: text, outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: 100 }}>
      {/* Header with steps */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${border}` }}>
        {step === 'CART' && (
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: sub, cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 8, padding: 0 }}>
            ← Back
          </button>
        )}
        <h1 style={{ fontWeight: 800, fontSize: 20, color: text, margin: '0 0 10px' }}>
          {step === 'CART' ? 'My Cart' : step === 'ADDRESS' ? 'Delivery Address' : step === 'PAYMENT' ? 'Payment Method' : 'Review Order'}
        </h1>
        <div style={{ display: 'flex', gap: 4 }}>
          {steps.map((s, i) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= stepIdx ? accent : border }} />
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 14px' }}>

        {/* STEP 1: Cart items */}
        {step === 'CART' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cart.map(item => (
              <div key={item.id} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 13, padding: '13px', display: 'flex', gap: 11, alignItems: 'center' }}>
                <Link to={`/product/${item.baseProductId || item.id}`}>
                  <img src={item.image} alt={item.name} style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: `1px solid ${border}` }} />
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: text, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                  <p style={{ fontSize: 12, color: sub, margin: '0 0 6px' }}>{item.category}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: bg, border: `1px solid ${border}`, borderRadius: 8 }}>
                      <button onClick={() => handleQty(item.id, -1)} disabled={updatingQty.has(item.id)} style={{ width: 28, height: 28, background: 'none', border: 'none', color: text, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {updatingQty.has(item.id) ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : '−'}
                      </button>
                      <span style={{ minWidth: 24, textAlign: 'center', fontSize: 13, fontWeight: 700, color: text }}>{item.quantity}</span>
                      <button onClick={() => handleQty(item.id, 1)} disabled={updatingQty.has(item.id)} style={{ width: 28, height: 28, background: 'none', border: 'none', color: text, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: text }}>Rs. {(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.id)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                  <Trash2 size={16} style={{ color: '#ef4444' }} />
                </button>
              </div>
            ))}

            {/* Summary + Next */}
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 13, padding: '14px', marginTop: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: sub }}>Subtotal</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: text }}>Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${border}` }}>
                <span style={{ fontSize: 13, color: sub }}>Shipping</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: text }}>Rs. {shipping.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: text }}>Total</span>
                <span style={{ fontSize: 17, fontWeight: 800, color: accent }}>Rs. {total.toLocaleString()}</span>
              </div>
              {currentUser ? (
                <button onClick={() => setStep('ADDRESS')} style={{ width: '100%', background: accent, color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                  Continue to Address →
                </button>
              ) : (
                <button onClick={() => navigate('/login')} style={{ width: '100%', background: accent, color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                  Login to Checkout →
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Address */}
        {step === 'ADDRESS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Saved addresses */}
            {addresses.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: sub, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Saved Addresses</p>
                {addresses.map(a => (
                  <button key={a.id} onClick={() => {
                    setSelectedAddrId(a.id); setName(a.fullName); setPhone(a.phone);
                    setAddr([a.streetAddress, a.tehsil, a.district, a.province].filter(Boolean).join(', '));
                  }} style={{ textAlign: 'left', padding: '11px 13px', background: selectedAddrId === a.id ? `${accent}15` : surface, border: `1.5px solid ${selectedAddrId === a.id ? accent : border}`, borderRadius: 11, cursor: 'pointer' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: text, margin: '0 0 2px' }}>{a.label} — {a.fullName}</p>
                    <p style={{ fontSize: 12, color: sub, margin: 0 }}>{a.streetAddress}</p>
                  </button>
                ))}
              </div>
            )}
            <p style={{ fontSize: 12, fontWeight: 700, color: sub, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Contact Details</p>
            {[
              { label: 'Full Name', val: name, set: setName, type: 'text', ph: 'Your name' },
              { label: 'Phone', val: phone, set: setPhone, type: 'text', ph: '+92 XXX XXXXXXX' },
              { label: 'Email', val: email, set: setEmail, type: 'email', ph: 'your@email.com' },
            ].map(f => (
              <div key={f.label}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: sub, marginBottom: 5 }}>{f.label}</label>
                <input required type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={inputStyle} />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: sub, marginBottom: 5 }}>Shipping Address</label>
              <textarea required value={addr} onChange={e => setAddr(e.target.value)} rows={2} placeholder="Full address..."
                style={{ ...inputStyle, resize: 'none' } as React.CSSProperties} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={() => setStep('CART')} style={{ flex: 1, padding: '12px', background: surface, border: `1px solid ${border}`, borderRadius: 10, color: sub, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>← Back</button>
              <button onClick={() => { if (name && phone && email && addr) setStep('PAYMENT'); }} disabled={!name || !phone || !email || !addr}
                style={{ flex: 2, padding: '12px', background: accent, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: (!name || !phone || !email || !addr) ? 0.5 : 1 }}>
                Continue to Payment →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Payment */}
        {step === 'PAYMENT' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {hasChina && (
              <div style={{ padding: '10px 13px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 11 }}>
                <p style={{ fontSize: 12, color: '#ef4444', margin: 0, fontWeight: 600 }}>China products ke liye COD available nahi — online payment karein.</p>
              </div>
            )}
            {[
              !hasChina && { id: 'cod', icon: '💵', title: 'Cash on Delivery', sub: 'Pay when it arrives', color: '#16a34a' },
              { id: 'easypaisa', icon: '📱', title: 'Easypaisa', sub: '0318-5576890', color: '#16a34a' },
              { id: 'jazzcash', icon: '💳', title: 'JazzCash', sub: '0336-5942212', color: '#ef4444' },
            ].filter(Boolean).map((opt: any) => opt && (
              <button key={opt.id} onClick={() => setPayment(opt.id)} style={{
                display: 'flex', alignItems: 'center', gap: 13, padding: '13px',
                background: payment === opt.id ? `${opt.color}12` : surface,
                border: `1.5px solid ${payment === opt.id ? opt.color + '60' : border}`,
                borderRadius: 13, cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ fontSize: 26 }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: text, margin: '0 0 2px' }}>{opt.title}</p>
                  <p style={{ fontSize: 12, color: opt.id !== 'cod' ? opt.color : sub, margin: 0, fontWeight: opt.id !== 'cod' ? 700 : 400 }}>{opt.sub}</p>
                </div>
                {payment === opt.id && <CheckCircle2 size={18} style={{ color: opt.color, flexShrink: 0 }} />}
              </button>
            ))}
            {(payment === 'easypaisa' || payment === 'jazzcash') && (
              <div style={{ padding: '10px 13px', background: `${accent}0a`, border: `1px solid ${accent}30`, borderRadius: 10 }}>
                <p style={{ fontSize: 12, color: '#93c5fd', margin: 0 }}>Next step mein payment receipt upload karni hogi. Order admin approval ke baad active ho ga.</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={() => setStep('ADDRESS')} style={{ flex: 1, padding: '12px', background: surface, border: `1px solid ${border}`, borderRadius: 10, color: sub, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>← Back</button>
              <button onClick={() => setStep('REVIEW')} style={{ flex: 2, padding: '12px', background: accent, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Review Order →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review */}
        {step === 'REVIEW' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 13, padding: '14px' }}>
              <p style={{ fontSize: 11, color: sub, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 8px' }}>Delivery Address</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: text, margin: '0 0 2px' }}>{name}</p>
              <p style={{ fontSize: 12, color: sub, margin: '0 0 2px' }}>{phone}</p>
              <p style={{ fontSize: 12, color: sub, margin: 0 }}>{addr}</p>
            </div>
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 13, padding: '14px' }}>
              <p style={{ fontSize: 11, color: sub, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 8px' }}>Payment</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: text }}>{payment === 'cod' ? '💵 Cash on Delivery' : payment === 'easypaisa' ? '📱 Easypaisa' : '💳 JazzCash'}</p>
            </div>
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 13, padding: '14px' }}>
              <p style={{ fontSize: 11, color: sub, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 8px' }}>Items ({cart.length})</p>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{item.name} ×{item.quantity}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: text, flexShrink: 0 }}>Rs. {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${border}`, paddingTop: 10, marginTop: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: sub }}>Subtotal</span>
                  <span style={{ fontSize: 12, color: text }}>Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: sub }}>Shipping</span>
                  <span style={{ fontSize: 12, color: text }}>Rs. {shipping.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: text }}>Total</span>
                  <span style={{ fontSize: 17, fontWeight: 800, color: accent }}>Rs. {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep('PAYMENT')} style={{ flex: 1, padding: '12px', background: surface, border: `1px solid ${border}`, borderRadius: 10, color: sub, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>← Back</button>
              <button onClick={handleCheckout} disabled={isSubmitting} style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: 10, color: '#000', fontWeight: 800, fontSize: 14, cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {isSubmitting ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</> : payment === 'cod' ? '✅ Place Order' : `Pay with ${payment === 'easypaisa' ? 'Easypaisa' : 'JazzCash'}`}
              </button>
            </div>
          </div>
        )}
      </div>

      {showPayModal && (payment === 'easypaisa' || payment === 'jazzcash') && (
        <OnlinePaymentModal method={payment} totalAmount={total} onReceiptUploaded={handleReceipt} onClose={() => setShowPayModal(false)} />
      )}
    </div>
  );
};

export const Cart: React.FC = () => {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileCartView />;

  const { cart, removeFromCart, updateCartQuantity, totalCartPrice, placeOrder, currentUser, addresses, products } = useStore();
  const navigate = useNavigate();
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('CART');
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isOrdered, setIsOrdered] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cod' | 'easypaisa' | 'jazzcash'>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingQuantities, setUpdatingQuantities] = useState<Set<string>>(new Set());
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingReceiptUrl, setPendingReceiptUrl] = useState<string | null>(null);
  const [orderPaymentStatus, setOrderPaymentStatus] = useState<'approved' | 'awaiting_approval' | 'pending' | null>(null);

  const subtotal = totalCartPrice;
  const shipping = 300; // Fixed delivery charges
  const finalTotal = subtotal + shipping;

  // Check if any cart item is a China product — COD not allowed for China
  const hasChineseProducts = useMemo(() => {
    return cart.some(item => {
      const country = item.country || products.find(p => String(p.id) === String(item.baseProductId || item.id))?.country;
      return country === 'china';
    });
  }, [cart, products]);

  // If COD is selected but China products in cart, auto-switch to easypaisa
  useEffect(() => {
    if (hasChineseProducts && selectedPaymentMethod === 'cod') {
      setSelectedPaymentMethod('easypaisa');
    }
  }, [hasChineseProducts]);

  // Suggested products logic
  const suggestedProducts = useMemo(() => {
    if (cart.length === 0) return [];
    const mainCategory = cart[0].category;
    return products
      .filter(p => p.category === mainCategory && !cart.find(c => c.id === p.id))
      .slice(0, 5);
  }, [cart, products]);

  useEffect(() => {
    // Auto-select default address
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddressId(def.id);
      setCustomerName(def.fullName);
      setCustomerPhone(def.phone);
      const fullAddr = [def.streetAddress, def.tehsil, def.district, def.province].filter(Boolean).join(', ');
      setShippingAddress(fullAddr);
    }
  }, [addresses, selectedAddressId]);

  const handleAddressSelect = (id: string) => {
    const addr = addresses.find(a => a.id === id);
    if (addr) {
      setSelectedAddressId(id);
      setCustomerName(addr.fullName);
      setCustomerPhone(addr.phone);
      const fullAddr = [addr.streetAddress, addr.tehsil, addr.district, addr.province].filter(Boolean).join(', ');
      setShippingAddress(fullAddr);
    }
  };

  const handleQuantityUpdate = async (itemId: string, change: number) => {
    if (updatingQuantities.has(itemId)) return;
    
    setUpdatingQuantities(prev => new Set(prev).add(itemId));
    try {
      await updateCartQuantity(itemId, change);
      // Small artificial delay for UX feel
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setUpdatingQuantities(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleCheckout = async () => {
    if (!customerName || !shippingAddress || !customerPhone || !customerEmail || isSubmitting) return;

    if (selectedPaymentMethod === 'easypaisa' || selectedPaymentMethod === 'jazzcash') {
      setShowPaymentModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await placeOrder(
        { name: customerName, phone: customerPhone, email: customerEmail, address: shippingAddress },
        finalTotal,
        selectedPaymentMethod,
        undefined,
        () => {
          // Navigate BEFORE clearCartSilent runs — Cart unmounts, no blank screen possible
          navigate(`/order-confirmed?method=${selectedPaymentMethod}&name=${encodeURIComponent(customerName)}`);
        }
      );
    } catch (err) {
      console.error('Order failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceiptUploaded = async (receiptUrl: string) => {
    setShowPaymentModal(false);
    setPendingReceiptUrl(receiptUrl);
    setIsSubmitting(true);

    try {
      await placeOrder(
        { name: customerName, phone: customerPhone, email: customerEmail, address: shippingAddress },
        finalTotal,
        selectedPaymentMethod,
        receiptUrl,
        () => {
          // Navigate BEFORE clearCartSilent runs — Cart unmounts, no blank screen possible
          navigate(`/order-confirmed?method=${selectedPaymentMethod}&name=${encodeURIComponent(customerName)}`);
        }
      );
    } catch (err) {
      console.error('Order failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (checkoutStep === 'CART') setCheckoutStep('ADDRESS');
    else if (checkoutStep === 'ADDRESS') {
      if (customerName && shippingAddress && customerPhone && customerEmail) setCheckoutStep('PAYMENT');
    }
    else if (checkoutStep === 'PAYMENT') setCheckoutStep('REVIEW');
  };

  const prevStep = () => {
    if (checkoutStep === 'ADDRESS') setCheckoutStep('CART');
    else if (checkoutStep === 'PAYMENT') setCheckoutStep('ADDRESS');
    else if (checkoutStep === 'REVIEW') setCheckoutStep('PAYMENT');
  };

  if (isOrdered) {
    const isOnlinePayment = selectedPaymentMethod === 'easypaisa' || selectedPaymentMethod === 'jazzcash';
    return (
      <div className="min-h-[90vh] flex items-center justify-center px-4 py-16 md:py-24 bg-[#010409]">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] bg-emerald-500/5 blur-[180px] rounded-full animate-pulse" />
          {isOnlinePayment && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-amber-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          )}
        </div>

        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch relative z-10">

          {/* Left card — confirmation */}
          <div className="glass-dark p-8 md:p-12 rounded-[3.5rem] border-emerald-500/20 text-center flex flex-col justify-center shadow-[0_40px_100px_rgba(0,0,0,0.8)] animate-reveal-left">

            {/* Icon */}
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>

            {/* Title — same for both */}
            <h2 className="font-display text-4xl md:text-5xl font-black mb-3 text-white uppercase tracking-tight leading-none">
              Order <span className="text-emerald-500 italic">Received!</span>
            </h2>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.5em] mb-8">
              {isOnlinePayment ? 'Awaiting Payment Approval' : 'Authorization Signal Received'}
            </p>

            {/* Message */}
            <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed mb-6 uppercase tracking-widest">
              Shukriya <span className="text-white font-black">{customerName}</span>! Aapka order hamare paas aa gaya hai.
            </p>

            {/* Online payment — extra info box */}
            {isOnlinePayment && (
              <div className="space-y-3 mb-6">
                <div className="px-5 py-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left space-y-2">
                  <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest flex items-center gap-2">
                    <Clock size={12} className="animate-pulse" /> Payment Verification Pending
                  </p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Jab <span className="text-white font-black">Adil Zaman</span> aapki payment approve kar dein ge, aapka order automatically place ho jaye ga aur processing shuru ho jaye gi.
                  </p>
                </div>
                <div className="px-5 py-3 bg-white/[0.03] border border-white/5 rounded-2xl">
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Filhal aapka order <span className="text-amber-400 font-black">Pending Payment</span> section mein hai. Approval ke baad yeh{' '}
                    <span className="text-emerald-400 font-black">Active Orders</span> mein move ho jaye ga.
                  </p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <Link
                to="/orders"
                className="py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.4em] text-[9px] transition-all shadow-xl"
              >
                {isOnlinePayment ? 'Check Payment Status' : 'Track My Order'}
              </Link>
              <Link
                to="/shop"
                className="py-5 glass-dark hover:bg-white/5 text-gray-400 hover:text-white rounded-2xl font-black uppercase tracking-[0.4em] text-[9px] transition-all"
              >
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Right card — what happens next */}
          <div className="glass-dark p-8 md:p-12 rounded-[3.5rem] border-white/5 shadow-2xl animate-reveal-right flex flex-col">
            <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-6">
              <Info size={20} className="text-emerald-500" />
              <h3 className="text-lg font-black uppercase tracking-tighter text-white">
                Aage Kya <span className="text-gray-500 italic">Hoga?</span>
              </h3>
            </div>

            <div className="space-y-5 flex-grow">
              {isOnlinePayment ? [
                {
                  step: '1',
                  color: 'amber',
                  title: 'Payment Review',
                  desc: 'Adil Zaman 1-2 ghanton mein aapki receipt check karein ge.',
                },
                {
                  step: '2',
                  color: 'emerald',
                  title: 'Order Placement',
                  desc: 'Payment approve hote hi aapka order automatically active ho jaye ga.',
                },
                {
                  step: '3',
                  color: 'blue',
                  title: 'Delivery',
                  desc: 'Order confirm hone ke 24 ghante mein dispatch ho jaye ga.',
                },
                {
                  step: '4',
                  color: 'purple',
                  title: 'Rejection (agar hua)',
                  desc: 'Agar payment reject ho toh aapko My Orders mein notification milegi.',
                },
              ] : [
                {
                  step: '1',
                  color: 'emerald',
                  title: 'Order Confirmed',
                  desc: 'Aapka order hamare system mein record ho gaya hai.',
                },
                {
                  step: '2',
                  color: 'blue',
                  title: 'Processing',
                  desc: '24 ghante ke andar aapka order dispatch ke liye tayar ho jaye ga.',
                },
                {
                  step: '3',
                  color: 'amber',
                  title: 'Delivery',
                  desc: 'Order aapke diye hue address par deliver kiya jaye ga.',
                },
                {
                  step: '4',
                  color: 'gray',
                  title: 'Returns',
                  desc: 'Agar koi masla ho toh 7 din ke andar return request kar sakte hain.',
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start group">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5
                    ${item.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                      item.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                      item.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                      item.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-white/5 text-gray-500'}`}>
                    <span className="text-[10px] font-black">{item.step}</span>
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-white">{item.title}</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between opacity-30">
              <span className="text-[8px] font-black uppercase tracking-[1em] text-white">Zaman Mall</span>
              <span className="text-[8px] font-black uppercase text-gray-500 italic">© 2026</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#010409] text-white pt-20 md:pt-24 pb-20 md:pb-32 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-amber-500/[0.03] blur-[200px] rounded-full"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 mb-16 reveal text-center md:text-left">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-3 px-4 py-2 glass-dark border-amber-500/20 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-[0.5em] text-amber-500 shadow-xl">
              <ShieldCheck size={10} className="animate-pulse" /> Node Manifest
            </div>
            <h1 className="font-display text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none text-white">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 italic capitalize font-serif tracking-normal">Cart</span>
            </h1>
          </div>

          {/* Progress Indicator */}
          {cart.length > 0 && (
            <div className="flex items-center gap-4 md:gap-8 bg-white/[0.02] border border-white/5 p-4 rounded-3xl">
              {[
                { id: 'CART', icon: <ShoppingCart size={14} />, label: 'Registry' },
                { id: 'ADDRESS', icon: <MapPin size={14} />, label: 'Logistics' },
                { id: 'PAYMENT', icon: <PaymentIcon size={14} />, label: 'Protocol' },
                { id: 'REVIEW', icon: <ClipboardList size={14} />, label: 'Finalize' }
              ].map((s, i) => {
                const isActive = checkoutStep === s.id;
                const isCompleted = ['CART', 'ADDRESS', 'PAYMENT', 'REVIEW'].indexOf(checkoutStep) > i;
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]' : isCompleted ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20' : 'bg-white/5 text-gray-600 border border-white/5'}`}>
                      {isCompleted ? <CheckCircle2 size={12} /> : s.icon}
                    </div>
                    <span className={`hidden lg:block text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-gray-600'}`}>{s.label}</span>
                    {i < 3 && <div className="hidden lg:block w-8 h-[1px] bg-white/5 mx-2"></div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cart.length > 0 ? (
          <div className="flex flex-col gap-12">
            {/* Step Content */}
            <div className="w-full">
              {checkoutStep === 'CART' && (
                <div className="space-y-6 animate-fade-in">
                  {cart.map((item, idx) => (
                    <div key={item.id} className={`group relative glass-dark rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center border-white/5 hover:border-amber-500/20 transition-all duration-700 shadow-2xl reveal stagger-${(idx % 3) + 1}`}>
                      <Link to={`/product/${item.baseProductId || item.id}`} className="w-40 h-40 rounded-3xl overflow-hidden shrink-0 border border-white/10 shadow-xl bg-black relative">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" />
                      </Link>

                      <div className="flex-grow text-center md:text-left space-y-3">
                        <div className="flex items-center justify-center md:justify-start gap-4">
                          <span className="text-amber-500 text-[8px] font-black uppercase tracking-[0.4em] px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">{item.category}</span>
                          {(() => {
                            const country = item.country || products.find(p => p.id === (item.baseProductId || item.id))?.country;
                            return country && (
                              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/5">
                                <img src={country === 'china' ? "/images/china.png" : "/images/pakistan.png"} className="w-4 h-3 object-contain" alt="" />
                                <span className={`text-[8px] font-black uppercase tracking-widest ${country === 'china' ? 'text-red-500' : 'text-emerald-500'}`}>{country}</span>
                              </div>
                            );
                          })()}
                        </div>
                        <Link to={`/product/${item.baseProductId || item.id}`} className="block hover:text-amber-400 transition-colors">
                          <h3 className="text-xl md:text-3xl font-black text-white tracking-tight uppercase leading-tight">{item.name}</h3>
                        </Link>
                        {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                            {Object.entries(item.selectedVariants).map(([type, val]) => (
                              <span key={type} className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[8px] text-gray-400 font-black uppercase tracking-widest">
                                {type}: <span className="text-white ml-1">{val}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-center md:items-end gap-6 w-full md:w-auto">
                        <div className="flex items-center gap-6 glass bg-white/[0.02] rounded-2xl p-2 border border-white/5 shadow-xl">
                          <button
                            onClick={() => handleQuantityUpdate(item.id, -1)}
                            disabled={updatingQuantities.has(item.id)}
                            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-white transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingQuantities.has(item.id) ? <Loader2 size={14} className="animate-spin" /> : <Minus size={14} />}
                          </button>
                          <span className="w-6 text-center font-black text-lg text-white font-mono">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityUpdate(item.id, 1)}
                            disabled={updatingQuantities.has(item.id)}
                            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-white transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingQuantities.has(item.id) ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                          </button>
                        </div>

                        <div className="text-center md:text-right w-full">
                          <p className="text-2xl font-black text-white tracking-tighter font-mono">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="mt-4 text-gray-600 hover:text-red-500 transition-all flex items-center justify-center md:justify-end gap-2 text-[8px] font-black uppercase tracking-widest group/del"
                          >
                            <Trash2 size={12} className="group-hover/del:rotate-12 transition-transform" /> Evict Asset
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Action Bar for Step 1 */}
                  <div className="mt-12 flex justify-end">
                    <button
                      onClick={nextStep}
                      className="group flex items-center gap-4 px-12 py-6 bg-white text-black rounded-3xl font-black uppercase tracking-[0.4em] text-[10px] hover:bg-amber-500 hover:text-white transition-all shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-95"
                    >
                      Process Logistics <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              )}

              {checkoutStep === 'ADDRESS' && (
                <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
                  <div className="glass-dark p-8 md:p-12 rounded-[3.5rem] border-white/5 shadow-2xl space-y-10">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-8">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                        <MapPin className="text-amber-500" size={24} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Logistics Node</h3>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Select distribution endpoint</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map(addr => (
                        <button
                          key={addr.id}
                          onClick={() => handleAddressSelect(addr.id)}
                          className={`text-left p-6 rounded-[2rem] border transition-all duration-500 ${selectedAddressId === addr.id ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_10px_30px_rgba(245,158,11,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${selectedAddressId === addr.id ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400'}`}>{addr.label}</span>
                            {selectedAddressId === addr.id && <CheckCircle2 size={16} className="text-amber-500" />}
                          </div>
                          <p className="text-sm font-bold text-white mb-1">{addr.fullName}</p>
                          <p className="text-xs text-gray-500 line-clamp-2">{addr.streetAddress}</p>
                        </button>
                      ))}
                      <Link to="/addresses" className="flex flex-col items-center justify-center p-6 rounded-[2rem] border border-dashed border-white/10 hover:border-amber-500/40 transition-all group">
                        <Plus size={24} className="text-gray-600 group-hover:text-amber-500 mb-2 transition-colors" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 group-hover:text-amber-500">Provision New Node</span>
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                      {[
                        { id: 'name', label: 'Identity Marker', type: 'text', value: customerName, onChange: setCustomerName, placeholder: 'Legal Entity Designation' },
                        { id: 'phone', label: 'Signal Link', type: 'text', value: customerPhone, onChange: setCustomerPhone, placeholder: '+92-XXX-XXXXXXX' },
                        { id: 'email', label: 'Neural Link', type: 'email', value: customerEmail, onChange: setCustomerEmail, placeholder: 'name@terminal.com' },
                        { id: 'address', label: 'Logistics Endpoint', type: 'textarea', value: shippingAddress, onChange: setShippingAddress, placeholder: 'Full Distribution Point' }
                      ].map((field) => (
                        <div key={field.id} className={`${field.type === 'textarea' ? 'md:col-span-2' : ''} space-y-2`}>
                          <label className="text-[8px] font-black text-gray-700 uppercase tracking-[0.4em] ml-4">{field.label}</label>
                          {field.type !== 'textarea' ? (
                            <input required type={field.type} value={field.value} onChange={(e) => field.onChange(e.target.value)} className="w-full bg-[#010409] border border-white/5 rounded-2xl py-5 px-6 text-xs font-bold text-white focus:border-amber-500/50 outline-none transition-all" placeholder={field.placeholder} />
                          ) : (
                            <textarea required value={field.value} onChange={(e) => field.onChange(e.target.value)} rows={3} className="w-full bg-[#010409] border border-white/5 rounded-[2rem] py-5 px-6 text-xs font-medium text-gray-400 focus:border-amber-500/50 outline-none transition-all resize-none" placeholder={field.placeholder} />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button onClick={prevStep} className="px-8 py-6 glass-dark border border-white/5 rounded-[2rem] text-gray-500 hover:text-white transition-all">
                        <ArrowLeft size={20} />
                      </button>
                      <button
                        onClick={nextStep}
                        disabled={!customerName || !shippingAddress || !customerPhone || !customerEmail}
                        className="flex-grow py-6 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] hover:bg-amber-500 hover:text-white transition-all shadow-xl disabled:opacity-30"
                      >
                        Payment Protocol <ChevronRight size={16} className="inline ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {checkoutStep === 'PAYMENT' && (
                <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
                  <div className="glass-dark p-8 md:p-12 rounded-[3.5rem] border-white/5 shadow-2xl space-y-10">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-8">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                        <PaymentIcon className="text-amber-500" size={24} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Payment Protocol</h3>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Select settlement method</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {/* COD — only for Pakistan products */}
                      {!hasChineseProducts && (
                        <button
                          onClick={() => setSelectedPaymentMethod('cod')}
                          className={`flex items-center gap-6 p-8 rounded-[2.5rem] border transition-all duration-500 ${selectedPaymentMethod === 'cod' ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_10px_30px_rgba(245,158,11,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                        >
                          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${selectedPaymentMethod === 'cod' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-500'}`}>
                            <Banknote size={32} />
                          </div>
                          <div className="text-left flex-grow">
                            <h4 className="text-lg font-black uppercase tracking-tight text-white mb-1">Cash on Delivery</h4>
                            <p className="text-xs text-gray-500">Payment upon delivery — Pakistan orders only</p>
                          </div>
                          {selectedPaymentMethod === 'cod' && <CheckCircle2 size={24} className="text-amber-500" />}
                        </button>
                      )}

                      {/* China products — COD not available notice */}
                      {hasChineseProducts && (
                        <div className="flex items-start gap-4 p-5 rounded-[2.5rem] bg-red-500/5 border border-red-500/15">
                          <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0 mt-1">
                            <img src="/images/china.png" className="w-6 h-4 object-contain" alt="" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-red-400 mb-1">COD Available Nahi</p>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              China products ke liye Cash on Delivery available nahi hai. Easypaisa ya JazzCash se payment karein.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Easypaisa */}
                      <button
                        onClick={() => setSelectedPaymentMethod('easypaisa')}
                        className={`flex items-center gap-6 p-8 rounded-[2.5rem] border transition-all duration-500 ${selectedPaymentMethod === 'easypaisa' ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_10px_30px_rgba(16,185,129,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                      >
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-2xl ${selectedPaymentMethod === 'easypaisa' ? 'bg-emerald-500 text-white' : 'bg-white/5'}`}>
                          📱
                        </div>
                        <div className="text-left flex-grow">
                          <h4 className="text-lg font-black uppercase tracking-tight text-white mb-1">Easypaisa</h4>
                          <p className="text-xs text-gray-500">Send payment to <span className="text-emerald-400 font-black">0318-5576890</span> and upload receipt</p>
                        </div>
                        {selectedPaymentMethod === 'easypaisa' && <CheckCircle2 size={24} className="text-emerald-500" />}
                      </button>

                      {/* JazzCash */}
                      <button
                        onClick={() => setSelectedPaymentMethod('jazzcash')}
                        className={`flex items-center gap-6 p-8 rounded-[2.5rem] border transition-all duration-500 ${selectedPaymentMethod === 'jazzcash' ? 'bg-red-500/10 border-red-500/40 shadow-[0_10px_30px_rgba(239,68,68,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                      >
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-2xl ${selectedPaymentMethod === 'jazzcash' ? 'bg-red-500 text-white' : 'bg-white/5'}`}>
                          💳
                        </div>
                        <div className="text-left flex-grow">
                          <h4 className="text-lg font-black uppercase tracking-tight text-white mb-1">JazzCash</h4>
                          <p className="text-xs text-gray-500">Send payment to <span className="text-red-400 font-black">0336-5942212</span> and upload receipt</p>
                        </div>
                        {selectedPaymentMethod === 'jazzcash' && <CheckCircle2 size={24} className="text-red-500" />}
                      </button>
                    </div>

                    {/* Online payment info banner */}
                    {(selectedPaymentMethod === 'easypaisa' || selectedPaymentMethod === 'jazzcash') && (
                      <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-4">
                        <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-blue-300 leading-relaxed">
                          After clicking <strong>Review Manifest</strong>, you'll see payment instructions and can upload your receipt.
                          Your order will be confirmed once admin verifies the payment.
                        </p>
                      </div>
                    )}

                    <div className="flex gap-4 pt-4">
                      <button onClick={prevStep} className="px-8 py-6 glass-dark border border-white/5 rounded-[2rem] text-gray-500 hover:text-white transition-all">
                        <ArrowLeft size={20} />
                      </button>
                      <button
                        onClick={nextStep}
                        className="flex-grow py-6 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] hover:bg-amber-500 hover:text-white transition-all shadow-xl"
                      >
                        Review Manifest <ChevronRight size={16} className="inline ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {checkoutStep === 'REVIEW' && (
                <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
                  <div className="glass-dark p-8 md:p-12 rounded-[3.5rem] border-white/5 shadow-2xl space-y-10">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-8">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                        <ClipboardList className="text-amber-500" size={24} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Final Review</h3>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Authorize final transmission</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-8">
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 mb-4">Logistics Summary</h4>
                          <div className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/5 space-y-3">
                            <p className="text-xs font-black text-white">{customerName}</p>
                            <p className="text-[10px] text-gray-400 font-medium leading-relaxed">{shippingAddress}</p>
                            <p className="text-[10px] text-gray-500 font-mono italic">{customerPhone}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 mb-4">Settlement Method</h4>
                          <div className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/5 flex items-center gap-4">
                            {selectedPaymentMethod === 'cod' && <><Banknote size={20} className="text-gray-400" /><p className="text-xs font-black text-white uppercase tracking-widest">Cash on Delivery</p></>}
                            {selectedPaymentMethod === 'easypaisa' && <><span className="text-xl">📱</span><div><p className="text-xs font-black text-white uppercase tracking-widest">Easypaisa</p><p className="text-[10px] text-emerald-400 font-black">0318-5576890</p></div></>}
                            {selectedPaymentMethod === 'jazzcash' && <><span className="text-xl">💳</span><div><p className="text-xs font-black text-white uppercase tracking-widest">JazzCash</p><p className="text-[10px] text-red-400 font-black">0336-5942212</p></div></>}
                          </div>
                          {(selectedPaymentMethod === 'easypaisa' || selectedPaymentMethod === 'jazzcash') && (
                            <p className="text-[10px] text-amber-400 mt-3 px-2 leading-relaxed">
                              ⚡ You will be prompted to upload your payment receipt after clicking the button below.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 mb-4">Registry Items</h4>
                          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                            {cart.map((item) => (
                              <div key={item.id} className="flex gap-4 items-center bg-white/[0.01] p-3 rounded-2xl border border-white/5">
                                <img src={item.image} className="w-12 h-12 rounded-xl object-cover" alt="" />
                                <div className="flex-grow min-w-0">
                                  <p className="text-[10px] font-black text-white truncate uppercase">{item.name}</p>
                                  <p className="text-[8px] text-gray-500 font-mono">Qty: {item.quantity} × Rs. {item.price.toLocaleString()}</p>
                                </div>
                                <p className="text-[10px] font-black text-amber-500 font-mono shrink-0">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-amber-500/[0.03] p-6 rounded-[2rem] border border-amber-500/20 space-y-4">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                            <span>Subtotal</span>
                            <span className="text-white font-mono">Rs. {subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                            <span>Logistics</span>
                            <span className="text-white font-mono">Rs. {shipping.toLocaleString()}</span>
                          </div>
                          <div className="h-[1px] bg-amber-500/20 my-2"></div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-widest text-white">Total Authorized</span>
                            <span className="text-2xl font-black text-amber-500 font-mono tracking-tighter">Rs. {finalTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button onClick={prevStep} className="px-8 py-6 glass-dark border border-white/5 rounded-[2rem] text-gray-500 hover:text-white transition-all">
                        <ArrowLeft size={20} />
                      </button>
                      <button
                        onClick={handleCheckout}
                        disabled={isSubmitting}
                        className="flex-grow py-6 bg-gradient-to-r from-amber-500 to-amber-700 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] hover:scale-[1.01] transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                        {isSubmitting
                          ? 'Synchronizing Archive...'
                          : (selectedPaymentMethod === 'easypaisa' || selectedPaymentMethod === 'jazzcash')
                            ? 'Pay with ' + (selectedPaymentMethod === 'easypaisa' ? 'Easypaisa' : 'JazzCash')
                            : 'Authorize Final Transmission'
                        }
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Imperial Curations Section (Suggested Products) */}
            {suggestedProducts.length > 0 && checkoutStep === 'CART' && (
              <div className="mt-20 reveal">
                <div className="flex items-center justify-between mb-10 px-4">
                  <div className="space-y-1.5">
                    <h4 className="text-2xl font-black uppercase tracking-tighter text-white">Imperial <span className="text-amber-500 italic">Curations</span></h4>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-600">Assets aligned with your selection</p>
                  </div>
                  <Link to="/shop" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 hover:text-amber-400 transition-colors">
                    View All Assets <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {suggestedProducts.map((p, i) => (
                    <Link 
                      key={p.id} 
                      to={`/product/${p.id}`} 
                      className="glass-dark rounded-[2.5rem] border border-white/5 hover:border-amber-500/20 transition-all duration-500 group reveal shadow-xl"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      <div className="aspect-square rounded-[2rem] overflow-hidden m-3 border border-white/5 bg-black">
                        <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                      </div>
                      <div className="p-6 pt-2 space-y-2">
                        <h5 className="text-[10px] font-black uppercase text-white truncate tracking-tight">{p.name}</h5>
                        <div className="flex items-center justify-between">
                          <p className="text-amber-500 font-mono font-black text-xs italic">Rs. {p.price.toLocaleString()}</p>
                          {p.country && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/40 border border-white/5">
                              <img src={p.country === 'china' ? "/images/china.png" : "/images/pakistan.png"} className="w-2.5 h-2 object-contain" alt="" />
                              <span className={`text-[6px] font-black uppercase tracking-widest ${p.country === 'china' ? 'text-red-500' : 'text-emerald-500'}`}>{p.country}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : isSubmitting ? (
          /* Cart was just cleared while order is being placed — show a loading state instead of empty */
          <div className="flex flex-col items-center justify-center py-40 gap-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-2 border-amber-500/20 flex items-center justify-center">
                <Loader2 size={36} className="text-amber-500 animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-500">Placing Your Order</p>
              <p className="text-sm font-medium text-gray-500">Please wait...</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-40 glass-dark rounded-[4rem] border-dashed border-white/10 shadow-2xl reveal">
            <ShoppingBag size={64} className="mx-auto text-gray-800 animate-float opacity-30 mb-8" />
            <h3 className="font-display text-4xl font-black uppercase tracking-tight mb-4 text-white">Registry Void</h3>
            <p className="text-gray-500 text-sm mb-12 max-w-sm mx-auto font-medium uppercase tracking-widest leading-relaxed">No curations designated for acquisition.</p>
            <Link to="/shop" className="px-12 py-5 bg-white text-black rounded-full font-black uppercase tracking-[0.5em] text-[10px] transition-all hover:bg-blue-600 hover:text-white shadow-xl">
              Access Vault
            </Link>
          </div>
        )}
      </div>

      {/* Online Payment Modal */}
      {showPaymentModal && (selectedPaymentMethod === 'easypaisa' || selectedPaymentMethod === 'jazzcash') && (
        <OnlinePaymentModal
          method={selectedPaymentMethod}
          totalAmount={finalTotal}
          onReceiptUploaded={handleReceiptUploaded}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};
