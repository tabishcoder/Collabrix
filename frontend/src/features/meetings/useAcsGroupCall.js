import { useCallback, useRef, useState } from "react";
import { joinMeetingApi } from "./meetingsApi";

function participantKey(identifier) {
  if (!identifier) return "unknown";
  if (identifier.communicationUserId) return identifier.communicationUserId;
  if (identifier.rawId) return identifier.rawId;
  try {
    return JSON.stringify(identifier);
  } catch {
    return "unknown";
  }
}

function subscribeRemoteParticipant(
  { VideoStreamRenderer },
  participant,
  remoteContainer,
) {
  const wrap = document.createElement("div");
  wrap.className =
    "flex min-h-[120px] min-w-[160px] flex-1 flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-black/50";
  const label = document.createElement("div");
  label.className =
    "truncate bg-black/60 px-2 py-1 text-[11px] font-medium text-white/90";
  label.textContent =
    participant.displayName || participantKey(participant.identifier);
  const videoHost = document.createElement("div");
  videoHost.className =
    "relative flex min-h-[140px] flex-1 items-center justify-center bg-black/40";
  wrap.appendChild(label);
  wrap.appendChild(videoHost);
  remoteContainer.appendChild(wrap);

  const active = new Map();
  const availListeners = new Map();

  const removeStream = async (stream) => {
    const fn = availListeners.get(stream.id);
    if (fn) {
      try {
        stream.off("isAvailableChanged", fn);
      } catch {
        /* ignore */
      }
      availListeners.delete(stream.id);
    }
    const entry = active.get(stream.id);
    if (!entry) return;
    try {
      entry.view.dispose();
    } catch {
      /* ignore */
    }
    try {
      entry.renderer.dispose();
    } catch {
      /* ignore */
    }
    active.delete(stream.id);
    if (entry.view?.target?.parentElement) {
      entry.view.target.remove();
    }
  };

  const tryRender = async (stream) => {
    if (stream.mediaStreamType !== "Video" && stream.mediaStreamType !== "ScreenSharing") {
      return;
    }
    if (!stream.isAvailable || active.has(stream.id)) return;
    try {
      const renderer = new VideoStreamRenderer(stream);
      const view = await renderer.createView({ scalingMode: "Crop" });
      view.target.className = "max-h-full max-w-full object-contain";
      videoHost.appendChild(view.target);
      active.set(stream.id, { renderer, view, stream });
    } catch {
      /* ignore */
    }
  };

  const attachStream = (stream) => {
    const onAvail = () => {
      void tryRender(stream);
    };
    availListeners.set(stream.id, onAvail);
    stream.on("isAvailableChanged", onAvail);
    void tryRender(stream);
  };

  const onVideoStreamsUpdated = ({ added, removed }) => {
    for (const s of removed) {
      void removeStream(s);
    }
    for (const s of added) {
      attachStream(s);
    }
  };

  participant.on("videoStreamsUpdated", onVideoStreamsUpdated);
  for (const s of participant.videoStreams) {
    attachStream(s);
  }

  return async () => {
    try {
      participant.off("videoStreamsUpdated", onVideoStreamsUpdated);
    } catch {
      /* ignore */
    }
    for (const s of [...participant.videoStreams]) {
      await removeStream(s);
    }
    wrap.remove();
  };
}

/**
 * Azure Communication Services group call (VoIP token from Collabrix backend).
 * Loads heavy ACS bundles via dynamic import to keep the main chunk lean.
 */
export function useAcsGroupCall() {
  const callClientRef = useRef(null);
  const callAgentRef = useRef(null);
  const credentialRef = useRef(null);
  const callRef = useRef(null);
  const localVideoStreamRef = useRef(null);
  const localRendererRef = useRef(null);
  const participantCleanupsRef = useRef(new Map());
  const miscDisposersRef = useRef([]);

  const [sdkState, setSdkState] = useState("idle");
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);

  const detachRemoteNodes = useCallback((remoteContainer) => {
    if (remoteContainer) remoteContainer.replaceChildren();
  }, []);

  const disposeAll = useCallback(async (remoteContainer) => {
    for (const [, fn] of participantCleanupsRef.current) {
      try {
        await fn();
      } catch {
        /* ignore */
      }
    }
    participantCleanupsRef.current.clear();

    for (const fn of miscDisposersRef.current) {
      try {
        await fn();
      } catch {
        /* ignore */
      }
    }
    miscDisposersRef.current = [];

    if (localRendererRef.current) {
      try {
        localRendererRef.current.dispose();
      } catch {
        /* ignore */
      }
      localRendererRef.current = null;
    }
    if (localVideoStreamRef.current) {
      try {
        localVideoStreamRef.current.dispose();
      } catch {
        /* ignore */
      }
      localVideoStreamRef.current = null;
    }

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

    detachRemoteNodes(remoteContainer);
  }, [detachRemoteNodes]);

  const registerParticipant = useCallback((sdk, participant, remoteContainer) => {
    const key = participantKey(participant.identifier);
    if (participantCleanupsRef.current.has(key)) return;
    const cleanup = subscribeRemoteParticipant(sdk, participant, remoteContainer);
    participantCleanupsRef.current.set(key, cleanup);
  }, []);

  const unregisterParticipant = useCallback(async (participant) => {
    const key = participantKey(participant.identifier);
    const fn = participantCleanupsRef.current.get(key);
    if (!fn) return;
    participantCleanupsRef.current.delete(key);
    await fn();
  }, []);

  const connect = useCallback(
    async ({
      initialToken,
      meetingId,
      groupId,
      displayName,
      localContainer,
      remoteContainer,
    }) => {
      const [{ CallClient, LocalVideoStream, VideoStreamRenderer }, { AzureCommunicationTokenCredential }] =
        await Promise.all([
          import("@azure/communication-calling"),
          import("@azure/communication-common"),
        ]);
      const sdk = { VideoStreamRenderer };

      setError(null);
      setSdkState("connecting");
      await disposeAll(remoteContainer);

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
      await deviceManager.askDevicePermission({ audio: true, video: true });

      const cameras = await deviceManager.getCameras();
      let joinOptions = {
        audioOptions: { muted: false },
      };

      if (cameras?.length && localContainer) {
        const localVideoStream = new LocalVideoStream(cameras[0]);
        localVideoStreamRef.current = localVideoStream;
        const localRenderer = new VideoStreamRenderer(localVideoStream);
        localRendererRef.current = localRenderer;
        const view = await localRenderer.createView({
          scalingMode: "Crop",
          isMirrored: true,
        });
        view.target.className = "h-full w-full max-h-[280px] object-cover";
        localContainer.replaceChildren();
        localContainer.appendChild(view.target);
        joinOptions = {
          ...joinOptions,
          videoOptions: { localVideoStreams: [localVideoStream] },
        };
        setIsCameraOn(true);
      } else {
        setIsCameraOn(false);
      }

      const call = callAgent.join({ groupId }, joinOptions);
      callRef.current = call;

      const syncMuted = () => setIsMuted(!!call.isMuted);
      const syncVideo = () => setIsCameraOn(!!call.localVideoStreams?.length);
      const syncCallState = () => {
        if (call.state === "Connected") setSdkState("connected");
        else if (call.state === "Disconnected") setSdkState("idle");
        else setSdkState("connecting");
      };

      syncMuted();
      syncVideo();
      syncCallState();

      call.on("isMutedChanged", syncMuted);
      call.on("isLocalVideoStartedChanged", syncVideo);
      call.on("stateChanged", syncCallState);

      miscDisposersRef.current.push(async () => {
        call.off("isMutedChanged", syncMuted);
        call.off("isLocalVideoStartedChanged", syncVideo);
        call.off("stateChanged", syncCallState);
      });

      for (const p of call.remoteParticipants) {
        registerParticipant(sdk, p, remoteContainer);
      }

      const rpHandler = ({ added, removed }) => {
        for (const p of removed) {
          void unregisterParticipant(p);
        }
        for (const p of added) {
          registerParticipant(sdk, p, remoteContainer);
        }
      };
      call.on("remoteParticipantsUpdated", rpHandler);
      miscDisposersRef.current.push(async () => {
        call.off("remoteParticipantsUpdated", rpHandler);
      });
    },
    [disposeAll, registerParticipant, unregisterParticipant],
  );

  const disconnect = useCallback(
    async (remoteContainer) => {
      await disposeAll(remoteContainer);
      setSdkState("idle");
      setIsMuted(false);
      setIsCameraOn(false);
    },
    [disposeAll],
  );

  const toggleMute = useCallback(async () => {
    const call = callRef.current;
    if (!call) return;
    if (call.isMuted) await call.unmute();
    else await call.mute();
  }, []);

  const toggleCamera = useCallback(async (localContainer) => {
    const call = callRef.current;
    const client = callClientRef.current;
    if (!call || !client) return;

    const [{ LocalVideoStream, VideoStreamRenderer }] = await import("@azure/communication-calling");

    if (isCameraOn && localVideoStreamRef.current) {
      try {
        await call.stopVideo(localVideoStreamRef.current);
      } catch {
        /* ignore */
      }
      if (localRendererRef.current) {
        try {
          localRendererRef.current.dispose();
        } catch {
          /* ignore */
        }
        localRendererRef.current = null;
      }
      try {
        localVideoStreamRef.current.dispose();
      } catch {
        /* ignore */
      }
      localVideoStreamRef.current = null;
      if (localContainer) localContainer.replaceChildren();
      setIsCameraOn(false);
      return;
    }

    const deviceManager = await client.getDeviceManager();
    const cameras = await deviceManager.getCameras();
    if (!cameras?.length || !localContainer) return;
    const localVideoStream = new LocalVideoStream(cameras[0]);
    localVideoStreamRef.current = localVideoStream;
    await call.startVideo(localVideoStream);
    const localRenderer = new VideoStreamRenderer(localVideoStream);
    localRendererRef.current = localRenderer;
    const view = await localRenderer.createView({
      scalingMode: "Crop",
      isMirrored: true,
    });
    view.target.className = "h-full w-full max-h-[280px] object-cover";
    localContainer.replaceChildren();
    localContainer.appendChild(view.target);
    setIsCameraOn(true);
  }, [isCameraOn]);

  return {
    connect,
    disconnect,
    sdkState,
    error,
    setError,
    isMuted,
    isCameraOn,
    toggleMute,
    toggleCamera,
  };
}
