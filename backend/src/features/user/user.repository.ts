import prisma from "@/providers/database/database.provider";
import { UserCreate, UserUpdate } from "@/features/user/user.schema";
import { Role } from "@/providers/database/generated/enums"; // ✅ import enum มาจาก Prisma

export namespace UserRepository {
  export async function create(user: UserCreate) {
    return prisma.user.create({
      data: {
        ...user,
        role: user.role ?? Role.USER,
      },
    });
  }

  export async function createMany(users: UserCreate[]) {
    // Hash passwords before creation
    const usersWithHashedPasswords = users.map(user => ({
      ...user,
      password: user.password, // Passwords should already be hashed by service/controller
      role: user.role ?? Role.USER,
    }));

    return prisma.user.createMany({
      data: usersWithHashedPasswords,
      skipDuplicates: true, // Option to skip users with duplicate unique fields (username, email)
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
            { username: { contains: options.search, mode: "insensitive" as const } },
            { firstname: { contains: options.search, mode: "insensitive" as const } },
            { lastname: { contains: options.search, mode: "insensitive" as const } },
          ],
        }
      : {};

    return prisma.user.findMany({
      where,
      take: options.take,
      skip: options.skip,
      orderBy: { createdAt: "desc" },
    });
  }

  export async function findUserByUsername(username: string) {
    return await prisma.user.findUnique({
      where: {
        username: username,
      },
    });
  }

  export async function findById(id: string) {
    return await prisma.user.findUnique({
      where: {
        id: id,
      },
    });
  }

  export async function update(
    id: string,
    user: Partial<UserUpdate>
  ) {
    return prisma.user.update({
      where: {
        id: id,
      },
      data: user,
    });
  }

  export async function deleteById(id: string) {
    // ลบ tokens ของ user นี้ออกก่อนเพื่อป้องกัน foreign key constraint error
    await prisma.token.deleteMany({
      where: {
        user_id: id,
      },
    });

    return prisma.user.delete({
      where: {
        id: id,
      },
    });
  }

  export async function countAll(search?: string) {
    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" as const } },
            { firstname: { contains: search, mode: "insensitive" as const } },
            { lastname: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};
    return await prisma.user.count({ where });
  }
}
