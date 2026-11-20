export function visibleToUser<T extends { to: string }>(rows: T[], userId: string | null): T[] {
  return userId ? rows.filter(n => n.to === "all" || n.to === userId) : [];
}
export function unreadRows<T extends { id: string }>(rows: T[], readIds: string[]): T[] {
  return rows.filter(n => !readIds.includes(n.id));
}