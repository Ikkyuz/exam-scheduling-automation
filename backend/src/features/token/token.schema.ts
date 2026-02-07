import { t } from "elysia";

export const createTokenSchema = t.Object({
  token: t.String(),
  user_id: t.String(),
  expires_at: t.Date(),
});

export const createTokenCreateUpdateSchema = t.Omit(createTokenSchema, [
  "id",
  "created_at",
  "updated_at",
]);

export const verifyTokenSchema = t.Object({
  token: t.String(),
});

export const userIdSchema = t.Object({
  user_id: t.String(),
});

export type CreateToken = typeof createTokenSchema.static;
export type CreateTokenCreateUpdate = typeof createTokenCreateUpdateSchema.static;
export type VerifyToken = typeof verifyTokenSchema.static;
export type UserId = typeof userIdSchema.static;
