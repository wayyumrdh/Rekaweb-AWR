import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/login', { email, password });
      
      // 💡 Pastikan backend merespons objek token dengan sukses
      if (response.data.token) {
        
        // ====================================================================
        // 💡 STRUKTUR BARU: Menyimpan Token tanpa merusak pembacaan Dashboard
        // ====================================================================
        const dataSimpan = {
          message: "Login berhasil!",
          token: response.data.token, // 🔑 Paspor Token JWT Baru
          user: response.data.user    // Berisi id, name, email, role
        };

        localStorage.setItem('user_pshub', JSON.stringify(dataSimpan));
        
        console.log("Login Sukses, Token & Sesi disimpan:", dataSimpan);
        // Gantilah baris navigate('/dashboard') dengan logika branching ini:
        if (response.data.user.role === 'admin') {
          navigate('/admin/dashboard'); // ➔ Jika role admin, lempar ke Command Center
        } else {
          navigate('/dashboard');      // ➔ Jika customer, lempar ke dashboard biasa
        }
      }
    } catch (err) {
      console.error("Login Error:", err);
      alert(err.response?.data?.error || "Login Gagal! Periksa email/password atau koneksi backend.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
      <form onSubmit={handleLogin} className="bg-[#0f1115] p-8 rounded-[2rem] border border-white/5 w-full max-w-md shadow-2xl shadow-blue-500/5">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">
            PS<span className="text-blue-500">HUB</span>
          </h2>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] mt-2 font-bold">Gamer Authentication</p>
        </div>
        
        <div className="space-y-4">
          <div className="group">
            <input 
              type="email" placeholder="Email Address" 
              className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="group">
            <input 
              type="password" placeholder="Password" 
              className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button className="w-full bg-blue-600 p-4 rounded-2xl font-black uppercase italic hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-95 text-sm tracking-widest mt-4">
            Sign In
          </button>
        </div>

        <p className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-8">
          Belum bergabung? <span onClick={() => navigate('/register')} className="text-blue-500 cursor-pointer hover:underline">Register Akun</span>
        </p>
      </form>
    </div>
  );
};

export default Login;