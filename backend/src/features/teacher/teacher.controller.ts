import Elysia, { t } from "elysia";
import * as xlsx from 'xlsx';
import { parse as csvParse } from 'csv-parse';
import { Buffer } from 'buffer'; // Explicitly import Buffer
import {
  TeacherCreateUpdateSchema,
  TeacherWithRelationsSchema,
  TeacherCreateUpdate,
} from "../teacher/teacher.schema";
import { TeacherService } from "../teacher/teacher.service";
import { DepartmentService } from "../department/department.service";

export namespace TeacherController {
  export const teacherController = new Elysia({ prefix: "/teachers" })
    .post(
      "/",
      async ({ body, set }) => {
        try {
          const newTeacher = await TeacherService.createMany(body);
          set.status = 201;
          return {
            newTeacher, // array ของ Teacher objects พร้อม relations
            message: "Teacher created successfully",
          };
        } catch (error: any) {
          if (error.message.includes("Bad Request")) {
            set.status = 400;
            return { message: error.message };
          }
          if (error.message.includes("already exists")) {
            set.status = 409;
            return { message: error.message };
          }
          set.status = 500;
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        body: t.Array(TeacherCreateUpdateSchema),
        response: {
          201: t.Object({
            newTeacher: t.Array(TeacherWithRelationsSchema), // ใช้ schema พร้อม relations
            message: t.String(),
          }),
          400: t.Object({ message: t.String() }),
          409: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Teachers"],
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
          let rawRecords: any[] = [];

          if (fileExtension === 'csv') {
            const csvString = Buffer.from(buffer).toString('utf8');
            rawRecords = await new Promise<any[]>((resolve, reject) => {
              csvParse(csvString, {
                columns: true,
                skip_empty_lines: true
              }, (err, records) => {
                if (err) reject(err);
                else resolve(records);
              });
            });
          } else if (fileExtension === 'xlsx') {
            const workbook = xlsx.read(buffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            rawRecords = xlsx.utils.sheet_to_json(sheet);
          } else {
            set.status = "Bad Request";
            return { message: "Unsupported file type. Only CSV and XLSX are supported." };
          }

          const departments = await DepartmentService.findAll({ itemsPerPage: -1 });
          const teachersToCreate: TeacherCreateUpdate[] = [];

          for (const record of rawRecords) {
            const getValue = (keys: string[]) => {
              for (const key of keys) {
                if (record[key] !== undefined) return record[key];
                const lowerKey = Object.keys(record).find(k => k.toLowerCase() === key.toLowerCase());
                if (lowerKey) return record[lowerKey];
              }
              return undefined;
            };

            const deptRaw = getValue(['department_id', 'departmentId', 'dept_id', 'รหัสสาขาวิชา (ID)', 'รหัสสาขาวิชา', 'ชื่อสาขาวิชา', 'สาขาวิชา']);
            let deptIdVal: number | undefined;

            if (deptRaw) {
              const deptStr = String(deptRaw).trim();
              const deptIdNum = parseInt(deptStr, 10);
              
              if (!isNaN(deptIdNum)) {
                const foundDept = departments.data.find(d => d.id === deptIdNum);
                if (foundDept) deptIdVal = foundDept.id;
              }
              
              if (!deptIdVal) {
                const foundDeptByName = departments.data.find(d => d.name === deptStr);
                if (foundDeptByName) deptIdVal = foundDeptByName.id;
              }
            }

            if (deptIdVal) {
              teachersToCreate.push({
                firstname: getValue(['firstname', 'firstName', 'first_name', 'ชื่อ']) || '',
                lastname: getValue(['lastname', 'lastName', 'last_name', 'นามสกุล']) || '',
                department_id: deptIdVal,
                tel: getValue(['tel', 'telephone', 'mobile', 'เบอร์โทร', 'เบอร์โทรศัพท์']) || '',
              });
            }
          }

          if (teachersToCreate.length === 0) {
            set.status = "Bad Request";
            return { message: "ไม่พบข้อมูลที่ถูกต้องในไฟล์" };
          }

          const result = await TeacherService.createMany(teachersToCreate);

          set.status = "Created";
          return {
            data: result,
            message: "Teachers imported successfully",
          };
        } catch (error: any) {
          console.error("Error importing teachers:", error);
          set.status = "Internal Server Error";
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        body: t.Object({
          file: t.File(),
        }),
        response: {
          201: t.Object({ data: t.Array(TeacherWithRelationsSchema), message: t.String() }),
          400: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Teachers"],
      }
    )

    .get(
        "/template",
        async ({ set }) => {
            try {
                const worksheet = xlsx.utils.aoa_to_sheet([
                    ["ชื่อ", "นามสกุล", "เบอร์โทรศัพท์", "ชื่อสาขาวิชา"]
                ]);
                const workbook = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(workbook, worksheet, "Teachers");
                const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
                
                set.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                set.headers['Content-Disposition'] = 'attachment; filename=teacher_template.xlsx';
                
                return buffer;
            } catch (error: any) {
                set.status = "Internal Server Error";
                return { message: error.message || "Internal Server Error" };
            }
        },
        {
            tags: ["Teachers"],
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

          const result = await TeacherService.findAll({
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
            data: t.Array(TeacherWithRelationsSchema),
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
        tags: ["Teachers"],
      }
    )
    .get(
        "/count",
        async ({ set }) => {
            try {
                const count = await TeacherService.count();
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
            tags: ["Teachers"],
        }
    )
    .get(
      "/:id",
      async ({ params, set }) => {
        try {
          const teacher = await TeacherService.findById(params.id);
          return teacher;
        } catch (error: any) {
          set.status = "Internal Server Error"; // 500
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        params: t.Object({ id: t.Number() }),
        response: {
          200: TeacherWithRelationsSchema,
          500: t.Object({ message: t.String() }),
        },
        tags: ["Teachers"],
      }
    )
    .patch(
      "/:id",
      async ({ params, body, set }) => {
        try {
          const updatedTeacher = await TeacherService.update(params.id, body);
          set.status = "OK"; // 200
          return { updatedTeacher, message: "Teacher updated successfully" };
        } catch (error: any) {
          if (error.message.includes("already exists")) {
            set.status = "Conflict"; // 409
            return { message: error.message };
          }
          if (error.message.includes("Bad Request")) {
            set.status = "Bad Request"; // 400
            return { message: error.message };
          }
          set.status = "Internal Server Error"; // 500
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        params: t.Object({ id: t.Number() }),
        body: t.Partial(TeacherCreateUpdateSchema),
        response: {
          200: t.Object({
            updatedTeacher: TeacherWithRelationsSchema,
            message: t.String(),
          }),
          400: t.Object({ message: t.String() }),
          409: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Teachers"],
      }
    )
    .delete(
      "/clear",
      async ({ set }) => {
        try {
          await TeacherService.deleteAll();
          set.status = "OK"; // 200
          return { message: "Teachers deleted successfully" };
        } catch (error: any) {
          set.status = "Internal Server Error"; // 500
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        response: {
          200: t.Object({
            message: t.String(),
          }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Teachers"],
      }
    )
    .delete(
      "/:id",
      async ({ params, set }) => {
        try {
          const deletedTeacher = await TeacherService.deleteById(params.id);
          set.status = "OK"; // 200
          return { deletedTeacher, message: "Teacher deleted successfully" };
        } catch (error: any) {
          if (
            error.message.includes(
              "Cannot delete teacher because it has related records"
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
            deletedTeacher: TeacherWithRelationsSchema,
            message: t.String(),
          }),
          409: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Teachers"],
      }
    );
}
