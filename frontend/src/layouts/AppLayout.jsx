import { useState } from "react";
import { Outlet } from "react-router-dom";
import TopNavbar from "../components/TopNavbar";
import Sidebar from "../components/Sidebar";
import SubSidebarSwitch from "../components/subsidebars/SubSidebarSwitch";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-dvh min-h-0 flex flex-col bg-[var(--color-bg)] text-[var(--color-text-primary)]">

      {/* TOP NAVBAR */}
      <TopNavbar />

      {/* BODY */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* MAIN SIDEBAR */}
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />

        {/* SUB SIDEBAR */}
        <SubSidebarSwitch collapsed={collapsed} />

        {/* MAIN CONTENT */}
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7 bg-[radial-gradient(1200px_600px_at_20%_-10%,var(--gradient-page-spot1),transparent_55%),radial-gradient(900px_500px_at_90%_0%,var(--gradient-page-spot2),transparent_50%),var(--color-bg)]">
          <div className="mx-auto max-w-[1600px]">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}