// TODO: Replace with real branch data (name, address, phone, coordinates, hours)
export type Branch = {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  openFrom: string; // "09:00"
  openTo: string; // "23:00"
  lat: number;
  lng: number;
};

export const branches: Branch[] = [
  {
    id: "1",
    name: "Markaziy filial",
    address: "Toshkent sh., Chilonzor 9-kvartal, 12-uy",
    phone: "+998 71 200 00 00",
    hours: "09:00 - 00:00",
    openFrom: "09:00",
    openTo: "24:00",
    lat: 41.2856,
    lng: 69.2034,
  },
  {
    id: "2",
    name: "Yunusobod filial",
    address: "Toshkent sh., Yunusobod 4-kvartal, 25-uy",
    phone: "+998 71 200 00 01",
    hours: "10:00 - 23:00",
    openFrom: "10:00",
    openTo: "23:00",
    lat: 41.3613,
    lng: 69.2877,
  },
  {
    id: "3",
    name: "Sergeli filial",
    address: "Toshkent sh., Sergeli 7-kvartal, 5-uy",
    phone: "+998 71 200 00 02",
    hours: "09:00 - 22:00",
    openFrom: "09:00",
    openTo: "22:00",
    lat: 41.2287,
    lng: 69.2257,
  },
];

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
  // round up to next step
  const min = cursor.getMinutes();
  const rounded = Math.ceil(min / stepMin) * stepMin;
  cursor.setMinutes(rounded, 0, 0);

  const slots: string[] = [];
  while (cursor <= end && slots.length < 24) {
    const hh = String(cursor.getHours()).padStart(2, "0");
    const mm = String(cursor.getMinutes()).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
    cursor.setMinutes(cursor.getMinutes() + stepMin);
  }
  return slots;
}
