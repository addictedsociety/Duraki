import type { Seat } from "@duraki/game-core";
import type { DashboardDto, GameHistoryDto } from "@duraki/shared";
import { prisma } from "../lib/db/prisma";

type Result = "WIN" | "LOSS" | "DRAW";

const resultForSeat = (seat: Seat, winner: Seat | null): Result => {
  if (winner === null) return "DRAW";
  return winner === seat ? "WIN" : "LOSS";
};

const bumpStats = (result: Result) => ({
  gamesPlayed: { increment: 1 },
  wins: { increment: result === "WIN" ? 1 : 0 },
  losses: { increment: result === "LOSS" ? 1 : 0 },
  draws: { increment: result === "DRAW" ? 1 : 0 },
});

/** Persist participant results and roll up player + opponent statistics. */
export const recordResult = async (
  gameId: string,
  users: [string, string],
  winnerSeat: Seat | null,
  _loserSeat: Seat | null,
): Promise<void> => {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return;

  const seats: Seat[] = [0, 1];

  await prisma.$transaction(async (tx) => {
    for (const seat of seats) {
      const userId = users[seat];
      const opponentId = users[seat === 0 ? 1 : 0];
      if (!userId) continue;
      const result = resultForSeat(seat, winnerSeat);

      await tx.gameParticipant.update({
        where: { gameId_seat: { gameId, seat } },
        data: { result },
      });

      await tx.playerStats.upsert({
        where: { userId },
        create: {
          userId,
          gamesPlayed: 1,
          wins: result === "WIN" ? 1 : 0,
          losses: result === "LOSS" ? 1 : 0,
          draws: result === "DRAW" ? 1 : 0,
        },
        update: bumpStats(result),
      });

      if (opponentId) {
        await tx.recentOpponent.upsert({
          where: { userId_opponentId: { userId, opponentId } },
          create: {
            userId,
            opponentId,
            gamesPlayed: 1,
            wins: result === "WIN" ? 1 : 0,
            losses: result === "LOSS" ? 1 : 0,
          },
          update: {
            gamesPlayed: { increment: 1 },
            wins: { increment: result === "WIN" ? 1 : 0 },
            losses: { increment: result === "LOSS" ? 1 : 0 },
            lastPlayedAt: new Date(),
          },
        });
      }
    }

    await tx.gameRoom.update({
      where: { id: game.roomId },
      data: { status: "FINISHED" },
    });
  });
};

export const getDashboard = async (userId: string): Promise<DashboardDto> => {
  const [stats, opponents, participations] = await Promise.all([
    prisma.playerStats.findUnique({ where: { userId } }),
    prisma.recentOpponent.findMany({
      where: { userId },
      include: { opponent: true },
      orderBy: { lastPlayedAt: "desc" },
      take: 20,
    }),
    prisma.gameParticipant.findMany({
      where: { userId },
      include: {
        game: {
          include: { participants: { include: { user: true } } },
        },
      },
      orderBy: { game: { startedAt: "desc" } },
      take: 20,
    }),
  ]);

  const gamesPlayed = stats?.gamesPlayed ?? 0;
  const wins = stats?.wins ?? 0;

  const history: GameHistoryDto[] = participations.map((p) => ({
    id: p.game.id,
    startedAt: p.game.startedAt.toISOString(),
    finishedAt: p.game.finishedAt?.toISOString() ?? null,
    status: p.game.status,
    result: p.result,
    opponents: p.game.participants
      .filter((other) => other.userId !== userId)
      .map((other) => ({
        id: other.user.id,
        name: other.user.name,
        avatarUrl: other.user.avatarUrl,
      })),
  }));

  return {
    stats: {
      gamesPlayed,
      wins,
      losses: stats?.losses ?? 0,
      draws: stats?.draws ?? 0,
      winrate: gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0,
    },
    opponents: opponents.map((o) => ({
      id: o.opponent.id,
      name: o.opponent.name,
      avatarUrl: o.opponent.avatarUrl,
      gamesPlayed: o.gamesPlayed,
      wins: o.wins,
      losses: o.losses,
      lastPlayedAt: o.lastPlayedAt.toISOString(),
    })),
    history,
  };
};
