import { useViewport } from "../hooks/useViewport";

/**
 * Viewports under 360px: full-screen centered notice only (no other UI).
 */
export default function TinyViewportFullscreenGate() {
  const { isTiny } = useViewport();

  if (!isTiny) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-[var(--color-bg)] p-4"
      aria-modal="true"
      role="presentation"
    >
      <div
        role="alert"
        aria-live="polite"
        className="w-full max-w-[min(100%,18.5rem)] rounded-2xl border border-amber-500/40 bg-amber-50 px-4 py-6 text-center shadow-[var(--shadow-modal)] dark:border-amber-400/30 dark:bg-amber-950/90"
      >
        <p className="text-[13px] font-semibold leading-snug text-amber-950 dark:text-amber-50">
          Screen too narrow
        </p>
        <p className="mt-3 text-[12px] leading-relaxed text-amber-900/90 dark:text-amber-100/85">
          Collabrix needs at least <span className="tabular-nums font-semibold">360px</span> width. Rotate your device or use a larger window to continue.
        </p>
      </div>
    </div>
  );
}
