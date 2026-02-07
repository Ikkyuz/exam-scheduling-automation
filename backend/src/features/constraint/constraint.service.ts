import { getPaginationParams } from "@/shared/utils/pagination";
import { ConstraintRepository } from "./constraint.repository";
import { ConstraintCreateUpdate } from "./constraint.schema";

export namespace ConstraintService {
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

    const data = await ConstraintRepository.findAll({ skip, take, search });
    const total = await ConstraintRepository.countAll(search);

    const totalPages = itemsPerPage === -1 ? 1 : ((total + itemsPerPage - 1) / itemsPerPage) >> 0;
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
    return ConstraintRepository.findById(id);
  }

  export async function create(data: ConstraintCreateUpdate) {
    return ConstraintRepository.create(data);
  }

  export async function importConstraints(data: ConstraintCreateUpdate[]) {
    return ConstraintRepository.createMany(data);
  }

  export async function update(
    id: number,
    data: Partial<ConstraintCreateUpdate>
  ) {
    return ConstraintRepository.update(id, data);
  }

  export async function deleteAll() {
    return ConstraintRepository.deleteAll();
  }

  export async function deleteById(id: number) {
    return ConstraintRepository.deleteById(id);
  }
}
