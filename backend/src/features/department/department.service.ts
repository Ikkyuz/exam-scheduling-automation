import { DepartmentRepository } from "./department.repository";
import { DepartmentCreateUpdate } from "./department.schema";
import { getPaginationParams } from "@/shared/utils/pagination";

export namespace DepartmentService {
  export async function createMany(departments: DepartmentCreateUpdate[]) {
    return DepartmentRepository.createMany(departments);
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

    const departments = await DepartmentRepository.findAll({
      skip,
      take,
      search,
    });
    const total = await DepartmentRepository.countAll(search);

    const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(total / itemsPerPage);
    const nextPage = page < totalPages;
    const previousPage = page > 1;

    return {
      data: departments,
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

  export async function findById(departmentId: number) {
    const department = await DepartmentRepository.findById(departmentId);
    if (!department) {
      throw new Error("Department not found");
    }
    return department;
  }

  export async function update(
    departmentId: number,
    department: Partial<DepartmentCreateUpdate>
  ) {
    // ตรวจสอบว่า Department ที่จะอัปเดตมีอยู่จริงหรือไม่
    const existingDepartment = await DepartmentRepository.findById(
      departmentId
    );
    if (!existingDepartment) {
      throw new Error("Department not found");
    }

    return await DepartmentRepository.update(departmentId, department);
  }

  export async function deleteAll() {
    return await DepartmentRepository.deleteAll();
  }

  export async function deleteById(departmentId: number) {
    // ตรวจสอบว่า Department ที่จะลบมีอยู่จริงหรือไม่
    const existingDepartment = await DepartmentRepository.findById(
      departmentId
    );
    if (!existingDepartment) {
      throw new Error("Department not found");
    }

    return await DepartmentRepository.deleteById(departmentId);
  }
}
