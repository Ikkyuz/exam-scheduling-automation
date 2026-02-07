import { CourseCreateUpdate } from "./course.schema";
import { CourseRepository } from "./course.repository";
import { getPaginationParams } from "../../shared/utils/pagination";

export namespace CourseService {
  export async function createMany(courses: CourseCreateUpdate[]) {
    const createdCourses = await CourseRepository.createMany(courses);
    return createdCourses;
  }

  export async function findAll(
    options: { page?: number; itemsPerPage?: number; search?: string } = {}
  ) {
    const page = options.page ?? 1;
    const itemsPerPage = options.itemsPerPage ?? 10;
    const search = options.search;

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

    const data = await CourseRepository.findAll({ skip, take, search });
    const total = await CourseRepository.countAll(search);

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
    return await CourseRepository.findById(id);
  }

  export async function update(
    id: number,
    course: CourseCreateUpdate
  ) {
    return await CourseRepository.update(id, course);
  }

  export async function deleteById(id: number) {
    return await CourseRepository.deleteById(id);
  }

  export async function deleteAll() {
    return await CourseRepository.deleteAll();
  }

  export async function count() {
    return await CourseRepository.countAll();
  }
}
