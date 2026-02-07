import prisma from "@/providers/database/database.provider";
import { Schedule, ScheduleBulkCreate } from "./schedule.schema";

export namespace ScheduleRepository {
    export async function bulkCreate(data: ScheduleBulkCreate[]): Promise<void> {
        await prisma.schedule.createMany({
            data: data.map((item) => ({
                className: item.className,
                departmentName: item.departmentName,
                courseCode: item.courseCode,
                courseName: item.courseName,
                timeStart: new Date(item.timeStart),
                timeEnd: new Date(item.timeEnd),
                duration: item.duration,
                roomNumber: item.roomNumber,
                semester: item.semester,
                academicYear: item.academicYear,
            })),
        });
    }

    export async function getAll(semester?: string, academicYear?: string, departmentName?: string): Promise<Schedule[]> {
        const where: any = {};
        if (semester) where.semester = semester;
        if (academicYear) where.academicYear = academicYear;
        if (departmentName) where.departmentName = departmentName;
        return await prisma.schedule.findMany({
            where,
            orderBy: {
                timeStart: "asc",
            },
        });
    }

    export async function deleteAll(semester: string, academicYear: string): Promise<void> {
        await prisma.schedule.deleteMany({
            where: {
                semester,
                academicYear,
            },
        });
    }
}