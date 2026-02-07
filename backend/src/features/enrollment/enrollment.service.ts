import { EnrollmentCreateUpdate } from "./enrollment.schema";
import { EnrollmentRepository } from "./enrollment.repository";
import { CourseRepository } from "../course/course.repository";
import { getPaginationParams } from "../../shared/utils/pagination";

export namespace EnrollmentService {
  export async function createMany(data: EnrollmentCreateUpdate[]) {
    return await EnrollmentRepository.createMany(data);
  }

  export async function findAll(
    options: { page?: number; itemsPerPage?: number; search?: string } = {},
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
    const rawData = await EnrollmentRepository.findAll({ skip, take, search });
    const total = await EnrollmentRepository.countAll(search);

    const totalPages =
      itemsPerPage === -1 ? 1 : Math.ceil(total / itemsPerPage);
    const nextPage = page < totalPages;
    const previousPage = page > 1;

    return {
      data: rawData,
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
    return await EnrollmentRepository.findById(id);
  }

  export async function update(
    id: number,
    data: Partial<EnrollmentCreateUpdate>,
  ) {
    const existingEnrollment = await EnrollmentRepository.findById(id);
    if (!existingEnrollment) {
      throw new Error("Enrollment not found");
    }

    return await EnrollmentRepository.update(id, data);
  }

  export async function deleteAll() {
    return await EnrollmentRepository.deleteAll();
  }

  export async function deleteById(id: number) {
    return await EnrollmentRepository.deleteById(id);
  }

  export async function count(search?: string) {
    return await EnrollmentRepository.countAll(search);
  }

  export async function getAllClasses() {
    return await EnrollmentRepository.getAllClasses();
  }

  export async function getAllCourses() {
    return await EnrollmentRepository.getAllCourses();
  }
}
