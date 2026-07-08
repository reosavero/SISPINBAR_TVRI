// ============================================
// APP - Sistem Peminjaman Barang TVRI
// ============================================

import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import AppRoutes from './routes/AppRoutes';
import ToastConfig from './components/ui/ToastConfig';
import AppToaster from './components/ui/AppToaster';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
          <AppToaster />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;