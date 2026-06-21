import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/register', formData);
      alert(response.data.message || "Registrasi Berhasil!");
      navigate('/login');
    } catch (err) {
      console.error("Register Error:", err);
      alert(err.response?.data?.error || "Registrasi Gagal! Periksa koneksi backend.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
      <form 
        onSubmit={handleRegister} 
        className="bg-[#0f1115] p-8 rounded-[2rem] border border-white/5 w-full max-w-md shadow-2xl shadow-blue-500/5"
      >
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">
            JOIN <span className="text-blue-500">PSHUB</span>
          </h2>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] mt-2 font-bold">
            Create Gamer Account
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="group">
            <input 
              type="text" 
              placeholder="Full Name" 
              className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="group">
            <input 
              type="email" 
              placeholder="Email Address" 
              className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className="group">
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>
          
          <button className="w-full bg-blue-600 p-4 rounded-2xl font-black uppercase italic hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-95 text-sm tracking-widest mt-4">
            Create Account
          </button>
        </div>

        <p className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-8">
          Sudah punya akun?{' '}
          <span 
            onClick={() => navigate('/login')} 
            className="text-blue-500 cursor-pointer hover:underline"
          >
            Login di sini
          </span>
        </p>
      </form>
    </div>
  );
};

export default Register;