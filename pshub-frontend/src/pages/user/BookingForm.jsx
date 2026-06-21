import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  User, 
  Monitor, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Phone 
} from 'lucide-react';
import axios from 'axios';

const BookingForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // 1. Set default typePs menggunakan nama lengkap "PlayStation 5" agar sinkron dengan Backend
  const [formData, setFormData] = useState({
    userId: '',
    namaLengkap: '',
    typePs: 'PlayStation 5', 
    durasi: 1, // Default angka awal
    alamat: '',
    jaminan: 'KTP (Asli)',
    kontak: ''
  });

  // 2. Mengambil data login user dari localStorage
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
            namaLengkap: userData.name || userData.nama || '',
            kontak: userData.phone || userData.kontak || ''
          }));
        }
      } catch (err) {
        console.error("Gagal parsing data user:", err);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Pastikan durasi dikonversi menjadi tipe data Number murni
    const payload = {
      ...formData,
      durasi: parseInt(formData.durasi, 10) || 1
    };

    try {
      console.log("--- PROSES BOOKING REGULER ---");
      console.log("Payload dikirim:", payload);

      // 💡 PERBAIKAN UTAMA: Ambil token JWT aktif dari localStorage
      const savedData = localStorage.getItem('user_pshub');
      const token = savedData ? JSON.parse(savedData).token : null;

      // 💡 JABAT TANGAN AXIOS: Kirim data bersama Headers Authorization Bearer Token
      const response = await axios.post(`https://rekaweb-awr-production.up.railway.app/api/booking`, payload, {
        headers: {
          Authorization: `Bearer ${token}` // 🔑 Kunci pembuka barikade JWT backend
        }
      });

      if (response.data) {
        alert("Booking Berhasil! Unit reguler segera diproses.");
        navigate('/dashboard');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Terjadi kesalahan pada server";
      alert(errorMsg);
      console.error("Booking Error:", error.response?.data);
      
      // Keamanan Tambahan: Jika token kedaluwarsa (401/403), tendang ke halaman login
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('user_pshub');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 font-sans relative">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-600/5 rounded-full blur-[100px]"></div>

      <button 
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-6 text-xs font-black uppercase tracking-widest group relative z-10"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Kembali
      </button>

      <div className="max-w-xl mx-auto relative z-10">
        <div className="mb-8">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">
            RENTAL <span className="text-blue-500">REGISTRATION</span>
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">
            Lengkapi data untuk penyewaan unit
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nama Lengkap */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input 
                  type="text" 
                  className="w-full bg-[#0f1115] border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold outline-none focus:border-blue-500/50 transition-all focus:bg-blue-500/5"
                  value={formData.namaLengkap}
                  onChange={(e) => setFormData({...formData, namaLengkap: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* Type PS */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Type PS</label>
              <div className="relative">
                <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <select 
                  className="w-full bg-[#0f1115] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none cursor-pointer appearance-none"
                  value={formData.typePs}
                  onChange={(e) => setFormData({...formData, typePs: e.target.value})}
                >
                  <option value="PlayStation 5">PlayStation 5</option>
                  <option value="PlayStation 4">PlayStation 4</option>
                  <option value="PlayStation 3">PlayStation 3</option>
                  <option value="PlayStation 2">PlayStation 2</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Durasi */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Durasi (Jam)</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input 
                  type="number" 
                  min="1"
                  className="w-full bg-[#0f1115] border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold outline-none focus:border-blue-500/50 focus:bg-blue-500/5"
                  value={formData.durasi}
                  onChange={(e) => setFormData({...formData, durasi: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* Jaminan */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Jaminan</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <select 
                  className="w-full bg-[#0f1115] border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold outline-none focus:border-blue-500/50 appearance-none cursor-pointer focus:bg-blue-500/5"
                  value={formData.jaminan}
                  onChange={(e) => setFormData({...formData, jaminan: e.target.value})}
                >
                  <option value="KTP (Asli)">KTP (Asli)</option>
                  <option value="SIM A/C (Asli)">SIM A/C (Asli)</option>
                  <option value="Kartu Pelajar">Kartu Pelajar</option>
                </select>
              </div>
            </div>
          </div>

          {/* Alamat */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Alamat Pengiriman</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-4 w-4 h-4 text-blue-500" />
              <textarea 
                className="w-full bg-[#0f1115] border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold outline-none focus:border-blue-500/50 min-h-[100px] resize-none focus:bg-blue-500/5"
                placeholder="Masukkan alamat lengkap..."
                value={formData.alamat}
                onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                required
              ></textarea>
            </div>
          </div>

          {/* Kontak */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Kontak WhatsApp</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
              <input 
                type="tel" 
                className="w-full bg-[#0f1115] border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold outline-none focus:border-blue-500/50 focus:bg-blue-500/5"
                value={formData.kontak}
                onChange={(e) => setFormData({...formData, kontak: e.target.value})}
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl mt-4 shadow-lg shadow-blue-600/20 transition-all active:scale-95 uppercase tracking-[0.2em] text-[10px]"
          >
            {loading ? "MEMPROSES..." : "KONFIRMASI PESANAN"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;