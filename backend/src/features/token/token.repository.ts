import prisma from "@/providers/database/database.provider";
import { CreateTokenCreateUpdate } from "./token.schema";

export namespace TokenRepository {
  export async function create(token: CreateTokenCreateUpdate) {
    try {
      return await prisma.token.create({
        data: token,
        include: { user: true }
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to create token");
    }
  }

  export async function findByToken(token: string) {
    try {
      return await prisma.token.findUnique({
        where: { token },
        include: { user: true }
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to find token");
    }
  }

  export async function findByUserId(user_id: string) {
    try {
      return await prisma.token.findMany({
        where: { user_id },
        include: { user: true }
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to find user tokens");
    }
  }

  export async function deleteExpired() {
    try {
      return await prisma.token.deleteMany({
        where: {
          expires_at: {
            lt: new Date()
          }
        }
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to delete expired tokens");
    }
  }

  export async function removeToken(token: string) {
    try {
      return await prisma.token.delete({
        where: { token },
        include: { user: true }
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to delete token");
    }
  }

  export async function deleteAllUserTokens(user_id: string) {
    try {
      return await prisma.token.deleteMany({
        where: { user_id }
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to delete user tokens");
    }
  }
}
