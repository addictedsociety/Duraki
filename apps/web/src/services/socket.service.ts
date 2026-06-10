import { io, type Socket } from "socket.io-client";
import type {
  Ack,
  ClientToServerEvents,
  ServerToClientEvents,
} from "@duraki/shared";
import { serverUrl } from "./config";
import { getToken } from "./token";

export type AppClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppClientSocket | null = null;

export const getSocket = (): AppClientSocket => {
  if (!socket) {
    socket = io(serverUrl, {
      autoConnect: false,
      transports: ["websocket"],
      auth: (cb) => {
        getToken().then((token) => cb({ token: token ?? "" }));
      },
    });
  }
  return socket;
};

export const connectSocket = (): AppClientSocket => {
  const current = getSocket();
  if (!current.connected) current.connect();
  return current;
};

export const disconnectSocket = (): void => {
  socket?.disconnect();
};

/** Promise wrapper around an acknowledged client event. */
export const request = <Res>(
  event: keyof ClientToServerEvents,
  payload?: unknown,
): Promise<Res> =>
  new Promise((resolve, reject) => {
    const current = connectSocket();
    const callback = (res: Ack<Res>) => {
      if (res.ok) resolve(res.data);
      else reject(new Error(res.error));
    };
    const emit = current.emit.bind(current) as (
      e: string,
      ...args: unknown[]
    ) => void;
    if (payload === undefined) emit(event, callback);
    else emit(event, payload, callback);
  });
