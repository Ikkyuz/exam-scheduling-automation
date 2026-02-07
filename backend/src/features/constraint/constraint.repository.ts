import { option } from "./../../../node_modules/effect/src/Config";
import { get } from "./../../../node_modules/effect/src/Array";
import prisma from "@/providers/database/database.provider";
import { ConstraintCreateUpdate } from "./constraint.schema";

export namespace ConstraintRepository {
  export async function findAll(options: {
    skip?: number;
    take?: number;
    search?: string;
  }) {
    const where = options.search
      ? {
          OR: [
            { category: { contains: options.search, mode: "insensitive" as const } },
            { level: { contains: options.search, mode: "insensitive" as const } },
            { constraint: { contains: options.search, mode: "insensitive" as const } },
          ],
        }
      : {};

    return prisma.constraint.findMany({
      where,
      skip: options.skip,
      take: options.take,
    });
  }

  export async function countAll(search?: string) {
    const where = search
      ? {
          OR: [
            { category: { contains: search, mode: "insensitive" as const } },
            { level: { contains: search, mode: "insensitive" as const } },
            { constraint: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};
    return prisma.constraint.count({ where });
  }

  export async function findById(id: number) {
    return prisma.constraint.findUnique({ where: { id } });
  }

  export async function create(data: ConstraintCreateUpdate) {
    return prisma.constraint.create({ data });
  }

  export async function createMany(data: ConstraintCreateUpdate[]) {
    return prisma.constraint.createMany({ data, skipDuplicates: true });
  }

  export async function update(
    id: number,
    data: Partial<ConstraintCreateUpdate>
  ) {
    return prisma.constraint.update({ where: { id }, data });
  }

  export async function deleteAll() {
    return prisma.constraint.deleteMany();
  }

  export async function deleteById(id: number) {
    return prisma.constraint.delete({ where: { id } });
  }
}
