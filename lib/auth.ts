import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Role, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "itsm_session";
const SESSION_MAX_AGE = 60 * 60 * 8;
const DEFAULT_EMAIL_DOMAIN = "local.itsm";

type SessionPayload = {
  userId: string;
  username: string;
  role: string;
  exp: number;
};

export type AuthUser = Pick<User, "id" | "username" | "email" | "name" | "isActive"> & {
  role: Pick<Role, "id" | "name" | "description"> | null;
};

function getSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-only-change-this-secret";
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string) {
  return crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("base64url");
  return `pbkdf2_sha256$120000$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash?: string | null) {
  if (!storedHash) return false;
  const [algorithm, iterationsText, salt, hash] = storedHash.split("$");
  if (algorithm !== "pbkdf2_sha256" || !iterationsText || !salt || !hash) return false;
  const iterations = Number(iterationsText);
  if (!Number.isInteger(iterations) || iterations < 100000) return false;
  const candidate = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("base64url");
  return safeEqual(candidate, hash);
}

export function createSessionToken(user: AuthUser) {
  const payload: SessionPayload = {
    userId: user.id,
    username: user.username ?? user.email,
    role: user.role?.name ?? "VIEWER",
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
  };
  const body = base64Url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

function parseSessionToken(token?: string): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature || !safeEqual(sign(body), signature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.userId || !payload.role || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, user: AuthUser) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: createSessionToken(user),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const payload = parseSessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findFirst({
    where: { id: payload.userId, isActive: true },
    include: { role: true }
  });

  return user as AuthUser | null;
}

export function canAccessRole(user: AuthUser | null, allowedRoles: string[]) {
  if (!user?.role?.name) return false;
  return allowedRoles.includes(user.role.name);
}

async function ensureRole(name: string, description: string) {
  return prisma.role.upsert({
    where: { name },
    update: { description },
    create: { name, description }
  });
}

async function ensureUser(username: string, password: string, roleId: string, name: string) {
  const email = `${username}@${DEFAULT_EMAIL_DOMAIN}`;
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] }
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        username,
        email,
        name,
        roleId,
        isActive: true,
        passwordHash: existing.passwordHash ?? hashPassword(password)
      }
    });
  }

  return prisma.user.create({
    data: {
      username,
      email,
      name,
      roleId,
      isActive: true,
      passwordHash: hashPassword(password)
    }
  });
}

export async function ensureDefaultUsers() {
  const adminRole = await ensureRole("SUPER_ADMIN", "Full system access");
  await ensureUser("admin", "password", adminRole.id, "ผู้ดูแลระบบ");
}
