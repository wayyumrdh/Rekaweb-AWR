import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Tv, Sofa, Lock, CheckCircle2, Crown, Loader2 } from 'lucide-react';
import axios from 'axios';

const Reservation = () => {
  const navigate = useNavigate();
  const [roomStats, setRoomStats] = useState({});
  const [loading, setLoading] = useState(true);

  // 1. Fetch Status Ketersediaan Ruangan dari Database + Integrasi JWT
  const fetchRoomStatus = async () => {
    setLoading(true);
    try {
      // 💡 PERBAIKAN UTAMA: Ambil token JWT aktif dari localStorage
      const savedData = localStorage.getItem('user_pshub');
      const token = savedData ? JSON.parse(savedData).token : null;

      // 💡 JABAT TANGAN AXIOS: Kirim request bersama Headers Authorization Bearer Token
      const response = await axios.get(`https://rekaweb-awr-production.up.railway.app/api/units`, {
        headers: {
          Authorization: `Bearer ${token}` // 🔑 Paspor pembuka keamanan backend
        }
      });
      
      const data = response.data;

      // Mengelompokkan total stok berdasarkan tipe generasi PS dan tipe layanannya
      const stats = data.reduce((acc, unit) => {
        const nameParts = unit.nama_unit.toUpperCase().trim();
        let key = "";
        
        // INTEGRASI SAKTI: Mendeteksi string nama baik menggunakan spasi maupun tanpa spasi
        if (nameParts.includes("PS 5") || nameParts.includes("PS5")) {
          key = "PS 5 AREA";
        } else if (nameParts.includes("PS 4") || nameParts.includes("PS4")) {
          key = "PS 4 AREA";
        } else if (nameParts.includes("PS 3") || nameParts.includes("PS3")) {
          key = "PS 3 AREA";
        } else if (nameParts.includes("PS 2") || nameParts.includes("PS2")) {
          key = "PS 2 AREA";
        }

        if (key) {
          if (!acc[key]) acc[key] = { Standard: 0, VIP: 0 };
          
          const jenisUnit = unit.jenis ? unit.jenis.toLowerCase() : "";

          // HARMONISASI BAHASA DB: Toleransi penuh untuk penulisan bahasa Indonesia/Inggris
          if (jenisUnit.includes("standar") || jenisUnit.includes("standard")) { 
            acc[key].Standard += parseInt(unit.stok_tersedia, 10) || 0;
          } else if (jenisUnit.includes("vip")) {
            acc[key].VIP += parseInt(unit.stok_tersedia, 10) || 0;
          }
        }
        return acc;
      }, {});

      console.log("🔥 Hasil Akhir Sinkronisasi Desk Ruangan PSHUB:", stats);
      setRoomStats(stats);
    } catch (err) {
      console.error("Gagal melakukan kalkulasi ketersediaan unit:", err);
      
      // Keamanan Tambahan: Jika token tidak valid/expired (401/403), tendang ke login
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('user_pshub');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomStatus();
  }, []);

  const reservationAreas = [
    {
      id: 'ps5-area',
      title: 'PS 5 AREA',
      features: ['Full AC', 'Sofa Bed', 'TV 4K 50"', 'DualSense Edge'],
      color: 'from-purple-600 to-indigo-800',
      glow: 'shadow-purple-500/20',
      icon: <Crown className="w-6 h-6" />
    },
    {
      id: 'ps4-area',
      title: 'PS 4 AREA',
      features: ['Full AC', 'Private Area', 'TV 1080p', 'Snack Tray'],
      color: 'from-blue-600 to-cyan-800',
      glow: 'shadow-blue-500/20',
      icon: <Tv className="w-6 h-6" />
    },
    {
      id: 'ps3-area',
      title: 'PS 3 AREA',
      features: ['Fan Cooling', 'Classic Vibe', 'Nostalgia Pack'],
      color: 'from-red-600 to-rose-800',
      glow: 'shadow-red-500/20',
      icon: <Sofa className="w-6 h-6" />
    },
    {
      id: 'ps2-area',
      title: 'PS 2 AREA',
      features: ['Retro Corner', 'Classic Joysticks'],
      color: 'from-yellow-500 to-orange-700',
      glow: 'shadow-yellow-500/20',
      icon: <Lock className="w-6 h-6" />
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Checking Availability...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 md:p-10 font-sans relative overflow-hidden">
      {/* Efek Gradasi Latar Belakang */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2"></div>

      <div className="w-full mb-12 relative z-10">
        <button 
          onClick={() => navigate('/dashboard')}
          className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:border-blue-600 transition-all group mb-8 shadow-xl"
        >
          <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
        </button>

        <div className="text-left">
          <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-none mb-4">
            PRIVATE <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">GAMING ROOM</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-[2px] w-20 bg-blue-500"></div>
            <p className="text-slate-500 text-[10px] md:text-sm font-bold uppercase tracking-[0.4em]">
              Premium experience with ultimate comfort
            </p>
          </div>
        </div>
      </div>

      {/* Grid Iterasi Tampilan Area Sewa */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 w-full relative z-10">
        {reservationAreas.map((area) => {
          const areaKey = area.title; 
          const stats = roomStats[areaKey] || { Standard: 0, VIP: 0 };
          const isFull = stats.Standard === 0 && stats.VIP === 0;

          return (
            <div 
              key={area.id}
              className={`bg-[#16181d] border border-white/5 rounded-[3.5rem] p-10 relative overflow-hidden group hover:border-white/20 transition-all duration-500 ${area.glow} hover:shadow-2xl flex flex-col justify-between min-h-[500px]`}
            >
              <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${area.color} opacity-5 blur-[100px] group-hover:opacity-20 transition-opacity`}></div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-3 group-hover:text-blue-500 transition-colors">{area.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${!isFull ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${!isFull ? 'text-green-500' : 'text-red-500'}`}>
                        {isFull ? 'FULL BOOKED' : 'ROOMS AVAILABLE'}
                      </span>
                    </div>
                  </div>
                  <div className="text-white/10 group-hover:text-blue-500/40 transition-colors">
                    {area.icon}
                  </div>
                </div>

                {/* Indikator Angka Ketersediaan Kamar */}
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Standard Room</span>
                    <span className={`text-xl font-black italic ${stats.Standard > 0 ? 'text-white' : 'text-slate-800'}`}>
                      {stats.Standard} Ready
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">VIP Premium</span>
                    <span className={`text-xl font-black italic ${stats.VIP > 0 ? 'text-blue-500' : 'text-slate-800'}`}>
                      {stats.VIP > 0 ? `${stats.VIP} Ready` : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-10">
                  {area.features.map((feat, idx) => (
                    <span key={idx} className="px-4 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-tighter text-slate-400 group-hover:text-white group-hover:border-blue-500/30 transition-all">
                      {feat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Akses Tombol Navigasi Menuju Form Ruangan */}
              <button 
                onClick={() => navigate('/room-booking', { state: { areaName: area.title } })}
                disabled={isFull}
                className={`w-full py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all active:scale-95 flex items-center justify-center gap-3 relative z-10 shadow-2xl ${
                  !isFull 
                  ? `bg-gradient-to-r ${area.color} text-white hover:brightness-125` 
                  : 'bg-[#0a0a0c] text-slate-800 border border-white/5 cursor-not-allowed opacity-50'
                }`}
              >
                {!isFull ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    SELECT AREA
                  </>
                ) : (
                  'UNAVAILABLE'
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Reservation;