import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Tv, Gamepad2, Users, Bell, Server, 
  LogOut, ChevronRight, MonitorCheck, CheckCircle, XCircle, Clock
} from 'lucide-react';
import axios from 'axios';

// ====================================================================
// 👑 KOMPONEN UTAMA DASHBOARD OPERATOR
// ====================================================================
const AdminDashboard = () => {
  const navigate = useNavigate();
  
  const savedData = localStorage.getItem('user_pshub');
  const session = savedData ? JSON.parse(savedData) : null;
  const user = session?.user || null;
  const token = session?.token || null;

  // State statistik dashboard utama
  const [readyUnits, setReadyUnits] = useState(0);
  const [activeRooms, setActiveRooms] = useState(0);
  const [totalRooms, setTotalRooms] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pendingList, setPendingList] = useState([]);

  // Proteksi hak akses admin
  useEffect(() => {
    if (!session || !user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [navigate]);

  const fetchAdminStats = async () => {
    if (!token) return;
    try {
      const resStats = await axios.get('http://localhost:5000/api/admin/dashboard-summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { availableUnits, roomsActive, roomsTotal } = resStats.data;
      setReadyUnits(availableUnits || 0);
      setActiveRooms(roomsActive || 0);
      setTotalRooms(roomsTotal || 0);

      const resPending = await axios.get('http://localhost:5000/api/admin/pending-reservations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingList(resPending.data);
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAdminStats();
      const interval = setInterval(fetchAdminStats, 10000); 
      return () => clearInterval(interval);
    }
  }, [token, user]);

  const handleAction = async (id, type, action) => {
    const confirmMsg = action === 'accept' ? 'Terima pesanan ini dan mulai waktu rental?' : 'Tolak pesanan ini dan kembalikan stok unit?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await axios.put(`http://localhost:5000/api/admin/reservation/${type}/${id}`, { action }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Pesanan berhasil di-${action === 'accept' ? 'Terima' : 'Tolak'}!`);
      fetchAdminStats(); 
    } catch (err) {
      alert('Gagal memproses pesanan.');
      console.error(err);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Keluar dari Command Center PSHUB?")) {
      localStorage.removeItem('user_pshub');
      navigate('/login');
    }
  };

  if (!user || user.role !== 'admin') return null;
  if (loading) return <div className="min-h-screen bg-[#08080a] flex items-center justify-center text-purple-500 font-mono text-xs tracking-widest">FETCHING COMMAND CENTER...</div>;

  // 🎯 PERBAIKAN 1: Struktur Navigasi Kompak Menggunakan Jalur URL Rill
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', route: '/admin/dashboard', icon: LayoutDashboard },
    { id: 'monitoring', label: 'Monitoring', route: '/admin/monitoring', icon: Tv },
    { id: 'units', label: 'Unit PS', route: '/admin/units', icon: Server },
    { id: 'reservasi', label: 'Aktivitas', route: '/admin/reservasi', icon: Bell },
    { id: 'users', label: 'Data User', route: '/admin/users', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-[#08080a] text-slate-200 font-sans flex overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0a0a0c] border-r border-white/[0.03] p-8 flex flex-col flex-shrink-0">
        <div className="mb-14 flex items-center gap-3 border-b border-white/[0.03] pb-6">
          <Gamepad2 size={24} className="text-purple-500" />
          <h1 className="text-xl font-black italic tracking-tighter text-white">PSHUB <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-purple-400">ADMIN</span></h1>
        </div>
        
        <nav className="space-y-3 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === 'dashboard'; // Murni aktif hanya jika di halaman home dashboard
            
            return (
              <button 
                key={item.id}
                onClick={() => navigate(item.route)} // 🎯 PERBAIKAN 2: Alur pindah rute mutlak menggunakan navigate()
                className={`w-full flex items-center justify-between px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all group ${
                  isActive ? 'bg-purple-600 text-white shadow-[0_8px_20px_rgba(110,63,222,0.3)]' : 'text-slate-500 hover:text-white hover:bg-white/[0.02]' 
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  {item.label}
                </div>
                <ChevronRight size={14} className={`${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`} />
              </button>
            );
          })}
        </nav>
        
        <div className="mt-auto border-t border-white/[0.03] pt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center font-black text-white shadow-lg uppercase">
              {user.name ? user.name[0] : 'A'}
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">{user.name}</p>
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">OPERATOR</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Keluar"><LogOut size={16} /></button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10 lg:p-12 overflow-y-auto">
        <div className="mb-10 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white leading-none">OPERATOR DASHBOARD</h2>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] mt-3">Sistem Monitoring PSHUB v1.0</p>
          </div>
        </div>

        {/* 🎯 PERBAIKAN 3: Menghilangkan seluruh logika blok pengkondisian currentTab */}
        <div className="animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-[#101014] border border-white/[0.03] rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
              <div className="bg-purple-600 px-8 py-5 flex items-center justify-between border-b border-black/[0.1] relative">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/90">RESERVASI MASUK</p>
                {pendingList.length > 0 ? (
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </div>
                ) : <Bell size={18} className="text-white" />}
              </div>
              <div className="bg-[#121216] px-8 py-10 flex items-center justify-between border-t border-black/[0.05]">
                <h4 className="font-black text-sm text-white/80 uppercase tracking-tight transition-all duration-300">
                  {pendingList.length > 0 ? `${pendingList.length} PESANAN MENUNGGU KONFIRMASI` : 'TIDAK ADA RESERVASI BARU'}
                </h4>
              </div>
            </div>

            <div className="bg-[#101014] border border-white/[0.03] rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.2)] cursor-pointer" onClick={() => navigate('/admin/units')}>
              <div className="bg-purple-600 px-8 py-5 flex items-center justify-between border-b border-black/[0.1]">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/90">UNIT MONITOR</p>
                <Server size={18} className="text-white" />
              </div>
              <div className="bg-[#121216] px-8 py-10 flex items-center justify-between border-t border-black/[0.05]">
                <h4 className="font-black text-sm text-white/80 uppercase tracking-tight">{readyUnits} UNIT PS READY DI GUDANG</h4>
              </div>
            </div>
          </div>

          {pendingList.length > 0 && (
            <div className="bg-[#0e0e12] border border-white/[0.05] rounded-[2rem] overflow-hidden mb-12 shadow-2xl">
              <div className="bg-[#1b1230] px-8 py-5 flex items-center border-b border-black/[0.1]">
                <Clock size={18} className="text-purple-400 mr-3" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-300">TINDAKAN DIPERLUKAN ({pendingList.length})</p>
              </div>
              <div className="p-6 divide-y divide-white/[0.03]">
                {pendingList.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-5 px-4 hover:bg-white/[0.02] rounded-xl transition-colors">
                    <div>
                      <h4 className="font-bold text-white uppercase text-sm">{item.nama_penyewa || item.nama_player}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {item.Unit?.nama_unit || 'Unit Tidak Diketahui'} • Tipe: {item.type === 'room' ? 'Kamar Privat' : 'Rental Reguler'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleAction(item.id, item.type, 'reject')} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                        <XCircle size={14} /> TOLAK
                      </button>
                      <button onClick={() => handleAction(item.id, item.type, 'accept')} className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                        <CheckCircle size={14} /> TERIMA
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[#0e0e12] border border-white/[0.03] rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
            <div className="bg-[#141418] p-10 lg:p-14">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
                <div>
                  <h4 className="font-bold text-xl text-white">Status Kamar Privat PSHUB</h4>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">Perbandingan Ruangan Sedang Aktif Bermain</p>
                </div>
                <button onClick={() => navigate('/admin/monitoring')} className="bg-purple-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all flex items-center gap-2">
                  <Tv size={14} /> LIVE MONITOR
                </button>
              </div>
              <div className="text-center bg-[#0d0d11] p-12 lg:p-16 rounded-[2.5rem] border border-white/[0.03] shadow-inner relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-4">
                    <MonitorCheck size={50} className="text-green-500 opacity-60 md:opacity-100" />
                    <h3 className="text-8xl lg:text-9xl font-black italic tracking-tighter text-white/80 group-hover:text-purple-400 transition-transform duration-500 leading-none">
                      {activeRooms}<span className="text-slate-600">/</span><span className="text-3xl lg:text-5xl">{totalRooms}</span>
                    </h3>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500 mt-6 relative z-10">ROOMS CURRENTLY ACTIVE IN DATABASE</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;