import prisma from "@/providers/database/database.provider";
import { EnrollmentCreateUpdate } from "./enrollment.schema";

export namespace EnrollmentRepository {
  export async function createMany(enrollments: EnrollmentCreateUpdate[]) {
    // 1. ตรวจสอบ Course และ Class มีตัวตนในระบบเบื้องต้น
    for (const enrollment of enrollments) {
      const course = await prisma.course.findUnique({
        where: { id: enrollment.course_id },
      });
      if (!course)
        throw new Error(`Course with id ${enrollment.course_id} not found`);

      const classed = await prisma.class.findUnique({
        where: { id: enrollment.class_id },
      });
      if (!classed)
        throw new Error(`Class with id ${enrollment.class_id} not found`);
    }

    // 2. ตรวจสอบข้อมูลที่ซ้ำกันในระบบอยู่แล้ว
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        OR: enrollments.map(e => ({
          class_id: e.class_id,
          course_id: e.course_id
        }))
      },
      select: { class_id: true, course_id: true }
    });

    const now = new Date();
    const enrollmentsToCreate = enrollments
      .filter(e => !existingEnrollments.some(ex => ex.class_id === e.class_id && ex.course_id === e.course_id))
      .map(e => ({
        ...e,
        createdAt: now,
        updatedAt: now
      }));

    // 3. bulk insert (ถ้ามีข้อมูลใหม่ที่ไม่ซ้ำ)
    if (enrollmentsToCreate.length > 0) {
      await prisma.enrollment.createMany({
        data: enrollmentsToCreate,
        skipDuplicates: true,
      });
    }

    // 4. คืนค่าตามรายการที่ส่งมา (รวมทั้งที่เพิ่งสร้างและที่มีอยู่แล้ว)
    return prisma.enrollment.findMany({
      where: {
        OR: enrollments.map(e => ({
          class_id: e.class_id,
          course_id: e.course_id
        }))
      },
      include: {
        class: true,
        course: true,
      },
    });
  }

  export async function findAll(options: {
    skip?: number;
    take?: number;
    search?: string;
  }) {
    let where: any = {};
    if (options.search) {
      const searchNum = parseInt(options.search, 10);
      if (!isNaN(searchNum)) {
        where = {
          OR: [
            { course_id: searchNum },
            { class_id: searchNum },
          ],
        };
      } else {
        where = {
          OR: [
            { course: { name: { contains: options.search, mode: 'insensitive' } } },
            { course: { code: { contains: options.search, mode: 'insensitive' } } },
            { class: { name: { contains: options.search, mode: 'insensitive' } } },
          ],
        };
      }
    }

    return prisma.enrollment.findMany({
      where,
      include: { course: true, class: true },
      take: options.take,
      skip: options.skip,
      orderBy: { createdAt: 'desc' }
    });
  }

  export async function countAll(search?: string) {
    let where: any = {};
    if (search) {
      const searchNum = parseInt(search, 10);
      if (!isNaN(searchNum)) {
        where = {
          OR: [
            { course_id: searchNum },
            { class_id: searchNum },
          ],
        };
      } else {
        where = {
          OR: [
            { course: { name: { contains: search, mode: 'insensitive' } } },
            { course: { code: { contains: search, mode: 'insensitive' } } },
            { class: { name: { contains: search, mode: 'insensitive' } } },
          ],
        };
      }
    }
    return prisma.enrollment.count({ where });
  }

  export async function getAllClasses() {
    return await prisma.class.findMany({
      select: { id: true, name: true }
    });
  }

  export async function getAllCourses() {
    return await prisma.course.findMany({
      select: { id: true, code: true }
    });
  }

  export async function findById(id: number) {
    return await prisma.enrollment.findUnique({ where: { id }, include: { course: true, class: true } });
  }

  export async function update(
    id: number,
    data: Partial<EnrollmentCreateUpdate>
  ) {
    return await prisma.enrollment.update({ where: { id }, data });
  }

  export async function deleteAll() {
    return await prisma.enrollment.deleteMany();
  }

  export async function deleteById(id: number) {
    return await prisma.enrollment.delete({ where: { id } });
  }
}
