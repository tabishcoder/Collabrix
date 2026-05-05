/** Client-side sent / delivered / read for the current user's own bubbles. */
export function computeReceiptStatusClient(msg, participantIds, readReceipts, currentUserId) {
  if (!msg?.createdAt || !currentUserId) return "sent";
  const senderId = String(msg.sender?._id || msg.sender);
  if (senderId !== String(currentUserId)) return null;
  const others = (participantIds || []).map(String).filter((id) => id !== String(currentUserId));
  if (!others.length) return "read";
  const delivered = (msg.deliveredTo || []).map((d) => String(d._id || d));
  const allDelivered = others.every((o) => delivered.includes(o));
  if (!allDelivered) return "sent";
  const allRead = others.every((o) => {
    const lr = readReceipts?.[o];
    if (!lr) return false;
    return new Date(lr) >= new Date(msg.createdAt);
  });
  if (allRead) return "read";
  return "delivered";
}

export function mergeMessagesById(existing, incoming) {
  const map = new Map();
  for (const m of [...(existing || []), ...(incoming || [])]) {
    if (!m?._id) continue;
    const id = String(m._id);
    const prev = map.get(id);
    if (!prev) {
      map.set(id, m);
      continue;
    }
    const tNew = new Date(m.updatedAt || m.createdAt).getTime();
    const tOld = new Date(prev.updatedAt || prev.createdAt).getTime();
    map.set(id, tNew >= tOld ? { ...prev, ...m } : { ...m, ...prev });
  }
  return [...map.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}
