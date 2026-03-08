import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle2, Circle, CreditCard, Banknote, Receipt } from 'lucide-react';
import { clsx } from 'clsx';

export default function CheckoutPage() {
  const { cart, cartTotal, tableNumber, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash'>('upi');
  const [isPlaced, setIsPlaced] = useState(false);

  const taxes = Math.round(cartTotal * 0.05); // 5% tax
  const toPay = cartTotal + taxes;

  const handlePlaceOrder = () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    
    // Here you would integrate Cashfree UPI or handle cash order
    setIsPlaced(true);
    setTimeout(() => {
      clearCart();
      navigate('/menu');
    }, 3000);
  };

  if (isPlaced) {
    return (
      <div className="min-h-screen bg-background-light flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle2 className="w-24 h-24 text-primary mb-6 animate-bounce" />
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Order Placed!</h1>
        <p className="text-slate-500 mb-8">
          Your food is being prepared. It will be served at Table {tableNumber}.
        </p>
        <p className="text-sm text-primary font-medium animate-pulse">Redirecting to menu...</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background-light flex flex-col items-center justify-center p-6 font-display">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Receipt className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
        <p className="text-slate-500 mb-8 text-center">Looks like you haven't added anything to your cart yet.</p>
        <button 
          onClick={() => navigate('/menu')}
          className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light font-display pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background-light/95 backdrop-blur-md border-b border-primary/20">
        <div className="px-4 py-3 flex items-center gap-4">
          <button 
            onClick={() => navigate('/menu')}
            className="p-2 hover:bg-primary/10 rounded-full text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-xl text-slate-900">Checkout</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Order Summary */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-primary/10">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-900">
            <Receipt className="w-5 h-5 text-primary" />
            Order Summary
          </h2>
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-primary/10">
                    <img className="w-full h-full object-cover" alt={item.name} src={item.imageUrl} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 leading-tight">{item.name}</h4>
                    <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-bold text-slate-900">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-dashed border-slate-200 space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-medium">₹{cartTotal}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Taxes (5% GST)</span>
              <span className="font-medium">₹{taxes.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-100 mt-2">
              <span>Total</span>
              <span className="text-primary">₹{toPay.toFixed(2)}</span>
            </div>
          </div>
        </section>

        {/* Payment Method */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-primary/10">
          <h2 className="font-bold text-lg mb-4 text-slate-900">Payment Method</h2>
          <div className="space-y-3">
            <button
              onClick={() => setPaymentMethod('upi')}
              className={clsx(
                "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                paymentMethod === 'upi' 
                  ? "border-primary bg-primary/5" 
                  : "border-slate-100 hover:border-primary/30"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  paymentMethod === 'upi' ? "bg-primary/20 text-primary" : "bg-slate-100 text-slate-500"
                )}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="font-semibold text-slate-900">UPI (GPay / PhonePe)</span>
              </div>
              {paymentMethod === 'upi' ? (
                <CheckCircle2 className="w-6 h-6 text-primary" />
              ) : (
                <Circle className="w-6 h-6 text-slate-300" />
              )}
            </button>

            <button
              onClick={() => setPaymentMethod('cash')}
              className={clsx(
                "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                paymentMethod === 'cash' 
                  ? "border-primary bg-primary/5" 
                  : "border-slate-100 hover:border-primary/30"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  paymentMethod === 'cash' ? "bg-primary/20 text-primary" : "bg-slate-100 text-slate-500"
                )}>
                  <Banknote className="w-5 h-5" />
                </div>
                <span className="font-semibold text-slate-900">Cash Payment</span>
              </div>
              {paymentMethod === 'cash' ? (
                <CheckCircle2 className="w-6 h-6 text-primary" />
              ) : (
                <Circle className="w-6 h-6 text-slate-300" />
              )}
            </button>
          </div>
        </section>
      </main>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-slate-500 font-medium">Total to pay</p>
            <p className="text-xl font-bold text-slate-900">₹{toPay.toFixed(2)}</p>
          </div>
          <button 
            onClick={handlePlaceOrder}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transition-all flex-[2] text-center"
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
}
