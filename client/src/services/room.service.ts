import { gameClient } from "../colyseus/client";

/**
 * Create a new Colyseus lobby room (host).
 * Returns the Colyseus Room instance.
 */
export const createRoom = async (username: string) => {
  const room = await gameClient.create("lobby", { username });
  return room;
};

/**
 * Join an existing room by its 6-char room code.
 * Uses Colyseus matchmaking REST API to discover rooms by metadata.roomCode.
 */
export const joinRoomByCode = async (
  code: string,
  username: string
) => {
  const response = await gameClient.http.get<{ rooms: any[] }>(
    `/matchmake/lobby`
  );

  const rooms: any[] = (response as any)?.data?.rooms
    ?? (response as any)?.rooms
    ?? [];

  const target = rooms.find(
    (r: any) => r.metadata?.roomCode === code.toUpperCase()
  );

  if (!target) {
    throw new Error("Room not found. Please check the code and try again.");
  }

  const room = await gameClient.joinById(target.roomId, { username });
  return room;
};