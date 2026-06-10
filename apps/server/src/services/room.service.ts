import { customAlphabet } from "nanoid";
import type { RoomDto, RoomMemberDto } from "@duraki/shared";
import type { Seat } from "@duraki/game-core";
import { prisma } from "../lib/db/prisma";

const generateCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

const MAX_MEMBERS = 2;

export class RoomError extends Error {}

const loadRoom = (roomId: string) =>
  prisma.gameRoom.findUnique({
    where: { id: roomId },
    include: {
      members: { include: { user: true }, orderBy: { joinedAt: "asc" } },
      games: { orderBy: { startedAt: "desc" }, take: 1, include: { participants: true } },
    },
  });

type LoadedRoom = NonNullable<Awaited<ReturnType<typeof loadRoom>>>;

export const toRoomDto = (room: LoadedRoom): RoomDto => {
  const latestGame = room.games[0] ?? null;
  const seatByUser = new Map<string, Seat>();
  if (latestGame && latestGame.status === "IN_PROGRESS") {
    for (const p of latestGame.participants) seatByUser.set(p.userId, p.seat as Seat);
  }

  const members: RoomMemberDto[] = room.members.map((member) => ({
    id: member.user.id,
    name: member.user.name,
    avatarUrl: member.user.avatarUrl,
    isReady: member.isReady,
    isHost: member.userId === room.hostId,
    seat: seatByUser.get(member.userId) ?? null,
  }));

  return {
    id: room.id,
    code: room.code,
    status: room.status,
    members,
    gameId:
      latestGame && latestGame.status === "IN_PROGRESS" ? latestGame.id : null,
  };
};

export const createRoom = async (userId: string): Promise<RoomDto> => {
  let code = generateCode();
  // Extremely unlikely collision, but stay safe.
  while (await prisma.gameRoom.findUnique({ where: { code } })) code = generateCode();

  const room = await prisma.gameRoom.create({
    data: {
      code,
      hostId: userId,
      members: { create: { userId } },
    },
  });
  const loaded = await loadRoom(room.id);
  return toRoomDto(loaded!);
};

export const joinRoom = async (userId: string, code: string): Promise<RoomDto> => {
  const room = await prisma.gameRoom.findUnique({
    where: { code: code.toUpperCase() },
    include: { members: true },
  });
  if (!room) throw new RoomError("Raum nicht gefunden");
  if (room.status !== "WAITING")
    throw new RoomError("Raum nimmt keine Spieler mehr auf");

  const alreadyIn = room.members.some((m) => m.userId === userId);
  if (!alreadyIn) {
    if (room.members.length >= MAX_MEMBERS)
      throw new RoomError("Raum ist voll");
    await prisma.roomMember.create({ data: { roomId: room.id, userId } });
  }

  const loaded = await loadRoom(room.id);
  return toRoomDto(loaded!);
};

export const setReady = async (
  userId: string,
  roomId: string,
  isReady: boolean,
): Promise<RoomDto> => {
  await prisma.roomMember.update({
    where: { roomId_userId: { roomId, userId } },
    data: { isReady },
  });
  const loaded = await loadRoom(roomId);
  if (!loaded) throw new RoomError("Raum nicht gefunden");
  return toRoomDto(loaded);
};

export const leaveRoom = async (userId: string, roomId: string): Promise<void> => {
  const room = await prisma.gameRoom.findUnique({ where: { id: roomId } });
  if (!room) return;
  await prisma.roomMember.deleteMany({ where: { roomId, userId } });
  if (room.status === "WAITING") {
    await prisma.gameRoom.update({
      where: { id: roomId },
      data: { status: "ABANDONED" },
    });
  }
};

export const getRoomDto = async (roomId: string): Promise<RoomDto> => {
  const loaded = await loadRoom(roomId);
  if (!loaded) throw new RoomError("Raum nicht gefunden");
  return toRoomDto(loaded);
};
