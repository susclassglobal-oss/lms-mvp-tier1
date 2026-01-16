import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const activeRole = role.toLowerCase();
    
    const endpoint = activeRole === 'admin' ? '/api/admin/login' : '/api/login';

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(), 
          password, 
          role: activeRole 
        })
      });
      const data = await response.json();

      if (data.mfaRequired) {
        setShowOtp(true); 
      } else if (data.success) {
        completeAuth(data, activeRole);
      } else {
        setError(data.message || "INVALID CREDENTIALS");
      }
    } catch (err) { 
      console.error(err);
      setError("BACKEND CONNECTION FAILED"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`http://localhost:5000/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(), 
          otp: otp.trim(), 
          role: role.toLowerCase() 
        })
      });
      const data = await res.json();
      
      if (data.success) {
        completeAuth(data, role.toLowerCase());
      } else {
        setError(data.message || "Invalid OTP");
        setOtp(''); // Clear input on failure
      }
    } catch (err) { 
      console.error(err);
      setError("Verification Failed"); 
    } finally { 
      setLoading(false); 
    }
  };

  const completeAuth = (data, activeRole) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user_role', activeRole);
    if (data.user) {
      localStorage.setItem('user_data', JSON.stringify(data.user));
    }
    
    if (activeRole === 'admin') navigate('/admin-dashboard');
    else if (activeRole === 'teacher') navigate('/teacher-dashboard');
    else navigate('/dashboard');
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#F8FAFC] font-sans relative">
      <div className="w-full max-w-md rounded-[2.5rem] bg-white p-12 shadow-2xl border border-slate-100">
        <div className="mb-10 flex rounded-2xl bg-slate-100/80 p-1.5 backdrop-blur-sm">
          {['admin', 'teacher', 'student'].map((r) => (
            <button 
              key={r} 
              type="button" 
              onClick={() => setRole(r)} 
              className={`flex-1 py-2.5 text-[10px] font-black uppercase transition-all duration-300 ${role === r ? 'bg-white text-emerald-600 shadow-md rounded-xl' : 'text-slate-400'}`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="mb-10 text-center">
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-slate-800">
            {role}<span className="text-emerald-500"> </span><span className="text-emerald-600 not-italic lowercase font-medium">portal</span>
          </h2>
          {error && (
            <div className="mt-6 p-3 bg-red-50 text-red-500 text-[10px] font-bold rounded-xl uppercase border border-red-100 animate-shake">
              {error}
            </div>
          )}
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <input 
            type="email" 
            required 
            placeholder="Email Identity" 
            className="w-full rounded-2xl border bg-slate-50/50 p-4 text-sm font-bold outline-none focus:bg-white focus:border-emerald-500 transition-all" 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <input 
            type="password" 
            required 
            placeholder="Access Password" 
            className="w-full rounded-2xl border bg-slate-50/50 p-4 text-sm font-bold outline-none focus:bg-white focus:border-emerald-500 transition-all" 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full rounded-2xl bg-slate-900 py-5 font-black text-white uppercase tracking-widest text-[11px] hover:bg-emerald-600 transition-all disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Authenticate Access'}
          </button>
        </form>
      </div>
      {showOtp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4">
          <div className="w-full max-w-sm rounded-[2.5rem] bg-white p-10 shadow-2xl border border-slate-100 text-center animate-in zoom-in duration-300">
            <h3 className="text-xl font-black uppercase italic tracking-tighter">Enter <span className="text-emerald-500">OTP</span></h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 mb-6 tracking-widest">Verify the code sent to {email}</p>
            
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <input 
                type="text" 
                maxLength="6" 
                required 
                value={otp}
                placeholder="••••••" 
                className="w-full text-center text-3xl tracking-[0.3em] font-black rounded-2xl border-2 border-slate-100 bg-slate-50 p-5 outline-none focus:border-emerald-500" 
                onChange={(e) => setOtp(e.target.value)} 
              />
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full rounded-2xl bg-emerald-600 py-4 font-black text-white text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all"
              >
                {loading ? 'Verifying...' : 'Verify Identity'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowOtp(false)} 
                className="text-[9px] font-black text-slate-400 uppercase tracking-widest block w-full text-center hover:text-slate-600"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;