import { useState } from "react";
import { Outlet } from "react-router-dom";

import Header from "../components/layout/Header.jsx";
import Sidebar from "../components/layout/Sidebar.jsx";

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 bg-slate-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
