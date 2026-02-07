FROM oven/bun:1 AS builder
WORKDIR /app
COPY ./package.json ./
RUN bun i
COPY . .
ENV DATABASE_URL={DATABASE_URL}
RUN bun x prisma generate
RUN bun run build
# CMD [ "bun", "start" ]

FROM oven/bun:1 AS app
WORKDIR /app
COPY ./package.json ./
RUN bun i
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/src/providers/database/generated /app/src/providers/database/generated
CMD [ "bun", "dev" ]