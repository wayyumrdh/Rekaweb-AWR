import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import DashboardUser from './pages/user/Dashboard';
import BookingForm from './pages/user/BookingForm';
import UnitList from './pages/user/UnitList';
import Reservation from './pages/user/Reservation';
import RoomBookingForm from './pages/user/RoomBookingForm';
import SnackMenu from './pages/user/SnackMenu';
import OrderConfirmation from './pages/user/OrderConfirmation';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserData from './pages/admin/UserData';
import MenuCatalog from './pages/user/MenuCatalog';

// 💡 TAMBAHAN 1: Import file UnitMonitor yang baru dibuat
import UnitMonitor from './pages/admin/UnitMonitor';
import Monitoring from './pages/admin/Monitoring';
import ReservasiView from './pages/admin/ReservasiView';

// --- KOMPONEN PROTEKSI (DIREKONSILIASI BERDASARKAN LOG CONSOLE) ---
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const savedData = localStorage.getItem('user_pshub');
  
  if (!savedData) {
    // Jika belum login, tendang ke halaman login
    return <Navigate to="/login" replace />;
  }

  // 🎯 PERBAIKAN UTAMA: Bongkar data session, lalu ambil objek 'user' di dalamnya
  const session = JSON.parse(savedData);
  const userProfile = session?.user || null; 

  // Jika profile gagal dibaca, paksa login ulang
  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  // 🎯 PERBAIKAN KEDUA: Validasi role berdasarkan properti objek internal yang sah
  if (adminOnly && userProfile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Jalur Publik */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Jalur Khusus User (Harus Login) */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardUser /></ProtectedRoute>} />
        <Route path="/booking" element={<ProtectedRoute><BookingForm /></ProtectedRoute>} />
        <Route path="/units" element={<ProtectedRoute><UnitList /></ProtectedRoute>} />
        <Route path="/reservasi" element={<ProtectedRoute><Reservation /></ProtectedRoute>} />
        <Route path="/room-booking" element={<ProtectedRoute><RoomBookingForm /></ProtectedRoute>} />
        <Route path="/snack" element={<ProtectedRoute><SnackMenu /></ProtectedRoute>} />
        <Route path="/confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
        
        {/* Buku Menu Digital */}
        <Route path="/menu" element={<ProtectedRoute><MenuCatalog /></ProtectedRoute>} />

        {/* Jalur Khusus Admin (Sesuai dengan navigate('/admin/dashboard') di Login.jsx) */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* 💡 TAMBAHAN 2: Rute untuk Halaman Unit Monitor Admin */}
        <Route 
          path="/admin/units" 
          element={
            <ProtectedRoute adminOnly={true}>
              <UnitMonitor />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute adminOnly={true}>
              <UserData />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/monitoring" 
          element={
            <ProtectedRoute adminOnly={true}>
              <Monitoring />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/reservasi" 
          element={
            <ProtectedRoute adminOnly={true}>
              <ReservasiView />
            </ProtectedRoute>
          } 
        />

        {/* Catch-all: Jika URL tidak ada, kembali ke login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;