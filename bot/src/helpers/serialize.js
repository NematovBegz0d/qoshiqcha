export function toMillis(value) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value._seconds === "number") {
    return value._seconds * 1000 + Math.floor((value._nanoseconds ?? 0) / 1000000);
  }
  return 0;
}

export function serializeOrderDoc(doc) {
  const data = doc.data() ?? {};
  const statusHistory = Array.isArray(data.statusHistory)
    ? data.statusHistory.map((h) => ({ ...h, at: toMillis(h?.at) }))
    : [];
  return {
    ...data,
    id: doc.id,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
    statusHistory,
  };
}

export function sortOrdersNewestFirst(a, b) {
  return (b.createdAt ?? 0) - (a.createdAt ?? 0);
}
