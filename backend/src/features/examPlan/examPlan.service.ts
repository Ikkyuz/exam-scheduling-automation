import { ExamPlanRepository } from "./examPlan.ropository";
import { ExamPlanBulkCreate } from "./examPlan.schema";

export namespace ExamPlanService {
  export async function bulkCreate(data: ExamPlanBulkCreate[]) {
    return await ExamPlanRepository.bulkCreate(data);
  }

  export async function getAll(semester?: string, academicYear?: string, departmentName?: string) {
    return await ExamPlanRepository.getAll(semester, academicYear, departmentName);
  }

  export async function deleteAll(semester: string, academicYear: string) {
    return await ExamPlanRepository.deleteAll(semester, academicYear);
  }
}
