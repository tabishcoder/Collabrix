/**
 * WhatsApp-style tick marks with Meet-inspired traffic colours:
 * — Sent: single tick (red tint)
 * — Delivered: double tick (amber / yellow)
 * — Read: double tick (green)
 * Designed for outgoing (indigo) bubbles; includes title for accessibility.
 */
export default function MessageReceiptTicks({ status }) {
  const s = status || "sent";
  const tick = "font-sans text-[0.72rem] font-bold leading-none tracking-[-0.12em]";

  if (s === "read") {
    return (
      <span
        className={`inline-flex select-none items-center text-emerald-300 ${tick}`}
        title="Read"
        aria-label="Read by everyone"
      >
        ✓✓
      </span>
    );
  }
  if (s === "delivered") {
    return (
      <span
        className={`inline-flex select-none items-center text-amber-200 ${tick}`}
        title="Delivered"
        aria-label="Delivered to everyone’s devices"
      >
        ✓✓
      </span>
    );
  }
  return (
    <span
      className={`inline-flex select-none items-center text-red-200 ${tick}`}
      title="Sent"
      aria-label="Sent from your device"
    >
      ✓
    </span>
  );
}
