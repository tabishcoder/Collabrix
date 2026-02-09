import { Outlet } from "react-router-dom";
import TopNavbar from "../components/TopNavbar";
import Sidebar from "../components/Sidebar";
import SubSidebarSwitch from "../components/subsidebars/SubSidebarSwitch";

export default function AppLayout() {
  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg)]">
      {/* Top Navbar */}
      <TopNavbar />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <SubSidebarSwitch />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
