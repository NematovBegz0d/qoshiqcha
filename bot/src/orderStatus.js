export const ORDER_STATUS_TRANSITIONS = Object.freeze({
  new: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["delivering", "cancelled"],
  delivering: ["completed"],
  completed: [],
  cancelled: [],
});

export function getNextOrderStatuses(status) {
  return ORDER_STATUS_TRANSITIONS[status] ?? [];
}

export function canChangeOrderStatus(from, to) {
  return getNextOrderStatuses(from).includes(to);
}
