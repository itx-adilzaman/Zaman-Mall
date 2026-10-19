import React, { useState, useRef } from 'react';
import {
  X, Upload, CheckCircle2, Copy, Smartphone, AlertCircle,
  Loader2, ImageIcon, Check
} from 'lucide-react';
import { uploadToCloudinary } from '../services/cloudinary';
import { useIsMobile } from '../hooks/useIsMobile';

interface OnlinePaymentModalProps {
  method: 'easypaisa' | 'jazzcash';
  totalAmount: number;
  onReceiptUploaded: (receiptUrl: string) => void;
  onClose: () => void;
}

const PAYMENT_INFO = {
  easypaisa: {
    number: '0318-5576890',
    name: 'Easypaisa',
    color: 'emerald',
    gradient: 'from-emerald-600 to-emerald-800',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    icon: '📱',
    accountTitle: 'Zaman Sons Mall',
    solidColor: '#10b981',
    lightBg: '#052e16',
  },
  jazzcash: {
    number: '0336-5942212',
    name: 'JazzCash',
    color: 'red',
    gradient: 'from-red-600 to-red-800',
    borderColor: 'border-red-500/30',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-400',
    icon: '💳',
    accountTitle: 'Zaman Sons Mall',
    solidColor: '#ef4444',
    lightBg: '#2d0a0a',
  },
};

export const OnlinePaymentModal: React.FC<OnlinePaymentModalProps> = ({
  method,
  totalAmount,
  onReceiptUploaded,
  onClose,
}) => {
  const info      = PAYMENT_INFO[method];
  const isMobile  = useIsMobile();

  const [receiptFile,    setReceiptFile]    = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploading,    setIsUploading]    = useState(false);
  const [uploadError,    setUploadError]    = useState<string | null>(null);
  const [copied,         setCopied]         = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Handlers (unchanged) ──────────────────────────────────────────────────
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(info.number.replace(/-/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silent fail
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    setUploadError(null);
    const reader = new FileReader();
    reader.onloadend = () => setReceiptPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!receiptFile) {
      setUploadError('Please select a payment receipt image first.');
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      const url = await uploadToCloudinary(receiptFile);
      onReceiptUploaded(url);
    } catch (err) {
      console.error('Receipt upload failed:', err);
      setUploadError('Failed to upload receipt. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // ── MOBILE UI ─────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[200] flex items-end justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70" onClick={onClose} />

        {/* Bottom sheet */}
        <div
          className="relative w-full bg-[#0d1117] rounded-t-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: '92vh' }}
        >
          {/* Header strip */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ background: info.lightBg, borderBottom: `1px solid ${info.solidColor}30` }}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{info.icon}</span>
              <div>
                <p className="text-white font-black text-sm leading-none">{info.name} Payment</p>
                <p className="text-xs mt-0.5" style={{ color: info.solidColor }}>
                  Rs. {totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4" style={{ scrollbarWidth: 'none' }}>

            {/* Step 1 — Account number */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: `${info.solidColor}30` }}>
              <div className="px-3 py-2" style={{ background: `${info.solidColor}12` }}>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: info.solidColor }}>
                  Step 1 — Send Payment
                </p>
              </div>
              <div className="px-3 py-3 flex items-center justify-between gap-3 bg-black/30">
                <div>
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-0.5">
                    {info.name} Number
                  </p>
                  <p className="text-white font-black text-lg font-mono tracking-widest">
                    {info.number}
                  </p>
                  <p className="text-gray-600 text-[10px] mt-0.5">{info.accountTitle}</p>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg"
                  style={{ background: `${info.solidColor}15`, border: `1px solid ${info.solidColor}30` }}
                >
                  {copied
                    ? <Check size={16} style={{ color: info.solidColor }} />
                    : <Copy size={16} style={{ color: info.solidColor }} />
                  }
                  <span className="text-[9px] font-black uppercase" style={{ color: info.solidColor }}>
                    {copied ? 'Copied!' : 'Copy'}
                  </span>
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-3 py-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={13} className="text-yellow-400 flex-shrink-0" />
                <p className="text-yellow-400 text-[10px] font-black uppercase tracking-wider">Instructions</p>
              </div>
              <ol className="space-y-1.5">
                {[
                  `Open ${info.name} app or dial *786#`,
                  `Send exactly Rs. ${totalAmount.toLocaleString()} to ${info.number}`,
                  'Take a screenshot of the transaction confirmation',
                  'Upload the screenshot below and place order',
                  'Admin will verify within 1–2 hours',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-gray-400 leading-snug">
                    <span className="font-black text-gray-600 flex-shrink-0">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Step 2 — Upload receipt */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: `${info.solidColor}30` }}>
              <div className="px-3 py-2" style={{ background: `${info.solidColor}12` }}>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: info.solidColor }}>
                  Step 2 — Upload Receipt
                </p>
              </div>
              <div className="p-3 bg-black/30">
                {receiptPreview ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="w-full max-h-48 object-contain bg-black/40"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 flex items-center gap-1 px-3 py-1.5 bg-black/70 rounded-lg text-white text-[10px] font-bold"
                    >
                      <Upload size={11} /> Change
                    </button>
                    <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={14} className="text-white" />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center gap-2"
                  >
                    <ImageIcon size={24} className="text-gray-500" />
                    <p className="text-sm font-bold text-gray-400">Tap to upload receipt</p>
                    <p className="text-[10px] text-gray-600">JPG, PNG, or screenshot</p>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </div>
            </div>

            {/* Error */}
            {uploadError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-400">{uploadError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isUploading || !receiptFile}
              className="w-full py-3.5 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ background: info.solidColor }}
            >
              {isUploading ? (
                <><Loader2 size={16} className="animate-spin" />Uploading...</>
              ) : (
                <><Smartphone size={16} />Place Order & Submit Receipt</>
              )}
            </button>

            <p className="text-[10px] text-gray-600 text-center leading-relaxed pb-2">
              Order stays <span className="text-yellow-400 font-bold">Pending</span> until admin verifies receipt.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── DESKTOP UI (original, unchanged) ─────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg glass-dark rounded-[3rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.9)] animate-fade-in flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className={`p-8 rounded-t-[3rem] bg-gradient-to-br ${info.gradient} relative overflow-hidden shrink-0`}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{info.icon}</span>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                  {info.name} Payment
                </h2>
                <p className="text-white/60 text-xs font-black uppercase tracking-widest mt-1">
                  Manual Transfer
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto flex-1 overscroll-contain" style={{ scrollbarWidth: 'none' }}>
          {/* Amount */}
          <div className={`p-5 rounded-2xl ${info.bgColor} ${info.borderColor} border`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
              Amount to Pay
            </p>
            <p className={`text-3xl font-black ${info.textColor} font-mono`}>
              Rs. {totalAmount.toLocaleString()}
            </p>
          </div>

          {/* Step 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full ${info.bgColor} ${info.borderColor} border flex items-center justify-center shrink-0`}>
                <span className={`text-[11px] font-black ${info.textColor}`}>1</span>
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white">
                Send Payment to This Number
              </h3>
            </div>
            <div className={`p-5 rounded-2xl bg-black/50 ${info.borderColor} border flex items-center justify-between gap-4`}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                  {info.name} Number
                </p>
                <p className="text-2xl font-black text-white font-mono tracking-widest">
                  {info.number}
                </p>
                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                  Account: {info.accountTitle}
                </p>
              </div>
              <button
                onClick={handleCopy}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${info.bgColor} ${info.borderColor} border transition-all hover:scale-105 active:scale-95`}
              >
                {copied ? (
                  <Check size={20} className={info.textColor} />
                ) : (
                  <Copy size={20} className={info.textColor} />
                )}
                <span className={`text-[8px] font-black uppercase tracking-widest ${info.textColor}`}>
                  {copied ? 'Copied!' : 'Copy'}
                </span>
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
            <div className="flex items-center gap-3">
              <AlertCircle size={16} className="text-amber-400 shrink-0" />
              <h4 className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                Instructions
              </h4>
            </div>
            <ol className="space-y-2 pl-1">
              {[
                `Open your ${info.name} app or dial *786# for EasyPaisa / *786# for JazzCash`,
                `Send exactly Rs. ${totalAmount.toLocaleString()} to ${info.number}`,
                'Take a screenshot or photo of the payment confirmation / transaction receipt',
                'Upload the receipt below and click "Place Order"',
                'Your order will be confirmed after admin verifies the payment (usually within 1-2 hours)',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-[11px] text-gray-400 leading-relaxed">
                  <span className="shrink-0 font-black text-gray-600">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full ${info.bgColor} ${info.borderColor} border flex items-center justify-center shrink-0`}>
                <span className={`text-[11px] font-black ${info.textColor}`}>2</span>
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white">
                Upload Payment Receipt
              </h3>
            </div>

            {receiptPreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/10 group">
                <img
                  src={receiptPreview}
                  alt="Receipt preview"
                  className="w-full max-h-56 object-contain bg-black/50"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-3 bg-white/20 rounded-2xl text-white text-[11px] font-black uppercase tracking-widest"
                  >
                    <Upload size={14} /> Change Receipt
                  </button>
                </div>
                <div className="absolute top-3 right-3 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl">
                  <CheckCircle2 size={18} className="text-white" />
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-10 rounded-2xl border-2 border-dashed border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col items-center gap-3 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-all">
                  <ImageIcon size={24} className="text-gray-500 group-hover:text-gray-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-gray-400 group-hover:text-white transition-colors">
                    Click to upload receipt
                  </p>
                  <p className="text-[10px] text-gray-600 mt-1">JPG, PNG, or screenshot</p>
                </div>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Error */}
          {uploadError && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-400 font-medium">{uploadError}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isUploading || !receiptFile}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.4em] text-[11px] transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed
              bg-gradient-to-r ${info.gradient} text-white hover:scale-[1.01] active:scale-[0.99]`}
          >
            {isUploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Uploading Receipt...
              </>
            ) : (
              <>
                <Smartphone size={18} />
                Place Order &amp; Submit Receipt
              </>
            )}
          </button>

          <p className="text-[10px] text-gray-600 text-center leading-relaxed">
            Your order will remain in <span className="text-amber-400 font-black">Pending Payment</span> until
            the admin verifies your receipt. You'll see the status update in your orders.
          </p>
        </div>
      </div>
    </div>
  );
};
