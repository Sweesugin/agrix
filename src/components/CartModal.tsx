import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Trash2, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { CartItem } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const { refreshCartCount } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<{ orderId: string; message: string } | null>(null);

  const loadCart = async () => {
    try {
      setLoading(true);
      const data = await api.getCart();
      setItems(data.items);
      setSubtotal(data.subtotal);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCheckoutSuccess(null);
      loadCart();
    }
  }, [isOpen]);

  const handleRemove = async (productId: string) => {
    try {
      await api.removeFromCart(productId);
      await loadCart();
      await refreshCartCount();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const res = await api.checkoutCart();
      setCheckoutSuccess({ orderId: res.orderId, message: res.message });
      setItems([]);
      setSubtotal(0);
      await refreshCartCount();
    } catch (err: any) {
      alert(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">Marketplace Cart</h3>
              <p className="text-xs text-stone-500">Conceptual Sustainable Farm Inputs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {checkoutSuccess ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-stone-900">Prototype Order Confirmed!</h4>
              <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full inline-block">
                Order ID: {checkoutSuccess.orderId}
              </p>
              <p className="text-xs text-stone-600 leading-relaxed max-w-xs mx-auto">
                {checkoutSuccess.message}
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-sm hover:bg-emerald-700"
              >
                Return to Marketplace
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 mx-auto text-stone-300" />
              <p className="text-sm font-semibold text-stone-600">Your cart is currently empty</p>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                Explore verified sustainable seeds, bio-pesticides, drip kits, and compost in the AgriX Marketplace.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/50 flex items-center gap-3"
                >
                  <img
                    src={item.product?.imageUrl}
                    alt={item.product?.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-stone-900 truncate">
                      {item.product?.name}
                    </h5>
                    <div className="text-[11px] text-stone-500">
                      ₹{item.product?.price} × {item.quantity} ({item.product?.unit})
                    </div>
                    <div className="text-xs font-bold text-emerald-800 mt-1">
                      ₹{item.itemTotal}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(item.productId)}
                    className="p-2 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Prototype simulation: No actual financial charge will occur. Demonstrates order routing to verified bio-input cooperatives.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!checkoutSuccess && items.length > 0 && (
          <div className="p-5 border-t border-stone-200 bg-stone-50 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600 font-medium">Estimated Subtotal</span>
              <span className="text-lg font-extrabold text-stone-900">₹{subtotal}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition-all"
            >
              <span>{loading ? 'Processing...' : 'Place Prototype Order'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
