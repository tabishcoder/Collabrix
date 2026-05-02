import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhoneSlash } from "react-icons/fa";
import { getSocket } from "../../services/socket";
import {
  applyMeetingFromSocket,
  clearMeetingSession,
  fetchMeetingById,
  joinMeeting,
  leaveMeeting,
  endMeeting,
} from "./meetingsSlice";
import { useAcsGroupCall } from "./useAcsGroupCall";
import { pushRecentMeeting } from "./recentMeetingsStorage";

export default function MeetingRoomPage() {
  const { meetingId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const activeProject = useSelector((s) => s.projects.activeProject);
  const meeting = useSelector((s) => s.meetings.activeMeeting);
  const acs = useSelector((s) => s.meetings.acs);
  const loading = useSelector((s) => s.meetings.loading);
  const loadError = useSelector((s) => s.meetings.error);

  const [localHost, setLocalHost] = useState(null);
  const [remoteHost, setRemoteHost] = useState(null);
  const localHostRef = useRef(null);
  const remoteHostRef = useRef(null);
  useEffect(() => {
    localHostRef.current = localHost;
  }, [localHost]);
  useEffect(() => {
    remoteHostRef.current = remoteHost;
  }, [remoteHost]);

  const {
    connect,
    disconnect,
    sdkState,
    error: acsError,
    setError: setAcsError,
    isMuted,
    isCameraOn,
    toggleMute,
    toggleCamera,
  } = useAcsGroupCall();

  const leavingRef = useRef(false);
  const joinAttemptedRef = useRef(false);

  const createdById =
    meeting?.createdBy && typeof meeting.createdBy === "object"
      ? String(meeting.createdBy._id)
      : meeting?.createdBy
        ? String(meeting.createdBy)
        : "";
  const isHost = user?._id && createdById && String(user._id) === createdById;

  const goBackToHub = useCallback(() => {
    navigate("/meetings");
  }, [navigate]);

  const teardown = useCallback(async () => {
    await disconnect(remoteHostRef.current);
    dispatch(clearMeetingSession());
  }, [disconnect, dispatch]);

  useEffect(() => {
    joinAttemptedRef.current = false;
  }, [meetingId]);

  useEffect(() => {
    if (!meetingId) return undefined;
    leavingRef.current = false;
    dispatch(fetchMeetingById(meetingId));
    return () => {
      dispatch(clearMeetingSession());
    };
  }, [dispatch, meetingId]);

  // joinAttemptedRef avoids duplicate POST /join when `meeting` is replaced by socket merges
  useEffect(() => {
    if (!meetingId || !meeting || meeting.status !== "active") return undefined;
    if (joinAttemptedRef.current) return undefined;
    joinAttemptedRef.current = true;
    dispatch(joinMeeting(meetingId))
      .unwrap()
      .then((data) => {
        if (activeProject?._id && data?.meeting) {
          pushRecentMeeting(String(activeProject._id), data.meeting);
        }
      })
      .catch((msg) => {
        joinAttemptedRef.current = false;
        toast.error(typeof msg === "string" ? msg : "Could not join meeting");
      });
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- joinAttemptedRef avoids re-POST when `meeting` reference changes from sockets
  }, [dispatch, meetingId, meeting?.status, meeting?._id, activeProject?._id]);

  useEffect(() => {
    if (!meetingId) return undefined;
    const socket = getSocket();
    socket.emit("join-meeting", meetingId);

    const onStarted = (payload) => {
      if (String(payload?.meetingId) !== String(meetingId)) return;
      dispatch(applyMeetingFromSocket(payload));
    };
    const onJoined = (payload) => {
      if (String(payload?.meetingId) !== String(meetingId)) return;
      dispatch(applyMeetingFromSocket(payload));
    };
    const onLeft = (payload) => {
      if (String(payload?.meetingId) !== String(meetingId)) return;
      dispatch(applyMeetingFromSocket(payload));
    };
    const onEnded = async (payload) => {
      if (String(payload?.meetingId) !== String(meetingId)) return;
      dispatch(applyMeetingFromSocket(payload));
      toast("Meeting ended");
      await disconnect(remoteHostRef.current);
      navigate("/meetings");
    };

    socket.on("meeting:started", onStarted);
    socket.on("meeting:user-joined", onJoined);
    socket.on("meeting:user-left", onLeft);
    socket.on("meeting:ended", onEnded);

    return () => {
      socket.emit("leave-meeting", meetingId);
      socket.off("meeting:started", onStarted);
      socket.off("meeting:user-joined", onJoined);
      socket.off("meeting:user-left", onLeft);
      socket.off("meeting:ended", onEnded);
    };
  }, [dispatch, meetingId, navigate, disconnect]);

  useEffect(() => {
    if (!meetingId || !acs?.token || !meeting?.groupId || meeting.status !== "active") {
      return undefined;
    }
    if (!localHost || !remoteHost) return undefined;

    let cancelled = false;
    setAcsError(null);
    (async () => {
      try {
        await connect({
          initialToken: acs.token,
          meetingId,
          groupId: meeting.groupId,
          displayName: user?.name || user?.email || "Guest",
          localContainer: localHost,
          remoteContainer: remoteHost,
        });
      } catch (e) {
        if (!cancelled) {
          const msg = e?.message || String(e);
          setAcsError(msg);
          toast.error(msg);
        }
      }
    })();

    return () => {
      cancelled = true;
      void disconnect(remoteHost);
    };
  }, [
    meetingId,
    acs?.token,
    meeting?.groupId,
    meeting?.status,
    localHost,
    remoteHost,
    connect,
    disconnect,
    user?.name,
    user?.email,
    setAcsError,
  ]);

  const handleLeave = async () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    try {
      await disconnect(remoteHostRef.current);
      await dispatch(leaveMeeting(meetingId)).unwrap();
      toast.success("You left the meeting");
    } catch (e) {
      toast.error(typeof e === "string" ? e : "Leave failed");
    } finally {
      await teardown();
      goBackToHub();
    }
  };

  const handleEndForAll = async () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    try {
      await disconnect(remoteHostRef.current);
      await dispatch(endMeeting(meetingId)).unwrap();
      toast.success("Meeting ended");
    } catch (e) {
      toast.error(typeof e === "string" ? e : "Could not end meeting");
    } finally {
      await teardown();
      goBackToHub();
    }
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}/meetings/${meetingId}`;
    void navigator.clipboard.writeText(url).then(
      () => toast.success("Link copied"),
      () => toast.error("Could not copy link"),
    );
  };

  if (!meetingId) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-[var(--color-text-secondary)]">
        Missing meeting id.
      </div>
    );
  }

  if (loadError && !meeting) {
    return (
      <div className="space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <p className="text-[var(--color-text-secondary)]">{loadError}</p>
        <Link
          to="/meetings"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Back to meetings
        </Link>
      </div>
    );
  }

  if (meeting?.status === "ended") {
    return (
      <div className="space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
          {meeting.title || "Meeting"}
        </h1>
        <p className="text-[13px] text-[var(--color-text-muted)]">This meeting has ended.</p>
        <Link
          to="/meetings"
          className="inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Back to meetings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to="/meetings"
            className="text-[12px] font-medium text-indigo-600 hover:text-indigo-500"
          >
            Meetings
          </Link>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {meeting?.title || "Meeting"}
          </h1>
          <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">
            Room · ACS {sdkState === "connected" ? "connected" : sdkState}
            {loading ? " · syncing…" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyInviteLink}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-[12px] font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
          >
            Copy invite link
          </button>
        </div>
      </div>

      {(acsError || loadError) && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-900 dark:text-amber-100">
          {acsError || loadError}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr]">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            You
          </p>
          <div
            ref={setLocalHost}
            className="flex min-h-[200px] items-center justify-center overflow-hidden rounded-lg border border-[var(--color-border)] bg-black/80"
          />
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Participants
          </p>
          <div
            ref={setRemoteHost}
            className="flex min-h-[200px] flex-wrap gap-2 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-2"
          />
        </div>
      </div>

      {meeting?.participants?.length ? (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]/80 p-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Roster (app)
          </p>
          <ul className="flex flex-wrap gap-2 text-[12px] text-[var(--color-text-secondary)]">
            {meeting.participants.map((p) => (
              <li
                key={String(p.user?._id || p.user)}
                className="rounded-md bg-[var(--color-surface-hover)] px-2 py-1"
              >
                {p.user?.name || p.user?.email || "User"}{" "}
                <span className="text-[var(--color-text-muted)]">({p.role})</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-4">
        <button
          type="button"
          onClick={() => void toggleMute()}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
        >
          {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
          {isMuted ? "Unmute" : "Mute"}
        </button>
        <button
          type="button"
          onClick={() => void toggleCamera(localHostRef.current)}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
        >
          {isCameraOn ? <FaVideo /> : <FaVideoSlash />}
          {isCameraOn ? "Camera off" : "Camera on"}
        </button>
        <button
          type="button"
          onClick={() => void handleLeave()}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <FaPhoneSlash />
          Leave
        </button>
        {isHost ? (
          <button
            type="button"
            onClick={() => void handleEndForAll()}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            End for everyone
          </button>
        ) : null}
      </div>
    </div>
  );
}
