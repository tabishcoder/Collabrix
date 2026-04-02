import { useLocation } from "react-router-dom";
import ProjectsSubSidebar from "./ProjectsSubSidebar";
import ChatsSubSidebar from "./ChatsSubSidebar";
import MeetingsSubSidebar from "./MeetingsSubSidebar";
import AISubSidebar from "./AISubSidebar";

export default function SubSidebarSwitch() {
  const { pathname } = useLocation();

  if (pathname.startsWith("/projects")) return <ProjectsSubSidebar />;
  if (pathname.startsWith("/chats")) return <ChatsSubSidebar />;
  if (pathname.startsWith("/meetings")) return <MeetingsSubSidebar />;
  if (pathname.startsWith("/aibot")) return <AISubSidebar />;

  return null;
}
