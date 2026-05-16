import { create } from "zustand";

type NotifState = {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
};

export const useNotifStore = create<NotifState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (unreadCount) => set({ unreadCount }),
}));
