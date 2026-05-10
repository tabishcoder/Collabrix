import { useCallback, useRef } from "react";

function pickMime() {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  return "";
}

/**
 * Browser capture for free local STT: optional tab/system audio (getDisplayMedia) merged with mic.
 * Host should share a Chrome tab with "Share tab audio" checked for best multi-speaker capture.
 */
export function useMeetingTranscriptRecorder() {
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const displayStreamRef = useRef(null);
  const micStreamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const mergedTracksRef = useRef([]);

  const cleanupStreams = useCallback(() => {
    try {
      mergedTracksRef.current.forEach((t) => {
        try {
          t.stop();
        } catch {
          /* ignore */
        }
      });
      mergedTracksRef.current = [];
    } catch {
      /* ignore */
    }
    const d = displayStreamRef.current;
    if (d) {
      d.getTracks().forEach((t) => t.stop());
      displayStreamRef.current = null;
    }
    const m = micStreamRef.current;
    if (m) {
      m.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state !== "closed") {
      void ctx.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      const mr = recorderRef.current;
      recorderRef.current = null;
      if (!mr || mr.state === "inactive") {
        cleanupStreams();
        resolve(null);
        return;
      }
      const mime = mr.mimeType || pickMime() || "audio/webm";
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        chunksRef.current = [];
        cleanupStreams();
        resolve(blob.size > 512 ? blob : null);
      };
      try {
        mr.stop();
      } catch {
        cleanupStreams();
        resolve(null);
      }
    });
  }, [cleanupStreams]);

  const startRecording = useCallback(async () => {
    await stopRecording();
    chunksRef.current = [];

    let displayStream = null;
    try {
      displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
    } catch {
      /* user cancelled — mic only */
    }
    displayStreamRef.current = displayStream;

    let micStream;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (e) {
      cleanupStreams();
      throw e;
    }
    micStreamRef.current = micStream;

    const dAud = (displayStream?.getAudioTracks() || []).filter((t) => t.readyState === "live");
    const mAud = (micStream.getAudioTracks() || []).filter((t) => t.readyState === "live");

    let recordStream;
    if (dAud.length) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const dest = ctx.createMediaStreamDestination();
      dAud.forEach((track) => {
        const ms = new MediaStream([track]);
        ctx.createMediaStreamSource(ms).connect(dest);
      });
      mAud.forEach((track) => {
        const ms = new MediaStream([track]);
        ctx.createMediaStreamSource(ms).connect(dest);
      });
      recordStream = dest.stream;
      mergedTracksRef.current = [...recordStream.getAudioTracks()];
      if (displayStream) {
        displayStream.getVideoTracks().forEach((t) => t.stop());
      }
    } else {
      if (displayStream) {
        displayStream.getTracks().forEach((t) => t.stop());
        displayStreamRef.current = null;
      }
      recordStream = new MediaStream(mAud.length ? mAud : micStream.getAudioTracks());
    }

    const mime = pickMime();
    const mr = new MediaRecorder(recordStream, mime ? { mimeType: mime } : undefined);
    recorderRef.current = mr;
    mr.ondataavailable = (ev) => {
      if (ev.data?.size) chunksRef.current.push(ev.data);
    };
    mr.start(4000);
  }, [cleanupStreams, stopRecording]);

  const discardRecording = useCallback(() => {
    const mr = recorderRef.current;
    recorderRef.current = null;
    chunksRef.current = [];
    if (mr && mr.state !== "inactive") {
      try {
        mr.stop();
      } catch {
        /* ignore */
      }
    }
    cleanupStreams();
  }, [cleanupStreams]);

  return { startRecording, stopRecording, discardRecording };
}
