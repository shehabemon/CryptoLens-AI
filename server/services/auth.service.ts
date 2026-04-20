import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { AppError, AuthError } from "../middleware/errorHandler.js";
import type { JwtPayload } from "../middleware/auth.js";

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString("hex");
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
}

export async function register(
  email: string,
  password: string,
  name?: string
): Promise<{ user: UserResponse; tokens: AuthTokens }> {
  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { email, passwordHash, name },
    select: { id: true, email: true, name: true },
  });

  const tokens = await createTokenPair(user.id, user.email);

  return { user, tokens };
}

export async function login(
  email: string,
  password: string
): Promise<{ user: UserResponse; tokens: AuthTokens }> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, passwordHash: true },
  });

  if (!user) {
    throw new AuthError("Invalid email or password");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new AuthError("Invalid email or password");
  }

  const tokens = await createTokenPair(user.id, user.email);

  return {
    user: { id: user.id, email: user.email, name: user.name },
    tokens,
  };
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<AuthTokens> {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!stored) {
    throw new AuthError("Invalid refresh token");
  }

  if (new Date() > stored.expiresAt) {
    // Clean up expired token
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw new AuthError("Refresh token expired");
  }

  // Rotate: delete old token and create new pair
  await prisma.refreshToken.delete({ where: { id: stored.id } });

  return createTokenPair(stored.user.id, stored.user.email);
}

export async function logout(refreshToken: string): Promise<void> {
  // Silently ignore if token doesn't exist (idempotent logout)
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
}

export async function getProfile(userId: string): Promise<UserResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    throw new AuthError("User not found");
  }

  return user;
}

// --- Internal helpers ---

async function createTokenPair(
  userId: string,
  email: string
): Promise<AuthTokens> {
  const accessToken = generateAccessToken({ userId, email });
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    },
  });

  return { accessToken, refreshToken };
}
