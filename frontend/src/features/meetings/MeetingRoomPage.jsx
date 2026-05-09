import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhoneSlash,
  FaSignInAlt,
} from "react-icons/fa";
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

function formatMeetingWhen(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

function formatDuration(startIso, endIso) {
  if (!startIso || !endIso) return null;
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function participantDisplayName(p) {
  const u = p?.user;
  if (u && typeof u === "object") return u.name || u.email || "User";
  return "User";
}

function MeetingParticipantTable({ participants }) {
  const rows = [...(participants || [])].sort(
    (a, b) => new Date(a.joinedAt || 0).getTime() - new Date(b.joinedAt || 0).getTime(),
  );
  if (!rows.length) {
    return (
      <p className="text-[12px] text-[var(--color-text-muted)]">No join records for this session.</p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
      <table className="w-full min-w-[320px] border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]/60">
            <th className="px-3 py-2 font-semibold text-[var(--color-text-secondary)]">Participant</th>
            <th className="px-3 py-2 font-semibold text-[var(--color-text-secondary)]">Role</th>
            <th className="px-3 py-2 font-semibold text-[var(--color-text-secondary)]">Joined</th>
            <th className="px-3 py-2 font-semibold text-[var(--color-text-secondary)]">Left</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, idx) => (
            <tr key={`${participantDisplayName(p)}-${idx}`} className="border-b border-[var(--color-border)] last:border-0">
              <td className="px-3 py-2 text-[var(--color-text-primary)]">{participantDisplayName(p)}</td>
              <td className="px-3 py-2 capitalize text-[var(--color-text-muted)]">{p.role || "—"}</td>
              <td className="px-3 py-2 text-[var(--color-text-secondary)]">{formatMeetingWhen(p.joinedAt)}</td>
              <td className="px-3 py-2 text-[var(--color-text-secondary)]">
                {p.leftAt ? formatMeetingWhen(p.leftAt) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
  const [joinUiError, setJoinUiError] = useState(null);
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

  const runJoinMeeting = useCallback(() => {
    if (!meetingId || meeting?.status !== "active") return;
    joinAttemptedRef.current = true;
    dispatch(joinMeeting(meetingId))
      .unwrap()
      .then((data) => {
        setJoinUiError(null);
        if (activeProject?._id && data?.meeting && (data.meeting.callKind || "meeting") !== "chat_voice") {
          pushRecentMeeting(String(activeProject._id), data.meeting);
        }
      })
      .catch((msg) => {
        joinAttemptedRef.current = false;
        const m = typeof msg === "string" ? msg : "Could not join meeting";
        setJoinUiError(m);
        toast.error(m);
      });
  }, [dispatch, meetingId, meeting?.status, activeProject?._id]);

  useEffect(() => {
    joinAttemptedRef.current = false;
    setJoinUiError(null);
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
    runJoinMeeting();
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- joinAttemptedRef avoids re-POST when `meeting` reference changes from sockets
  }, [runJoinMeeting, meetingId, meeting?.status, meeting?._id]);

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

  if (loading && !meeting && !loadError) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center text-[var(--color-text-muted)]">
        Loading meeting…
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
    const hostName = meeting.createdBy && typeof meeting.createdBy === "object"
      ? meeting.createdBy.name || meeting.createdBy.email || "Host"
      : "Host";
    const duration = formatDuration(meeting.createdAt, meeting.endedAt);

    return (
      <div className="space-y-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <div>
          <Link
            to="/meetings"
            className="text-[12px] font-medium text-indigo-600 hover:text-indigo-500"
          >
            Meetings
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {meeting.title || "Meeting"}
          </h1>
          <p className="mt-1 inline-flex rounded-md bg-[var(--color-border)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Ended
          </p>
        </div>

        <dl className="grid gap-3 text-[13px] sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              Started
            </dt>
            <dd className="mt-0.5 text-[var(--color-text-primary)]">{formatMeetingWhen(meeting.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              Ended
            </dt>
            <dd className="mt-0.5 text-[var(--color-text-primary)]">{formatMeetingWhen(meeting.endedAt)}</dd>
          </div>
          {duration ? (
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                Duration
              </dt>
              <dd className="mt-0.5 text-[var(--color-text-primary)]">{duration}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              Host
            </dt>
            <dd className="mt-0.5 text-[var(--color-text-primary)]">{hostName}</dd>
          </div>
        </dl>

        <div>
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Who joined
          </h2>
          <MeetingParticipantTable participants={meeting.participants} />
        </div>

        <Link
          to="/meetings"
          className="inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Back to meetings
        </Link>
      </div>
    );
  }

  const liveHostName =
    meeting?.createdBy && typeof meeting.createdBy === "object"
      ? meeting.createdBy.name || meeting.createdBy.email || "Host"
      : "Host";

  const joiningRoom = Boolean(loading && !acs?.token);

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

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]/80 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <dl className="grid gap-3 text-[13px] sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                Started
              </dt>
              <dd className="mt-0.5 text-[var(--color-text-primary)]">{formatMeetingWhen(meeting?.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                Host
              </dt>
              <dd className="mt-0.5 text-[var(--color-text-primary)]">{liveHostName}</dd>
            </div>
          </dl>
          <p className="inline-flex shrink-0 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            Live
          </p>
        </div>

        {!acs?.token ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--color-border)] pt-4">
            <button
              type="button"
              disabled={joiningRoom}
              onClick={() => runJoinMeeting()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaSignInAlt />
              {joiningRoom ? "Joining…" : joinUiError ? "Try again" : "Join meeting"}
            </button>
            {!joiningRoom ? (
              <span className="text-[12px] text-[var(--color-text-muted)]">
                Join to receive a media token and open the room.
              </span>
            ) : null}
          </div>
        ) : sdkState !== "connected" && sdkState !== "connecting" ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--color-border)] pt-4">
            <button
              type="button"
              onClick={() => runJoinMeeting()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              <FaSignInAlt />
              Rejoin meeting
            </button>
            <span className="text-[12px] text-[var(--color-text-muted)]">
              Refreshes your token if media dropped.
            </span>
          </div>
        ) : sdkState === "connecting" ? (
          <p className="mt-4 border-t border-[var(--color-border)] pt-4 text-[12px] text-[var(--color-text-muted)]">
            Connecting camera and microphone…
          </p>
        ) : null}
      </div>

      {(acsError || loadError || joinUiError) && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-900 dark:text-amber-100">
          {acsError || joinUiError || loadError}
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

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]/80 p-3">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
          Attendance
        </p>
        <MeetingParticipantTable participants={meeting?.participants} />
      </div>

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
