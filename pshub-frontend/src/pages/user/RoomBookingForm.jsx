import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, User, Clock, Users, Tv, ShieldCheck, Calendar } from 'lucide-react';

const RoomBookingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const selectedArea = location.state?.areaName || 'PS 5 AREA';

  const [formData, setFormData] = useState({
    userId: '', 
    nama: '',
    area_gaming: selectedArea,
    tipe_ruangan: 'Standar',
    jumlah_orang: 1,
    jam_mulai: '',
    durasi_jam: 1,
  });

  useEffect(() => {
    const savedData = localStorage.getItem('user_pshub');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        const userData = parsedData.user; 

        if (userData) {
          setFormData(prev => ({
            ...prev,
            userId: userData.id || '',
            nama: userData.name || userData.nama || ''
          }));
        }
      } catch (err) {
        console.error("Gagal memproses auto-fill data user:", err);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const d = new Date();
    const tahun = d.getFullYear();
    const bulan = String(d.getMonth() + 1).padStart(2, '0'); 
    const hari = String(d.getDate()).padStart(2, '0');
    
    const tanggalHariIni = `${tahun}-${bulan}-${hari}`;
    const waktuMulaiDirencanakan = `${tanggalHariIni} ${formData.jam_mulai}:00`;
    
    // 🎯 SINKRONISASI PAYLOAD FINAL: Menghapus ...formData perusak variabel
    const finalReservationData = {
      userId: parseInt(formData.userId, 10),
      namaLengkap: formData.nama,
      typePs: formData.area_gaming, // Dikirim utuh sebagai "PS 5 AREA", "PS 4 AREA", dll.
      jenis: formData.tipe_ruangan,
      durasi: (parseInt(formData.durasi_jam, 10) || 1) * 60, // Konversi Jam ke Menit untuk backend
      jumlah_orang: parseInt(formData.jumlah_orang, 10) || 1,
      alamat: "PSHUB Room",
      kontak: "Via App",
      waktuMulaiKustom: waktuMulaiDirencanakan
    };

    console.log("🚀 Meneruskan State Reservasi Berjadwal:", finalReservationData);

    // Oper data menuju halaman pemilihan makanan kantin
    navigate('/snack', { 
      state: { 
        fromReservation: true, 
        reservationData: finalReservationData, 
        roomInfo: formData.area_gaming 
      } 
    });
  };
  
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 font-sans relative">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-600/5 rounded-full blur-[100px]"></div>

      {/* Header Back Button */}
      <button 
        onClick={() => navigate('/reservasi')}
        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 relative z-10 text-[10px] font-black uppercase tracking-[0.2em] group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Kembali ke Area
      </button>

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="mb-10">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
            ROOM <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-500">RESERVATION</span>
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-3">
            Lengkapi detail untuk menyiapkan ruangan anda
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Nama */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Nama Player</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input 
                  type="text" 
                  className="w-full bg-[#0f1115] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-500/50 transition-all shadow-inner text-slate-200"
                  value={formData.nama}
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* Area Gaming */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Area Gaming</label>
              <div className="relative">
                <Tv className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <select 
                  className="w-full bg-[#0f1115] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none cursor-pointer appearance-none text-slate-200"
                  value={formData.area_gaming}
                  onChange={(e) => setFormData({...formData, area_gaming: e.target.value})}
                >
                  <option value="PS 5 AREA">PS 5 AREA</option>
                  <option value="PS 4 AREA">PS 4 AREA</option>
                  <option value="PS 3 AREA">PS 3 AREA</option>
                  <option value="PS 2 AREA">PS 2 AREA</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipe Ruangan */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Tipe Ruangan</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <select 
                  className="w-full bg-[#0f1115] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none cursor-pointer appearance-none text-slate-200"
                  value={formData.tipe_ruangan}
                  onChange={(e) => setFormData({...formData, tipe_ruangan: e.target.value})}
                >
                  <option value="Standar">Standar Room</option>
                  <option value="VIP">VIP Room (Premium)</option>
                </select>
              </div>
            </div>

            {/* Jumlah Orang */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Jumlah Player</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input 
                  type="number" 
                  min="1"
                  max="4"
                  className="w-full bg-[#0f1115] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-500/50 text-slate-200"
                  value={formData.jumlah_orang}
                  onChange={(e) => setFormData({...formData, jumlah_orang: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Waktu Mulai */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Mulai Main (Jam)</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input 
                  type="time" 
                  className="w-full bg-[#0f1115] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-500/50 text-slate-200"
                  value={formData.jam_mulai}
                  onChange={(e) => setFormData({...formData, jam_mulai: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* Durasi */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Durasi (Jam)</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input 
                  type="number" 
                  min="1"
                  className="w-full bg-[#0f1115] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-500/50 text-slate-200"
                  value={formData.durasi_jam}
                  onChange={(e) => setFormData({...formData, durasi_jam: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[2.5rem] mt-10 shadow-[0_20px_40px_rgba(37,99,235,0.15)] transition-all active:scale-[0.98] uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-3 group"
          >
            Lanjut Pilih Snack
            <ChevronLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoomBookingForm;