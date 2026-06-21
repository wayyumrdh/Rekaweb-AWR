import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TimerCard from './TimerCard';
import { 
  CalendarDays, 
  UtensilsCrossed, 
  Clock, 
  Monitor, 
  LogOut,
  Zap,
  Gamepad2,
  ChevronRight // 💡 Ini kuncinya yang bikin layar hitam kalau ketinggalan!
} from 'lucide-react';

const DashboardUser = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [activeBookings, setActiveBookings] = useState([]);

  const fetchMyBooking = async (userId) => {
    if (!userId) return;
    try {
      const savedData = localStorage.getItem('user_pshub');
      const token = savedData ? JSON.parse(savedData).token : null;

      const response = await axios.get(`http://localhost:5000/api/my-booking/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setActiveBookings(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Gagal menarik data sewa aktif:", err);
    }
  };

  useEffect(() => {
    const savedData = localStorage.getItem('user_pshub');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed && parsed.user) {
          setUserData(parsed.user);
          
          if (parsed.user.id) {
            fetchMyBooking(parsed.user.id);
          }
        }
      } catch (e) {
        console.error("Gagal memuat data login dari localStorage:", e);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);
  
  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari PSHUB?")) {
      localStorage.removeItem('user_pshub');
      navigate('/login');
    }
  };

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-[#060608] text-white p-4 sm:p-6 md:p-8 font-sans relative overflow-x-hidden selection:bg-blue-500/30 flex justify-center">
      
      {/* 🌌 AMBIENT LIGHTS EFFECT (Efek Pendaran Cahaya Bioskop) */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-blue-600/[0.04] rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-purple-600/[0.04] rounded-full blur-[120px] pointer-events-none"></div>

      {/* Pembungkus Utama Konten Agar Simetris Di Tengah Layar PC */}
      <div className="w-full max-w-5xl relative z-10 space-y-8">
        
        {/* 👤 1. GAMER IDENTITY CARD */}
        <div className="bg-gradient-to-r from-[#0d0d14] to-[#0a0a0f] border border-white/[0.04] rounded-3xl p-5 md:p-6 flex justify-between items-center shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-white/[0.02] to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
          
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl border border-blue-500/20 flex items-center justify-center bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                <span className="font-black text-base md:text-lg text-blue-400 font-mono">
                  {userData.name ? userData.name[0].toUpperCase() : 'G'}
                </span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#060608] rounded-full animate-pulse"></span>
            </div>
            <div>
              <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md w-max mb-1">
                <Zap size={10} className="text-blue-400 fill-blue-400" />
                <span className="text-[8px] font-black uppercase tracking-widest text-blue-400">ONLINE MEMBER</span>
              </div>
              <h2 className="text-lg md:text-xl font-black tracking-tight uppercase text-white font-mono flex items-center gap-2">
                {userData.name?.split(' ')[0]} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-sans italic font-normal lowercase tracking-normal">gamer</span>
              </h2>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-red-500/5 hover:bg-red-500/20 border border-red-500/10 flex items-center justify-center text-red-400 transition-all active:scale-95 shadow-md"
            title="Sign Out Session"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* 🎮 2. ACTIVE SESSION TRACKER */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 flex items-center gap-2 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> LOG SESI AKTIF
          </p>
          
          <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar w-full">
            {activeBookings.length > 0 ? (
              activeBookings.map((booking) => (
                <div key={booking.id} className="flex-shrink-0 w-full max-w-sm">
                  <TimerCard 
                    booking={booking} 
                    onFinish={() => fetchMyBooking(userData.id)} 
                  />
                </div>
              ))
            ) : (
              <div className="w-full py-10 text-center border border-dashed border-white/[0.03] rounded-3xl bg-[#09090d]/40 flex flex-col items-center justify-center gap-2">
                <Gamepad2 size={24} className="text-slate-700" />
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest font-mono">NO ACTIVE SESSION DETECTED</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 🧭 3. NAVIGATION HUB (RE-ENGINEERED BENTO GRID) */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 px-1">KONSOL LAYANAN PSHUB</p>
          
          {/* Grid responsif: 1 kolom di HP, 2 kolom di tablet/PC untuk menjaga kesimetrisan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* CARD 1: BOOKING SEWA */}
            <button 
              onClick={() => navigate('/booking')}
              className="bg-[#0b0b10] border border-white/[0.03] p-5 rounded-2xl flex items-center justify-between h-24 transition-all hover:border-blue-500/30 hover:bg-[#0f0f17] hover:shadow-[0_0_30px_rgba(59,130,246,0.05)] group active:scale-[0.99] w-full text-left"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-3.5 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300 border border-blue-500/10 flex-shrink-0">
                  <CalendarDays className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-black tracking-wide uppercase text-white leading-none">BOOKING RENTAL</h4>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-1.5 group-hover:text-blue-300 transition-colors truncate">Sewa unit PS reguler & lesehan</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </button>

            {/* CARD 2: RESERVASI PRIVATE ROOM */}
            <button 
              onClick={() => navigate('/reservasi')}
              className="bg-[#0b0b10] border border-white/[0.03] p-5 rounded-2xl flex items-center justify-between h-24 transition-all hover:border-yellow-500/30 hover:bg-[#121210] hover:shadow-[0_0_30px_rgba(234,179,8,0.05)] group active:scale-[0.99] w-full text-left"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-3.5 bg-yellow-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300 border border-yellow-500/10 flex-shrink-0">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-black tracking-wide uppercase text-white leading-none">RESERVASI ROOM</h4>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-1.5 group-hover:text-yellow-300 transition-colors truncate">Booking bilik kamar VIP privat</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </button>

            {/* CARD 3: PESAN SNACK */}
            <button 
              onClick={() => navigate('/menu')}
              className="bg-[#0b0b10] border border-white/[0.03] p-5 rounded-2xl flex items-center justify-between h-24 transition-all hover:border-purple-500/30 hover:bg-[#110e17] hover:shadow-[0_0_30px_rgba(168,85,247,0.05)] group active:scale-[0.99] w-full text-left"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-3.5 bg-purple-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300 border border-purple-500/10 flex-shrink-0">
                  <UtensilsCrossed className="w-5 h-5 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-black tracking-wide uppercase text-white leading-none">PESAN SNACK & MINUMAN</h4>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-1.5 group-hover:text-purple-300 transition-colors truncate">Katalog makanan pendamping mabar</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </button>

            {/* CARD 4: STATUS UNIT PS */}
            <button 
              onClick={() => navigate('/units')}
              className="bg-[#0b0b10] border border-white/[0.03] p-5 rounded-2xl flex items-center justify-between h-24 transition-all hover:border-red-500/30 hover:bg-[#170e10] hover:shadow-[0_0_30px_rgba(239,68,68,0.05)] group active:scale-[0.99] w-full text-left"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-3.5 bg-red-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300 border border-red-500/10 flex-shrink-0">
                  <Monitor className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-black tracking-wide uppercase text-white leading-none">STATUS UNIT PS</h4>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-1.5 group-hover:text-red-300 transition-colors truncate">Cek ketersediaan konsol secara live</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-red-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardUser;