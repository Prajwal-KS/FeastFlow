import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle2, Circle, CreditCard, Banknote, Receipt } from 'lucide-react';
import { clsx } from 'clsx';
import { load } from '@cashfreepayments/cashfree-js';
import { supabase } from '../lib/supabase';

export default function CheckoutPage() {
  const { cart, cartTotal, tableNumber, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash'>('upi');
  const [isPlaced, setIsPlaced] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Tax is already included in the price
  const toPay = cartTotal;

  useEffect(() => {
    // Check if returning from Cashfree payment redirect
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');
    
    if (orderId) {
      // If we have an order_id in the URL, it means we returned from a payment gateway
      // In a real app, you would verify the payment status with your backend here
      // For this demo, we'll assume it was successful if they returned
      setIsPlaced(true);
      setTimeout(() => {
        clearCart();
        navigate('/orders');
      }, 3000);
    }
  }, [navigate, clearCart]);

  const generateOrderNumber = async () => {
    try {
      // Get current date in IST
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(now.getTime() + istOffset);
      
      const startOfDayIST = new Date(istDate);
      startOfDayIST.setUTCHours(0, 0, 0, 0);
      const startOfDayUTC = new Date(startOfDayIST.getTime() - istOffset);

      const endOfDayIST = new Date(istDate);
      endOfDayIST.setUTCHours(23, 59, 59, 999);
      const endOfDayUTC = new Date(endOfDayIST.getTime() - istOffset);

      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfDayUTC.toISOString())
        .lte('created_at', endOfDayUTC.toISOString());

      if (error) throw error;

      const orderNumberCount = (count || 0) + 1;
      return `#${orderNumberCount.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating order number:', error);
      return `#${Math.floor(Math.random() * 9000 + 1000)}`; // Fallback
    }
  };

  const saveOrderToDatabase = async (paymentStatus: string) => {
    try {
      const orderNumber = await generateOrderNumber();

      // 1. Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user?.id,
          table_number: tableNumber,
          order_number: orderNumber,
          total_amount: toPay,
          status: 'pending',
          payment_method: paymentMethod,
          payment_status: paymentStatus
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order.id;
    } catch (error) {
      console.error('Failed to save order to database:', error);
      // We don't throw here to not block the user if the DB isn't set up yet
      return null;
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    
    if (paymentMethod === 'cash') {
      setIsProcessing(true);
      await saveOrderToDatabase('pending');
      setIsProcessing(false);
      
      setIsPlaced(true);
      setTimeout(() => {
        clearCart();
        navigate('/orders');
      }, 3000);
      return;
    }

    try {
      setIsProcessing(true);
      
      // 1. Create order on our backend
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderAmount: toPay,
          customerId: user.id,
          customerPhone: user.phone || '9999999999',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      // 2. Initialize Cashfree SDK
      const cashfree = await load({
        mode: 'sandbox', // Change to 'production' for live environment
      });

      // 3. Open checkout modal
      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        redirectTarget: '_modal',
      };

      cashfree.checkout(checkoutOptions).then(async (result: any) => {
        if(result.error){
          console.error("Payment error or popup closed:", result.error);
          alert(result.error.message || 'Payment failed or cancelled');
          await saveOrderToDatabase('failed');
        }
        if(result.redirect){
          console.log("Payment will be redirected");
          // The page will redirect, so we don't need to do anything here
          // The useEffect will catch the return URL
          await saveOrderToDatabase('pending');
        }
        if(result.paymentDetails){
          console.log("Payment completed:", result.paymentDetails.paymentMessage);
          
          await saveOrderToDatabase('paid');
          
          setIsPlaced(true);
          setTimeout(() => {
            clearCart();
            navigate('/orders');
          }, 3000);
        }
      });

    } catch (error: any) {
      console.error('Payment error:', error);
      alert(error.message || 'Something went wrong while processing payment');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isPlaced) {
    return (
      <div className="min-h-screen bg-background-light flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle2 className="w-24 h-24 text-primary mb-6 animate-bounce" />
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Order Placed!</h1>
        <p className="text-slate-500 mb-8">
          Your food is being prepared. It will be served at Table {tableNumber}.
        </p>
        <p className="text-sm text-primary font-medium animate-pulse">Redirecting to your orders...</p>
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
              <span>Taxes (5% GST included)</span>
              <span className="font-medium text-green-600">Included</span>
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
            disabled={isProcessing}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transition-all flex-[2] text-center disabled:opacity-70 flex justify-center items-center"
          >
            {isProcessing ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Place Order'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
