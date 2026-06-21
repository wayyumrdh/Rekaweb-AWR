import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, ArrowLeft, RefreshCw, HelpCircle, Bell,
  LayoutDashboard, Tv, Gamepad2, Users, Server, LogOut, ChevronRight
} from 'lucide-react';
import axios from 'axios';

const ReservasiView = () => {
  const navigate = useNavigate();
  const savedData = localStorage.getItem('user_pshub');
  const session = savedData ? JSON.parse(savedData) : null;
  const user = session?.user || null;
  const token = session?.token || null;

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); 
  const [historyList, setHistoryList] = useState([]);
  
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Proteksi hak akses admin
  useEffect(() => {
    if (!session || !user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [navigate]);

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get(`https://rekaweb-awr-production.up.railway.app/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data || []);
      setLoadingUsers(false);
    } catch (err) {
      console.error("Gagal memuat akun:", err);
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (token) fetchAllUsers();
  }, [token]);

  const handleUserClick = async (userObj) => {
    setSelectedUser(userObj);
    setLoadingHistory(true);
    try {
      const res = await axios.get(`https://rekaweb-awr-production.up.railway.app/api/admin/users/${userObj.id}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistoryList(res.data || []);
      setLoadingHistory(false);
    } catch (err) {
      console.error("Gagal memuat riwayat transaksi akun:", err);
      setLoadingHistory(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Keluar dari Command Center PSHUB?")) {
      localStorage.removeItem('user_pshub');
      navigate('/login');
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'finished': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  // 🎯 DAFTAR MENU SIDEBAR UNTUK SINKRONISASI NAVIGASI
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', route: '/admin/dashboard', icon: LayoutDashboard },
    { id: 'monitoring', label: 'Monitoring', route: '/admin/monitoring', icon: Tv },
    { id: 'units', label: 'Unit PS', route: '/admin/units', icon: Server },
    { id: 'reservasi', label: 'Aktivitas', route: '/admin/reservasi', icon: Bell },
    { id: 'users', label: 'Data User', route: '/admin/users', icon: Users }
  ];

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-[#08080a] text-slate-200 font-sans flex overflow-hidden">
      
      {/* 👑 SIDEBAR NAVIGASI INTEGRAL */}
      <aside className="w-72 bg-[#0a0a0c] border-r border-white/[0.03] p-8 flex flex-col flex-shrink-0">
        <div className="mb-14 flex items-center gap-3 border-b border-white/[0.03] pb-6">
          <Gamepad2 size={24} className="text-purple-500" />
          <h1 className="text-xl font-black italic tracking-tighter text-white">PSHUB <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-purple-400">ADMIN</span></h1>
        </div>
        
        <nav className="space-y-3 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === 'reservasi'; // Kunci penanda aktif halaman ini
            
            return (
              <button 
                key={item.id}
                onClick={() => navigate(item.route)}
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

      {/* 👑 MAIN CONTENT AREA */}
      <main className="flex-1 p-10 lg:p-12 overflow-y-auto">
        <div className="mb-10 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white leading-none">MANAJEMEN AKTIVITAS</h2>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] mt-3">Sistem Monitoring PSHUB v1.0</p>
          </div>
        </div>

        {selectedUser ? (
          /* TAMPILAN DETAIL JIKA AKUN DIKLIK */
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-[#101014] border border-white/[0.03] p-8 rounded-3xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.03] pb-6">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => { setSelectedUser(null); setHistoryList([]); }} 
                    className="p-3 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl transition-all border border-white/[0.03] text-purple-400"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <h3 className="text-xl font-black italic text-white uppercase tracking-tight">
                      RIWAYAT {selectedUser.name.toUpperCase()}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-mono">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="bg-purple-600/10 border border-purple-500/20 px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest text-purple-400 self-start sm:self-center">
                  ID MEMBER: #{selectedUser.id}
                </div>
              </div>

              {loadingHistory ? (
                <div className="text-center py-20">
                  <RefreshCw size={24} className="text-purple-500 mx-auto animate-spin mb-3" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Menarik berkas log transaksi...</p>
                </div>
              ) : historyList.length === 0 ? (
                <div className="text-center py-20 bg-[#0d0d11] rounded-2xl border border-white/[0.02] mt-6">
                  <HelpCircle size={40} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Akun ini belum pernah melakukan reservasi apapun.</p>
                </div>
              ) : (
                <div className="overflow-x-auto mt-6">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.03] text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <th className="pb-4 pl-4">Kategori</th>
                        <th className="pb-4">Unit PS</th>
                        <th className="pb-4">Ruangan</th>
                        <th className="pb-4">Waktu Mulai</th>
                        <th className="pb-4">Waktu Selesai</th>
                        <th className="pb-4 pr-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02] text-sm">
                      {historyList.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.01] transition-colors group">
                          <td className="py-4 pl-4 font-black text-xs uppercase tracking-wider text-slate-400">
                            {log.type === 'room' ? (
                              <span className="text-purple-400">❖ Kamar Privat</span>
                            ) : (
                              <span className="text-blue-400">❖ Rental</span>
                            )}
                          </td>
                          <td className="py-4 font-bold text-white uppercase italic">{log.nama_unit}</td>
                          <td className="py-4 font-medium text-slate-400">{log.jenis} Room</td>
                          <td className="py-4 font-mono text-xs text-slate-400">{log.waktu_mulai}</td>
                          <td className="py-4 font-mono text-xs text-slate-400">{log.waktu_selesai}</td>
                          <td className="py-4 pr-4 text-center">
                            <span className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider ${getStatusStyle(log.status)}`}>
                              • {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* TAMPILAN AWAL: DAFTAR AKUN GRID */
          <div className="bg-[#101014] border border-white/[0.03] p-8 rounded-3xl animate-in fade-in duration-300">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Pilih salah satu member di bawah ini untuk menginspeksi riwayat sewa</p>

            {loadingUsers ? (
              <div className="text-center py-20">
                <RefreshCw size={24} className="text-purple-500 mx-auto animate-spin mb-3" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Menghubungkan ke basis data user...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                {users.map((account) => (
                  <div 
                    key={account.id}
                    onClick={() => handleUserClick(account)}
                    className="bg-[#141418] border border-white/[0.03] hover:border-purple-500/40 p-5 rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] hover:bg-[#181820] group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-600/10 group-hover:bg-purple-600 flex items-center justify-center font-black text-purple-400 group-hover:text-white transition-colors border border-purple-500/10">
                        <User size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white group-hover:text-purple-400 transition-colors uppercase text-sm truncate max-w-[140px]">{account.name}</h4>
                        <p className="text-[10px] font-mono text-slate-500 mt-1 truncate max-w-[140px]">{account.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-wider ${
                        account.role === 'admin' ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-blue-500/20 bg-blue-500/10 text-blue-400'
                      }`}>
                        {account.role}
                      </span>
                      <span className="text-[9px] font-bold text-slate-600 uppercase font-mono">#{account.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ReservasiView;