import "dotenv/config";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { Server } from "socket.io";
import { env } from "./env";
import { ensureUser, verifyClerkToken } from "./lib/auth/clerk";
import { addConnection, removeConnection } from "./lib/connections";
import { prisma } from "./lib/db/prisma";
import { getDashboard } from "./services/stats.service";
import { registerGameHandlers } from "./socket/game.handler";
import { registerRoomHandlers } from "./socket/room.handler";
import type { AppServer, AppSocket } from "./socket/types";

/**
 * Im Dev-Betrieb soll die App auch ueber die LAN-IP (z. B. vom Handy)
 * erreichbar sein. Wir erlauben daher localhost sowie private Netz-Adressen
 * auf beliebigem Port, zusaetzlich zum konfigurierten WEB_ORIGIN.
 */
const lanOriginPattern =
  /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[\w-]+\.local)(:\d+)?$/i;

const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin) return true;
  if (origin === env.webOrigin) return true;
  return lanOriginPattern.test(origin);
};

const corsOrigin = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) => callback(null, isAllowedOrigin(origin));

const app = express();
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

interface AuthedRequest extends Request {
  userId?: string;
}

const restAuth = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      res.status(401).json({ error: "Nicht authentifiziert" });
      return;
    }
    const verified = await verifyClerkToken(token);
    const user = await ensureUser(verified);
    req.userId = user.id;
    next();
  } catch (error) {
    console.error("[auth] REST-Verifikation fehlgeschlagen:", error instanceof Error ? error.message : error);
    res.status(401).json({ error: "Authentifizierung fehlgeschlagen" });
  }
};

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/me", restAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) {
    res.status(404).json({ error: "Nutzer nicht gefunden" });
    return;
  }
  res.json({ id: user.id, name: user.name, avatarUrl: user.avatarUrl });
});

app.get("/api/dashboard", restAuth, async (req: AuthedRequest, res) => {
  const dashboard = await getDashboard(req.userId!);
  res.json(dashboard);
});

const httpServer = createServer(app);

const io: AppServer = new Server(httpServer, {
  cors: { origin: corsOrigin, credentials: true },
});

io.use(async (socket: AppSocket, next) => {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Kein Token"));
    const verified = await verifyClerkToken(token);
    const user = await ensureUser(verified);
    socket.data.userId = user.id;
    socket.data.clerkId = user.clerkId;
    next();
  } catch (error) {
    console.error("[auth] Socket-Verifikation fehlgeschlagen:", error instanceof Error ? error.message : error);
    next(new Error("Authentifizierung fehlgeschlagen"));
  }
});

io.on("connection", (socket: AppSocket) => {
  addConnection(socket.data.userId, socket.id);
  registerRoomHandlers(io, socket);
  registerGameHandlers(io, socket);

  socket.on("disconnect", () => {
    removeConnection(socket.data.userId, socket.id);
  });
});

const lanAddresses = (): string[] =>
  Object.values(networkInterfaces())
    .flat()
    .filter((net): net is NonNullable<typeof net> => Boolean(net) && net!.family === "IPv4" && !net!.internal)
    .map((net) => net.address);

httpServer.listen(env.port, "0.0.0.0", () => {
  console.log(`Duraki server listening on http://localhost:${env.port}`);
  for (const address of lanAddresses()) {
    console.log(`  LAN: http://${address}:${env.port}  (Web-App: http://${address}:5173)`);
  }
});
