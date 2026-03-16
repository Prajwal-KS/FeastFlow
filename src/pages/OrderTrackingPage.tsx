import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Check, Clock, Utensils, Receipt, Menu as MenuIcon, Table, User } from 'lucide-react';
import { clsx } from 'clsx';
import { supabase } from '../lib/supabase';

interface OrderItem {
  id: string;
  quantity: number;
  price_at_time: number;
  menu_items: {
    name: string;
    image_url: string;
    description: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  table_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  order_type?: 'dine-in' | 'takeaway';
  order_items: OrderItem[];
}

import { useSettings } from '../context/SettingsContext';

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const { isTableServiceEnabled } = useSettings();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }

    async function fetchOrder() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            table_number,
            total_amount,
            status,
            payment_status,
            created_at,
            order_type,
            order_items (
              id,
              quantity,
              price_at_time,
              menu_items (
                name,
                image_url,
                description
              )
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrder();
  }, [id, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background-light flex flex-col items-center justify-center p-6">
        <Receipt className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
        <button 
          onClick={() => navigate('/orders')}
          className="mt-4 bg-primary text-white px-6 py-2 rounded-lg font-bold"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'COMPLETED';
      case 'served':
        return 'SERVED';
      case 'cancelled':
        return 'CANCELLED';
      case 'preparing':
        return 'PREPARING';
      case 'ready':
        return 'READY';
      default:
        return 'IN PROGRESS';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  return (
    <div className="bg-background-light font-display text-slate-900 min-h-screen flex flex-col">
      {/* Header Navigation */}
      <header className="flex items-center bg-white p-4 sticky top-0 z-10 border-b border-primary/10">
        <button 
          onClick={() => navigate('/orders')}
          className="size-10 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-primary" />
        </button>
        <h1 className="text-lg font-bold flex-1 text-center pr-10">Order Tracking</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {/* Order Identification Card */}
        <div className="m-4 p-6 bg-white rounded-xl shadow-sm border border-primary/5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {`Order ${order.order_number || `#${order.id.substring(0, 4).toUpperCase()}`}`}
              </h2>
              {order.order_type === 'takeaway' ? (
                <p className="text-primary font-medium">Takeaway</p>
              ) : isTableServiceEnabled ? (
                <p className="text-primary font-medium">Table {order.table_number || 'N/A'}</p>
              ) : null}
            </div>
            <div className={clsx(
              "px-3 py-1 rounded-full",
              order.status === 'cancelled' ? "bg-red-100" : "bg-primary/10"
            )}>
              <span className={clsx(
                "text-xs font-bold uppercase tracking-wider",
                order.status === 'cancelled' ? "text-red-600" : "text-primary"
              )}>
                {getStatusText(order.status)}
              </span>
            </div>
          </div>
          
          {['pending', 'preparing'].includes(order.status) && (
            <div className="flex items-center gap-3 p-3 bg-background-light rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-slate-500">Estimated Waiting Time</p>
                <p className="text-sm font-semibold">
                  {order.payment_status === 'pending'
                    ? "Awaiting Confirmation" 
                    : "10-15 minutes"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status Timeline */}
        <div className="px-6 py-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-8">Live Updates</h3>
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-200"></div>
            
            {/* Steps */}
            <div className="space-y-12">
              
              {/* Step 1: Order Received */}
              <div className="relative flex items-start gap-6">
                <div className={clsx(
                  "relative z-10 size-10 rounded-full flex items-center justify-center ring-4 ring-white",
                  ['pending', 'preparing', 'served', 'completed'].includes(order.status) 
                    ? "bg-primary text-white" 
                    : "bg-slate-200 text-slate-400"
                )}>
                  <Check className="w-5 h-5" />
                </div>
                <div className="flex-1 pt-1">
                  <h4 className={clsx(
                    "font-bold",
                    ['pending', 'preparing', 'served', 'completed'].includes(order.status) ? "text-slate-900" : "text-slate-400"
                  )}>Order Received</h4>
                  <p className="text-sm text-slate-500">
                    {order.payment_status === 'pending'
                      ? "Your order has been placed. Please pay cash at the counter to confirm."
                      : "Your order has been confirmed and sent to the kitchen."}
                  </p>
                  <span className="text-[10px] font-medium text-slate-400 mt-1 block">{formatTime(order.created_at)}</span>
                </div>
              </div>

              {/* Step 2: Preparing */}
              <div className="relative flex items-start gap-6">
                <div className={clsx(
                  "relative z-10 size-10 rounded-full flex items-center justify-center ring-4 ring-white",
                  order.status === 'preparing' ? "bg-primary text-white animate-pulse" : 
                  ['served', 'completed'].includes(order.status) ? "bg-primary text-white" : "bg-slate-200 text-slate-400"
                )}>
                  <Utensils className="w-5 h-5" />
                </div>
                <div className="flex-1 pt-1">
                  <h4 className={clsx(
                    "font-bold",
                    order.status === 'preparing' ? "text-primary" : 
                    ['served', 'completed'].includes(order.status) ? "text-slate-900" : "text-slate-400"
                  )}>Preparing</h4>
                  <p className="text-sm text-slate-600">The chef is currently crafting your delicious meal.</p>
                  
                  {order.status === 'preparing' && (
                    <div className="mt-3 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full w-1/2 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Ready for Pickup / Served */}
              <div className="relative flex items-start gap-6">
                <div className={clsx(
                  "relative z-10 size-10 rounded-full flex items-center justify-center ring-4 ring-white",
                  ['served', 'completed'].includes(order.status) ? "bg-primary text-white" : "bg-slate-200 text-slate-400"
                )}>
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="flex-1 pt-1">
                  <h4 className={clsx(
                    "font-bold",
                    ['served', 'completed'].includes(order.status) ? "text-slate-900" : "text-slate-400"
                  )}>Ready / Served</h4>
                  <p className="text-sm text-slate-400">We'll notify you as soon as your order is served.</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Order Summary Preview */}
        <div className="m-4 mt-8 p-4 border-t border-slate-200">
          <h3 className="font-bold mb-4">Items in this order</h3>
          <div className="space-y-4">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="size-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                  <img 
                    className="w-full h-full object-cover" 
                    alt={item.menu_items?.name} 
                    src={item.menu_items?.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop'}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium text-sm">{item.menu_items?.name}</p>
                    <p className="text-sm text-slate-500">x{item.quantity}</p>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{item.menu_items?.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
