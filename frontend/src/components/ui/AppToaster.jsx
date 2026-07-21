

import { useAuth } from '../../context/AuthContext';
import { Toaster } from 'react-hot-toast';

const AppToaster = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#fff',
          color: '#1F2937',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
          maxWidth: '90vw',
        },
        success: {
          iconTheme: { primary: '#10B981', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#EF4444', secondary: '#fff' },
        },
      }}
    />
  );
};

export default AppToaster;