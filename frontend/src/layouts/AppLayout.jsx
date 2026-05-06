import { useState } from "react";
import { Outlet } from "react-router-dom";
import TopNavbar from "../components/TopNavbar";
import Sidebar from "../components/Sidebar";
import SubSidebarSwitch from "../components/subsidebars/SubSidebarSwitch";
import ChatSocketBridge from "../features/chats/ChatSocketBridge";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-dvh min-h-0 flex flex-col bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <ChatSocketBridge />

      {/* TOP NAVBAR */}
      <TopNavbar onToggleSidebar={() => setCollapsed((c) => !c)} />

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
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-[radial-gradient(1200px_520px_at_18%_-8%,var(--gradient-page-spot1),transparent_62%),radial-gradient(800px_420px_at_92%_0%,var(--gradient-page-spot2),transparent_58%),var(--color-bg)] px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-7">
          <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col pb-2">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}