import prisma from "@/providers/database/database.provider";
import { ClassCreateUpdate } from "./class.schema";

export namespace ClassRepository {
  export async function createMany(classes: ClassCreateUpdate[]) {
    // ตรวจสอบว่า department_id มีอยู่จริง
    for (const classData of classes) {
      const department = await prisma.department.findUnique({
        where: { id: classData.department_id },
      });
      if (!department)
        throw new Error(
          `Department with id ${classData.department_id} not found`
        );
    }

    // ใส่ timestamp ชั่วคราวเพื่อ query objects ใหม่
    const now = new Date();
    const classesWithTime = classes.map((classData) => ({
      ...classData,
      createdAt: now,
      updatedAt: now,
    }));

    // bulk insert
    await prisma.class.createMany({
      data: classesWithTime,
      skipDuplicates: true,
    });

    // query objects ใหม่ พร้อม relation department (และ enrollments ถ้าต้องการ)
    // ใช้ timestamp 'now' ในการดึงข้อมูลที่เพิ่งสร้าง
    return prisma.class.findMany({
      where: {
        createdAt: {
          gte: now
        }
      },
      include: {
        department: true,
        enrollments: true,
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
        where = { department_id: searchNum };
      } else {
        where = {
          name: { contains: options.search, mode: "insensitive" },
        };
      }
    }

    return prisma.class.findMany({
      where,
      include: { department: true, enrollments: true },
      skip: options.skip,
      take: options.take,
    });
  }

  export async function countAll(search?: string) {
    let where: any = {};
    if (search) {
      const searchNum = parseInt(search, 10);
      if (!isNaN(searchNum)) {
        where = { department_id: searchNum };
      } else {
        // Optionally, search by department name if `search` is not a number
        // where = { department: { name: { contains: search, mode: 'insensitive' } } };
        // For now, if search is not a number, we don't apply a filter to department_id
        where = {
          name: { contains: search, mode: "insensitive" },
        };
      }
    }
    return prisma.class.count({ where });
  }

  export async function findById(id: number) {
    return await prisma.class.findUnique({
      where: { id },
      include: { department: true, enrollments: true },
    });
  }

  export async function update(
    id: number,
    classData: Partial<ClassCreateUpdate>
  ) {
    if (classData.department_id) {
      const department = await prisma.department.findUnique({
        where: { id: classData.department_id },
      });

      if (!department) {
        throw new Error(
          `Department with id ${classData.department_id} not found`
        );
      }
    }

    return await prisma.class.update({ where: { id }, data: classData });
  }

  export async function deleteAll() {
    return await prisma.class.deleteMany({ where: {} });
  }

  export async function deleteById(id: number) {
    return await prisma.class.delete({ where: { id } });
  }
}
