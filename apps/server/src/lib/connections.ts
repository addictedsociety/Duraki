/** Tracks which socket ids belong to a user (supports multiple tabs). */
const userSockets = new Map<string, Set<string>>();

export const addConnection = (userId: string, socketId: string): void => {
  const set = userSockets.get(userId) ?? new Set<string>();
  set.add(socketId);
  userSockets.set(userId, set);
};

export const removeConnection = (userId: string, socketId: string): void => {
  const set = userSockets.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) userSockets.delete(userId);
};

export const socketsForUser = (userId: string): string[] =>
  Array.from(userSockets.get(userId) ?? []);
