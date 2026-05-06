import { useLocation } from "react-router-dom";
import ChatsSubSidebar from "./ChatsSubSidebar";
import MeetingsSubSidebar from "./MeetingsSubSidebar";
import AISubSidebar from "./AISubSidebar";

export default function SubSidebarSwitch({ collapsed }) {
  const { pathname } = useLocation();

  if (pathname.startsWith("/projects")) return null;

  if (pathname.startsWith("/chats"))
    return <ChatsSubSidebar collapsed={collapsed} />;

  if (pathname.startsWith("/meetings")) return <MeetingsSubSidebar collapsed={collapsed} />;

  if (pathname.startsWith("/aibot")) return <AISubSidebar collapsed={collapsed} />;

  return null;
}