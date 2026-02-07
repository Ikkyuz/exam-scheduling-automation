import prisma from "@/providers/database/database.provider";
import { TeacherCreateUpdate } from "./teacher.schema";

export namespace TeacherRepository {
  export async function createMany(teachers: TeacherCreateUpdate[]) {
    // ตรวจสอบว่า department_id มีอยู่จริง
    for (const teacher of teachers) {
      const department = await prisma.department.findUnique({
        where: { id: teacher.department_id },
      });
      if (!department)
        throw new Error(
          `Department with id ${teacher.department_id} not found`
        );
    }

    // ใส่ timestamp ชั่วคราวเพื่อ query objects ใหม่
    const now = new Date();
    const teachersWithTime = teachers.map((t) => ({ ...t, createdAt: now }));

    // bulk insert
    await prisma.teacher.createMany({
      data: teachersWithTime,
      skipDuplicates: true,
    });

    // query objects ใหม่ พร้อม relation department และ proctorPairs (ผ่าน join table)
    return prisma.teacher.findMany({
      where: { createdAt: now },
      include: {
        department: true,
        proctorPairs: true,
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
        where = { id: searchNum }; // Search by ID if it's a number
      } else {
        where = {
          OR: [
            { firstname: { contains: options.search, mode: 'insensitive' } },
            { lastname: { contains: options.search, mode: 'insensitive' } },
            { tel: { contains: options.search, mode: 'insensitive' } },
            { department: { name: { contains: options.search, mode: 'insensitive' } } },
          ],
        };
      }
    }

    return prisma.teacher.findMany({
      where,
      include: {
        department: true,
        proctorPairs: true,
      },
      take: options.take,
      skip: options.skip,
    });
  }

  export async function findById(teacherId: number) {
    return await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        department: true,
        proctorPairs: true,
      },
    });
  }

  export async function update(
    teacherId: number,
    teacher: Partial<TeacherCreateUpdate>
  ) {
    // ตรวจสอบ Foreign Key หากมีการส่ง department_id มาอัปเดต
    if (teacher.department_id) {
      const department = await prisma.department.findUnique({
        where: { id: teacher.department_id },
      });
      if (!department) {
        throw new Error(
          `Department with id ${teacher.department_id} not found`
        );
      }
    }

    return prisma.teacher.update({
      where: { id: teacherId },
      data: teacher,
      include: {
        department: true,
        proctorPairs: true,
      },
    });
  }

  export async function deleteAll() {
    // ต้องลบข้อมูลใน join table ก่อน
    return prisma.teacher.deleteMany();
  }

  export async function deleteById(teacherId: number) {
    return prisma.teacher.delete({
      where: { id: teacherId },
      include: {
        department: true,
        proctorPairs: true,
      },
    });
  }

  export async function countAll(search?: string) {
    let where: any = {};
    if (search) {
      const searchNum = parseInt(search, 10);
      if (!isNaN(searchNum)) {
        where = { id: searchNum };
      } else {
        where = {
          OR: [
            { firstname: { contains: search, mode: 'insensitive' } },
            { lastname: { contains: search, mode: 'insensitive' } },
            { tel: { contains: search, mode: 'insensitive' } },
            { department: { name: { contains: search, mode: 'insensitive' } } },
          ],
        };
      }
    }
    return await prisma.teacher.count({ where });
  }

  export async function findByNameAndTel(firstname: string, lastname: string, tel: string) {
    return await prisma.teacher.findFirst({
      where: {
        firstname: { equals: firstname, mode: 'insensitive' },
        lastname: { equals: lastname, mode: 'insensitive' },
        tel: { equals: tel },
      },
      include: {
        department: true,
      }
    });
  }

  export async function findByName(firstname: string, lastname: string) {
    return await prisma.teacher.findFirst({
      where: {
        firstname: { equals: firstname, mode: 'insensitive' },
        lastname: { equals: lastname, mode: 'insensitive' },
      },
      include: {
        department: true,
      }
    });
  }
}
