import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, Gamepad, Crown } from 'lucide-react';

const TimerCard = ({ booking, onFinish }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [statusSesi, setStatusSesi] = useState("WAITING");
  
  // ====================================================================
  // ⏱️ LOGIKA UTAMA HITUNG MUNDUR (DENGAN COOLDOWN DETEKSI JADWAL)
  // ====================================================================
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const waktuMulaiSewa = new Date(booking.waktu_mulai).getTime();
      const waktuSelesaiSewa = new Date(booking.waktu_selesai).getTime();

      // KONDISI A: Waktu sekarang belum menyentuh jam mulai main (Booking Masa Depan)
      if (now < waktuMulaiSewa) {
        setStatusSesi("WAITING");
        const distance = waktuMulaiSewa - now;

        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`Buka dlm ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      } 
      // KONDISI B: Sesi main sudah resmi dibuka/berjalan
      else {
        setStatusSesi("PLAYING");
        const distance = waktuSelesaiSewa - now;

        if (distance < 0) {
          clearInterval(timer);
          onFinish();
        } else {
          const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((distance % (1000 * 60)) / 1000);
          setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [booking.waktu_mulai, booking.waktu_selesai, onFinish]);


  // ====================================================================
  // 🔍 PARSING DATA & NORMALISASI STRUKTUR DATABASE GANDA
  // ====================================================================
  
  // 1. Normalisasi teks jenis unit dari database (Ditambah fallback super aman)
  const jenisUnit = booking.Unit?.jenis 
    ? booking.Unit.jenis.toLowerCase() 
    : (booking.jenis ? booking.jenis.toLowerCase() : "standar");

  const isVIP = jenisUnit.includes("vip");
  const isStandard = jenisUnit.includes("standar") || jenisUnit.includes("standard") || jenisUnit === "";

  // 2. 💡 DETEKSI SAKTI GABUNGAN: Memastikan pemisahan data kamar vs rental bawa pulang
  const alamatPengirimanSewa = booking.alamat_pengiriman ? booking.alamat_pengiriman.toUpperCase() : "";
  const alamatKamarPrivat = booking.text_alamat ? booking.text_alamat.toUpperCase() : "";
  
  // Kamar privat valid jika terdeteksi 'nama_player' atau keyword string 'PSHUB ROOM' di salah satu kolom alamat
  const isRuanganPrivat = booking.nama_player || alamatPengirimanSewa.includes("PSHUB ROOM") || alamatKamarPrivat.includes("PSHUB ROOM");

  // Nama Unit Fallback: Mencegah tampilan kosong saat transisi data ORM loading
  const namaUnitTampil = booking.Unit?.nama_unit || `PlayStation Unit (Sewa #${booking.id})`;


  // ====================================================================
  // 🖥️ RENDERING MODEL KOMPONEN VISUAL UI
  // ====================================================================

// --- MODEL 1: RENTAL BIASA (Reguler - Bawa Pulang) ---
  if (isStandard && !isRuanganPrivat) {
    return (
      <div className={`bg-[#101216] border rounded-[2.5rem] p-6 shadow-[0_0_30px_rgba(59,130,246,0.05)] w-full h-full relative overflow-hidden flex flex-col justify-between group transition-all duration-300 min-w-[280px] min-h-[240px] ${
        statusSesi === "PLAYING" ? "border-blue-500/20 hover:border-blue-500/40" : "border-amber-500/20 hover:border-amber-500/40"
      }`}>
        {/* Ambient Glow effect Biru khas Rental Reguler / Amber untuk Standby */}
        <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-all duration-300 ${
          statusSesi === "PLAYING" ? "bg-blue-500" : "bg-amber-500"
        }`}></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            
            {/* Badge Status Jenis Sewa */}
            <div className={`flex items-center gap-2 border px-3 py-1 rounded-full ${
              statusSesi === "PLAYING" ? "bg-blue-500/10 border-blue-500/20" : "bg-amber-500/10 border-amber-500/20"
            }`}>
              <Gamepad className={`w-3.5 h-3.5 ${statusSesi === "PLAYING" ? "text-blue-400" : "text-amber-500"}`} />
              <span className={`text-[8px] font-black uppercase tracking-widest ${statusSesi === "PLAYING" ? "text-blue-400" : "text-amber-500"}`}>
                {statusSesi === "PLAYING" ? "Reguler Rental" : "Scheduled Rental"}
              </span>
            </div>

            {/* Badge Indikator Status Waktu */}
            <span className={`text-[8px] font-black bg-white/5 px-2.5 py-1 rounded-xl uppercase tracking-wider ${
              statusSesi === "PLAYING" ? "text-blue-400" : "text-amber-500"
            }`}>
              {statusSesi === "PLAYING" ? "Active" : "Standby"}
            </span>
          </div>
          
          {/* Detail Nama Penyewa */}
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">
            Penyewa: <span className="text-slate-300 normal-case">{booking.nama_penyewa || "Gamer"}</span>
          </p>
          <h3 className="text-xl font-black italic text-white uppercase tracking-tight mb-6">
            {namaUnitTampil}
          </h3>
        </div>

        {/* Box Timer Hitung Mundur Vertikal Bottom */}
        <div className={`relative z-10 flex items-center justify-between bg-black/40 backdrop-blur-md p-4 rounded-2xl border ${
          statusSesi === "PLAYING" ? "border-blue-500/20" : "border-amber-500/20"
        }`}>
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 animate-pulse ${statusSesi === "PLAYING" ? "text-blue-400" : "text-amber-500"}`} />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              {statusSesi === "PLAYING" ? "Sisa Waktu" : "Status Sesi"}
            </span>
          </div>
          <span className={`text-2xl font-black font-mono tracking-tighter ${statusSesi === "PLAYING" ? "text-blue-400" : "text-amber-500"}`}>
            {timeLeft}
          </span>
        </div>
      </div>
    );
  }

  // --- MODEL 2: RESERVASI RUANGAN STANDARD (Private Room) ---
  if (isStandard && isRuanganPrivat) {
    return (
      <div className={`bg-[#101216] border rounded-[2.5rem] p-6 shadow-[0_0_30px_rgba(6,182,212,0.05)] w-full h-full relative overflow-hidden flex flex-col justify-between group transition-all duration-300 min-w-[280px] min-h-[240px] ${
        statusSesi === "PLAYING" ? "border-cyan-500/20 hover:border-cyan-500/40" : "border-amber-500/20 hover:border-amber-500/40"
      }`}>
        {/* Ambient Glow effect */}
        <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-all duration-300 ${
          statusSesi === "PLAYING" ? "bg-cyan-500" : "bg-amber-500"
        }`}></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <div className={`flex items-center gap-2 border px-3 py-1 rounded-full ${
              statusSesi === "PLAYING" ? "bg-cyan-500/10 border-cyan-500/20" : "bg-amber-500/10 border-amber-500/20"
            }`}>
              <ShieldCheck className={`w-3.5 h-3.5 ${statusSesi === "PLAYING" ? "text-cyan-400" : "text-amber-500"}`} />
              <span className={`text-[8px] font-black uppercase tracking-widest ${statusSesi === "PLAYING" ? "text-cyan-400" : "text-amber-500"}`}>
                {statusSesi === "PLAYING" ? "Standard Room" : "Scheduled Room"}
              </span>
            </div>

            <span className={`text-[8px] font-black bg-white/5 px-2.5 py-1 rounded-xl uppercase tracking-wider ${
              statusSesi === "PLAYING" ? "text-cyan-400" : "text-amber-500"
            }`}>
              {statusSesi === "PLAYING" ? "In-Room" : "Standby"}
            </span>
          </div>
          
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Player Name: <span className="text-slate-300 normal-case">{booking.nama_player || booking.nama_penyewa}</span></p>
          <h3 className="text-xl font-black italic text-white uppercase tracking-tight mb-6">
            {namaUnitTampil}
          </h3>
        </div>

        <div className={`relative z-10 flex items-center justify-between bg-black/40 backdrop-blur-md p-4 rounded-2xl border ${
          statusSesi === "PLAYING" ? "border-cyan-500/20" : "border-amber-500/20"
        }`}>
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 animate-pulse ${statusSesi === "PLAYING" ? "text-cyan-400" : "text-amber-500"}`} />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              {statusSesi === "PLAYING" ? "Sisa Waktu" : "Status Sesi"}
            </span>
          </div>
          <span className={`text-2xl font-black font-mono tracking-tighter ${statusSesi === "PLAYING" ? "text-cyan-400" : "text-amber-500"}`}>
            {timeLeft}
          </span>
        </div>
      </div>
    );
  }

  // --- MODEL 3: RESERVASI RUANGAN VIP (Premium Room) ---
  if (isVIP) {
    return (
      <div className={`relative overflow-hidden border rounded-[2.5rem] p-6 shadow-2xl flex flex-col justify-between group transition-all duration-300 h-full w-full min-w-[280px] min-h-[240px] ${
        statusSesi === "PLAYING" 
          ? "bg-gradient-to-br from-[#12101c] to-[#1a1235] border-purple-500/30 hover:border-purple-500/50 shadow-purple-500/5" 
          : "bg-[#101216] border-amber-500/20 hover:border-amber-500/40 shadow-amber-500/5"
      }`}>
        
        {/* Ambient Glow Background */}
        <div className={`absolute -bottom-16 -left-16 w-40 h-40 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-all duration-300 ${
          statusSesi === "PLAYING" ? "bg-purple-600" : "bg-amber-500"
        }`}></div>
        
        <div className="absolute top-0 right-0 p-5 z-20">
          <Crown className={`w-5 h-5 opacity-60 ${
            statusSesi === "PLAYING" ? "text-purple-400 animate-bounce" : "text-amber-500"
          }`} />
        </div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-5">
            <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] rounded-full text-white shadow-lg ${
              statusSesi === "PLAYING" 
                ? "bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-600/30" 
                : "bg-amber-600 shadow-amber-600/30"
            }`}>
              {statusSesi === "PLAYING" ? "VIP PRIVATE ROOM" : "SCHEDULED VIP"}
            </span>

            <span className={`text-[8px] font-black bg-white/5 px-2.5 py-1 rounded-xl uppercase tracking-wider ${
              statusSesi === "PLAYING" ? "text-purple-400" : "text-amber-500"
            }`}>
              {statusSesi === "PLAYING" ? "In-Room" : "Standby"}
            </span>
          </div>
          
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-400/70 mb-1">Player Name: <span className="text-slate-300 normal-case">{booking.nama_player || booking.nama_penyewa}</span></p>
          <h3 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-200 uppercase tracking-tighter mb-6">
            {namaUnitTampil}
          </h3>
        </div>

        <div className={`relative z-10 flex flex-col items-center justify-center py-4 bg-black/50 backdrop-blur-xl rounded-2xl border shadow-inner transition-all ${
          statusSesi === "PLAYING" ? "border-white/10" : "border-amber-500/20"
        }`}>
          <p className={`text-[8px] font-bold uppercase tracking-[0.3em] mb-1.5 ${
            statusSesi === "PLAYING" ? "text-purple-400" : "text-amber-500"
          }`}>
            {statusSesi === "PLAYING" ? "Sesi Berlangsung" : "Sesi Menunggu"}
          </p>
          <h2 className={`text-3xl font-black font-mono tracking-tight transition-all ${
            statusSesi === "PLAYING" 
              ? "text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-300" 
              : "text-amber-500"
          }`}>
            {timeLeft}
          </h2>
        </div>
      </div>
    );
  }

  return null;
};

export default TimerCard;