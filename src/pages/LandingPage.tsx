import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Utensils, ArrowRight, QrCode, CreditCard, Leaf, MapPin } from 'lucide-react';

export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTableNumber, tableNumber } = useCart();

  useEffect(() => {
    const table = searchParams.get('table');
    if (table) {
      setTableNumber(table);
    }
  }, [searchParams, setTableNumber]);

  return (
    <div className="min-h-screen bg-background-light font-display text-slate-900 overflow-hidden relative">
      {/* Subtle Background Pattern/Image */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none">
        <img 
          className="w-full h-full object-cover filter blur-sm" 
          alt="Blurred overhead shot of delicious gourmet food" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2rMlScbJC-hTWE1BGe2AEPSVg3xSAiXRGA0hyy6oRau7pGtvFcvv7rcVfgzyihGwQZlruY2U2sKfeSYgiK2lQ9fvSBXWb0kZIQnwZhzDLaO1VUmAfcvi1Nbo9K2Lar3OJTGXI2FICmYkWuAq9sj48VMbYAjBk_nYYJcs5SspDDukR4LMsY3Odvatixun6zbBTrhmUi75BBDH4ys2EJklrzxf7mL5lw2ZZ8PaLqhHv_k5uw3K35L4vJdE9v4uzzUfQW_DU2uNmnNQ"
        />
      </div>

      {/* Main Content Container */}
      <main className="relative z-10 flex flex-col items-center justify-between min-h-screen p-8 text-center">
        {/* Header Section */}
        <div className="mt-12 space-y-4">
          <div className="flex items-center justify-center bg-primary/10 w-20 h-20 rounded-full mx-auto mb-6">
            <Utensils className="text-primary w-10 h-10" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Restaurant POS
          </h1>
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-900/5 border border-slate-200">
            <MapPin className="text-primary w-4 h-4 mr-2" />
            <span className="text-sm font-semibold uppercase tracking-widest text-slate-600">
              Table {tableNumber || '??'}
            </span>
          </div>
        </div>

        {/* Center Message */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-1 bg-primary rounded-full mb-8"></div>
          <h2 className="text-5xl font-bold leading-tight max-w-xs mx-auto">
            Scan.<br/>Order.<br/>Enjoy.
          </h2>
          <p className="mt-6 text-lg text-slate-500 max-w-xs">
            Welcome to a contactless dining experience. Fresh ingredients, served fast.
          </p>
        </div>

        {/* Footer / Action Area */}
        <div className="w-full max-w-sm mb-12 space-y-6">
          <button 
            onClick={() => navigate('/menu')}
            className="group relative w-full bg-primary hover:bg-primary/90 text-slate-900 font-bold py-5 px-8 rounded-xl shadow-xl shadow-primary/20 transition-all duration-300 transform active:scale-95 flex items-center justify-center overflow-hidden"
          >
            <span className="relative z-10 text-xl tracking-wide uppercase">Start Ordering</span>
            <ArrowRight className="ml-2 relative z-10 transition-transform group-hover:translate-x-1 w-6 h-6" />
          </button>
          
          <div className="flex items-center justify-center gap-8 pt-4">
            <div className="flex flex-col items-center opacity-60">
              <QrCode className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium uppercase">QR Ready</span>
            </div>
            <div className="w-px h-8 bg-slate-300"></div>
            <div className="flex flex-col items-center opacity-60">
              <CreditCard className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium uppercase">Fast Pay</span>
            </div>
            <div className="w-px h-8 bg-slate-300"></div>
            <div className="flex flex-col items-center opacity-60">
              <Leaf className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium uppercase">Eco Choice</span>
            </div>
          </div>
        </div>
      </main>

      {/* Decorative Elements */}
      <div className="fixed -bottom-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
}
