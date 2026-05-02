import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ProjectScopedModule from "../project-scope/ProjectScopedModule";
import { createMeeting, clearMeetingSession } from "../meetings/meetingsSlice";
import { pushRecentMeeting } from "../meetings/recentMeetingsStorage";

export default function MeetingsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const activeProject = useSelector((s) => s.projects.activeProject);
  const meetingsLoading = useSelector((s) => s.meetings.loading);

  const [title, setTitle] = useState("");
  const [joinId, setJoinId] = useState("");

  useEffect(() => {
    if (location.state?.focusCreate) {
      document.getElementById("meeting-create-title")?.focus();
    }
  }, [location.state]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error("Enter a meeting title");
      return;
    }
    if (!activeProject?._id) {
      toast.error("Select a project first");
      return;
    }
    try {
      const data = await dispatch(
        createMeeting({ title: trimmed, projectId: String(activeProject._id) }),
      ).unwrap();
      pushRecentMeeting(String(activeProject._id), data.meeting);
      setTitle("");
      toast.success("Meeting created");
      navigate(`/meetings/${data.meeting._id}`);
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Could not create meeting");
    }
  };

  const handleJoinById = (e) => {
    e.preventDefault();
    const id = joinId.trim();
    if (!id) {
      toast.error("Paste a meeting id");
      return;
    }
    dispatch(clearMeetingSession());
    navigate(`/meetings/${id}`);
  };

  return (
    <ProjectScopedModule
      title="Meetings"
      description="Start a voice or video meeting for this project. Share the room link so others can join the same ACS group call."
    >
      <div className="grid max-w-3xl gap-8">
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            New meeting
          </h2>
          <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
            Creates a room scoped to the current project and opens the call.
          </p>
          <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="meeting-create-title"
                className="block text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]"
              >
                Title
              </label>
              <input
                id="meeting-create-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sprint planning"
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none ring-indigo-500/30 focus:ring-2"
              />
            </div>
            <button
              type="submit"
              disabled={meetingsLoading}
              className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {meetingsLoading ? "Starting…" : "Start meeting"}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Join with id
          </h2>
          <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
            If someone shared a meeting link or id, paste the Mongo id to enter the room.
          </p>
          <form onSubmit={handleJoinById} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="meeting-join-id"
                className="block text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]"
              >
                Meeting id
              </label>
              <input
                id="meeting-join-id"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                placeholder="64-character hex id"
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 font-mono text-[13px] text-[var(--color-text-primary)] outline-none ring-indigo-500/30 focus:ring-2"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
            >
              Join
            </button>
          </form>
        </section>
      </div>
    </ProjectScopedModule>
  );
}
