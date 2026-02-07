import prisma from "@/providers/database/database.provider";
import { ProctorPairCreateUpdate } from "./proctorPair.schema";

export namespace ProctorPairRepository {
  export async function createMany(proctorPairs: ProctorPairCreateUpdate[]) {
    // 1. ตรวจสอบ Teacher
    for (const pp of proctorPairs) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: pp.teacher_id },
      });
      if (!teacher) throw new Error(`Teacher with id ${pp.teacher_id} not found`);
    }

    // 2. กำหนด groupNum
    let targetGroupNum = proctorPairs[0].groupNum;

    if (targetGroupNum === undefined || targetGroupNum === null) {
        const maxGroupResult = await prisma.proctorPair.aggregate({
            _max: { groupNum: true }
        });
        const currentMax = maxGroupResult._max.groupNum || 0;
        targetGroupNum = currentMax + 1;
    }

    // 3. ตรวจสอบการซ้ำซ้อนในกลุ่มเดิม
    const existingTeacherIds = await prisma.proctorPair.findMany({
      where: {
        groupNum: targetGroupNum,
        teacher_id: { in: proctorPairs.map(pp => pp.teacher_id) }
      },
      select: { teacher_id: true }
    }).then(results => results.map(r => r.teacher_id));

    const now = new Date();
    const proctorPairsToCreate = proctorPairs
      .filter(pp => !existingTeacherIds.includes(pp.teacher_id))
      .map((pp) => ({
        teacher_id: pp.teacher_id,
        groupNum: targetGroupNum!,
        createdAt: now,
        updatedAt: now,
      }));

    // 4. Insert
    if (proctorPairsToCreate.length > 0) {
      await prisma.proctorPair.createMany({
        data: proctorPairsToCreate,
        skipDuplicates: true,
      });
    }

    // 5. Return results
    return prisma.proctorPair.findMany({
      where: { 
          groupNum: targetGroupNum,
          teacher_id: { in: proctorPairs.map(pp => pp.teacher_id) }
      },
      include: { teacher: true },
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
            { groupNum: searchNum },
            { teacher_id: searchNum },
          ],
        };
      } else {
        where = {
          teacher: {
            OR: [
              { firstname: { contains: options.search, mode: 'insensitive' } },
              { lastname: { contains: options.search, mode: 'insensitive' } },
            ],
          },
        };
      }
    }

    return prisma.proctorPair.findMany({
      where,
      include: { teacher: true },
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
        where = {
          OR: [
            { groupNum: searchNum },
            { teacher_id: searchNum },
          ],
        };
      } else {
        where = {
          teacher: {
            OR: [
              { firstname: { contains: search, mode: 'insensitive' } },
              { lastname: { contains: search, mode: 'insensitive' } },
            ],
          },
        };
      }
    }
    return prisma.proctorPair.count({ where });
  }

  export async function countGroups() {
    const groups = await prisma.proctorPair.groupBy({
      by: ['groupNum'],
    });
    return groups.length;
  }

  export async function getAllTeachers() {
    return await prisma.teacher.findMany({
      select: { id: true, firstname: true, lastname: true, tel: true }
    });
  }

  export async function findById(id: number) {
    return await prisma.proctorPair.findMany({ where: { id }, include: { teacher: true } });
  }

  export async function update(
    id: number,
    data: Partial<ProctorPairCreateUpdate>
  ) {
    return await prisma.proctorPair.update({ where: { id }, data });
  }

  export async function deleteAll() {
    return await prisma.proctorPair.deleteMany();
  }

  export async function deleteById(id: number) {
    return await prisma.proctorPair.delete({ where: { id } });
  }
}