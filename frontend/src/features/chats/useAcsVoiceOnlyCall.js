import { useCallback, useRef, useState } from "react";
import { joinMeetingApi } from "../meetings/meetingsApi";

/**
 * Azure Communication Services — audio-only group call (same VoIP token + groupId pattern as meetings).
 */
export function useAcsVoiceOnlyCall() {
  const callClientRef = useRef(null);
  const callAgentRef = useRef(null);
  const credentialRef = useRef(null);
  const callRef = useRef(null);
  const miscDisposersRef = useRef([]);

  const [sdkState, setSdkState] = useState("idle");
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [remoteCount, setRemoteCount] = useState(0);

  const disposeAll = useCallback(async () => {
    for (const fn of miscDisposersRef.current) {
      try {
        await fn();
      } catch {
        /* ignore */
      }
    }
    miscDisposersRef.current = [];

    if (callRef.current) {
      try {
        await callRef.current.hangUp({ forEveryone: false });
      } catch {
        /* ignore */
      }
      callRef.current = null;
    }

    if (callAgentRef.current) {
      try {
        await callAgentRef.current.dispose();
      } catch {
        /* ignore */
      }
      callAgentRef.current = null;
    }

    if (credentialRef.current) {
      try {
        credentialRef.current.dispose();
      } catch {
        /* ignore */
      }
      credentialRef.current = null;
    }

    if (callClientRef.current) {
      try {
        await callClientRef.current.dispose();
      } catch {
        /* ignore */
      }
      callClientRef.current = null;
    }

    setRemoteCount(0);
  }, []);

  const connect = useCallback(
    async ({ initialToken, meetingId, groupId, displayName }) => {
      const [{ CallClient }, { AzureCommunicationTokenCredential }] = await Promise.all([
        import("@azure/communication-calling"),
        import("@azure/communication-common"),
      ]);

      setError(null);
      setSdkState("connecting");
      await disposeAll();

      const credential = new AzureCommunicationTokenCredential({
        token: initialToken,
        tokenRefresher: async () => {
          const res = await joinMeetingApi(meetingId);
          return res.data.acs.token;
        },
        refreshProactively: true,
      });
      credentialRef.current = credential;

      const callClient = new CallClient();
      callClientRef.current = callClient;

      const callAgent = await callClient.createCallAgent(credential, {
        displayName: displayName || "Guest",
      });
      callAgentRef.current = callAgent;

      const deviceManager = await callClient.getDeviceManager();
      await deviceManager.askDevicePermission({ audio: true, video: false });

      const joinOptions = { audioOptions: { muted: false } };
      const call = callAgent.join({ groupId }, joinOptions);
      callRef.current = call;

      const syncMuted = () => setIsMuted(!!call.isMuted);
      const syncRemotes = () => setRemoteCount(call.remoteParticipants?.length ?? 0);
      const syncState = () => {
        if (call.state === "Connected") setSdkState("connected");
        else if (call.state === "Disconnected") setSdkState("idle");
        else setSdkState("connecting");
      };

      syncMuted();
      syncRemotes();
      syncState();

      call.on("isMutedChanged", syncMuted);
      call.on("stateChanged", syncState);
      call.on("remoteParticipantsUpdated", syncRemotes);

      miscDisposersRef.current.push(async () => {
        call.off("isMutedChanged", syncMuted);
        call.off("stateChanged", syncState);
        call.off("remoteParticipantsUpdated", syncRemotes);
      });
    },
    [disposeAll],
  );

  const disconnect = useCallback(async () => {
    await disposeAll();
    setSdkState("idle");
    setIsMuted(false);
  }, [disposeAll]);

  const toggleMute = useCallback(async () => {
    const call = callRef.current;
    if (!call) return;
    if (call.isMuted) await call.unmute();
    else await call.mute();
  }, []);

  return {
    connect,
    disconnect,
    sdkState,
    error,
    setError,
    isMuted,
    remoteCount,
    toggleMute,
  };
}
