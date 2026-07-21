

import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { MasterDataProvider } from './context/MasterDataContext';
import AppRoutes from './routes/AppRoutes';
import ToastConfig from './components/ui/ToastConfig';
import AppToaster from './components/ui/AppToaster';

function App() {
  return (
    <BrowserRouter>
      <MasterDataProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppRoutes />
            <AppToaster />
          </NotificationProvider>
        </AuthProvider>
      </MasterDataProvider>
    </BrowserRouter>
  );
}

export default App;