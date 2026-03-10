import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, MoreVertical, Calendar, Menu as MenuIcon, Receipt, Table, User } from 'lucide-react';
import { clsx } from 'clsx';
import { supabase } from '../lib/supabase';

interface OrderItem {
  id: string;
  quantity: number;
  price_at_time: number;
  menu_items: {
    name: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
}

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'All' | 'Ongoing' | 'Completed'>('All');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }

    async function fetchOrders() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            total_amount,
            status,
            created_at,
            order_items (
              id,
              quantity,
              price_at_time,
              menu_items (
                name
              )
            )
          `)
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [user, navigate]);

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Ongoing') return ['pending', 'preparing'].includes(order.status);
    if (activeTab === 'Completed') return ['served', 'completed', 'cancelled'].includes(order.status);
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getItemsSummary = (items: OrderItem[]) => {
    if (!items || items.length === 0) return 'No items';
    const summary = items.map(item => `${item.quantity}x ${item.menu_items?.name || 'Item'}`).join(', ');
    return summary.length > 40 ? summary.substring(0, 37) + '...' : summary;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'served':
        return 'text-primary';
      case 'cancelled':
        return 'text-red-500';
      default:
        return 'text-orange-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
      case 'served':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'preparing':
        return 'Preparing';
      default:
        return 'In Progress';
    }
  };

  return (
    <div className="bg-background-light font-display text-slate-900 min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center bg-white p-4 pb-2 justify-between sticky top-0 z-10 border-b border-slate-100">
        <div 
          onClick={() => navigate('/menu')}
          className="text-slate-900 flex size-10 shrink-0 items-center justify-center cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6" />
        </div>
        <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center">Orders History</h2>
        <div className="flex w-10 items-center justify-end">
          {/* Empty div for balance */}
        </div>
      </div>

      {/* Tabs */}
      <div className="pb-3 bg-white">
        <div className="flex border-b border-slate-100 px-4 gap-8">
          {['All', 'Ongoing', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={clsx(
                "flex flex-col items-center justify-center pb-3 pt-4 transition-colors",
                activeTab === tab 
                  ? "border-b-[3px] border-primary text-primary" 
                  : "border-b-[3px] border-transparent text-slate-500"
              )}
            >
              <p className="text-sm font-bold">{tab}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 pb-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No orders found.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div 
              key={order.id} 
              onClick={() => navigate(`/orders/${order.id}`)}
              className={clsx(
                "flex flex-col items-stretch justify-start rounded-xl shadow-sm border border-slate-100 bg-white overflow-hidden cursor-pointer transition-transform active:scale-[0.98]",
                order.status === 'cancelled' && "opacity-80"
              )}
            >
              <div className="flex w-full flex-col items-stretch justify-center gap-2 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className={clsx("text-xs font-bold uppercase tracking-wider", getStatusColor(order.status))}>
                      {getStatusText(order.status)}
                    </p>
                    <p className="text-slate-900 text-lg font-bold leading-tight">Order {order.order_number || `#${order.id.substring(0, 4).toUpperCase()}`}</p>
                  </div>
                  <MoreVertical className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-slate-500 text-sm flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(order.created_at)}
                  </p>
                  <p className="text-slate-600 text-sm mt-1">{getItemsSummary(order.order_items)}</p>
                </div>
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-50">
                  <p className="text-slate-900 font-bold text-lg">₹{order.total_amount}</p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/orders/${order.id}`);
                    }}
                    className={clsx(
                      "flex min-w-[100px] cursor-pointer items-center justify-center rounded-lg h-9 px-4 text-sm font-bold transition-opacity hover:opacity-90",
                      order.status === 'cancelled' 
                        ? "bg-slate-100 text-slate-600" 
                        : "bg-primary text-white"
                    )}
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
