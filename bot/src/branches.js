export const branches = Object.freeze([
  {
    id: "1",
    name: "Markaziy filial",
    openFrom: "09:00",
    openTo: "24:00",
  },
  {
    id: "2",
    name: "Yunusobod filial",
    openFrom: "10:00",
    openTo: "23:00",
  },
  {
    id: "3",
    name: "Sergeli filial",
    openFrom: "09:00",
    openTo: "22:00",
  },
]);

export function getBranchById(id) {
  return branches.find((branch) => branch.id === id) ?? null;
}
