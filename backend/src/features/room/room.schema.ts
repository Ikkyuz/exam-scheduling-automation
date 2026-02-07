import { t } from "elysia";

export const RoomSchema = t.Object({
  id: t.Number(),
  roomNumber: t.String(),
  building: t.String(),
  floor: t.String(),
  capacity: t.Number(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export type Room = typeof RoomSchema.static;

export const RoomCreateUpdateSchema = t.Omit(RoomSchema, [
  "id",
  "createdAt",
  "updatedAt",
]);

export type RoomCreateUpdate = typeof RoomCreateUpdateSchema.static;
