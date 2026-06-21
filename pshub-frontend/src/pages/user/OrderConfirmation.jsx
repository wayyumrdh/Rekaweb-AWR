import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, Receipt, Utensils } from 'lucide-react';
import axios from 'axios';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { reservationData, cartData, menuItems } = location.state || {};

  const savedData = localStorage.getItem('user_pshub');
  const session = savedData ? JSON.parse(savedData) : null;
  const user = session?.user || null;  
  const token = session?.token || null; 

  if (!reservationData) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <button onClick={() => navigate('/dashboard')} className="text-blue-500 font-black uppercase tracking-widest text-xs">
          Data Kosong - Kembali ke Dashboard
        </button>
      </div>
    );
  }

  // 🎯 NORMALISASI DURASI: Ambil nilai jam murni untuk visual UI ringkasan
  const durasiJamMurni = parseInt(reservationData.durasi_jam, 10) || Math.floor((parseInt(reservationData.durasi, 10) || 60) / 60);
  // Pastikan durasi dalam menit dikirim secara solid ke backend (Jam * 60)
  const durasiMenitFinal = durasiJamMurni * 60;

  let totalHargaSnack = 0;
  const daftarSnackTerpilih = [];

  if (cartData && menuItems) {
    const semuaMenu = [...(menuItems.snacks || []), ...(menuItems.drinks || [])];
    
    Object.keys(cartData).forEach(itemId => {
      const qty = cartData[itemId];
      const detailMenu = semuaMenu.find(item => String(item.id) === String(itemId));
      
      if (detailMenu && qty > 0) {
        const totalPerItem = detailMenu.price * qty;
        totalHargaSnack += totalPerItem;
        daftarSnackTerpilih.push({
          ...detailMenu,
          qty,
          totalPerItem
        });
      }
    });
  }

  const handleFinishOrder = async () => {
    try {
      const startRentStr = reservationData.waktuMulaiKustom; 
      
      // 🎯 SINKRONISASI SELESAI BILLING: Tambah durasi menit final (bukan jam)
      let waktuSelesaiDirencanakan = null;
      if (startRentStr) {
        const startDateObj = new Date(startRentStr.replace(/-/g, '/')); 
        if (!isNaN(startDateObj.getTime())) {
          startDateObj.setMinutes(startDateObj.getMinutes() + durasiMenitFinal);
          
          const tahun = startDateObj.getFullYear();
          const bulan = String(startDateObj.getMonth() + 1).padStart(2, '0');
          const hari = String(startDateObj.getDate()).padStart(2, '0');
          const jam = String(startDateObj.getHours()).padStart(2, '0');
          const menit = String(startDateObj.getMinutes()).padStart(2, '0');
          const detik = String(startDateObj.getSeconds()).padStart(2, '0');
          
          waktuSelesaiDirencanakan = `${tahun}-${bulan}-${hari} ${jam}:${menit}:${detik}`;
        }
      }

      const payload = {
        userId: user?.id || reservationData.userId,
        namaLengkap: reservationData.namaLengkap || reservationData.nama,
        nama_player: reservationData.namaLengkap || reservationData.nama, 
        nama_penyewa: reservationData.namaLengkap || reservationData.nama, 
        
        typePs: reservationData.typePs || reservationData.area_gaming, 
        jenis: reservationData.jenis === 'Standard' ? 'Standar' : (reservationData.jenis || 'Standar'), 
        durasi: durasiMenitFinal, // Dikirim mutuh dalam hitungan MENIT sesuai keinginan server.js
        jumlah_orang: parseInt(reservationData.jumlah_orang, 10) || 1,
        
        jaminan: "Sewa Ruangan",
        alamat: "PSHUB Room", 
        text_alamat: "PSHUB Room",
        kontak: "Via App",
        
        waktuMulaiKustom: startRentStr,
        waktu_mulai: startRentStr,
        waktu_selesai: waktuSelesaiDirencanakan,
        
        cartData: cartData 
      };

      console.log("🚀 Payload Terkalibrasi Menuju Backend:", payload);

      const response = await axios.post(`https://rekaweb-awr-production.up.railway.app/api/room-reservation`, payload, {
        headers: {
          Authorization: `Bearer ${token}` 
        }
      });

      if (response.status === 201 || response.status === 200) {
        alert("Reservasi Kamar Privat & Makanan Kantin Berhasil Dicatat!");
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("Gagal memproses sewa kamar private:", err);
      alert(err.response?.data?.message || "Koneksi ke server gagal atau unit kamar penuh!");

      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('user_pshub');
        navigate('/login');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-600/5 rounded-full blur-[100px]"></div>

      <div className="max-w-2xl mx-auto mb-10 text-center mt-10">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">
          ORDER <span className="text-blue-500">READY!</span>
        </h1>
      </div>

      <div className="max-w-2xl mx-auto space-y-6 pb-24 relative z-10">
        {/* Detail Ringkasan Reservasi */}
        <div className="bg-[#0f1115] border border-white/5 rounded-[2.5rem] p-8 shadow-xl">
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 border-b border-white/5 pb-3">Ringkasan Sesi Ruangan</p>
           <div className="grid grid-cols-2 gap-6">
             <div>
               <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Area</p>
               <p className="text-lg font-black italic text-white uppercase">
                 {reservationData.typePs || reservationData.area_gaming}
               </p>
             </div>
             <div>
               <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Tipe Ruangan</p>
               <p className="text-lg font-black italic text-blue-500 uppercase">
                 {reservationData.jenis || reservationData.tipe_ruangan} Room
               </p>
             </div>
             <div>
               <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Durasi Sewa</p>
               <p className="text-lg font-black italic text-white">
                 {durasiJamMurni} Jam {/* 🎯 FIX TAMPILAN: Sekarang tercetak angka jam asli (misal: 2 Jam) */}
               </p>
             </div>
             <div>
               <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Nama Player</p>
               <p className="text-lg font-black italic text-white uppercase">
                 {reservationData.namaLengkap || reservationData.nama}
               </p>
             </div>
           </div>
         </div>

        {/* DETAIL RINGKASAN SNACK */}
        {daftarSnackTerpilih.length > 0 && (
          <div className="bg-[#0f1115] border border-white/5 rounded-[2.5rem] p-8 shadow-xl">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
              <Utensils className="w-4 h-4 text-amber-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Pesanan Kudapan & Minuman</p>
            </div>
            
            <div className="space-y-3">
              {daftarSnackTerpilih.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="text-slate-300">
                    {item.name} <span className="text-xs text-amber-500 font-black font-mono ml-1">x{item.qty}</span>
                  </div>
                  <div className="font-mono text-slate-400 text-xs">
                    Rp {item.totalPerItem.toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
              
              <div className="border-t border-white/5 pt-3 mt-2 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Total Tambahan Kantin:</span>
                <span className="font-mono text-amber-500 font-bold text-sm">
                  Rp {totalHargaSnack.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Notifikasi Sistem Informasi Kasir */}
        <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl flex items-start gap-4">
            <Receipt className="w-6 h-6 text-blue-500 shrink-0" />
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed tracking-widest">
                Konfirmasi ini akan langsung memotong stok unit ruangan secara otomatis. Silahkan menuju ke <span className="text-white">Kasir</span> untuk mengambil kunci ruangan privat anda {daftarSnackTerpilih.length > 0 && "beserta pesanan makanan anda"}.
            </p>
        </div>
      </div>

      {/* Footer Action Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-20">
        <button 
          onClick={handleFinishOrder}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-[0_20px_50px_rgba(37,99,235,0.3)] active:scale-95 transition-all"
        >
          KONFIRMASI & KE DASHBOARD
        </button>
      </div>
    </div>
  );
};

export default OrderConfirmation;