import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Tv, ArrowLeft, RefreshCw, Gamepad2, LayoutDashboard, 
  Server, Bell, Users, AlertTriangle, Clock, Plus 
} from 'lucide-react';
import axios from 'axios';

const Monitoring = () => {
  const navigate = useNavigate();
  const savedData = localStorage.getItem('user_pshub');
  const token = savedData ? JSON.parse(savedData).token : null;

  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('id-ID'));
  
  const [showExtModal, setShowExtModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [extHours, setExtHours] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('id-ID'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchMonitoringData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [unitRes, rentalRes] = await Promise.all([
        axios.get(`https://rekaweb-awr-production.up.railway.app/api/units`, config),
        axios.get(`https://rekaweb-awr-production.up.railway.app/api/active-rentals`, config)
      ]);

      const unitsData = unitRes.data || [];
      const activeRentals = rentalRes.data || [];

      const cleanKey = (text) => {
        if (!text) return "";
        let t = text.toUpperCase().replace(/\s+/g, '');
        if (t.includes("PLAYSTATION")) t = t.replace("PLAYSTATION", "PS"); 
        if (t.includes("AREA")) t = t.replace("AREA", ""); 
        return t;
      };

      // 🎯 INISIALISASI STRUKTUR AREA ANTI-TAMPILAN NYASAR
      const baseGrouped = {
        'PS5': { name: 'PLAYSTATION 5 AREA', items: [] },
        'PS4': { name: 'PLAYSTATION 4 AREA', items: [] },
        'PS3': { name: 'PLAYSTATION 3 AREA', items: [] },
        'PS2': { name: 'PLAYSTATION 2 AREA', items: [] }
      };

      // Buat penampung dinamis jika ada nama unit kustom di database skripsimu
      unitsData.forEach(u => {
        const areaKey = cleanKey(u.nama_unit);
        if (areaKey && !baseGrouped[areaKey]) {
          baseGrouped[areaKey] = { name: `${u.nama_unit.toUpperCase()} AREA`, items: [] };
        }
      });

      // Object untuk menyimpan transaksi aktif yang dikelompokkan berdasarkan unitId
      const rentalMapByUnit = {};

      activeRentals.forEach((rent) => {
        if (rent.status === 'finished' || rent.status === 'rejected') return;
        if (rent.unitId) {
          if (!rentalMapByUnit[rent.unitId]) {
            rentalMapByUnit[rent.unitId] = [];
          }
          rentalMapByUnit[rent.unitId].push(rent);
        }
      });

      // 🎯 RE-STRUCTURE LOOPING: Render bilik berdasarkan total kapasitas inventaris riil
// 🎯 RE-STRUCTURE LOOPING: Render bilik berdasarkan kapasitas inventaris riil yang akurat
      Object.keys(baseGrouped).forEach(key => {
        baseGrouped[key].items = [];
      });

      unitsData.forEach(item => {
        const areaKey = cleanKey(item.nama_unit);
        if (!baseGrouped[areaKey]) return;

        const jenisUnit = (item.jenis || "standar").toLowerCase();
        const prefix = jenisUnit.includes("vip") ? "VIP" : "STD";
        const totalStok = parseInt(item.stok_tersedia, 10) || 0;
        const defaultStatus = item.status === 'maintenance' ? 'maintenance' : 'free';

        // Ambil daftar transaksi aktif khusus untuk perangkat/varian unit ini
        const activeTransactionsForThisUnit = rentalMapByUnit[item.id] || [];
        
        // 🏁 Variabel penanda untuk menghitung jumlah slot yang benar-benar terpakai (Occupied / Booking)
        let totalSlotTerpakaiRiil = 0;

        // 1. Render dulu slot-slot yang sedang terpakai bermain (Occupied / Booking)
        activeTransactionsForThisUnit.forEach((rent) => {
          const slotNumber = String(baseGrouped[areaKey].items.length + 1).padStart(2, '0');
          
          const jenisUnitDB = rent.jenis || item.jenis || "standar";
          const isVIP = jenisUnitDB.toLowerCase().includes("vip");
          const cardPrefix = isVIP ? "VIP" : "STD";

          const customerName = rent.namaLengkap || rent.nama_player || rent.nama_penyewa || 'GAMER';

          let currentStatus = 'occupied';
          let startTimeInfo = null;
          let remainingTimeInfo = null;

          const statusDariDB = String(rent.status).toLowerCase();

          // ⚡ Sinkronisasi string status agar fleksibel membaca data pending/booked dari backend baru
          if (!rent.waktu_mulai || !rent.waktu_selesai || statusDariDB === 'pending' || statusDariDB === 'booked' || statusDariDB === 'booking') {
            currentStatus = 'booking';
            if (rent.waktu_mulai) {
              startTimeInfo = new Date(rent.waktu_mulai).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
          } else {
            const now = new Date().getTime();
            const endRent = new Date(rent.waktu_selesai).getTime();
            const diffMs = endRent - now;

            if (diffMs > 0) {
              const diffHrs = Math.floor(diffMs / 3600000);
              const diffMins = Math.floor((diffMs % 3600000) / 60000);
              const diffSecs = Math.floor((diffMs % 60000) / 1000);
              remainingTimeInfo = `${String(diffHrs).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}:${String(diffSecs).padStart(2, '0')} Sisa`;
              currentStatus = 'occupied';
            } else {
              currentStatus = 'free';
            }
          }

          if (currentStatus !== 'free') {
            totalSlotTerpakaiRiil++; // Tambah hitungan jika slot benar-benar terisi visualnya
            baseGrouped[areaKey].items.push({
              id: `RENT-${rent.id}`,
              rentalId: rent.id,
              label: `${cardPrefix} ${slotNumber}`,
              status: currentStatus,
              customer: customerName,
              waktu_mulai: startTimeInfo,
              duration: remainingTimeInfo,
            });
          }
        });

        // 2. Render sisa kapasitas unit yang statusnya benar-benar kosong (FREE)
        // ✅ PERBAIKAN: Sisa slot dihitung dari totalStok dikurangi totalSlotTerpakaiRiil yang valid
        const freeSlotsCount = Math.max(0, totalStok - totalSlotTerpakaiRiil);

        for (let i = 1; i <= freeSlotsCount; i++) {
          const slotNumber = String(baseGrouped[areaKey].items.length + 1).padStart(2, '0');
          baseGrouped[areaKey].items.push({
            id: `FREE-${item.id}-${i}`,
            rentalId: null,
            label: `${prefix} ${slotNumber}`,
            status: defaultStatus,
            customer: null,
            waktu_mulai: null,
            duration: null,
          });
        }
      });
      const finalAreas = Object.values(baseGrouped).filter(area => area.items.length > 0);
      setAreas(finalAreas);
      setLoading(false);
    } catch (err) {
      console.error("🔥 Gagal sinkronisasi data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 1000); 
    return () => clearInterval(interval);
  }, [token]);

  const handleExtendBilling = async (e) => {
    e.preventDefault();
    if (!selectedSlot?.rentalId) return;

    try {
      await axios.put(`https://rekaweb-awr-production.up.railway.app/api/admin/rentals/${selectedSlot.rentalId}/extend`, {
        tambah_jam: parseInt(extHours, 10)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Durasi bermain bilik ${selectedSlot.label} berhasil ditambah ${extHours} Jam!`);
      setShowExtModal(false);
      fetchMonitoringData();
    } catch (err) {
      alert("Gagal memperpanjang durasi billing.");
    }
  };

  const NavItem = ({ name, icon, path, isActive }) => (
    <button 
      onClick={() => navigate(path)}
      className={`w-full flex items-center gap-3 px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-left ${
        isActive ? 'text-white bg-purple-600 shadow-[0_8px_20px_rgba(110,63,222,0.3)]' : 'text-slate-500 hover:text-white hover:bg-white/[0.02]'
      }`}
    >
      {icon} {name}
    </button>
  );

  const getAccentColor = (name) => {
    if (name.includes('5')) return 'bg-purple-500 shadow-[0_0_10px_rgba(147,51,234,0.5)]';
    if (name.includes('4')) return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
    return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-slate-200 font-sans flex">
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0a0a0c] border-r border-white/[0.03] p-8 flex flex-col flex-shrink-0 sticky top-0 h-screen">
        <div className="mb-14 flex items-center gap-3 border-b border-white/[0.03] pb-6">
          <Gamepad2 size={24} className="text-purple-500" />
          <h1 className="text-xl font-black italic tracking-tighter text-white">PSHUB <span className="text-purple-500">ADMIN</span></h1>
        </div>
        <nav className="space-y-3 flex-1">
          <NavItem name="Dashboard" icon={<LayoutDashboard size={18} />} path="/admin/dashboard" />
          <NavItem name="Monitoring" icon={<Tv size={18} />} path="/admin/monitoring" isActive={true} />
          <NavItem name="Unit PS" icon={<Server size={18} />} path="/admin/units" />
          <NavItem name="Aktivitas" icon={<Bell size={18} />} path="/admin/reservasi" />
          <NavItem name="Data User" icon={<Users size={18} />} path="/admin/users" />
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10 lg:p-12 overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-10 border-b border-white/[0.05] pb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="p-3 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl transition-all border border-white/[0.03]">
              <ArrowLeft size={20} className="text-purple-400" />
            </button>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                <Tv size={28} className="text-purple-500 animate-pulse" /> MONITORING LIVE
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">Denah Distribusi Operasional Ruangan Real-Time</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#0a0a0c] border border-white/[0.05] px-4 py-2.5 rounded-xl font-mono text-xs font-bold tracking-widest text-purple-400 shadow-inner">
              {currentTime}
            </div>
            <button onClick={fetchMonitoringData} className="p-3 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl text-slate-400 transition-all border border-white/[0.03]">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-purple-500 font-mono text-xs tracking-widest mt-20 animate-pulse"> sinkronisasi server denah pshub...</div>
        ) : (
          <div className="space-y-12">
            {areas.map((area, areaIdx) => (
              <div key={areaIdx} className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className={`w-1.5 h-5 rounded-full ${getAccentColor(area.name)}`} />
                  <h3 className="text-xs font-black tracking-[0.2em] text-white italic uppercase">{area.name}</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {area.items.map((slot) => {
                    if (slot.status === 'occupied') {
                      return (
                        <div 
                          key={slot.id} 
                          onClick={() => { setSelectedSlot(slot); setShowExtModal(true); }}
                          className="bg-[#240a10] border border-red-500/40 rounded-2xl p-4 flex flex-col justify-between h-28 shadow-lg cursor-pointer transition-all hover:border-red-500 hover:scale-[1.02] group"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-bold text-red-400 tracking-wider block uppercase">{slot.label}</span>
                            <Plus size={12} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <h4 className="text-sm font-black text-white uppercase tracking-wide truncate">{slot.customer}</h4>
                          <span className="text-[9px] font-mono tracking-wider bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/10 text-center">
                            {slot.duration}
                          </span>
                        </div>
                      );
                    }

                    if (slot.status === 'pending_start') {
                      return (
                        <div key={slot.id} className="bg-[#1a1429] border border-purple-500/30 rounded-2xl p-4 flex flex-col justify-between h-28 shadow-md">
                          <span className="text-[9px] font-bold text-purple-400 tracking-wider block uppercase">{slot.label}</span>
                          <h4 className="text-xs font-black text-white uppercase truncate">{slot.customer}</h4>
                          <span className="text-[8px] font-bold bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-center">
                            Mulai Jam {slot.waktu_mulai}
                          </span>
                        </div>
                      );
                    }

                    if (slot.status === 'booking') {
                      return (
                        <div key={slot.id} className="bg-[#0b1b19] border border-teal-500/30 rounded-2xl p-4 flex flex-col justify-between h-28 shadow-md">
                          <span className="text-[9px] font-bold text-teal-400 tracking-wider block uppercase">{slot.label}</span>
                          <h4 className="text-xs font-black text-white uppercase truncate">{slot.customer}</h4>
                          <span className="text-[8px] font-black tracking-widest text-teal-400 uppercase bg-teal-500/10 py-1 rounded text-center border border-teal-500/10">
                            • BOOKED
                          </span>
                        </div>
                      );
                    }

                    if (slot.status === 'maintenance') {
                      return (
                        <div key={slot.id} className="bg-[#1a1105] border border-yellow-600/20 rounded-2xl p-4 flex flex-col justify-between h-28 opacity-40">
                          <span className="text-[9px] font-bold text-yellow-600 block uppercase">{slot.label}</span>
                          <h4 className="text-[10px] font-black text-yellow-600 uppercase flex items-center gap-1 mt-auto"><AlertTriangle size={12} /> REPAIR</h4>
                        </div>
                      );
                    }

                    return (
                      <div key={slot.id} className="bg-[#101014] border border-dashed border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-28">
                        <span className="text-[9px] font-bold text-slate-600 block uppercase">{slot.label}</span>
                        <h4 className="text-xs font-black text-slate-700 italic uppercase mt-auto tracking-widest">KOSONG</h4>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL BILLING EXTENSION */}
      {showExtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121216] w-full max-w-xs rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/[0.05] flex items-center gap-3">
              <Clock size={18} className="text-red-400" />
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Bilik {selectedSlot?.label}</h3>
                <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">User: {selectedSlot?.customer}</p>
              </div>
            </div>
            
            <form onSubmit={handleExtendBilling} className="p-6 space-y-4">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Tambah Durasi Main</label>
                <select 
                  value={extHours} 
                  onChange={(e) => setExtHours(e.target.value)} 
                  className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-purple-500 font-bold text-xs"
                >
                  <option value={1}>+ 1 Jam</option>
                  <option value={2}>+ 2 Jam</option>
                  <option value={3}>+ 3 Jam</option>
                  <option value={5}>+ 5 Jam</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowExtModal(false)} className="flex-1 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest text-slate-400 bg-white/5 hover:bg-white/10 transition-all">Batal</button>
                <button type="submit" className="flex-1 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest text-white bg-red-600 hover:bg-red-500 shadow-lg transition-all">Update Billing</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Monitoring;
