import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, PlayCircle, Clock, ChevronDown, ShoppingBag, X } from 'lucide-react';
import axios from 'axios';

const UnitList = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [units, setUnits] = useState([]);
  const [activeRentals, setActiveRentals] = useState([]); 
  const [showSchedule, setShowSchedule] = useState(null); 
  const [loading, setLoading] = useState(true);

  // 1. FUNGSI UTAMA: TARIK DATA, KALKULASI FILTER MAINTENANCE, & HITUNG RENTED
  const fetchData = async () => {
    try {
      const savedData = localStorage.getItem('user_pshub');
      const token = savedData ? JSON.parse(savedData).token : null;

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Tarik data Unit dan Rental Aktif secara paralel
      const [unitRes, rentalRes] = await Promise.all([
        axios.get(`https://rekaweb-awr-production.up.railway.app/api/units`, config),
        axios.get(`https://rekaweb-awr-production.up.railway.app/api/active-rentals`, config)
      ]);

      const dataRaw = unitRes.data || [];
      const rentalsRaw = rentalRes.data || [];

      // PROSES MERGE & FILTERING DATA: Gabungkan kartu berdasarkan 2 kata pertama nama unit
      const grouped = dataRaw.reduce((acc, unit) => {
        if (!unit.nama_unit) return acc;
        
        const key = unit.nama_unit.split(' ').slice(0, 2).join(' '); 
        const stokUnit = parseInt(unit.stok_tersedia, 10) || 0;

        if (!acc[key]) {
          acc[key] = { 
            ...unit, 
            nama_display: key, 
            stok_tersedia: unit.status === 'maintenance' ? 0 : stokUnit,
            rented_count: 0,
            harga_termurah: unit.harga_jam,
            harga_hari_tampil: unit.harga_hari
          };
        } else {
          if (unit.status !== 'maintenance') {
            acc[key].stok_tersedia += stokUnit;
          }
          if (unit.harga_jam < acc[key].harga_termurah) acc[key].harga_termurah = unit.harga_jam;
          if (unit.harga_hari < acc[key].harga_hari_tampil) acc[key].harga_hari_tampil = unit.harga_hari;
        }
        return acc;
      }, {});

      // 🎯 PERBAIKAN 1: Filter ketat status 'active' saat menghitung jumlah badge Rented
      if (rentalsRaw && rentalsRaw.length > 0) {
        rentalsRaw.forEach(rent => {
          // Hanya hitung yang statusnya 'active' rill
          if (rent.status?.toLowerCase() !== 'active') return;

          const unitData = rent.Unit || rent.unit || rent;
          const full_name = unitData?.nama_unit || rent.nama_unit || "";
          if (!full_name) return;
          
          const key = full_name.split(' ').slice(0, 2).join(' ');
          
          if (grouped[key]) {
            grouped[key].rented_count += 1;
          }
        });
      }

      setUnits(Object.values(grouped));
      setActiveRentals(rentalsRaw);
      setLoading(false);
    } catch (err) {
      console.error("🔥 Gagal sinkronisasi data katalog user:", err);
      setLoading(false);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('user_pshub');
        navigate('/login');
      }
    }
  };

  // POLLING SYSTEM: Auto-sync data database setiap 5 detik
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getVisual = (name) => {
    if (!name) return { img: '', color: 'from-slate-600 to-slate-700', shadow: 'shadow-black/20' };
    if (name.includes('5')) return { 
      img: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=400',
      color: 'from-purple-600 to-indigo-700', shadow: 'shadow-purple-900/20' 
    };
    if (name.includes('4')) return { 
      img: 'https://carisinyal.com/wp-content/uploads/2020/11/Prosesor.jpg',
      color: 'from-blue-600 to-cyan-700', shadow: 'shadow-blue-900/20' 
    };
    return { 
      img: 'https://carisinyal.com/wp-content/uploads/2020/11/Prosesor.jpg',
      color: 'from-red-600 to-rose-700', shadow: 'shadow-red-900/20' 
    };
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 md:p-12 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* HEADER BAR */}
      <div className="flex items-center justify-between mb-12 max-w-4xl mx-auto relative z-10">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Dashboard
        </button>
        <h1 className="text-xl font-black italic uppercase tracking-tighter">
          UNIT <span className="text-purple-500">CATALOG</span>
        </h1>
      </div>

      {/* LOADING CONTROLLER */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-2">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-mono tracking-widest text-purple-400 uppercase">Menyinkronkan data slot PSHUB...</p>
        </div>
      ) : (
        /* GRID SELEKSI KATALOG KONSOL */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto relative z-10">
          {units.map((unit) => {
            const style = getVisual(unit.nama_display);
            const isSelected = selectedCategory === unit.id;
            const hasStok = unit.stok_tersedia > 0;

            return (
              <div key={unit.id} className="relative group">
                <div 
                  onClick={() => setSelectedCategory(isSelected ? null : unit.id)}
                  className={`bg-[#121215] border rounded-[2.5rem] overflow-hidden cursor-pointer transition-all duration-300 ${
                    hasStok ? 'border-white/5 hover:border-purple-500/30' : 'border-red-500/20 bg-[#161212]'
                  } ${style.shadow} hover:shadow-2xl`}
                >
                  <div className="p-8">
                    <div className="flex gap-6 items-center mb-6">
                      <div className="w-24 h-24 rounded-3xl overflow-hidden bg-[#0a0a0c] border border-white/5 flex-shrink-0">
                        <img src={style.img} alt={unit.nama_display} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                      </div>

                      <div className="flex-1">
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">{unit.nama_display}</h3>
                        
                        <div className="mt-2 space-y-0.5">
                          <p className="text-purple-400 font-black text-sm">
                            Rp {unit.harga_termurah?.toLocaleString('id-ID')} <span className="text-[8px] text-slate-500 uppercase">/ Jam</span>
                          </p>
                          <p className="text-green-400 font-black text-sm">
                            Rp {unit.harga_hari_tampil?.toLocaleString('id-ID')} <span className="text-[8px] text-slate-500 uppercase">/ Hari</span>
                          </p>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                           <span className={`text-[10px] font-bold uppercase tracking-widest ${hasStok ? 'text-slate-400' : 'text-red-400'}`}>
                             {hasStok ? `Tersedia: ${unit.stok_tersedia} Unit` : 'Penuh / Maintenanced'}
                           </span>
                           <ChevronDown className={`w-4 h-4 text-purple-500 transition-transform ${isSelected ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </div>

                    {/* BARIS DATA INDIKATOR STATUS */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white/[0.02] rounded-2xl p-3 border border-white/5 flex flex-col items-center">
                        <CheckCircle2 className={`w-4 h-4 mb-1 ${hasStok ? 'text-[#00ff66]' : 'text-slate-600'}`} />
                        <span className={`text-xl font-black ${hasStok ? 'text-white' : 'text-slate-600'}`}>{unit.stok_tersedia}</span>
                        <span className="text-[7px] font-black uppercase text-slate-500 tracking-tighter">Ready</span>
                      </div>

                      {/* BUTTON RENTED SCHEDULE */}
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setShowSchedule(unit.nama_display); 
                        }}
                        className="bg-purple-500/5 hover:bg-purple-500/10 rounded-2xl p-3 border border-purple-500/10 flex flex-col items-center transition-all group/btn"
                      >
                        <Clock className="w-4 h-4 text-purple-400 mb-1 group-hover/btn:scale-110 transition-transform" />
                        <span className="text-xl font-black text-purple-300">{unit.rented_count}</span>
                        <span className="text-[7px] font-black uppercase text-purple-500 tracking-tighter underline decoration-dotted">Rented</span>
                      </button>

                      <div className="bg-white/[0.02] rounded-2xl p-3 border border-white/5 flex flex-col items-center opacity-40">
                        <PlayCircle className="w-4 h-4 text-yellow-500 mb-1" />
                        <span className="text-xl font-black">0</span>
                        <span className="text-[7px] font-black uppercase text-slate-500 tracking-tighter">Active</span>
                      </div>
                    </div>
                  </div>

                  {/* SLIDE-DOWN BOOKING TRIGGER */}
                  <div className={`px-8 pb-8 transition-all duration-300 ${isSelected ? 'opacity-100 max-h-40' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                    <button 
                      disabled={!hasStok}
                      onClick={(e) => { e.stopPropagation(); navigate('/booking', { state: { selectedUnit: unit } }); }}
                      className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        hasStok 
                          ? `bg-gradient-to-r ${style.color} text-white shadow-lg` 
                          : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      <ShoppingBag size={12} />
                      <span>{hasStok ? `Booking ${unit.nama_display} Sekarang` : 'Unit Tidak Tersedia'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🎯 MODAL JADWAL ESTIMASI (SELEKSI KETAT STATUS ACTIVE ONLY) */}
      {showSchedule && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowSchedule(null)}
        >
          <div 
            className="bg-[#121215] border border-white/10 w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-1 border-b border-white/[0.03] pb-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <div>
                    <h4 className="text-base font-black italic uppercase text-white tracking-tight">STATUS AKTIF: {showSchedule}</h4>
                    <p className="text-[9px] text-purple-400 uppercase font-bold tracking-widest mt-0.5">Estimasi Waktu Selesai Sewa</p>
                  </div>
                </div>
                <button onClick={() => setShowSchedule(null)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 mt-4 custom-scrollbar">
                {activeRentals && activeRentals.filter(r => {
                  // 🎯 PERBAIKAN 2: Saring modal agar data berstatus 'active' saja yang lolos filter
                  if (r.status?.toLowerCase() !== 'active') return false;
                  
                  const unitData = r.Unit || r.unit || r;
                  const nameStr = unitData?.nama_unit || r.nama_unit || "";
                  return nameStr.toUpperCase().includes(showSchedule.toUpperCase());
                }).length > 0 ? (
                  activeRentals
                    .filter(r => {
                      // 🎯 PERBAIKAN 3: Saring juga pada baris eksekusi mapping akhir
                      if (r.status?.toLowerCase() !== 'active') return false;
                      
                      const unitData = r.Unit || r.unit || r;
                      const nameStr = unitData?.nama_unit || r.nama_unit || "";
                      return nameStr.toUpperCase().includes(showSchedule.toUpperCase());
                    })
                    .map((rent, idx) => {
                      const unitData = rent.Unit || rent.unit || rent;
                      
                      let displayTime = "--:--";
                      if (rent.waktu_selesai) {
                        const dateObj = new Date(rent.waktu_selesai);
                        if (isNaN(dateObj.getTime())) {
                          displayTime = rent.waktu_selesai.slice(0, 5);
                        } else {
                          displayTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                        }
                      }

                      return (
                        <div key={idx} className="flex items-center justify-between bg-white/[0.02] p-4 rounded-xl border border-white/[0.03]">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Slot #{idx + 1}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 font-mono">
                              {unitData?.nama_unit || rent.nama_unit} ({unitData?.jenis || 'Reguler'})
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-green-400 font-mono bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-md">
                              {displayTime} WITA
                            </span>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="py-12 text-center bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                      Tidak ada unit varian ini yang sedang aktif
                    </p>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setShowSchedule(null)}
                className="w-full mt-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg shadow-purple-900/20"
              >
                Kembali Ke Katalog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitList;
