import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../middleware/errorHandler.js";

export interface CreateHoldingInput {
  assetId: string;
  symbol: string;
  name: string;
  image?: string;
  amount: number;
  buyPrice: number;
  buyDate: string; // ISO string
}

export interface UpdateHoldingInput {
  amount?: number;
  buyPrice?: number;
  buyDate?: string;
}

export async function getHoldings(userId: string) {
  return prisma.holding.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function addHolding(userId: string, data: CreateHoldingInput) {
  return prisma.holding.create({
    data: {
      userId,
      assetId: data.assetId,
      symbol: data.symbol,
      name: data.name,
      image: data.image,
      amount: data.amount,
      buyPrice: data.buyPrice,
      buyDate: new Date(data.buyDate),
    },
  });
}

export async function updateHolding(
  userId: string,
  holdingId: string,
  data: UpdateHoldingInput
) {
  // Ensure the holding belongs to this user
  const existing = await prisma.holding.findFirst({
    where: { id: holdingId, userId },
  });

  if (!existing) {
    throw new NotFoundError("Holding not found");
  }

  return prisma.holding.update({
    where: { id: holdingId },
    data: {
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.buyPrice !== undefined && { buyPrice: data.buyPrice }),
      ...(data.buyDate !== undefined && { buyDate: new Date(data.buyDate) }),
    },
  });
}

export async function deleteHolding(userId: string, holdingId: string) {
  const existing = await prisma.holding.findFirst({
    where: { id: holdingId, userId },
  });

  if (!existing) {
    throw new NotFoundError("Holding not found");
  }

  return prisma.holding.delete({ where: { id: holdingId } });
}
