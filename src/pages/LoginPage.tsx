import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/menu';

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { error } = await signIn(phone);
      if (error) throw error;
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { error } = await verifyOtp(phone, otp);
      if (error) throw error;
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light overflow-x-hidden font-display">
      {/* Top Navigation */}
      <div className="flex items-center bg-transparent p-4 pb-2 justify-between">
        <div 
          onClick={() => navigate(-1)}
          className="text-slate-900 flex size-12 shrink-0 items-center cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6" />
        </div>
        <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-[-0.015em] flex-1">Restaurant POS</h2>
      </div>

      {/* Main Content Container */}
      <div className="flex flex-col flex-1 px-4 max-w-[480px] mx-auto w-full">
        {/* Hero Image / Visual Element */}
        <div className="mt-8 mb-4">
          <div className="w-full h-48 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
            <img 
              alt="Delicious food platter" 
              className="w-full h-full object-cover opacity-90" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBiO7WzWbLnHn6ePUARvIhTu8_o4Iv4TT2rEdkPiD9Dr_VgELFIqU288TGji85QCWKoPeNkPkuY1-WghxKK2_t183SZYvit24J4ipAujFLq5N1fqsfX-U2dugAdItxy6eV44td1nzatoZHfS2r1nhZDHpAUVaWOZyHIY-8ZPn-FMxQ5V97JQ0hBshrcbOjs8Dfl5gy64Ej4lYy-SnHuP_TNWQFv9I7Z9dkm6nQG1ro46oNvvNFNqicBP-46NdvPdPzDZSsSfkKpkOA"
            />
          </div>
        </div>

        {/* Header Section */}
        <div className="pb-3 pt-6">
          <h1 className="text-slate-900 tracking-tight text-[32px] font-bold leading-tight">
            {step === 'phone' ? 'Login to place order' : 'Verify your number'}
          </h1>
          <p className="text-slate-600 text-base mt-2">
            {step === 'phone' 
              ? 'Enter your phone number to receive a verification code' 
              : `We sent a 6-digit code to +91 ${phone}`}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-2">
            {error}
          </div>
        )}

        {/* Form Section */}
        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4 py-3">
            <div className="flex flex-col w-full">
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-slate-800 text-sm font-semibold leading-normal pb-2 px-1">Phone Number</p>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-500 font-medium">+91</span>
                  <input 
                    className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-slate-900 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-200 bg-white h-14 placeholder:text-slate-400 pl-14 pr-4 text-base font-medium leading-normal transition-all" 
                    placeholder="123 456 7890" 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                  />
                </div>
              </label>
            </div>
            <div className="flex py-2">
              <button 
                type="submit"
                disabled={loading || phone.length < 10}
                className="flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                <span className="truncate">{loading ? 'Sending...' : 'Send OTP'}</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4 py-3">
            <div className="flex flex-col w-full">
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-slate-800 text-sm font-semibold leading-normal pb-2 px-1">6-Digit OTP</p>
                <div className="relative flex items-center">
                  <input 
                    className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-slate-900 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-200 bg-white h-14 placeholder:text-slate-400 px-4 text-center tracking-[0.5em] text-lg font-bold leading-normal transition-all" 
                    placeholder="------" 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                  />
                </div>
              </label>
            </div>
            <div className="flex flex-col gap-3 py-2">
              <button 
                type="submit"
                disabled={loading || otp.length < 6}
                className="flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                <span className="truncate">{loading ? 'Verifying...' : 'Verify & Continue'}</span>
              </button>
              <button 
                type="button"
                onClick={() => setStep('phone')}
                className="flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-5 bg-transparent text-slate-500 text-base font-semibold leading-normal tracking-[0.015em] hover:bg-slate-100 transition-colors"
              >
                <span className="truncate">Change Phone Number</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer Section */}
        <div className="mt-auto py-8">
          <p className="text-slate-500 text-sm font-normal leading-normal text-center">
            By continuing, you agree to our{' '}
            <a className="text-primary font-semibold hover:underline" href="#">Terms of Service</a>{' '}
            and{' '}
            <a className="text-primary font-semibold hover:underline" href="#">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
