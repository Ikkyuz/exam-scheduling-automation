import Elysia, { t } from "elysia";
import * as xlsx from 'xlsx';
import { parse as csvParse } from 'csv-parse';
import { Buffer } from 'buffer'; // Explicitly import Buffer
import {
  DepartmentCreateUpdateSchema,
  DepartmentWithRelationsSchema,
  DepartmentCreateUpdate,
} from "./department.schema";
import { DepartmentService } from "./department.service";

import { authMiddleware } from "../../shared/middleware/auth";
import { Role } from "@/providers/database/generated/enums";

export namespace DepartmentController {
  export const departmentController = new Elysia({ prefix: "/departments" })
    .use(authMiddleware)
    .post(
      "/",
      async ({ body, set }) => {
        try {
          const newDepartment = await DepartmentService.createMany(body);
          set.status = "Created";
          return {
            newDepartment, // array ของ Department objects พร้อม relations
            message: "Department created successfully",
          };
        } catch (error: any) {
          if (error.message.includes("already exists")) {
            set.status = "Conflict"; // 409
            return { message: error.message };
          }
          set.status = "Internal Server Error"; // 500
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        body: t.Array(DepartmentCreateUpdateSchema),
        response: {
          201: t.Object({
            newDepartment: t.Array(DepartmentWithRelationsSchema), // ใช้ schema พร้อม relations
            message: t.String(),
          }),
          409: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Departments"],
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
          let departmentsToCreate: DepartmentCreateUpdate[] = [];

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

              return {
                name: getValue(['name', 'ชื่อสาขาวิชา']) || '',
              };
            }).filter(d => d.name !== '');
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
            departmentsToCreate = parseRecords(records);
          } else if (fileExtension === 'xlsx') {
            const workbook = xlsx.read(buffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = xlsx.utils.sheet_to_json(sheet);
            departmentsToCreate = parseRecords(json);
          } else {
            set.status = "Bad Request";
            return { message: "Unsupported file type. Only CSV and XLSX are supported." };
          }

          if (departmentsToCreate.length === 0) {
            set.status = "Bad Request";
            return { message: "No valid data found in the file." };
          }

          const result = await DepartmentService.createMany(departmentsToCreate);

          set.status = "Created";
          return {
            data: result,
            message: "Departments imported successfully",
          };
        } catch (error: any) {
          console.error("Error importing departments:", error);
          set.status = "Internal Server Error";
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        body: t.Object({
          file: t.File(),
        }),
        response: {
          201: t.Object({ data: t.Array(DepartmentWithRelationsSchema), message: t.String() }),
          400: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Departments"],
        role: Role.ADMIN,
      }
    )

    .get(
        "/template",
        async ({ set }) => {
            try {
                const worksheet = xlsx.utils.aoa_to_sheet([
                    ["ชื่อสาขาวิชา"]
                ]);
                const workbook = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(workbook, worksheet, "Departments");
                const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
                
                set.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                set.headers['Content-Disposition'] = 'attachment; filename=department_template.xlsx';
                
                return buffer;
            } catch (error: any) {
                set.status = "Internal Server Error";
                return { message: error.message || "Internal Server Error" };
            }
        },
        {
            tags: ["Departments"],
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

          const result = await DepartmentService.findAll({
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
            data: t.Array(DepartmentWithRelationsSchema),
            meta_data: t.Object({
              page: t.Number(),
              itemsPerPage: t.Number(),
              total: t.Number(),
              totalPages: t.Number(),
              nextPage: t.Boolean(),
              previousPage: t.Boolean(),
            }),
          }),
          204: t.Object({ message: t.String() }), // กรณีไม่มีข้อมูลในหน้านั้นๆ
          500: t.Object({ message: t.String() }),
        },
        tags: ["Departments"],
        isLoggedIn: true,
      }
    )
    .get(
      "/:id",
      async ({ params, set }) => {
        try {
          const department = await DepartmentService.findById(params.id);
          return department;
        } catch (error: any) {
          set.status = "Internal Server Error"; // 500
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        params: t.Object({ id: t.Number() }),
        response: {
          200: DepartmentWithRelationsSchema,
          500: t.Object({ message: t.String() }),
        },
        tags: ["Departments"],
        isLoggedIn: true,
      }
    )
    .patch(
      "/:id",
      async ({ params, body, set }) => {
        try {
          const updatedDepartment = await DepartmentService.update(
            params.id,
            body
          );
          set.status = "OK"; // 200
          return {
            updatedDepartment,
            message: "Department updated successfully",
          };
        } catch (error: any) {
          if (error.message.includes("Unique constraint violated")) {
            set.status = "Conflict"; // 409
            return { message: error.message };
          }
          set.status = "Internal Server Error"; // 500
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        params: t.Object({ id: t.Number() }),
        body: t.Partial(DepartmentCreateUpdateSchema),
        response: {
          200: t.Object({
            updatedDepartment: DepartmentWithRelationsSchema,
            message: t.String(),
          }),
          409: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Departments"],
        role: Role.ADMIN,
      }
    )
    .delete(
      "/clear",
      async ({ set }) => {
        try {
          await DepartmentService.deleteAll();
          set.status = "OK"; // 200
          return {
            message: "Departments deleted successfully",
          };
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
        tags: ["Departments"],
        role: Role.ADMIN,
      }
    )
    .delete(
      "/:id",
      async ({ params, set }) => {
        try {
          const deletedDepartment = await DepartmentService.deleteById(params.id);
          set.status = "OK"; // 200
          return {
            deletedDepartment,
            message: "Department deleted successfully",
          };
        } catch (error: any) {
          if (
            error.message.includes(
              "Cannot delete department because it has related records"
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
            deletedDepartment: DepartmentWithRelationsSchema,
            message: t.String(),
          }),
          409: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Departments"],
        role: Role.ADMIN,
      }
    );
}

