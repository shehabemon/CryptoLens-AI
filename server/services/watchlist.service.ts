import { prisma } from "../lib/prisma.js";

export async function getWatchlist(userId: string) {
  const items = await prisma.watchlistItem.findMany({
    where: { userId },
    select: { assetId: true },
    orderBy: { createdAt: "asc" },
  });
  return items.map((item) => item.assetId);
}

export async function addToWatchlist(userId: string, assetId: string) {
  // upsert to make it idempotent
  await prisma.watchlistItem.upsert({
    where: { userId_assetId: { userId, assetId } },
    create: { userId, assetId },
    update: {},
  });
}

export async function removeFromWatchlist(userId: string, assetId: string) {
  await prisma.watchlistItem.deleteMany({
    where: { userId, assetId },
  });
}
