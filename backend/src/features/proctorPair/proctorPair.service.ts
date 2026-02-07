import { ProctorPairCreateUpdate } from "./proctorPair.schema";
import { ProctorPairRepository } from "./proctorPair.repository";
import { TeacherRepository } from "../teacher/teacher.repository";
import { getPaginationParams } from "../../shared/utils/pagination";

export namespace ProctorPairService {
  export async function createMany(data: ProctorPairCreateUpdate[]) {
    const rawData = await ProctorPairRepository.createMany(data);
    return rawData.map((item) => ({
      ...item,
      teacher: [item.teacher],
    }));
  }

  export async function findAll(
    options: { page?: number; itemsPerPage?: number; search?: string } = {}
  ) {
    const page = options.page ?? 1;
    const itemsPerPage = options.itemsPerPage ?? 10;
    const search = options.search ?? "";

    let skip: number | undefined;
    let take: number | undefined;

    if (itemsPerPage === -1) {
      skip = undefined;
      take = undefined;
    } else {
      const params = getPaginationParams(page, itemsPerPage);
      skip = params.skip;
      take = params.take;
    }

    // ดึงข้อมูลจาก repository
    const rawData = await ProctorPairRepository.findAll({ skip, take, search });
    const total = await ProctorPairRepository.countAll(search);

    // แก้ไข data ให้ตรง schema: teacher เป็น array
    const data = rawData.map((item) => ({
      ...item,
      teacher: [item.teacher], // <-- แก้ไขตรงนี้
    }));

    const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(total / itemsPerPage);
    const nextPage = page < totalPages;
    const previousPage = page > 1;

    return {
      data,
      meta_data: {
        page,
        itemsPerPage,
        total,
        totalPages,
        nextPage,
        previousPage,
      },
    };
  }

  export async function findById(id: number) {
    const result = await ProctorPairRepository.findById(id);
    if (!result) return null;
    return {
        ...result,
        teacher: [result.teacher]
    };
  }

  export async function update(
    id: number,
    data: Partial<ProctorPairCreateUpdate>
  ) {
    const existingPair = await ProctorPairRepository.findById(id);
    if (!existingPair) {
      throw new Error("ProctorPair not found");
    }

    return await ProctorPairRepository.update(id, data);
  }

  export async function deleteAll() {
    return await ProctorPairRepository.deleteAll();
  }

  export async function deleteById(id: number) {
    return await ProctorPairRepository.deleteById(id);
  }

  export async function count() {
    return await ProctorPairRepository.countGroups();
  }

  export async function getAllTeachers() {
    return await ProctorPairRepository.getAllTeachers();
  }
}