import { RoomCreateUpdate } from "./room.schema";
import { RoomRepository } from "./room.repository";
import { getPaginationParams } from "../../shared/utils/pagination";

export namespace RoomService {
  export async function createMany(courses: RoomCreateUpdate[]) {
    return await RoomRepository.createMany(
      courses,
    );
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

    const data = await RoomRepository.findAll({ skip, take, search });
    const total = await RoomRepository.countAll(search);

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
    return await RoomRepository.findById(id);
  }

  export async function update(
    id: number,
    room: RoomCreateUpdate
  ) {
    return await RoomRepository.update(id, room);
  }

  export async function deleteById(id: number) {
    return await RoomRepository.deleteById(id);
  }

  export async function deleteAll() {
    return await RoomRepository.deleteAll();
  }
}
