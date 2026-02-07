import prisma from "@/providers/database/database.provider";
import { CourseCreateUpdate } from "./course.schema";

export namespace CourseRepository {
  export async function createMany(courses: CourseCreateUpdate[]) {
    // ใส่ timestamp ชั่วคราวเพื่อ query objects ใหม่
    const now = new Date();
    const coursesWithTime = courses.map((c) => ({
      ...c,
      createdAt: now,
    }));
    // bulk insert
    await prisma.course.createMany({
      data: coursesWithTime,
      skipDuplicates: true,
    });

    // query objects ใหม่ พร้อม relations
    return prisma.course.findMany({
      where: { createdAt: now },
      include: {
        enrollments: true,
        courseGroups: true,
      },
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
            { code: { contains: options.search, mode: 'insensitive' } },
            { name: { contains: options.search, mode: 'insensitive' } },
          ],
        }
      : {};

    return prisma.course.findMany({
      where,
      include: {
        enrollments: {
          include: { class: true },
        },
        courseGroups: true,
      },
      take: options.take,
      skip: options.skip,
    });
  }

  export async function findById(courseId: number) {
    return await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: true,
        courseGroups: true,
      },
    });
  }

  export async function update(
    courseId: number,
    course: Partial<CourseCreateUpdate>
  ) {
    return prisma.course.update({
      where: { id: courseId },
      data: course,
      include: {
        enrollments: true,
        courseGroups: true,
      },
    });
  }

  export async function deleteAll() {
    return prisma.course.deleteMany({});
  }

  export async function deleteById(courseId: number) {
    return prisma.course.delete({
      where: { id: courseId },
      include: {
        enrollments: true,
        courseGroups: true,
      },
    });
  }

  export async function countAll(search?: string) {
    const where = search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};
    return prisma.course.count({ where });
  }
}
