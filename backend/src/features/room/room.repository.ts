import prisma from "@/providers/database/database.provider";
import { RoomCreateUpdate } from "./room.schema";

export namespace RoomRepository {
  export async function createMany(rooms: RoomCreateUpdate[]) {
    // ใส่ timestamp ชั่วคราวเพื่อ query objects ใหม่
    const now = new Date();
    const roomsWithTime = rooms.map((r) => ({ ...r, createdAt: now }));

    // bulk insert
    await prisma.room.createMany({
      data: roomsWithTime,
      skipDuplicates: true,
    });

    // query objects ใหม่
    return prisma.room.findMany({
      where: { createdAt: now },
    });
  }

  export async function findAll(options: {
    skip?: number;
    take?: number;
    search?: string;
  }) {
    const where = options.search
      ? {
          OR: [
            { roomNumber: { contains: options.search, mode: "insensitive" as const } },
            { building: { contains: options.search, mode: "insensitive" as const } },
          ],
        }
      : {};
    return prisma.room.findMany({
      where,
      take: options.take,
      skip: options.skip,
    });
  }

  export async function findById(id: number) {
    return await prisma.room.findUnique({
      where: { id: id },
    });
  }

  export async function update(id: number, room: Partial<RoomCreateUpdate>) {
    return prisma.room.update({
      where: { id: id },
      data: room,
    });
  }

  export async function deleteAll() {
    return prisma.room.deleteMany({});
  }

  export async function deleteById(id: number) {
    return prisma.room.delete({
      where: { id: id },
    });
  }

  export async function countAll(search?: string) {
    const where = search
      ? {
          OR: [
            { roomNumber: { contains: search, mode: "insensitive" as const } },
            { building: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};
    return prisma.room.count({ where });
  }
}
