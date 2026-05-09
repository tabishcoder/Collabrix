import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FaMicrophone, FaMicrophoneSlash, FaPhone, FaPhoneSlash, FaUserFriends } from "react-icons/fa";
import { startChatVoiceCallApi } from "./chatApi";
import { clearIncomingVoiceInvite } from "./chatSlice";
import { endMeetingApi, joinMeetingApi, leaveMeetingApi } from "../meetings/meetingsApi";
import { useAcsVoiceOnlyCall } from "./useAcsVoiceOnlyCall";
import { getSocket } from "../../services/socket";

function createdById(meeting) {
  const c = meeting?.createdBy;
  if (!c) return null;
  return typeof c === "object" ? c._id : c;
}

export default function ChatVoiceBar({ chatId }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const incomingInvite = useSelector((s) => s.chats.incomingVoiceInvite);

  const { connect, disconnect, sdkState, error, setError, isMuted, remoteCount, toggleMute } = useAcsVoiceOnlyCall();

  const [busy, setBusy] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const activeMeetingIdRef = useRef(null);

  useEffect(() => {
    activeMeetingIdRef.current = activeMeeting?._id ? String(activeMeeting._id) : null;
  }, [activeMeeting?._id]);

  const isHost = useMemo(() => {
    if (!activeMeeting || !user?._id) return false;
    return String(createdById(activeMeeting)) === String(user._id);
  }, [activeMeeting, user?._id]);

  const showJoinBanner =
    incomingInvite &&
    String(incomingInvite.chatId) === String(chatId) &&
    !activeMeeting &&
    sdkState === "idle";

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    const socket = getSocket();
    const onEnded = (payload) => {
      const mid = payload?.meetingId ? String(payload.meetingId) : null;
      if (!mid || mid !== activeMeetingIdRef.current) return;
      void disconnect();
      setActiveMeeting(null);
      dispatch(clearIncomingVoiceInvite());
      toast("Voice call ended");
    };
    socket.on("chat:voice-call-ended", onEnded);
    return () => socket.off("chat:voice-call-ended", onEnded);
  }, [disconnect, dispatch]);

  useEffect(() => {
    return () => {
      void disconnect();
      setActiveMeeting(null);
    };
  }, [chatId, disconnect]);

  const hangUp = useCallback(async () => {
    const mid = activeMeeting?._id;
    setBusy(true);
    try {
      if (mid) {
        if (isHost) await endMeetingApi(mid);
        else await leaveMeetingApi(mid);
      }
      await disconnect();
      setActiveMeeting(null);
      dispatch(clearIncomingVoiceInvite());
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Could not leave call");
      await disconnect();
      setActiveMeeting(null);
    } finally {
      setBusy(false);
    }
  }, [activeMeeting?._id, disconnect, dispatch, isHost]);

  const startVoice = async () => {
    if (!chatId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await startChatVoiceCallApi(chatId);
      const { meeting, acs } = res.data;
      setActiveMeeting(meeting);
      await connect({
        initialToken: acs.token,
        meetingId: meeting._id,
        groupId: acs.groupId,
        displayName: user?.name || user?.email || "Member",
      });
      toast.success(res.data.reused ? "Joined voice call" : "Voice call started");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Could not start voice call";
      toast.error(msg);
      setActiveMeeting(null);
    } finally {
      setBusy(false);
    }
  };

  const joinVoice = async (meetingId) => {
    if (!meetingId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await joinMeetingApi(meetingId);
      const { meeting, acs } = res.data;
      setActiveMeeting(meeting);
      dispatch(clearIncomingVoiceInvite());
      await connect({
        initialToken: acs.token,
        meetingId: meeting._id,
        groupId: acs.groupId,
        displayName: user?.name || user?.email || "Member",
      });
      toast.success("Connected (voice)");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Could not join call";
      toast.error(msg);
      setActiveMeeting(null);
      await disconnect();
    } finally {
      setBusy(false);
    }
  };

  if (!chatId) return null;

  const inCall = Boolean(activeMeeting && sdkState === "connected");
  const connecting = sdkState === "connecting" || busy;

  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-primary)_6%,transparent)] px-3 py-2 dark:bg-[color-mix(in_oklab,var(--color-primary)_10%,transparent)] sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-card)] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          <FaPhone className="text-[10px] text-[var(--color-primary)]" aria-hidden />
          Voice (Azure)
        </span>
        {inCall ? (
          <span className="flex items-center gap-1 text-[12px] text-[var(--color-text-secondary)]">
            <FaUserFriends className="text-[11px] opacity-80" aria-hidden />
            {remoteCount + 1} on call
          </span>
        ) : (
          <span className="text-[12px] text-[var(--color-text-muted)]">Audio only · no camera</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {showJoinBanner ? (
          <button
            type="button"
            disabled={connecting}
            onClick={() => joinVoice(incomingInvite.meetingId)}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            Join voice call
          </button>
        ) : null}

        {!inCall && !connecting ? (
          <button
            type="button"
            onClick={startVoice}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            <FaPhone className="text-[11px]" aria-hidden />
            Voice call
          </button>
        ) : null}

        {connecting && !inCall ? (
          <span className="text-[12px] text-[var(--color-text-muted)]">Connecting…</span>
        ) : null}

        {inCall ? (
          <>
            <button
              type="button"
              onClick={() => toggleMute()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-card)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
              aria-pressed={isMuted}
            >
              {isMuted ? <FaMicrophoneSlash className="text-[13px]" aria-hidden /> : <FaMicrophone className="text-[13px]" aria-hidden />}
              {isMuted ? "Unmute" : "Mute"}
            </button>
            <button
              type="button"
              onClick={() => hangUp()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-1.5 text-[12px] font-semibold text-red-700 hover:bg-red-500/15 disabled:opacity-50 dark:text-red-300"
            >
              <FaPhoneSlash className="text-[11px]" aria-hidden />
              {isHost ? "End for everyone" : "Leave"}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
