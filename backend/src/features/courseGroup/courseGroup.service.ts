import { CourseGroupCreateUpdate } from "./courseGroup.schema";
import { CourseGroupRepository } from "./courseGroup.repository";
import { getPaginationParams } from "../../shared/utils/pagination";

export namespace CourseGroupService {
  export async function createMany(data: CourseGroupCreateUpdate[]) {
    const rawData = await CourseGroupRepository.createMany(data);
    return rawData.map((item) => ({
      ...item,
      course: [item.course],
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
    const rawData = await CourseGroupRepository.findAll({ skip, take, search });
    const total = await CourseGroupRepository.countAll(search);

    // แก้ไข data ให้ตรง schema: course เป็น array
    const data = rawData.map((item) => ({
      ...item,
      course: [item.course], // <-- แก้ไขตรงนี้: wrap object เป็น array
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
    return await CourseGroupRepository.findById(id);
  }

  export async function update(
    id: number,
    data: Partial<CourseGroupCreateUpdate>
  ) {
    const existingGroup = await CourseGroupRepository.findById(id);
    if (!existingGroup || existingGroup.length === 0) {
      throw new Error("CourseGroup not found");
    }

    return await CourseGroupRepository.update(id, data);
  }

  export async function deleteAll() {
    return await CourseGroupRepository.deleteAll();
  }

  export async function deleteById(id: number) {
    return await CourseGroupRepository.deleteById(id);
  }

  export async function count() {
    return await CourseGroupRepository.countGroups();
  }

  export async function getAllCourses() {
    return await CourseGroupRepository.getAllCourses();
  }
}
