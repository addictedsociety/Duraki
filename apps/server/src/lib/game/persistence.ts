import { Prisma } from "@prisma/client";
import {
  applyMove,
  createGame,
  type Action,
  type GameState,
  type Seat,
} from "@duraki/game-core";
import { prisma } from "../db/prisma";
import { recordResult } from "../../services/stats.service";

export class GameError extends Error {}

export interface LoadedGame {
  id: string;
  state: GameState;
  /** seat -> userId */
  users: [string, string];
}

const asJson = (state: GameState): Prisma.InputJsonValue =>
  state as unknown as Prisma.InputJsonValue;

/** Start a fresh game for a room with exactly two ready members. */
export const createGameForRoom = async (roomId: string): Promise<string> => {
  const members = await prisma.roomMember.findMany({
    where: { roomId },
    orderBy: { joinedAt: "asc" },
  });
  if (members.length !== 2) throw new GameError("Es werden genau zwei Spieler benoetigt");

  const state = createGame();

  const game = await prisma.$transaction(async (tx) => {
    const created = await tx.game.create({
      data: {
        roomId,
        trumpSuit: state.trumpSuit,
        state: asJson(state),
        participants: {
          create: [
            { userId: members[0].userId, seat: 0 },
            { userId: members[1].userId, seat: 1 },
          ],
        },
      },
    });
    await tx.gameRoom.update({ where: { id: roomId }, data: { status: "PLAYING" } });
    return created;
  });

  return game.id;
};

export const loadGame = async (gameId: string): Promise<LoadedGame> => {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { participants: { orderBy: { seat: "asc" } } },
  });
  if (!game) throw new GameError("Spiel nicht gefunden");
  const users: [string, string] = [
    game.participants[0]?.userId ?? "",
    game.participants[1]?.userId ?? "",
  ];
  return { id: game.id, state: game.state as unknown as GameState, users };
};

export const seatOfUser = (game: LoadedGame, userId: string): Seat | null => {
  if (game.users[0] === userId) return 0;
  if (game.users[1] === userId) return 1;
  return null;
};

export interface ApplyResult {
  state: GameState;
  finished: boolean;
  game: LoadedGame;
}

/**
 * Validate and apply a move on behalf of `userId`. The requesting seat is
 * derived server-side, never trusted from the client payload.
 */
export const applyAction = async (
  gameId: string,
  userId: string,
  action: Action,
): Promise<ApplyResult> => {
  const game = await loadGame(gameId);
  const seat = seatOfUser(game, userId);
  if (seat === null) throw new GameError("Du bist kein Teilnehmer dieses Spiels");

  const safeAction = { ...action, seat } as Action;
  const nextState = applyMove(game.state, safeAction);
  const finished = nextState.phase === "finished";

  const participant = await prisma.gameParticipant.findUnique({
    where: { gameId_seat: { gameId, seat } },
  });
  const moveCount = await prisma.gameMove.count({ where: { gameId } });

  await prisma.$transaction(async (tx) => {
    await tx.game.update({
      where: { id: gameId },
      data: {
        state: asJson(nextState),
        ...(finished
          ? {
              status: "FINISHED",
              finishedAt: new Date(),
              winnerId:
                nextState.winner !== null ? game.users[nextState.winner] : null,
              loserId: nextState.loser !== null ? game.users[nextState.loser] : null,
            }
          : {}),
      },
    });
    if (participant) {
      await tx.gameMove.create({
        data: {
          gameId,
          participantId: participant.id,
          sequence: moveCount,
          type: safeAction.type,
          payload: asJson(safeAction as unknown as GameState),
        },
      });
    }
  });

  if (finished) {
    await recordResult(gameId, game.users, nextState.winner, nextState.loser);
  }

  return { state: nextState, finished, game };
};
