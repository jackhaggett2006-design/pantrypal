"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ImageUp, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "starting" | "ready" | "unavailable";

const noopSubscribe = () => () => {};

/** True only after the client has hydrated — lets us defer `document.body`
 * access without a server/client markup mismatch. */
function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * In-app camera viewfinder: a bottom sheet with a live preview and a
 * Snapchat-style shutter button, so capturing a pantry photo never leaves
 * the app for the OS camera. Falls back to the system photo picker if
 * getUserMedia isn't available (e.g. dev over a non-HTTPS LAN origin).
 */
export function CameraCaptureSheet({
  open,
  onClose,
  onCapture,
}: {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [status, setStatus] = useState<Status>("starting");
  const [flash, setFlash] = useState(false);
  const mounted = useMounted();

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function start() {
      setStatus("starting");
      stopStream();
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unavailable");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("unavailable");
      }
    }

    start();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, facing]);

  function handleClose() {
    stopStream();
    onClose();
  }

  function capture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (facing === "user") {
      // Mirror front-camera shots back to how they actually looked.
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 150);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopStream();
        onCapture(new File([blob], `pantry-${Date.now()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9,
    );
  }

  function onLibraryPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    stopStream();
    onCapture(file);
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal
            aria-label="Take a photo"
            className="relative flex h-[58vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-black shadow-2xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
          >
            {/* Grab handle */}
            <div className="absolute inset-x-0 top-2 z-10 flex justify-center">
              <div className="h-1 w-10 rounded-full bg-white/30" />
            </div>

            {/* Viewfinder */}
            <div className="relative flex-1 overflow-hidden bg-neutral-900">
              <video
                ref={videoRef}
                playsInline
                muted
                className={cn(
                  "h-full w-full object-cover",
                  status !== "ready" && "opacity-0",
                  facing === "user" && "-scale-x-100",
                )}
              />

              {status === "starting" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70">
                  <div className="size-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <p className="text-sm">Opening camera…</p>
                </div>
              )}

              {status === "unavailable" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center text-white/70">
                  <p className="text-sm">
                    Camera preview isn&apos;t available here. Choose a photo
                    from your library instead.
                  </p>
                </div>
              )}

              {flash && (
                <motion.div
                  className="absolute inset-0 bg-white"
                  initial={{ opacity: 0.9 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                />
              )}

              <button
                type="button"
                onClick={handleClose}
                aria-label="Close camera"
                className="absolute right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] grid size-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm"
              >
                <X className="size-5" />
              </button>

              {status === "ready" && (
                <button
                  type="button"
                  onClick={() =>
                    setFacing((f) => (f === "environment" ? "user" : "environment"))
                  }
                  aria-label="Flip camera"
                  className="absolute left-3 top-[calc(env(safe-area-inset-top)+0.75rem)] grid size-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm"
                >
                  <RefreshCw className="size-4" />
                </button>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between bg-black px-8 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-4">
              <label className="relative grid size-11 cursor-pointer place-items-center rounded-full bg-white/10 text-white">
                <ImageUp className="size-5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={onLibraryPick}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Choose a photo from your library"
                />
              </label>

              <button
                type="button"
                onClick={capture}
                disabled={status !== "ready"}
                aria-label="Take photo"
                className="grid size-[72px] place-items-center rounded-full border-[3px] border-white/70 p-1 transition-transform active:scale-90 disabled:opacity-40"
              >
                <span className="size-full rounded-full bg-white" />
              </button>

              {/* Spacer to balance the library button so the shutter stays centered */}
              <div className="size-11" aria-hidden />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
