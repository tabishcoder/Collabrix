import { useLocation } from "react-router-dom";
import ChatsSubSidebar from "./ChatsSubSidebar";
import MeetingsSubSidebar from "./MeetingsSubSidebar";
import AISubSidebar from "./AISubSidebar";

export default function SubSidebarSwitch({ collapsed }) {
  const { pathname } = useLocation();

  let node = null;
  if (!pathname.startsWith("/projects")) {
    if (pathname.startsWith("/chats")) node = <ChatsSubSidebar collapsed={collapsed} />;
    else if (pathname.startsWith("/meetings")) node = <MeetingsSubSidebar collapsed={collapsed} />;
    else if (pathname.startsWith("/aibot")) node = <AISubSidebar collapsed={collapsed} />;
  }

  if (!node) return null;

  return (
    <div
      className="
        flex max-h-[42vh] min-h-[200px] w-full shrink-0 flex-col overflow-hidden
        border-b border-[var(--color-border-strong)]
        lg:max-h-none lg:h-full lg:w-auto lg:border-b-0 lg:border-r lg:border-[var(--color-border-strong)]
      "
    >
      {node}
    </div>
  );
}
