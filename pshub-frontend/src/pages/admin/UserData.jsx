import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, UserPlus, Mail, Calendar, ChevronLeft, 
  Trash2, ShieldCheck, Gamepad2, LayoutDashboard, Tv, 
  Server, Bell, RefreshCw, X
} from 'lucide-react';
import axios from 'axios';

const UserData = () => {
  const navigate = useNavigate();
  const savedData = localStorage.getItem('user_pshub');
  const token = savedData ? JSON.parse(savedData).token : null;
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // 🎯 FORM DATA: Sekarang default role adalah 'user'
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });

  // 1. Ambil Data User Riil dari Database Backend
  const fetchUsers = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`https://rekaweb-awr-production.up.railway.app/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataAmbil = Array.isArray(res.data) ? res.data : [];
      setUsers(dataAmbil);
      setLoading(false);
    } catch (err) {
      console.error("Gagal mengambil data user:", err);
      setLoading(false);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('user_pshub');
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  // 2. Tambah Akun User Baru (Sinkron dengan role 'user')
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`https://rekaweb-awr-production.up.railway.app/register`, formData);
      alert(`Akun Operator/User "${formData.name}" Berhasil Terdaftar!`);
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', role: 'user' }); // Reset ke 'user'
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Gagal mendaftarkan user baru.");
    }
  };

  // 3. Fungsi Mengubah Status/Role User (user ➔ vip ➔ admin ➔ user)
  const handleToggleRole = async (id, currentRole) => {
    const roleSekarang = currentRole ? currentRole.toLowerCase() : 'user';
    let newRole = 'user';
    
    // 🎯 LOGIKA SINKRON: Menggunakan 'user' bukan 'customer'
    if (roleSekarang === 'user') newRole = 'vip';
    else if (roleSekarang === 'vip') newRole = 'admin';
    else if (roleSekarang === 'admin') newRole = 'user';

    if (!window.confirm(`Ubah tingkatan akses user ini menjadi ${newRole.toUpperCase()}?`)) return;

    try {
      await axios.put(`https://rekaweb-awr-production.up.railway.app/api/admin/users/${id}/role`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      console.error("Gagal memperbarui role:", err);
      alert("Gagal mengubah role keanggotaan user!");
    }
  };

  // 4. Fungsi Menghapus Akun User Permanen
  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus user "${name}" secara permanen?`)) return;

    try {
      await axios.delete(`https://rekaweb-awr-production.up.railway.app/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`User "${name}" berhasil dihapus dari sistem.`);
      fetchUsers();
    } catch (err) {
      console.error("Gagal menghapus user:", err);
      alert(err.response?.data?.message || "Gagal menghapus akun user dari database!");
    }
  };

  // 5. Filter Pencarian
  const filteredUsers = users.filter(user => {
    const namaUser = user?.name ? String(user.name).toLowerCase() : '';
    const emailUser = user?.email ? String(user.email).toLowerCase() : '';
    const kataKunci = search.toLowerCase();
    return namaUser.includes(kataKunci) || emailUser.includes(kataKunci);
  });

  const NavItem = ({ name, icon, path, isActive }) => (
    <button 
      onClick={() => navigate(path)}
      className={`w-full flex items-center gap-3 px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-left ${
        isActive 
          ? 'text-white bg-purple-600 shadow-[0_8px_20px_rgba(110,63,222,0.3)]' 
          : 'text-slate-500 hover:text-white hover:bg-white/[0.02]'
      }`}
    >
      {icon} {name}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#08080a] text-slate-200 font-sans flex">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0a0a0c] border-r border-white/[0.03] p-8 flex flex-col flex-shrink-0 sticky top-0 h-screen">
        <div className="mb-14 flex items-center gap-3 border-b border-white/[0.03] pb-6">
          <Gamepad2 size={24} className="text-purple-500" />
          <h1 className="text-xl font-black italic tracking-tighter text-white">
            PSHUB <span className="text-purple-500">ADMIN</span>
          </h1>
        </div>
        <nav className="space-y-3 flex-1">
          <NavItem name="Dashboard" icon={<LayoutDashboard size={18} />} path="/admin/dashboard" />
          <NavItem name="Monitoring" icon={<Tv size={18} />} path="/admin/monitoring" />
          <NavItem name="Unit PS" icon={<Server size={18} />} path="/admin/units" />
          <NavItem name="Aktivitas" icon={<Bell size={18} />} path="/admin/reservasi" />
          <NavItem name="Data User" icon={<Users size={18} />} path="/admin/users" isActive={true} />
        </nav>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 p-10 lg:p-12 overflow-y-auto">
        
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <button 
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 text-purple-400 text-[10px] font-black uppercase tracking-widest mb-4 hover:gap-3 transition-all"
            >
              <ChevronLeft size={14} /> Back to Dashboard
            </button>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white leading-none flex items-center gap-3">
              <Users size={28} className="text-purple-500" /> DATA USER
            </h2>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] mt-3">
              Manajemen Keanggotaan Aktual PSHUB
            </p>
          </div>

          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 flex items-center gap-3 hover:bg-purple-500 transition-all"
          >
            <UserPlus size={16} /> Tambah User Baru
          </button>
        </div>

        {/* Tools & Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Cari berdasarkan nama atau email player..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#101014] border border-white/[0.03] rounded-2xl py-5 pl-14 pr-6 text-sm outline-none focus:border-purple-500/50 transition-all text-slate-200 placeholder-slate-600"
            />
          </div>
          <button 
            onClick={fetchUsers} 
            className="bg-[#101014] border border-white/[0.03] rounded-2xl flex items-center justify-center gap-3 text-slate-400 hover:text-white transition-all font-bold text-xs uppercase tracking-widest py-5"
          >
            <RefreshCw size={18} /> Refresh Data
          </button>
        </div>

        {/* Tabel Data */}
        <div className="bg-[#0e0e12] border border-white/[0.03] rounded-[2.5rem] overflow-hidden shadow-2xl">
          {loading ? (
            <div className="text-center text-purple-500 font-mono text-xs tracking-widest py-20 animate-pulse">
              MENGHUBUNGI DATABASE PSHUB...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-white/[0.02]">
                    <th className="px-10 py-7">User Profile</th>
                    <th className="px-10 py-7">Status / Role</th>
                    <th className="px-10 py-7">Join Date</th>
                    <th className="px-10 py-7 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] font-bold divide-y divide-white/[0.03]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-10 py-12 text-center text-slate-600 italic">
                        Tidak ada data akun user terdaftar di database.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, index) => {
                      // 🎯 DEFAULT BALIKAN: jika kosong langsung gunakan 'user'
                      const lowerRole = u?.role ? String(u.role).toLowerCase() : 'user';
                      const keyAman = u?.id ? u.id : `user-row-${index}`; 
                      
                      return (
                        <tr key={keyAman} className="hover:bg-white/[0.01] transition-colors group">
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center font-black text-purple-400">
                                {u?.name ? String(u.name)[0].toUpperCase() : 'U'}
                              </div>
                              <div>
                                <p className="text-white text-sm font-black tracking-tight">{u?.name || 'No Name'}</p>
                                <p className="text-slate-600 flex items-center gap-1 font-medium italic mt-0.5">
                                  <Mail size={10} /> {u?.email || '-'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-6">
                            <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                              lowerRole === 'vip' 
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                              lowerRole === 'admin' 
                                ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                'bg-blue-500/10 text-blue-400 border-blue-500/20' // Biru mantap untuk role 'user'
                            }`}>
                              {u?.role || 'user'}
                            </span>
                          </td>
                          <td className="px-10 py-6 text-slate-400">
                            <div className="flex items-center gap-2">
                              <Calendar size={12} className="text-slate-600" />
                              {u?.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID', { 
                                day: 'numeric', month: 'short', year: 'numeric' 
                              }) : '-'}
                            </div>
                          </td>
                          <td className="px-10 py-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleToggleRole(u.id, u.role)} 
                                className="p-3 bg-white/5 rounded-xl hover:bg-purple-600 hover:text-white transition-all text-slate-400" 
                                title="Ubah Role"
                              >
                                <ShieldCheck size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(u.id, u.name)} 
                                className="p-3 bg-white/5 rounded-xl hover:bg-red-500 hover:text-white transition-all text-red-500" 
                                title="Hapus User"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="p-8 border-t border-white/[0.03] flex justify-between items-center bg-white/[0.01]">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              Total: {filteredUsers.length} Users Terhubung Aktif
            </p>
          </div>
        </div>
      </main>

      {/* MODAL POP-UP UNTUK INPUT TAMBAH USER BARU */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121216] w-full max-w-md rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 border-b border-white/[0.05] flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">REGISTRASI USER BARU</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Sistem Input Basis Data PSHUB</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nama Lengkap Gamer</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-purple-500 text-xs font-bold" placeholder="Masukkan nama..." />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Alamat Email Aktif</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-purple-500 text-xs font-bold" placeholder="nama@email.com" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Kata Sandi (Password)</label>
                <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-purple-500 text-xs font-bold" placeholder="******" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Otoritas Tingkatan Akses</label>
                {/* 🎯 SELECTION: Menggunakan opsi value="user" */}
                <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-purple-500 appearance-none text-xs font-bold">
                  <option value="user">USER / MEMBER STANDAR</option>
                  <option value="vip">VIP GAMER</option>
                  <option value="admin">ADMIN / OPERATOR</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4 mt-8 border-t border-white/[0.05]">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 bg-white/5 hover:bg-white/10 transition-all">Batal</button>
                <button type="submit" className="flex-1 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest text-white bg-purple-600 hover:bg-purple-500 shadow-lg transition-all">Daftarkan Akun</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserData;