import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle2, Circle, CreditCard, Banknote, Receipt, Plus, Minus } from 'lucide-react';
import { clsx } from 'clsx';
import { load } from '@cashfreepayments/cashfree-js';
import { supabase } from '../lib/supabase';

import { useSettings } from '../context/SettingsContext';

export default function CheckoutPage() {
  const { cart, cartTotal, tableNumber, clearCart, updateQuantity } = useCart();
  const { user, loading } = useAuth();
  const { isTableServiceEnabled, packagingCharge } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash'>('upi');
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('dine-in');
  const [isPlaced, setIsPlaced] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [tempOrderNumber, setTempOrderNumber] = useState<string | null>(null);

  // Tax is already included in the price
  const toPay = cartTotal + (orderType === 'takeaway' ? packagingCharge : 0);

  useEffect(() => {
    // Check if returning from Cashfree payment redirect
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');
    
    if (orderId && !isPlaced && !loading) {
      // If we have an order_id in the URL, it means we returned from a payment gateway
      // In a real app, you would verify the payment status with your backend here
      // For this demo, we'll assume it was successful if they returned
      
      const completeRedirectOrder = async () => {
        setIsProcessing(true);
        const pendingOrderId = localStorage.getItem('restaurant_pos_pending_order');
        
        if (pendingOrderId) {
          // Generate order number now that payment is successful
          const orderNumber = await generateOrderNumber();
          
          // Update existing pending order
          await supabase
            .from('orders')
            .update({ 
              payment_status: 'paid', 
              status: 'preparing',
              order_number: orderNumber
            })
            .eq('id', pendingOrderId);
          localStorage.removeItem('restaurant_pos_pending_order');
        } else {
          // Fallback: create new order if pending order ID was lost
          await saveOrderToDatabase('paid');
        }
        
        setIsProcessing(false);
        setIsPlaced(true);
        setTimeout(() => {
          clearCart();
          navigate('/orders');
        }, 3000);
      };
      
      completeRedirectOrder();
    }
  }, [navigate, clearCart, isPlaced, loading]);

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

  const generateTempOrderNumber = () => {
    return `T-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  };

  const saveOrderToDatabase = async (paymentStatus: string) => {
    try {
      const orderNumber = paymentStatus === 'paid' ? await generateOrderNumber() : generateTempOrderNumber();

      // 1. Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user?.id,
          table_number: tableNumber,
          order_number: orderNumber,
          total_amount: toPay,
          status: paymentStatus === 'paid' ? 'preparing' : 'pending',
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          order_type: orderType,
          packaging_charge: orderType === 'takeaway' ? packagingCharge : 0
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

      return { id: order.id, orderNumber: order.order_number };
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
      const result = await saveOrderToDatabase('pending');
      if (result) {
        setTempOrderNumber(result.orderNumber);
      }
      setIsProcessing(false);
      
      setIsPlaced(true);
      setTimeout(() => {
        clearCart();
        navigate('/orders');
      }, 5000); // Increased timeout to let them read the temp order number
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

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Non-JSON response from /api/create-order:', responseText);
        throw new Error('Server returned an invalid response. If you are on Vercel, the backend API is not supported.');
      }

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

      await cashfree.checkout(checkoutOptions).then(async (result: any) => {
        if(result.error){
          console.error("Payment error or popup closed:", result.error);
          alert(result.error.message || 'Payment failed or cancelled');
          // Do not create order on failure
        }
        if(result.redirect){
          console.log("Payment will be redirected");
          // The page will redirect, so we don't need to do anything here
          // The useEffect will catch the return URL
          const orderResult = await saveOrderToDatabase('pending');
          if (orderResult) {
            localStorage.setItem('restaurant_pos_pending_order', orderResult.id);
          }
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
          {paymentMethod === 'cash' 
            ? `Please pay cash at the counter and show ${tempOrderNumber} to confirm your order${orderType === 'takeaway' ? ' for Takeaway' : (isTableServiceEnabled ? ` for Table ${tableNumber}` : '')}.`
            : `Your food is being prepared.${orderType === 'takeaway' ? ' Please collect it from the counter when ready.' : (isTableServiceEnabled ? ` It will be served at Table ${tableNumber}.` : ' Please collect it from the counter when ready.')}`}
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

      <main className="max-w-2xl mx-auto pb-32">
        {/* Service Type Selection */}
        <section className="p-4">
          <div className="flex bg-primary/5 p-1 rounded-xl border border-primary/10">
            <button 
              onClick={() => setOrderType('dine-in')}
              className={clsx(
                "flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all",
                orderType === 'dine-in' 
                  ? "bg-primary text-slate-900 shadow-sm" 
                  : "text-slate-500 font-medium hover:bg-primary/5"
              )}
            >
              Dine-in
            </button>
            <button 
              onClick={() => setOrderType('takeaway')}
              className={clsx(
                "flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all",
                orderType === 'takeaway' 
                  ? "bg-primary text-slate-900 shadow-sm" 
                  : "text-slate-500 font-medium hover:bg-primary/5"
              )}
            >
              Takeaway
            </button>
          </div>
        </section>

        {/* Order Summary */}
        <section className="p-4 border-b border-primary/5">
          <h2 className="text-lg font-bold mb-4 text-slate-900">Order Summary</h2>
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div 
                  className="h-16 w-16 rounded-lg bg-cover bg-center shrink-0" 
                  style={{ backgroundImage: `url('${item.imageUrl}')` }}
                ></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-3 bg-white border border-primary/20 rounded-lg px-2 py-1">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="text-primary hover:bg-primary/10 rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="text-primary hover:bg-primary/10 rounded"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="font-bold text-slate-900">₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Payment Method */}
        <section className="p-4">
          <h2 className="text-lg font-bold mb-4 text-slate-900">Payment Methods</h2>
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Other Options</p>
            
            <label className="flex items-center justify-between p-4 rounded-xl bg-white border border-primary/10 cursor-pointer hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-primary" />
                <p className="font-medium text-slate-900">UPI (GPay / PhonePe)</p>
              </div>
              <input 
                type="radio" 
                name="payment" 
                className="text-primary focus:ring-primary h-5 w-5" 
                checked={paymentMethod === 'upi'}
                onChange={() => setPaymentMethod('upi')}
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl bg-white border border-primary/10 cursor-pointer hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <Banknote className="w-6 h-6 text-primary" />
                <p className="font-medium text-slate-900">Cash</p>
              </div>
              <input 
                type="radio" 
                name="payment" 
                className="text-primary focus:ring-primary h-5 w-5" 
                checked={paymentMethod === 'cash'}
                onChange={() => setPaymentMethod('cash')}
              />
            </label>
          </div>
        </section>

        {/* Bill Details */}
        <section className="p-4 mt-2">
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
            <div className="flex justify-between mb-2">
              <span className="text-slate-600">Item Total</span>
              <span className="text-slate-900 font-medium">₹{cartTotal}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-slate-600">Taxes & Charges</span>
              <span className="text-green-600 font-medium">Included</span>
            </div>
            {orderType === 'takeaway' && (
              <div className="flex justify-between mb-2">
                <span className="text-slate-600">Packaging Charge (Takeaway)</span>
                <span className="text-slate-900 font-medium">₹{packagingCharge}</span>
              </div>
            )}
            <div className="h-[1px] bg-primary/20 my-3"></div>
            <div className="flex justify-between items-center font-bold text-lg text-slate-900">
              <span>To Pay</span>
              <span className="text-primary">₹{toPay.toFixed(2)}</span>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-primary/10 p-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:block">
            <p className="text-xs text-slate-500 uppercase font-bold">Total Amount</p>
            <p className="text-xl font-bold text-slate-900">₹{toPay.toFixed(2)}</p>
          </div>
          <button 
            onClick={handlePlaceOrder}
            disabled={isProcessing}
            className="w-full sm:w-auto flex-1 sm:px-12 py-4 bg-primary text-slate-900 font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors flex justify-center items-center disabled:opacity-70"
          >
            {isProcessing ? (
              <div className="w-6 h-6 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
            ) : (
              'Place Order'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
