import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Plus, Minus, ArrowRight } from 'lucide-react';
import axios from 'axios';

const SnackSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 🎯 PERBAIKAN 1: Destructuring aman dengan fallback berlapis agar halaman tidak crash saat di-refresh
  const { fromReservation = false, reservationData = null, roomInfo = 'PS 5 AREA' } = location.state || {};

  // State internal menu dan keranjang
  const [menuItems, setMenuItems] = useState({ snacks: [], drinks: [] });
  const [cart, setCart] = useState({}); // Format: { [itemId]: kuantitas }
  const [loading, setLoading] = useState(true);

  // Fetch data snack & drink dari backend dengan sinkronisasi JWT
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const savedData = localStorage.getItem('user_pshub');
        const token = savedData ? JSON.parse(savedData).token : null;

        const response = await axios.get('http://localhost:5000/api/menus', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setMenuItems(response.data || { snacks: [], drinks: [] });
        setLoading(false);
      } catch (err) {
        console.error("Gagal memuat menu snack dinamis:", err);
        setLoading(false);
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('user_pshub');
          navigate('/login');
        }
      }
    };
    fetchMenu();
  }, [navigate]);

  // Fungsi Kelola Kuantitas Cart
  const addToCart = (id) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id) => {
    setCart(prev => {
      const updated = { ...prev };
      if (updated[id] > 1) updated[id] -= 1;
      else delete updated[id];
      return updated;
    });
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

  // 🎯 PERBAIKAN 2: Fungsi Navigasi Teruskan Semua Data dengan Mapping Keranjang Lengkap
  const handleProceedToConfirm = () => {
    // Gabungkan master data snacks dan drinks menjadi satu array untuk pencarian item
    const allMasterMenu = [...(menuItems.snacks || []), ...(menuItems.drinks || [])];

    // Petakan isi keranjang belanja menjadi array of object lengkap yang siap dibaca oleh Halaman Konfirmasi & Backend
    const formattedCartDetails = Object.keys(cart).map(itemId => {
      const itemDetail = allMasterMenu.find(menu => String(menu.id) === String(itemId));
      return {
        id: parseInt(itemId, 10),
        name: itemDetail?.name || 'Menu K canteen',
        price: itemDetail?.price || 0,
        qty: cart[itemId],
        subtotal: (itemDetail?.price || 0) * cart[itemId]
      };
    });

    const payloadState = {
      reservationData: reservationData, // Tetap utuh (Membawa parameter dari RoomBookingForm)
      cartData: cart,                    // ID dan Kuantitas mentah (untuk kebutuhan state form)
      cartDetails: formattedCartDetails,  // 🌟 BARU: Data snack detail siap konsumsi backend/struk billing
      fromReservation: fromReservation
    };

    console.log("🚀 Meneruskan Kamar + Pilihan Snack ke Konfirmasi:", payloadState);
    navigate('/confirmation', { state: payloadState }); 
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-slate-500 font-mono text-xs tracking-widest">
        LOADING PSHUB CANTEEN...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 font-sans relative pb-32">
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-blue-600/5 rounded-full blur-[120px]"></div>

      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <button 
          onClick={() => navigate('/room-booking', { state: { areaName: roomInfo } })}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-6 text-xs font-black uppercase tracking-widest group relative z-10"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">PSHUB <span className="text-blue-500">CANTEEN</span></h2>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Pilih cemilan peneman bermain anda</p>
        </div>
      </div>

      {/* Grid Menu Makanan */}
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Kategori Makanan */}
        {menuItems.snacks?.length > 0 && (
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-4 border-b border-white/5 pb-2">🍿 Snacks & Platters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {menuItems.snacks.map(item => (
                <div key={item.id} className="bg-[#111317] border border-white/5 p-5 rounded-3xl flex justify-between items-center group hover:border-white/10 transition-all">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">{item.name}</h4>
                    <p className="text-xs font-mono text-blue-400">Rp {item.price.toLocaleString('id-ID')}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-black/40 p-2 rounded-2xl border border-white/5">
                    {cart[item.id] ? (
                      <>
                        <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg flex items-center justify-center transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black font-mono w-4 text-center">{cart[item.id]}</span>
                      </>
                    ) : null}
                    <button onClick={() => addToCart(item.id)} className="w-6 h-6 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center transition-all active:scale-90">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kategori Minuman */}
        {menuItems.drinks?.length > 0 && (
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-4 border-b border-white/5 pb-2">🥤 Fresh Drinks</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {menuItems.drinks.map(item => (
                <div key={item.id} className="bg-[#111317] border border-white/5 p-5 rounded-3xl flex justify-between items-center group hover:border-white/10 transition-all">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">{item.name}</h4>
                    <p className="text-xs font-mono text-blue-400">Rp {item.price.toLocaleString('id-ID')}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-black/40 p-2 rounded-2xl border border-white/5">
                    {cart[item.id] ? (
                      <>
                        <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg flex items-center justify-center transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black font-mono w-4 text-center">{cart[item.id]}</span>
                      </>
                    ) : null}
                    <button onClick={() => addToCart(item.id)} className="w-6 h-6 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center transition-all active:scale-90">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-30">
        <button 
          onClick={handleProceedToConfirm}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-[0_20px_50px_rgba(37,99,235,0.25)] active:scale-95 transition-all flex items-center justify-center gap-3 group"
        >
          {totalItems > 0 ? `Lanjut Dengan ${totalItems} Cemilan` : 'Skip / Tanpa Snack'}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default SnackSelection;