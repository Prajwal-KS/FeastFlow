import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Phone, LogOut, CheckCircle2, Menu as MenuIcon, Receipt, Table } from 'lucide-react';
import { clsx } from 'clsx';

export default function ProfilePage() {
  const { user, loading, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState(user?.name || '');
  const [isEditing, setIsEditing] = useState(!user?.name);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  React.useEffect(() => {
    if (user?.name && !name) {
      setName(user.name);
      setIsEditing(false);
    }
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setIsSaving(true);
    const { error } = await updateProfile(name.trim());
    setIsSaving(false);
    
    if (!error) {
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      alert('Failed to update profile');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-background-light"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

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
        <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center">My Profile</h2>
        <div className="flex w-10 items-center justify-end">
          {/* Empty div for balance */}
        </div>
      </div>

      <main className="flex-1 p-4 max-w-md mx-auto w-full">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary/10 mb-6 flex flex-col items-center">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <User className="w-12 h-12 text-primary" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900">
            {user.name || 'Guest User'}
          </h2>
          <p className="text-slate-500 flex items-center gap-2 mt-1">
            <Phone className="w-4 h-4" />
            {user.phone}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary/10 space-y-6">
          <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">Personal Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input 
                type="text" 
                value={user.phone} 
                disabled 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              {isEditing ? (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    autoFocus
                    className="w-full px-4 py-3 bg-white border border-primary/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button 
                    onClick={handleSave}
                    disabled={isSaving || !name.trim()}
                    className="bg-primary text-white px-4 py-3 rounded-xl font-bold disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className={clsx(user.name ? "text-slate-900" : "text-slate-400 italic")}>
                    {user.name || 'Not provided'}
                  </span>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-primary font-semibold text-sm"
                  >
                    Edit
                  </button>
                </div>
              )}
              
              {saveSuccess && (
                <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Profile updated successfully
                </p>
              )}
            </div>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full mt-8 bg-red-50 text-red-600 hover:bg-red-100 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </main>
    </div>
  );
}
