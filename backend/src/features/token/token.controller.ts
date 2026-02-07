import Elysia, { t } from "elysia";
import { TokenService } from "./token.service";

import { createTokenSchema } from "./token.schema";

export namespace TokenController {
  export const tokenController = new Elysia({ prefix: "/tokens" })
    .post(
      "/generate",
      async ({ body, set }) => {
        try {
          const { userId, expiresIn } = body;
          const token = await TokenService.generateToken(userId, expiresIn);
          set.status = "Created";
          return token;
        } catch (error: any) {
          set.status = "Bad Request";
          return { error: error.message };
        }
      },
      {
        body: t.Object({
          userId: t.String(),
          expiresIn: t.Optional(t.Number()),
        }),
        tags: ["Token"],
      }
    )
    .get(
      "/verify/:token",
      async ({ params: { token }, set }) => {
        try {
          const tokenRecord = await TokenService.verifyToken(token);
          set.status = "OK";
          return tokenRecord;
        } catch (error: any) {
          set.status = "Bad Request";
          return { error: error.message };
        }
      },
      {
        tags: ["Token"],
      }
    )
    .get(
      "/user/:userId",
      async ({ params: { userId }, set }) => {
        try {
          const tokens = await TokenService.getUserTokens(userId);
          set.status = "OK";
          return tokens;
        } catch (error: any) {
          set.status = "Internal Server Error";
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        response: {
          200: t.Array(createTokenSchema),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Token"],
      }
    )
    .delete(
      "/:token",
      async ({ params: { token }, set }) => {
        try {
          await TokenService.revokeToken(token);
          set.status = "No Content";
          return null;
        } catch (error: any) {
          set.status = "Bad Request";
          return { error: error.message };
        }
      },
      {
        tags: ["Token"],
      }
    )
    .delete(
      "/user/:userId",
      async ({ params: { userId }, set }) => {
        try {
          await TokenService.revokeAllUserTokens(userId);
          set.status = "No Content";
          return null;
        } catch (error: any) {
          set.status = "Bad Request";
          return { error: error.message };
        }
      },
      {
        tags: ["Token"],
      }
    )
    .delete(
      "/cleanup/expired",
      async ({ set }) => {
        try {
          set.status = "No Content";
          return await TokenService.cleanupExpiredTokens();
        } catch (error: any) {
          set.status = "Bad Request";
          return { error: error.message };
        }
      },
      {
        tags: ["Token"],
      }
    );
}
