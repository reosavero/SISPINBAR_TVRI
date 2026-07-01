// ============================================
// APP - Sistem Peminjaman Barang TVRI
// ============================================

import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import ToastConfig from './components/ui/ToastConfig';
import AppToaster from './components/ui/AppToaster';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <AppToaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;