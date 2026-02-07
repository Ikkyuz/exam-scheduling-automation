import { safeFromNumber } from './../../../node_modules/effect/src/BigDecimal';
import { t } from "elysia";
import { Role } from "@/providers/database/generated/enums"; // ✅ import enum มาจาก Prisma 

export const UserResponseSchema = t.Object({
  id: t.String(),
  firstname: t.String(),
  lastname: t.String(),
  username: t.String(),
  email: t.Union([t.String(), t.Null()]),
  role: t.Enum(Role),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export type User = typeof UserResponseSchema.static;

export const UserCreateSchema = t.Object({
  firstname: t.String(),
  lastname: t.String(),
  username: t.String(),
  password: t.String(),
  email: t.Optional(t.String()),
  role: t.Optional(t.Enum(Role)),
});

export const UserUpdateSchema = t.Object({
  firstname: t.Optional(t.String()),
  lastname: t.Optional(t.String()),
  username: t.Optional(t.String()),
  password: t.Optional(t.String()),
  email: t.Optional(t.Union([t.String(), t.Null()])),
  role: t.Optional(t.Enum(Role)),
});

export type UserCreate = typeof UserCreateSchema.static;
export type UserUpdate = typeof UserUpdateSchema.static;
