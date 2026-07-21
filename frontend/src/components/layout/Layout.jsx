

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F5F7FA] overflow-hidden">
      {
}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {
}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {
}
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        {
}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;