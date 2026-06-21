import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import axios from 'axios';

const MenuCatalog = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState({ snacks: [], drinks: [] });
  const [loading, setLoading] = useState(true);

  // Ambil daftar makanan & minuman aktif langsung dari database + Otentikasi JWT
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        // 💡 PERBAIKAN UTAMA: Ambil token JWT aktif dari localStorage
        const savedData = localStorage.getItem('user_pshub');
        const token = savedData ? JSON.parse(savedData).token : null;

        // 💡 JABAT TANGAN AXIOS: Selipkan Authorization Headers Bearer Token
        const response = await axios.get(`https://rekaweb-awr-production.up.railway.app/api/menus`, {
          headers: {
            Authorization: `Bearer ${token}` // 🔑 Paspor keamanan JWT
          }
        });
        
        setMenuItems(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Gagal memuat katalog menu:", err);
        setLoading(false);
        
        // Skenario jika token invalid atau kedaluwarsa (401/403), tendang ke login
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('user_pshub');
          navigate('/login');
        }
      }
    };
    fetchMenu();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-slate-500 font-mono text-xs tracking-widest">
        LOADING PSHUB CATALOG...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 font-sans relative">
      {/* Background Ambient Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-purple-600/5 rounded-full blur-[120px]"></div>

      {/* Header */}
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-12 mt-4 relative z-10">
        <button 
          onClick={() => navigate('/dashboard')}
          className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-purple-600/20 hover:border-purple-500/30 transition-all active:scale-95"
        >
          <ChevronLeft className="w-6 h-6 text-slate-300" />
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2 justify-end">
            PSHUB <span className="text-purple-500">DIGITAL MENU</span>
          </h2>
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">
            Daftar hidangan & drink active ready di kantin
          </p>
        </div>
      </div>

      {/* Grid Katalog Menu */}
      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        
        {/* Kategori Makanan */}
        {menuItems.snacks?.length > 0 && (
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-purple-400 mb-5 border-b border-purple-500/10 pb-2 flex items-center gap-2">
              🍿 Snacks & Platters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {menuItems.snacks.map(item => (
                <div key={item.id} className="bg-[#111317]/80 backdrop-blur-md border border-white/5 p-5 rounded-3xl flex justify-between items-center group hover:border-purple-500/20 transition-all duration-300">
                  <div>
                    <h4 className="text-sm font-bold text-slate-200 mb-1 group-hover:text-white transition-colors">{item.name}</h4>
                    <p className="text-xs font-mono text-purple-400 font-bold">Rp {item.price.toLocaleString('id-ID')}</p>
                  </div>
                  <span className="text-[8px] font-black uppercase bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-xl text-purple-400 tracking-wider">
                    Ready
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kategori Minuman */}
        {menuItems.drinks?.length > 0 && (
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400 mb-5 border-b border-cyan-500/10 pb-2 flex items-center gap-2">
              🥤 Fresh Drinks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {menuItems.drinks.map(item => (
                <div key={item.id} className="bg-[#111317]/80 backdrop-blur-md border border-white/5 p-5 rounded-3xl flex justify-between items-center group hover:border-cyan-500/20 transition-all duration-300">
                  <div>
                    <h4 className="text-sm font-bold text-slate-200 mb-1 group-hover:text-white transition-colors">{item.name}</h4>
                    <p className="text-xs font-mono text-cyan-400 font-bold">Rp {item.price.toLocaleString('id-ID')}</p>
                  </div>
                  <span className="text-[8px] font-black uppercase bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-xl text-cyan-400 tracking-wider">
                    Fresh
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MenuCatalog;