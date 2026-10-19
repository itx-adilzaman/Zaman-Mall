import React from 'react';
import { CheckCircle2, XCircle, RotateCcw, User as UserIcon, Clock, Package } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useAlert } from '../context/AlertContext';

export default function Returns() {
  const { orders, updateReturnStatus, formatPrice } = useAdmin();
  const { showAlert } = useAlert();
  const requests = orders.filter(o => o?.returnRequest);

  const handleApprove = async (id: string) => {
    try { await updateReturnStatus(id, 'approved'); showAlert('success', 'Return Approved'); }
    catch { showAlert('error', 'Failed'); }
  };
  const handleReject = async (id: string) => {
    try { await updateReturnStatus(id, 'rejected'); showAlert('info', 'Return Rejected'); }
    catch { showAlert('error', 'Failed'); }
  };

  if (!requests.length) return (
    <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)' }}>
        <RotateCcw size={20} style={{ color: '#c084fc' }} />
      </div>
      <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>No return requests</p>
      <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>All clear — nothing pending</p>
    </div>
  );

  const pending  = requests.filter(o => o.returnRequest?.status === 'pending').length;
  const approved = requests.filter(o => o.returnRequest?.status === 'approved').length;
  const rejected = requests.filter(o => o.returnRequest?.status === 'rejected').length;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Summary — 3 cols on all sizes */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending',  val: pending,  color: '#fbbf24', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.15)' },
          { label: 'Approved', val: approved, color: '#4ade80', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.15)' },
          { label: 'Rejected', val: rejected, color: '#f87171', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.15)' },
        ].map(s => (
          <div key={s.label} className="card text-center py-4"
            style={{ borderColor: s.border, background: s.bg }}>
            <p className="text-2xl font-extrabold font-mono-num" style={{ color: s.color }}>{s.val}</p>
            <p className="section-title mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Return request cards */}
      {requests.map(order => {
        const req = order.returnRequest!;
        const isPending = req.status === 'pending';
        return (
          <div key={order.id} className="card card-hover">
            {/* Stacks vertically on mobile, side-by-side on md+ */}
            <div className="flex flex-col md:flex-row gap-5">
              <div className="flex-1 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="badge badge-returned">Return</span>
                  <span className="text-xs font-bold font-mono-num" style={{ color: 'var(--text)' }}>
                    #{order.id.slice(0, 12)}
                  </span>
                  <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-subtle)' }}>
                    <Clock size={10} />
                    {req.requestedAt
                      ? new Date(req.requestedAt).toLocaleDateString()
                      : new Date(order.date).toLocaleDateString()}
                  </div>
                </div>

                {/* Customer */}
                <div className="flex items-center gap-2.5">
                  <div className="avatar w-9 h-9 rounded-xl">
                    <UserIcon size={14} style={{ color: 'var(--text-subtle)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{order.customerName}</p>
                    <p className="text-xs font-mono-num" style={{ color: 'var(--text-subtle)' }}>{order.customerEmail}</p>
                  </div>
                </div>

                {/* Reason */}
                <div className="p-4 rounded-xl" style={{ background: 'var(--hover)', border: '1px solid var(--border)' }}>
                  <p className="section-title mb-1.5">Return Reason</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>"{req.reason}"</p>
                </div>

                {/* Value + Items */}
                <div className="flex items-center gap-5 flex-wrap">
                  <div>
                    <p className="section-title mb-1">Order Value</p>
                    <p className="text-lg font-extrabold font-mono-num" style={{ color: 'var(--brand)' }}>
                      {formatPrice(order.total)}
                    </p>
                  </div>
                  <div>
                    <p className="section-title mb-1">Items</p>
                    <div className="flex -space-x-1.5">
                      {order.items.slice(0, 5).map((item, i) => (
                        <div key={i} className="avatar w-8 h-8">
                          <img src={item.image} alt="" className="object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons — full width on mobile, fixed width on md+ */}
              <div className="flex flex-row md:flex-col gap-2.5 md:justify-center md:w-44 shrink-0">
                {isPending ? (
                  <>
                    <button onClick={() => handleApprove(order.id)}
                      className="flex-1 md:w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wide text-white transition-all flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)', boxShadow: '0 4px 12px rgba(34,197,94,0.35)' }}>
                      <CheckCircle2 size={14} /> Approve
                    </button>
                    <button onClick={() => handleReject(order.id)}
                      className="flex-1 md:w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-2"
                      style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <XCircle size={14} /> Reject
                    </button>
                  </>
                ) : (
                  <div className={`flex-1 md:w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wide text-center border flex items-center justify-center gap-2`}
                    style={{
                      background: req.status === 'approved' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                      borderColor: req.status === 'approved' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                      color: req.status === 'approved' ? '#4ade80' : '#f87171',
                    }}>
                    {req.status === 'approved' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {req.status}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
