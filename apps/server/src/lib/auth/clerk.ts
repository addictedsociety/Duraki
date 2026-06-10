import { createClerkClient, verifyToken } from "@clerk/backend";
import { env } from "../../env";
import { prisma } from "../db/prisma";

export const clerk = createClerkClient({ secretKey: env.clerkSecretKey });

export interface VerifiedUser {
  clerkId: string;
  name: string;
  avatarUrl: string | null;
}

/**
 * Verify a Clerk session token (sent over the socket handshake) and resolve
 * the basic profile fields we persist locally.
 */
export const verifyClerkToken = async (token: string): Promise<VerifiedUser> => {
  const payload = await verifyToken(token, { secretKey: env.clerkSecretKey });
  const clerkId = payload.sub;
  if (!clerkId) throw new Error("Token ohne Subject");

  const user = await clerk.users.getUser(clerkId);
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    user.primaryEmailAddress?.emailAddress ||
    "Spieler";

  return {
    clerkId,
    name,
    avatarUrl: user.imageUrl ?? null,
  };
};

/** Upsert the local user mirror for a verified Clerk identity. */
export const ensureUser = (verified: VerifiedUser) =>
  prisma.user.upsert({
    where: { clerkId: verified.clerkId },
    create: {
      clerkId: verified.clerkId,
      name: verified.name,
      avatarUrl: verified.avatarUrl,
    },
    update: { name: verified.name, avatarUrl: verified.avatarUrl },
  });
