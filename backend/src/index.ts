import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { corsMiddleware } from "./shared/middleware/cors";
import { app as features } from "./features/app";
import jwt from "@elysiajs/jwt";

const app = new Elysia()
  .use(corsMiddleware)
  .use(jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "supersecret",
  }))
  .use(swagger({ path: "/docs" }))
  .use(features())
  .get("/", () => "Hello API")
  .listen({ port: process.env.PORT ?? 3000 });

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}/docs`
);
