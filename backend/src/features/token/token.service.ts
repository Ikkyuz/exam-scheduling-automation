import { Value } from "@sinclair/typebox/value";
import { TokenRepository } from "./token.repository";
import { createTokenSchema, verifyTokenSchema, userIdSchema } from "./token.schema";

export namespace TokenService {

  export async function generateToken(userId: string, expiresIn: number = 30) {

    try {

      const token = Bun.randomUUIDv7();

      const expiresAt = new Date();

      expiresAt.setDate(expiresAt.getDate() + expiresIn);

      const tokenData = {

        token,

        user_id: userId,

        expires_at: expiresAt

      };

if (!Value.Check(createTokenSchema, tokenData)) {

        throw new Error("Invalid token data");

      }

      return await TokenRepository.create(tokenData);

    } catch (error) {

      throw new Error(error instanceof Error ? error.message : "Failed to generate token");

    }

  }

export async function verifyToken(token: string) {

    try {

      if (!Value.Check(verifyTokenSchema, { token })) {

        throw new Error("Invalid token");

      }

      const tokenRecord = await TokenRepository.findByToken(token);

if (!tokenRecord) {

        return null;

      }

if (tokenRecord.expires_at < new Date()) {

        await TokenRepository.removeToken(token);

        return null;

      }

return tokenRecord;

    } catch (error) {

      throw new Error(error instanceof Error ? error.message : "Failed to verify token");

    }

  }

export async function getUserTokens(userId: string) {

    try {

      if (!Value.Check(userIdSchema, { user_id: userId })) {

        throw new Error("Invalid user ID");

      }

      return await TokenRepository.findByUserId(userId);

    } catch (error) {

      throw new Error(error instanceof Error ? error.message : "Failed to get user tokens");

    }

  }

export async function revokeToken(token: string) {

    try {

      if (!Value.Check(verifyTokenSchema, { token })) {

        throw new Error("Invalid token");

      }

      return await TokenRepository.removeToken(token);

    } catch (error) {

      throw new Error(error instanceof Error ? error.message : "Failed to revoke token");

    }

  }

export async function revokeAllUserTokens(userId: string) {

    try {

      if (!Value.Check(userIdSchema, { user_id: userId })) {

        throw new Error("Invalid user ID");

      }

      return await TokenRepository.deleteAllUserTokens(userId);

    } catch (error) {

      throw new Error(error instanceof Error ? error.message : "Failed to revoke user tokens");

    }

  }

export async function cleanupExpiredTokens() {

    try {

      return await TokenRepository.deleteExpired();

    } catch (error) {

      throw new Error(error instanceof Error ? error.message : "Failed to cleanup expired tokens");

    }

  }

}
