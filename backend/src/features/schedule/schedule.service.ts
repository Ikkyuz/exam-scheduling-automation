import prisma from "@/providers/database/database.provider";
import { ScheduleRepository } from "./schedule.ropository";
import { ScheduleBulkCreate } from "./schedule.schema";

export namespace ScheduleService {
  export async function bulkCreate(data: ScheduleBulkCreate[]) {
    return await ScheduleRepository.bulkCreate(data);
  }

  export async function getAll(semester?: string, academicYear?: string, departmentName?: string) {
    return await ScheduleRepository.getAll(semester, academicYear, departmentName);
  }

  export async function deleteAll(semester: string, academicYear: string) {
    return await ScheduleRepository.deleteAll(semester, academicYear);
  }
}