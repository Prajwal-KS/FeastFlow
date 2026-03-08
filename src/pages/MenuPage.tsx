import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { menuItems, categories, MenuItem } from '../data/menu';
import { Menu, Search, ShoppingBasket, Plus, Minus, ArrowRight, X, User, ClipboardList, LogOut } from 'lucide-react';
import { clsx } from 'clsx';

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('All Items');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const { cart, addToCart, updateQuantity, cartTotal, cartCount, tableNumber } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === 'All Items' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getQuantity = (itemId: string) => {
    return cart.find((i) => i.id === itemId)?.quantity || 0;
  };

  return (
    <div className="min-h-screen bg-background-light font-display text-slate-900 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background-light/95 backdrop-blur-md border-b border-primary/20">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="font-bold text-lg leading-tight uppercase tracking-wider">Restaurant POS</h1>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <span className="material-icons text-[14px]">table_restaurant</span>
                <span>Table #{tableNumber || '??'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isSearchOpen) setSearchQuery('');
              }}
              className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                isSearchOpen ? "bg-primary text-white" : "bg-primary/10 text-primary"
              )}
            >
              {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        {isSearchOpen && (
          <div className="px-4 pb-3 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for dishes..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        )}
      </header>

      {/* Side Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] animate-in fade-in duration-200"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Side Drawer */}
      <div className={clsx(
        "fixed top-0 left-0 bottom-0 w-3/4 max-w-sm bg-background-light shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col",
        isDrawerOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-primary/10 flex items-center justify-between">
          <h2 className="font-bold text-xl uppercase tracking-wider">Restaurant POS</h2>
          <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          {user ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Logged In</p>
                  <p className="text-sm text-slate-500">{user.email?.replace('@restaurantpos.local', '') || 'User'}</p>
                </div>
              </div>
              
              <nav className="space-y-2">
                <button className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white border border-transparent hover:border-primary/10 text-slate-700 font-medium transition-all">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  My Orders
                </button>
                <button className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white border border-transparent hover:border-primary/10 text-slate-700 font-medium transition-all">
                  <User className="w-5 h-5 text-primary" />
                  Profile
                </button>
              </nav>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/10">
                  <User className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 mb-6 font-medium">Login to track your orders and save preferences.</p>
                <button 
                  onClick={() => {
                    setIsDrawerOpen(false);
                    navigate('/login');
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all"
                >
                  Login Now
                </button>
              </div>
            </div>
          )}
        </div>
        
        {user && (
          <div className="p-6 border-t border-primary/10">
            <button 
              onClick={async () => {
                await signOut();
                setIsDrawerOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-red-600 hover:bg-red-50 font-bold transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        )}
      </div>

      <main>
        {/* Hero */}
        <div className="relative h-48 w-full overflow-hidden mb-6">
          <img
            className="w-full h-full object-cover"
            alt="Gourmet Indian plating"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJ4RufeyBruyU-hLkUbxtxE8dwxHAY_Enir62gbRJuY6tlANiyRz8Swdq0IoO5ivxvLY6uAs8klvwc2WGbQiztlWh8R5Rc1Ne2x8NsMdfcJEfkHkmhjBRO3u6kiGEFukD_Gg4KVzar3tfxE4GrJZVijjb-69J9lDtI3CZxCax0ttP_9DpkeiN2TYIiONz8eGzlGikWWWMNwg1Ym3SSwvJ_9JXpTyepvDdfKpSlMdluruDxnr1biQmERWcvQ4V2H56so5Iw8y72xEui"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
            <div>
              <span className="bg-primary text-slate-900 px-2 py-1 rounded text-xs font-bold uppercase tracking-tighter mb-2 inline-block">
                Chef's Special
              </span>
              <h2 className="text-2xl font-bold text-white">Traditional Flavors, Modern Twist</h2>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="px-4 mb-8">
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={clsx(
                  "whitespace-nowrap px-5 py-2 rounded-full font-semibold transition-colors",
                  activeCategory === cat
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "bg-white text-slate-700 hover:bg-primary/10 border border-primary/20"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <section className="px-4 space-y-8">
          <div>
            <h3 className="text-xl font-bold mb-4 border-l-4 border-primary pl-3">
              {searchQuery ? 'Search Results' : (activeCategory === 'All Items' ? 'Menu' : activeCategory)}
            </h3>
            
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No items found matching your criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredItems.map((item) => (
                  <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm border border-primary/10 flex gap-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <img className="w-full h-full object-cover" alt={item.name} src={item.imageUrl} />
                    </div>
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-lg leading-tight mb-1">{item.name}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-primary font-bold">₹{item.price}</span>
                        
                        {getQuantity(item.id) > 0 ? (
                          <div className="flex items-center bg-primary/10 rounded-lg overflow-hidden border border-primary/30">
                            <button 
                              onClick={() => updateQuantity(item.id, getQuantity(item.id) - 1)}
                              className="px-2 py-1.5 text-primary hover:bg-primary/20 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-2 font-bold text-sm text-slate-900 min-w-[24px] text-center">
                              {getQuantity(item.id)}
                            </span>
                            <button 
                              onClick={() => updateQuantity(item.id, getQuantity(item.id) + 1)}
                              className="px-2 py-1.5 text-primary hover:bg-primary/20 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => addToCart(item)}
                            className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm shadow-primary/20"
                          >
                            <Plus className="w-3 h-3" /> ADD
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Sticky Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 z-30 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="max-w-md mx-auto bg-slate-900 text-white rounded-xl shadow-2xl p-3 flex items-center justify-between ring-1 ring-primary/20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBasket className="w-6 h-6 text-primary" />
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              </div>
              <div>
                <p className="text-[10px] opacity-70 leading-none mb-0.5 uppercase tracking-wider">Your Selection</p>
                <p className="font-bold text-base leading-none">₹{cartTotal}</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/checkout')}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              VIEW CART <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
