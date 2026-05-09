import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import TopNavbar from "../components/TopNavbar";
import Sidebar from "../components/Sidebar";
import SubSidebarSwitch from "../components/subsidebars/SubSidebarSwitch";
import ChatSocketBridge from "../features/chats/ChatSocketBridge";
import ActiveTimerBanner from "../features/time/ActiveTimerBanner";
import TinyViewportFullscreenGate from "../components/TinyViewportFullscreenGate";
import { useViewport } from "../hooks/useViewport";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { isLgUp, isTiny } = useViewport();

  useEffect(() => {
    if (isLgUp) setMobileSidebarOpen(false);
  }, [isLgUp]);

  const toggleSidebar = () => {
    if (isLgUp) setCollapsed((c) => !c);
    else setMobileSidebarOpen((o) => !o);
  };

  // Under 360px: only centered alert — no chrome, no page content (avoids overflow/overlap).
  if (isTiny) {
    return (
      <>
        <ChatSocketBridge />
        <TinyViewportFullscreenGate />
      </>
    );
  }

  return (
    <div className="relative h-dvh min-h-0 flex flex-col overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <ChatSocketBridge />

      <TopNavbar onToggleSidebar={toggleSidebar} />

      <ActiveTimerBanner />

      {/* Mobile sidebar backdrop */}
      {!isLgUp && mobileSidebarOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      ) : null}

      {/* BODY */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden h-full min-h-0 shrink-0 lg:flex">
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        </div>

        {/* Mobile drawer */}
        <div
          className={`
            fixed inset-y-0 left-0 z-50 h-full min-h-0 w-[min(17.5rem,calc(100vw-2.5rem))] max-w-[280px] shadow-[var(--shadow-soft)] transition-transform duration-200 ease-out lg:hidden
            ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"}
          `}
          aria-hidden={!mobileSidebarOpen}
        >
          <Sidebar
            collapsed={false}
            setCollapsed={setCollapsed}
            onNavigate={() => setMobileSidebarOpen(false)}
          />
        </div>

        {/* Sub-sidebar + main: stack below lg to avoid horizontal overflow */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <SubSidebarSwitch collapsed={isLgUp ? collapsed : false} />

          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain bg-[radial-gradient(1200px_520px_at_18%_-8%,var(--gradient-page-spot1),transparent_62%),radial-gradient(800px_420px_at_92%_0%,var(--gradient-page-spot2),transparent_58%),var(--color-bg)] px-3 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-7">
            <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col pb-2">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
