"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderState = "idle" | "recording" | "blocked" | "unsupported";

const MAX_MS = 8000;

function pickMimeType(): string | undefined {
  const options = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  return options.find((type) => MediaRecorder.isTypeSupported(type));
}

/** Records a short clip from the microphone. Stops on its own after 8 seconds. */
export function useRecorder(onClip: (clip: Blob) => void) {
  const [state, setState] = useState<RecorderState>("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onClipRef = useRef(onClip);

  useEffect(() => {
    onClipRef.current = onClip;
  }, [onClip]);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const start = useCallback(async () => {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setState("blocked");
      return;
    }
    const recorder = new MediaRecorder(stream, { mimeType: pickMimeType() });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      recorderRef.current = null;
      setState("idle");
      const clip = new Blob(chunks, { type: recorder.mimeType.split(";")[0] || "audio/webm" });
      if (clip.size > 0) onClipRef.current(clip);
    };
    recorderRef.current = recorder;
    recorder.start();
    setState("recording");
    timerRef.current = setTimeout(stop, MAX_MS);
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { state, start, stop };
}
