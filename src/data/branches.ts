import type { Branch } from "@/lib/types";

/** Generate 30-min time slots for today between branch hours, starting from now+30min. */
export function generateTimeSlots(branch: Branch, stepMin = 30): string[] {
  const [fh, fm] = branch.openFrom.split(":").map(Number);
  const [th, tm] = branch.openTo.split(":").map(Number);
  const now = new Date();
  const start = new Date();
  start.setHours(fh, fm, 0, 0);
  const end = new Date();
  end.setHours(th, tm, 0, 0);
  if (end <= start) end.setDate(end.getDate() + 1);

  const earliest = new Date(now.getTime() + 30 * 60 * 1000);
  const cursor = start > earliest ? new Date(start) : new Date(earliest);
  const min = cursor.getMinutes();
  const rounded = Math.ceil(min / stepMin) * stepMin;
  cursor.setMinutes(rounded, 0, 0);

  // Yopilish vaqtining O'ZI kiritilmaydi: backend ish vaqti oynasini yuqori chegarada
  // istisno qiladi (target < toMinutes), shuning uchun "cursor < end".
  const slots: string[] = [];
  while (cursor < end && slots.length < 24) {
    const hh = String(cursor.getHours()).padStart(2, "0");
    const mm = String(cursor.getMinutes()).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
    cursor.setMinutes(cursor.getMinutes() + stepMin);
  }
  return slots;
}
