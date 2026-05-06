import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import ProjectScopedModule from "../project-scope/ProjectScopedModule";
import { fetchProjectById } from "../projects/projectSlice";
import { clearChatUi, fetchProjectChats } from "../chats/chatSlice";
import ChatThread from "../chats/ChatThread";

export default function ChatsPage() {
  const dispatch = useDispatch();
  const activeProject = useSelector((s) => s.projects.activeProject);
  const lastProjectId = useRef(null);

  useEffect(() => {
    const id = activeProject?._id;
    if (!id) return;
    if (lastProjectId.current !== id) {
      dispatch(clearChatUi());
      lastProjectId.current = id;
    }
    dispatch(fetchProjectChats(id));
    dispatch(fetchProjectById(id));
  }, [dispatch, activeProject?._id]);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <ProjectScopedModule
        compact
        title="Chats"
        description="Project channel, DMs & groups — live sync."
      >
        <ChatThread />
      </ProjectScopedModule>
    </div>
  );
}
