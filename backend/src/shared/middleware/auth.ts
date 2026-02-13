import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { Role } from "@/providers/database/generated/enums";

export const authMiddleware = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "supersecret",
    })
  )
  .derive(async ({ jwt, headers, set }) => {
    const authHeader = headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { user: null };
    }

    const token = authHeader.split(" ")[1];
    const payload = await jwt.verify(token);

    if (!payload || !payload.sub) {
      return { user: null };
    }

    return {
      user: {
        id: payload.sub,
        role: payload.role as Role,
        username: payload.username as string,
      },
    };
  })
  .macro(({ onBeforeHandle }) => ({
    isLoggedIn(value: boolean) {
      if (!value) return;

      onBeforeHandle(({ user, set }) => {
        if (!user) {
          set.status = 401;
          return { message: "Unauthorized" };
        }
      });
    },
    role(requiredRole: Role | Role[]) {
      onBeforeHandle(({ user, set }) => {
        if (!user) {
          set.status = 401;
          return { message: "Unauthorized" };
        }

        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!roles.includes(user.role)) {
          set.status = 403;
          return { message: "Forbidden: You don't have permission to access this resource" };
        }
      });
    },
  }));
