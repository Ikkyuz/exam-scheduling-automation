import Elysia, { t } from "elysia";
import * as xlsx from 'xlsx';
import { parse as csvParse } from 'csv-parse';
import { Buffer } from 'buffer'; // Explicitly import Buffer
import {
  EnrollmentCreateUpdateSchema,
  EnrollmentWithRelationsSchema,
  EnrollmentCreateUpdate,
} from "./enrollment.schema";
import { EnrollmentService } from "./enrollment.service";

export namespace EnrollmentController {
  export const enrollmentController = new Elysia({ prefix: "/enrollments" })
    .post(
      "/",
      async ({ body, set }) => {
        try {
          const newEnrollments = await EnrollmentService.createMany(body);
          set.status = 201;
          return {
            newEnrollments, // array ของ Enrollment objects พร้อม relations
            message: "Enrollments created successfully",
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
        body: t.Array(EnrollmentCreateUpdateSchema),
        response: {
          201: t.Object({
            newEnrollments: t.Array(EnrollmentWithRelationsSchema), // ใช้ schema พร้อม relations
            message: t.String(),
          }),
          409: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Enrollments"],
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

          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const fileExtension = file.name.split('.').pop()?.toLowerCase();
          let records: any[] = [];

          if (fileExtension === 'csv') {
            const csvString = buffer.toString('utf8');
            records = await new Promise<any[]>((resolve, reject) => {
              csvParse(csvString, {
                columns: true,
                skip_empty_lines: true
              }, (err, records) => {
                if (err) reject(err);
                else resolve(records);
              });
            });
          } else if (fileExtension === 'xlsx') {
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            records = xlsx.utils.sheet_to_json(sheet, { defval: null });
          } else {
            set.status = "Bad Request";
            return { message: "Unsupported file type. Only CSV and XLSX are supported." };
          }

          if (records.length === 0) {
            set.status = "Bad Request";
            return { message: "ไม่พบข้อมูลในไฟล์" };
          }

          const enrollmentsToCreate: EnrollmentCreateUpdate[] = [];
          const allClasses = await EnrollmentService.getAllClasses();
          const allCourses = await EnrollmentService.getAllCourses();

          // 1. ระบุชื่อคอลัมน์ที่มีในไฟล์ก่อนเริ่มวนลูป
          const sampleRecord = records[0];
          const recordKeys = Object.keys(sampleRecord);
          
          const classKeys = ['class', 'class_id', 'classid', 'ชั้นเรียน', 'ห้องเรียน', 'กลุ่มเรียน', 'รหัสชั้นเรียน'];
          const courseKeys = ['course', 'course_id', 'courseid', 'วิชา', 'รหัสวิชา', 'รหัสวิชา (id)'];

          const classKeyFound = recordKeys.find(key => classKeys.includes(key.toLowerCase().trim()));
          const courseKeyFound = recordKeys.find(key => courseKeys.includes(key.toLowerCase().trim()));

          for (const record of records) {
            let classIdValue: number | undefined;
            let courseIdValue: number | undefined;

            const getValue = (targetKey: string | undefined) => {
                if (!targetKey) return undefined;
                const val = record[targetKey];
                return (val !== undefined && val !== null) ? String(val).trim() : undefined;
            };

            const classStr = getValue(classKeyFound);
            const courseStr = getValue(courseKeyFound);

            if (!classStr || !courseStr) continue;

            // ค้นหา Class ID
            const classNum = Number(classStr);
            if (!isNaN(classNum)) {
                const foundClass = allClasses.find(c => c.id === classNum);
                if (foundClass) classIdValue = foundClass.id;
            }
            if (!classIdValue) {
                const foundClassByName = allClasses.find(c => c.name === classStr);
                if (foundClassByName) classIdValue = foundClassByName.id;
            }

            // ค้นหา Course ID
            const courseNum = Number(courseStr);
            if (!isNaN(courseNum)) {
                const foundCourse = allCourses.find(c => c.id === courseNum);
                if (foundCourse) courseIdValue = foundCourse.id;
            }
            if (!courseIdValue) {
                const foundCourseByCode = allCourses.find(c => c.code === courseStr);
                if (foundCourseByCode) courseIdValue = foundCourseByCode.id;
            }

            if (classIdValue && courseIdValue) {
              if (!enrollmentsToCreate.find(e => e.class_id === classIdValue && e.course_id === courseIdValue)) {
                enrollmentsToCreate.push({
                  class_id: classIdValue,
                  course_id: courseIdValue,
                });
              }
            }
          }

          if (enrollmentsToCreate.length === 0) {
            set.status = "Bad Request";
            return { message: "ไม่พบข้อมูลการลงทะเบียนที่ถูกต้องหรือมีอยู่ในระบบในไฟล์ที่อัปโหลด" };
          }

          const result = await EnrollmentService.createMany(enrollmentsToCreate);

          set.status = "Created";
          return {
            data: result,
            message: "Enrollments imported successfully",
          };
        } catch (error: any) {
          console.error("Error importing enrollments:", error);
          set.status = "Internal Server Error";
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        body: t.Object({
          file: t.File(),
        }),
        response: {
          201: t.Object({ data: t.Array(EnrollmentWithRelationsSchema), message: t.String() }),
          400: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Enrollments"],
      }
    )

    .get(
        "/template",
        async ({ set }) => {
            try {
                const worksheet = xlsx.utils.aoa_to_sheet([
                    ["รหัสชั้นเรียน", "รหัสวิชา (ID)"]
                ]);
                const workbook = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(workbook, worksheet, "Enrollments");
                const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
                
                set.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                set.headers['Content-Disposition'] = 'attachment; filename=enrollment_template.xlsx';
                
                return buffer;
            } catch (error: any) {
                set.status = "Internal Server Error";
                return { message: error.message || "Internal Server Error" };
            }
        },
        {
            tags: ["Enrollments"],
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

          const result = await EnrollmentService.findAll({
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
            data: t.Array(EnrollmentWithRelationsSchema),
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
          500: t.String(),
        },
        tags: ["Enrollments"],
      }
    )

    .get(
      "/:id",
      async ({ params, set }) => {
        try {
          const result = await EnrollmentService.findById(params.id);
          return result;
        } catch (error: any) {
          set.status = "Internal Server Error";
          if ("message" in error) return error.message;
          return "Internal Server Error";
        }
      },
      {
        params: t.Object({ id: t.Number() }),
        response: {
          200: t.Object({ data: EnrollmentWithRelationsSchema }),
          500: t.String(),
        },
        tags: ["Enrollments"],
      }
    )

    .patch(
      "/:id",
      async ({ params, body, set }) => {
        try {
          const updatedCourseGroup = await EnrollmentService.update(
            params.id,
            body
          );
          set.status = "OK"; // 200
          return {
            data: updatedCourseGroup,
            message: "Enrollments updated successfully",
          };
        } catch (error: any) {
          if (error.message.includes("already exists")) {
            set.status = "Conflict"; // 409
            return error.message; // string
          }
          set.status = "Internal Server Error"; // 500
          return error.message || "Internal Server Error"; // string
        }
      },
      {
        params: t.Object({ id: t.Number() }),
        body: t.Partial(EnrollmentCreateUpdateSchema),
        response: {
          200: t.Object({
            data: EnrollmentWithRelationsSchema, // ต้อง match relations
            message: t.String(),
          }),
          409: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Enrollments"],
      }
    )

    .delete(
      "/clear",
      async ({ set }) => {
        try {
          await EnrollmentService.deleteAll();
          set.status = "OK";
          return {
            message: "All enrollments deleted successfully",
          };
        } catch (error: any) {
          set.status = "Internal Server Error";
          if ("message" in error) return error.message;
          return "Internal Server Error";
        }
      },
      {
        response: {
          200: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Enrollments"],
      }
    )

    .delete(
      "/:id",
      async ({ params, set }) => {
        try {
          const deleteEnrollment = await EnrollmentService.deleteById(
            params.id
          );
          set.status = "OK";
          return {
            deleteEnrollment,
            message: "Enrollment deleted successfully",
          };
        } catch (error: any) {
          set.status = "Internal Server Error";
          if ("message" in error) return error.message;
          return "Internal Server Error";
        }
      },
      {
        params: t.Object({ id: t.Number() }),
        response: {
          200: t.Object({
            deleteEnrollment: EnrollmentWithRelationsSchema,
            message: t.String(),
          }),
          500: t.String(),
        },
        tags: ["Enrollments"],
      }
    );
}
