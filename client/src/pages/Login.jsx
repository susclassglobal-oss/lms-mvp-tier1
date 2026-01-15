import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Ensure the role is lowercase to match server logic (teacher, student, admin)
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

      if (data.success) {
        // SECURE STORAGE
        localStorage.setItem('token', data.token);
        localStorage.setItem('user_role', activeRole);
        
        // Store the full user object (contains staff_id/dept for teachers)
        if (data.user) {
          localStorage.setItem('user_data', JSON.stringify(data.user));
        }

        // ROLE-BASED REDIRECTION
        // Verify these paths match your App.js/Routes
        if (activeRole === 'admin') {
          navigate('/admin-dashboard');
        } else if (activeRole === 'teacher') {
          navigate('/teacher-dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        // This will now show the specific error from your server (e.g., "Incorrect Password")
        setError(data.message || "INVALID CREDENTIALS");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("BACKEND CONNECTION FAILED");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-100 font-sans">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-2xl">
        
        {/* ROLE SELECTOR */}
        <div className="mb-8 flex rounded-2xl bg-slate-100 p-1">
          {['admin', 'teacher', 'student'].map((r) => (
            <button key={r} type="button" onClick={() => setRole(r)}
              className={`flex-1 py-3 text-xs font-black uppercase transition-all ${role === r ? 'bg-white text-emerald-600 shadow-sm rounded-xl' : 'text-slate-400'}`}>
              {r}
            </button>
          ))}
        </div>

        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black uppercase italic">
            {role} <span className="text-emerald-600">Portal</span>
          </h2>
          {error && (
            <p className="mt-4 p-3 bg-red-50 text-red-600 text-[11px] font-black rounded-xl uppercase border border-red-100">
              {error}
            </p>
          )}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Email Address</label>
            <input 
              type="email" 
              required 
              placeholder="name@university.edu" 
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 font-bold outline-none focus:border-emerald-500 transition-colors" 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Secret Password</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••" 
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 font-bold outline-none focus:border-emerald-500 transition-colors" 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full rounded-2xl bg-emerald-600 py-5 font-black text-white shadow-xl hover:bg-emerald-700 transition-all uppercase tracking-widest ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Authenticating...' : 'Enter Classroom'}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Secure Academic Access System
        </p>
      </div>
    </div>
  );
}

export default Login;