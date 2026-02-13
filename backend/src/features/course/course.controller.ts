import Elysia, { t } from "elysia";
import * as xlsx from 'xlsx';
import { parse as csvParse } from 'csv-parse';
import { Buffer } from 'buffer';
import {
  CourseWithRelationsSchema,
  CourseCreateUpdateSchema,
  CourseCreateUpdate,
} from "../course/course.schema";
import { CourseService } from "../course/course.service";

import { authMiddleware } from "../../shared/middleware/auth";
import { Role } from "@/providers/database/generated/enums";

export namespace CourseController {
  export const courseController = new Elysia({ prefix: "/courses" })
    .use(authMiddleware)
    .post(
      "/",
      async ({ body, set }) => {
        try {
          const newCourse = await CourseService.createMany(body);
          set.status = "Created";
          return {
            newCourse, // array ของ Course objects พร้อม relations
            message: "Course created successfully",
          };
        } catch (error: any) {
          if (error.message.includes("already exists")) {
            set.status = "Conflict";
            return { message: error.message };
          }
          set.status = "Internal Server Error";
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        body: t.Array(CourseCreateUpdateSchema),
        response: {
          201: t.Object({
            newCourse: t.Array(CourseWithRelationsSchema), // ใช้ schema พร้อม relations
            message: t.String(),
          }),
          409: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Courses"],
        role: Role.ADMIN,
      }
    )
    .post(
      "/import",
      async ({ body, set }) => {
        try {
          const file = body.file;
          if (!file) {
            set.status = "Bad Request";
            return { message: "No file uploaded" };
          }

          const buffer = await file.arrayBuffer();
          const fileExtension = file.name.split('.').pop()?.toLowerCase();
          let coursesToCreate: CourseCreateUpdate[] = [];

          const parseRecords = (records: any[]) => {
            return records.map(record => {
              const getValue = (keys: string[]) => {
                for (const key of keys) {
                  if (record[key] !== undefined) return record[key];
                  const lowerKey = Object.keys(record).find(k => k.toLowerCase() === key.toLowerCase());
                  if (lowerKey) return record[lowerKey];
                }
                return undefined;
              };

              const rawExamType = getValue(['examType', 'ประเภทการสอบ']) || 'ในตาราง';
              const examTypeValue = rawExamType.toUpperCase();
              
              const rawDuration = getValue(['duration', 'เวลาสอบ (นาที)', 'เวลาสอบ']);
              const durationValue = typeof rawDuration === 'string' ? parseInt(rawDuration, 10) : rawDuration;

              if (isNaN(durationValue)) {
                throw new Error(`Invalid duration: ${rawDuration}`);
              }

              return {
                code: getValue(['code', 'รหัสวิชา']) || '',
                name: getValue(['name', 'ชื่อวิชา']) || '',
                duration: durationValue,
                examType: examTypeValue
              };
            }).filter(c => c.code !== '');
          };

          if (fileExtension === 'csv') {
            const csvString = Buffer.from(buffer).toString('utf8');
            const records = await new Promise<any[]>((resolve, reject) => {
              csvParse(csvString, {
                columns: true,
                skip_empty_lines: true
              }, (err, records) => {
                if (err) reject(err);
                else resolve(records);
              });
            });
            coursesToCreate = parseRecords(records);
          } else if (fileExtension === 'xlsx') {
            const workbook = xlsx.read(buffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = xlsx.utils.sheet_to_json(sheet);
            coursesToCreate = parseRecords(json);
          } else {
            set.status = "Bad Request";
            return { message: "Unsupported file type. Only CSV and XLSX are supported." };
          }

          if (coursesToCreate.length === 0) {
            set.status = "Bad Request";
            return { message: "No valid data found in the file." };
          }

          const result = await CourseService.createMany(coursesToCreate);

          set.status = "Created";
          return {
            data: result,
            message: "Courses imported successfully",
          };
        } catch (error: any) {
          console.error("Error importing courses:", error);
          set.status = "Internal Server Error";
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        body: t.Object({
          file: t.File(),
        }),
        response: {
          201: t.Object({ data: t.Array(CourseWithRelationsSchema), message: t.String() }),
          400: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Courses"],
        role: Role.ADMIN,
      }
    )

    .get(
        "/template",
        async ({ set }) => {
            try {
                const worksheet = xlsx.utils.aoa_to_sheet([
                    ["รหัสวิชา", "ชื่อวิชา", "เวลาสอบ (นาที)", "ประเภทการสอบ"]
                ]);
                const workbook = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(workbook, worksheet, "Courses");
                const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
                
                set.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                set.headers['Content-Disposition'] = 'attachment; filename=course_template.xlsx';
                
                return buffer;
            } catch (error: any) {
                set.status = "Internal Server Error";
                return { message: error.message || "Internal Server Error" };
            }
        },
        {
            tags: ["Courses"],
            isLoggedIn: true,
        }
    )
    .get(
      "/",
      async ({ query, set }) => {
        try {
          const page = query.page ? Number(query.page) : 1;
          const itemsPerPage = query.itemsPerPage
            ? Number(query.itemsPerPage)
            : 10;
          const search = query.search;

          const result = await CourseService.findAll({
            page,
            itemsPerPage,
            search,
          });

          if (result.data.length === 0 && result.meta_data.total > 0) {
            set.status = "No Content"; // 204
            return { message: "No content for this page/query." };
          }

          return result;
        } catch (error: any) {
          set.status = "Internal Server Error"; // 500
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        query: t.Object({
          page: t.Optional(t.Numeric()),
          itemsPerPage: t.Optional(t.Numeric()),
          search: t.Optional(t.String()),
        }),
        response: {
          200: t.Object({
            data: t.Array(CourseWithRelationsSchema),
            meta_data: t.Object({
              page: t.Number(),
              itemsPerPage: t.Number(),
              total: t.Number(),
              totalPages: t.Number(),
              nextPage: t.Boolean(),
              previousPage: t.Boolean(),
            }),
          }),
          204: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Courses"],
        isLoggedIn: true,
      }
    )
    .get(
        "/count",
        async ({ set }) => {
            try {
                const count = await CourseService.count();
                set.status = "OK";
                return { count };
            } catch (error: any) {
                set.status = "Internal Server Error";
                return { message: error.message || "Internal Server Error" };
            }
        },
        {
            response: {
                200: t.Object({ count: t.Number() }),
                500: t.Object({ message: t.String() }),
            },
            tags: ["Courses"],
            isLoggedIn: true,
        }
    )
    .get(
      "/:id",
      async ({ params, set }) => {
        try {
          const course = await CourseService.findById(params.id);
          set.status = "OK"; // 200
          return course;
        } catch (error: any) {
          set.status = "Internal Server Error"; // 500
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        params: t.Object({ id: t.Number() }),
        response: {
          200: t.Union([CourseWithRelationsSchema, t.Null()]),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Courses"],
        isLoggedIn: true,
      }
    )
    .patch(
      "/:id",
      async ({ params, body, set }) => {
        try {
          const updatedCourse = await CourseService.update(params.id, body);
          set.status = "OK"; // 200
          return { updatedCourse, message: "Course updated successfully" };
        } catch (error: any) {
          if (
            error.message.includes("Unique constraint violated") ||
            error.message.includes("already exists")
          ) {
            set.status = "Conflict"; // 409
            return { message: error.message };
          }
          set.status = "Internal Server Error"; // 500
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        params: t.Object({ id: t.Number() }),
        body: CourseCreateUpdateSchema,
        response: {
          200: t.Object({
            updatedCourse: CourseWithRelationsSchema,
            message: t.String(),
          }),
          409: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Courses"],
        role: Role.ADMIN,
      }
    )
    .delete(
      "/clear",
      async ({ set }) => {
        try {
          await CourseService.deleteAll();
          set.status = "OK"; // 200
          return { message: "All courses deleted successfully" };
        } catch (error: any) {
          set.status = "Internal Server Error"; // 500
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        response: {
          200: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Courses"],
        role: Role.ADMIN,
      }
    )
    .delete(
      "/:id",
      async ({ params, set }) => {
        try {
          const deletedCourse = await CourseService.deleteById(params.id);
          set.status = "OK"; // 200
          return { deletedCourse, message: "Course deleted successfully" };
        } catch (error: any) {
          if (
            error.message.includes(
              "Cannot delete course because it has related records"
            )
          ) {
            set.status = "Conflict"; // 409
            return { message: error.message };
          }
          set.status = "Internal Server Error"; // 500
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        params: t.Object({ id: t.Number() }),
        response: {
          200: t.Object({
            deletedCourse: CourseWithRelationsSchema,
            message: t.String(),
          }),
          409: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Courses"],
        role: Role.ADMIN,
      }
    );
}

