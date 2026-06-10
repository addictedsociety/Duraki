import type { Action, PlayerView, Seat } from "@duraki/game-core";

export type RoomStatus = "WAITING" | "PLAYING" | "FINISHED" | "ABANDONED";

export interface PublicUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface RoomMemberDto extends PublicUser {
  isReady: boolean;
  isHost: boolean;
  seat: Seat | null;
}

export interface RoomDto {
  id: string;
  code: string;
  status: RoomStatus;
  members: RoomMemberDto[];
  gameId: string | null;
}

export type PopupKind =
  | "attack"
  | "defended"
  | "pushed"
  | "taken"
  | "won"
  | "durak";

export interface PopupEvent {
  kind: PopupKind;
  seat: Seat;
}

export interface AckOk<T> {
  ok: true;
  data: T;
}

export interface AckError {
  ok: false;
  error: string;
}

export type Ack<T> = AckOk<T> | AckError;

export interface ServerToClientEvents {
  "room:update": (room: RoomDto) => void;
  "room:closed": (payload: { roomId: string }) => void;
  "game:started": (payload: { gameId: string }) => void;
  "game:view": (view: PlayerView) => void;
  "game:popup": (event: PopupEvent) => void;
  "game:over": (payload: { gameId: string; winnerSeat: Seat | null }) => void;
}

export interface ClientToServerEvents {
  "room:create": (cb: (res: Ack<RoomDto>) => void) => void;
  "room:join": (payload: { code: string }, cb: (res: Ack<RoomDto>) => void) => void;
  "room:leave": (payload: { roomId: string }, cb: (res: Ack<null>) => void) => void;
  "room:ready": (
    payload: { roomId: string; isReady: boolean },
    cb: (res: Ack<RoomDto>) => void,
  ) => void;
  "game:start": (payload: { roomId: string }, cb: (res: Ack<{ gameId: string }>) => void) => void;
  "game:move": (
    payload: { gameId: string; action: Action },
    cb: (res: Ack<null>) => void,
  ) => void;
  "game:sync": (payload: { gameId: string }, cb: (res: Ack<PlayerView>) => void) => void;
}

export interface SocketData {
  userId: string;
  clerkId: string;
}

// --- REST DTOs (dashboard) ---

export interface StatsDto {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winrate: number;
}

export interface OpponentStatsDto extends PublicUser {
  gamesPlayed: number;
  wins: number;
  losses: number;
  lastPlayedAt: string;
}

export interface GameHistoryDto {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: "IN_PROGRESS" | "FINISHED";
  opponents: PublicUser[];
  result: "WIN" | "LOSS" | "DRAW" | null;
}

export interface DashboardDto {
  stats: StatsDto;
  opponents: OpponentStatsDto[];
  history: GameHistoryDto[];
}
