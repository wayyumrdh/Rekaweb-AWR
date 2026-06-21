import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Server, 
  ArrowLeft, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Gamepad2, 
  Trash2, 
  Power, 
  AlertTriangle,
  LayoutDashboard, 
  Tv,              
  Bell,            
  Users            
} from 'lucide-react';
import axios from 'axios';

const UnitMonitor = () => {
  const navigate = useNavigate();
  const savedData = localStorage.getItem('user_pshub');
  const token = savedData ? JSON.parse(savedData).token : null;

  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [formData, setFormData] = useState({ 
    nama_unit: '', 
    jenis: 'Standar', 
    stok_tersedia: 1, 
    harga_jam: 0,
    harga_hari: 0
  });

  // 1. FUNGSI TARIK & KELOMPOKKAN DATA UNIT BERDASARKAN NAMA UTAMA
  const fetchUnits = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/units', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Mengelompokkan data berdasarkan Nama Unit (Contoh: "PS5" akan menampung array Varian Standar & VIP)
      const groupedData = response.data.reduce((acc, unit) => {
        const key = unit.nama_unit.replace(/\s+/g, '').toUpperCase(); 
        
        if (!acc[key]) {
          acc[key] = {
            nama_display: unit.nama_unit,
            varian: [unit] // Menyimpan baris unit utuh ke dalam list varian
          };
        } else {
          acc[key].varian.push(unit);
        }
        return acc;
      }, {});

      setUnits(Object.values(groupedData));
      setLoading(false);
    } catch (err) {
      console.error("🔥 Gagal mengambil data unit inventaris:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [token]);

  const NavItem = ({ name, icon, path }) => (
    <button 
      onClick={() => navigate(path)}
      className="w-full flex items-center gap-3 px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/[0.02] transition-all text-left"
    >
      {icon} {name}
    </button>
  );

  // 2. FUNGSI TAMBAH UNIT BARU
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        harga_jam: parseInt(formData.harga_jam, 10),
        harga_hari: formData.harga_hari || (parseInt(formData.harga_jam, 10) * 18),
        stok_tersedia: parseInt(formData.stok_tersedia, 10)
      };

      await axios.post('http://localhost:5000/api/admin/units', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert("Unit baru berhasil didaftarkan ke gudang PSHUB!");
      setShowAddModal(false);
      setFormData({ nama_unit: '', jenis: 'Standar', stok_tersedia: 1, harga_jam: 0, harga_hari: 0 });
      fetchUnits();
    } catch (err) {
      alert("Gagal menambahkan unit baru.");
    }
  };

  // 3. FUNGSI TOGGLE STATUS (Hanya Mengubah 1 ID Unit Tertentu)
  const handleToggleStatus = async (id, currentStatus, jenisUnit) => {
    const isMaintenance = currentStatus === 'maintenance';
    const actionText = isMaintenance ? 'MENGAKTIFKAN KEMBALI' : 'MENONAKTIFKAN (Layanan Pemeliharaan)';
    
    if (!window.confirm(`Apakah Anda yakin ingin ${actionText} varian [${jenisUnit}] ini?`)) return;

    try {
      await axios.put(`http://localhost:5000/api/admin/units/${id}/status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUnits(); 
    } catch (err) {
      alert("Gagal memperbarui status operasional perangkat.");
    }
  };

  // 4. 🎯 SINKRONISASI BARU: FUNGSI HAPUS SATU PER SATU UNIT (BERDASARKAN ID TUNGGAL)
  const handleDeleteSingle = async (id, namaUnit, jenisUnit) => {
    if (!window.confirm(`⚠️ PERINGATAN: Anda yakin ingin MENGHAPUS PERMANEN perangkat ${namaUnit} varian [${jenisUnit}] dari basis data?`)) return;

    try {
      await axios.delete(`http://localhost:5000/api/admin/units/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Varian ${jenisUnit} berhasil dihapus.`);
      fetchUnits();
    } catch (err) {
      alert("Gagal menghapus entitas unit dari gudang.");
    }
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-slate-200 font-sans flex">
      
      {/* SIDEBAR OPERATOR ADMIN */}
      <aside className="w-72 bg-[#0a0a0c] border-r border-white/[0.03] p-8 flex flex-col flex-shrink-0">
        <div className="mb-14 flex items-center gap-3 border-b border-white/[0.03] pb-6">
          <Gamepad2 size={24} className="text-purple-500" />
          <h1 className="text-xl font-black italic tracking-tighter text-white">PSHUB <span className="text-purple-500">ADMIN</span></h1>
        </div>
        <nav className="space-y-3 flex-1">
          <NavItem name="Dashboard" icon={<LayoutDashboard size={18} />} path="/admin/dashboard" />
          <NavItem name="Monitoring" icon={<Tv size={18} />} path="/admin/monitoring" />
          <NavItem name="Unit PS" icon={<Server size={18} />} path="/admin/units" />
          <NavItem name="Aktivitas" icon={<Bell size={18} />} path="/admin/reservasi" />
          <NavItem name="Data User" icon={<Users size={18} />} path="/admin/users" />
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto relative">
        
        {/* HEADER UTAMA */}
        <div className="flex items-center justify-between mb-10 border-b border-white/[0.05] pb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="p-3 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl transition-all">
              <ArrowLeft size={20} className="text-purple-400" />
            </button>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                <Server size={28} className="text-purple-500" /> INVENTARIS UNIT PS
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">Manajemen Kontrol Aset Individual Per Varian</p>
            </div>
          </div>
          
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)]">
            <Plus size={16} /> TAMBAH UNIT
          </button>
        </div>

        {/* RENDERING GRID INVENTARIS */}
        {loading ? (
          <div className="text-center text-purple-500 font-mono text-xs tracking-widest mt-20 animate-pulse">SINKRONISASI DATA GUDANG BERSAMA DATABASE...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {units.map((group, groupIndex) => {
              return (
                <div key={groupIndex} className="bg-[#121215] border border-white/[0.04] rounded-[20px] overflow-hidden shadow-xl flex flex-col transition-all">
                  
                  {/* KARTU HEADER KELOMPOK KONSOL */}
                  <div className="px-6 py-4 flex items-center justify-between border-b bg-[#16161a] border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <Gamepad2 size={18} className="text-purple-500" />
                      <h3 className="font-black text-lg text-white uppercase tracking-wide">{group.nama_display}</h3>
                    </div>
                  </div>

                  {/* KARTU KONTEN - LIST DETAIL SUB-UNIT VARIAN */}
                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      {group.varian.map((v, varIndex) => {
                        const isUnitMaintenance = v.status === 'maintenance';
                        
                        return (
                          <div key={varIndex} className={`p-4 rounded-xl border ${isUnitMaintenance ? 'bg-orange-500/5 border-orange-500/20' : 'bg-[#0a0a0c] border-white/[0.02]'} transition-all`}>
                            
                            {/* Baris Info Atas Varian */}
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-black uppercase text-purple-300 tracking-wider">
                                Varian: {v.jenis}
                              </span>
                              
                              {/* Status Mini Per-Unit */}
                              {isUnitMaintenance ? (
                                <span className="text-[8px] font-bold px-2 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase">
                                  Maint
                                </span>
                              ) : v.stok_tersedia > 0 ? (
                                <span className="text-[8px] font-bold px-2 py-1 rounded bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20 uppercase">
                                  Ready ({v.stok_tersedia})
                                </span>
                              ) : (
                                <span className="text-[8px] font-bold px-2 py-1 rounded bg-red-500/10 text-red-500 border border-red-500/20 uppercase">
                                  Habis
                                </span>
                              )}
                            </div>

                            {/* Detal Harga */}
                            <div className="text-[11px] text-slate-400 font-mono mb-3">
                              Harga/Jam: <span className="text-white">Rp {v.harga_jam?.toLocaleString('id-ID')}</span>
                            </div>

                            {/* Tombol Aksi Mandiri Per Unit */}
                            <div className="flex gap-2">
                              {/* Tombol Maintenance Varian */}
                              <button 
                                onClick={() => handleToggleStatus(v.id, v.status, v.jenis)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                                  isUnitMaintenance 
                                    ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20' 
                                    : 'bg-[#24130a] border-[#ff6b00]/20 text-[#ff8c33] hover:bg-[#ff6b00]/20'
                                }`}
                              >
                                <Power size={11} strokeWidth={2.5} />
                                <span>{isUnitMaintenance ? 'Aktifkan' : 'Maint'}</span>
                              </button>

                              {/* Tombol Hapus Spesifik Varian */}
                              <button 
                                onClick={() => handleDeleteSingle(v.id, group.nama_display, v.jenis)}
                                className="flex items-center justify-center px-3 bg-[#240a10] border border-[#ff0033]/20 text-[#ff3355] rounded-lg hover:bg-[#ff0033]/20 transition-all text-[9px]"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL TAMBAH UNIT BARU */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121216] w-full max-w-md rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/[0.05]">
              <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">REGISTRASI ASET UNIT</h3>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Masukkan detail spesifikasi perangkat baru</p>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nama Unit (Contoh: PS5)</label>
                <input type="text" required value={formData.nama_unit} onChange={(e) => setFormData({...formData, nama_unit: e.target.value})} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-purple-500" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tipe Komparasi</label>
                  <select value={formData.jenis} onChange={(e) => setFormData({...formData, jenis: e.target.value})} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-purple-500 appearance-none">
                    <option value="Standar">Standar</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Jumlah Unit</label>
                  <input type="number" min="1" required value={formData.stok_tersedia} onChange={(e) => setFormData({...formData, stok_tersedia: e.target.value})} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-purple-500" />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tarif per Jam (Rp)</label>
                <input type="number" min="0" required value={formData.harga_jam} onChange={(e) => setFormData({...formData, harga_jam: e.target.value})} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-purple-500" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tarif per Hari (Rp) - Opsional</label>
                <input type="number" min="0" placeholder="Kosongkan untuk auto-kalkulasi" value={formData.harga_hari || ''} onChange={(e) => setFormData({...formData, harga_hari: e.target.value})} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-purple-500" />
              </div>
              
              <div className="flex gap-4 pt-4 mt-8 border-t border-white/[0.05]">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 bg-white/5 hover:bg-white/10 transition-all">Batal</button>
                <button type="submit" className="flex-1 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest text-white bg-purple-600 hover:bg-purple-500 shadow-lg transition-all">Simpan Aset</button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default UnitMonitor;