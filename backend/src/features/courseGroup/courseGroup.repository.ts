import prisma from "@/providers/database/database.provider";
import { CourseGroupCreateUpdate } from "./courseGroup.schema";

export namespace CourseGroupRepository {
  export async function createMany(courseGroups: CourseGroupCreateUpdate[]) {
    // 1. ตรวจสอบ Course
    for (const cg of courseGroups) {
      const course = await prisma.course.findUnique({
        where: { id: cg.course_id },
      });
      if (!course) throw new Error(`Course with id ${cg.course_id} not found`);
    }

    // 2. กำหนด groupNum
    // ถ้า payload มี groupNum มาให้ (กรณีเพิ่มวิชาเข้ากลุ่มเดิม) ก็ใช้ค่านั้น
    // ถ้าไม่มี (สร้างกลุ่มใหม่) ให้หา Max groupNum แล้ว +1
    let targetGroupNum = courseGroups[0].groupNum;

    if (targetGroupNum === undefined || targetGroupNum === null) {
        const maxGroupResult = await prisma.courseGroup.aggregate({
            _max: { groupNum: true }
        });
        const currentMax = maxGroupResult._max.groupNum || 0;
        targetGroupNum = currentMax + 1;
    }

    const now = new Date();
    // ตรวจสอบก่อนว่าวิชาเหล่านี้มีอยู่ในกลุ่มนี้หรือยัง เพื่อป้องกันการ insert ซ้ำ
    const existingCourseIds = await prisma.courseGroup.findMany({
      where: {
        groupNum: targetGroupNum,
        course_id: { in: courseGroups.map(cg => cg.course_id) }
      },
      select: { course_id: true }
    }).then(results => results.map(r => r.course_id));

    const courseGroupsWithData = courseGroups
      .filter(cg => !existingCourseIds.includes(cg.course_id)) // กรองตัวที่ซ้ำออก
      .map((cg) => ({
        course_id: cg.course_id,
        groupNum: targetGroupNum!,
        createdAt: now,
      }));

    // 3. Insert (ถ้ามีข้อมูลใหม่ที่เหลืออยู่)
    if (courseGroupsWithData.length > 0) {
      await prisma.courseGroup.createMany({
        data: courseGroupsWithData,
        skipDuplicates: true,
      });
    }

    // 4. Return results (คืนค่าเฉพาะวิชาที่เราตั้งใจจะเพิ่มเข้าไปในรอบนี้จริงๆ)
    const insertedCourseIds = courseGroupsWithData.map(cg => cg.course_id);
    
    // ถ้าไม่มีการ insert ใหม่ (เพราะซ้ำหมด) ให้ไปดึงตัวเดิมที่มีอยู่แล้วตาม list ที่ส่งมา
    const queryIds = insertedCourseIds.length > 0 ? insertedCourseIds : courseGroups.map(cg => cg.course_id);

    return prisma.courseGroup.findMany({
      where: { 
          groupNum: targetGroupNum,
          course_id: { in: queryIds }
      },
      include: { course: true },
    });
  }

  export async function findAll(options: {
    skip?: number;
    take?: number;
    search?: string;
  }) {
    let where: any = {};
    if (options.search) {
        // ... (Logic search เดิม) ...
        const searchNum = parseInt(options.search, 10);
        if (!isNaN(searchNum)) {
            // ค้นหาด้วย groupNum หรือ course_id
            where = { 
                OR: [
                    { groupNum: searchNum },
                    { course_id: searchNum }
                ]
            };
        } else {
            where = {
                course: {
                    OR: [
                        { name: { contains: options.search, mode: 'insensitive' } },
                        { code: { contains: options.search, mode: 'insensitive' } },
                    ],
                },
            };
        }
    }
    
    // เรียงตาม groupNum เพื่อให้ frontend จัดกลุ่มง่าย
    return prisma.courseGroup.findMany({
      where,
      include: { course: true },
      take: options.take,
      skip: options.skip,
      orderBy: { groupNum: 'asc' }
    });
  }

  export async function countAll(search?: string) {
    let where: any = {};
    if (search) {
      const searchNum = parseInt(search, 10);
      if (!isNaN(searchNum)) {
        where = { course_id: searchNum };
      } else {
        // Optionally, search by course name if `search` is not a number
        // where = { course: { name: { contains: search, mode: 'insensitive' } } };
        // For now, if search is not a number, we don't apply a filter to course_id
        where = {
          course: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          },
        };
      }
    }
    return prisma.courseGroup.count({ where });
  }

  export async function countGroups() {
    const groups = await prisma.courseGroup.groupBy({
      by: ['groupNum'],
    });
    return groups.length;
  }

  export async function findById(id: number) {
    return await prisma.courseGroup.findMany({ where: { id }, include: { course: true } });
  }

  export async function update(
    id: number,
    data: Partial<CourseGroupCreateUpdate>
  ) {
    return await prisma.courseGroup.update({ where: { id }, data });
  }

  export async function deleteAll() {
    return await prisma.courseGroup.deleteMany();
  }

  export async function deleteById(id: number) {
    return await prisma.courseGroup.delete({ where: { id } });
  }

  export async function getAllCourses() {
    return await prisma.course.findMany({
      select: { id: true, code: true }
    });
  }
}
