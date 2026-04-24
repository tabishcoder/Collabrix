import { useState } from "react";
import { Outlet } from "react-router-dom";
import TopNavbar from "../components/TopNavbar";
import Sidebar from "../components/Sidebar";
import SubSidebarSwitch from "../components/subsidebars/SubSidebarSwitch";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-[#050505]">

      {/* TOP NAVBAR */}
      <TopNavbar />

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">

        {/* MAIN SIDEBAR */}
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />

        {/* SUB SIDEBAR */}
        <SubSidebarSwitch collapsed={collapsed} />

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-[#050505] via-[#0a0a0b] to-[#050505]">
          <Outlet />
        </main>

      </div>
    </div>
  );
}