import Elysia, { t } from "elysia";
import * as xlsx from "xlsx";
import { parse as csvParse } from "csv-parse";
import { Buffer } from "buffer"; // Explicitly import Buffer
import {
  ClassCreateUpdateSchema,
  ClassWithRelationsSchema,
  ClassCreateUpdate,
} from "./class.schema";
import { ClassService } from "./class.service";

export namespace ClassController {
  export const classController = new Elysia({ prefix: "/class" })
    .post(
      "/",
      async ({ body, set }) => {
        try {
          // The service method expects an array of data, even for a single item
          const dataToCreate = Array.isArray(body) ? body : [body]; // Ensure body is always an array
          const result = await ClassService.createMany(dataToCreate);
          set.status = "Created";
          return {
            data: result, // array ของ Class objects พร้อม relations
            message: "Classes created successfully",
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
        body: t.Union([ClassCreateUpdateSchema, t.Array(ClassCreateUpdateSchema)]),
        response: {
          201: t.Object({
            data: t.Array(ClassWithRelationsSchema),
            message: t.String(),
          }),
          409: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Classes"],
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
          const fileExtension = file.name.split(".").pop()?.toLowerCase();
          let classesToCreate: ClassCreateUpdate[] = [];

          const parseRecords = (records: any[]) => {
            return records.map((record) => {
              const getValue = (keys: string[]) => {
                for (const key of keys) {
                  if (record[key] !== undefined) return record[key];
                  const lowerKey = Object.keys(record).find(k => k.toLowerCase() === key.toLowerCase());
                  if (lowerKey) return record[lowerKey];
                }
                return undefined;
              };

              const deptIdRaw = getValue(['department_id', 'departmentId', 'dept_id', 'รหัสสาขาวิชา (ID)', 'รหัสสาขาวิชา']);
              const deptIdVal = typeof deptIdRaw === 'string' ? parseInt(deptIdRaw, 10) : deptIdRaw;
              
              const amountRaw = getValue(['amount', 'studentCount', 'count', 'จำนวนผู้เข้าสอบ', 'จำนวน', 'amount (คน)']);
              let amountVal = 0;
              if (typeof amountRaw === 'number') {
                amountVal = amountRaw;
              } else if (typeof amountRaw === 'string') {
                amountVal = parseInt(amountRaw.replace(/[^0-9]/g, ''), 10);
              }

              if (isNaN(deptIdVal)) {
                console.warn(`Missing or invalid departmentId for record:`, record);
                return null;
              }

              return {
                name: getValue(['name', 'className', 'class_name', 'ชื่อชั้นเรียน']) || '',
                level: (getValue(['level', 'classLevel', 'ระดับชั้น', 'ระดับ']) || 'ปวช').toUpperCase(),
                classYear: (() => {
                  const rawValue = getValue(['classYear', 'year', 'ชั้นปี']);
                  if (typeof rawValue === 'number' && rawValue > 30000) {
                    try {
                      const dateObj = xlsx.SSF.parse_date_code(rawValue);
                      return `${dateObj.d}/${dateObj.m}`;
                    } catch (e) {
                      return String(rawValue);
                    }
                  }
                  return String(rawValue || '');
                })(),
                department_id: deptIdVal,
                amount: isNaN(amountVal) ? 0 : amountVal,
              };
            }).filter((c) => c !== null && c.name !== '' && c.department_id !== undefined) as ClassCreateUpdate[];
          };

          if (fileExtension === "csv") {
            const csvString = Buffer.from(buffer).toString("utf8");
            const records = await new Promise<any[]>((resolve, reject) => {
              csvParse(
                csvString,
                {
                  columns: true,
                  skip_empty_lines: true,
                },
                (err, records) => {
                  if (err) reject(err);
                  else resolve(records);
                }
              );
            });
            classesToCreate = parseRecords(records);
          } else if (fileExtension === "xlsx") {
            const workbook = xlsx.read(buffer, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = xlsx.utils.sheet_to_json(sheet);
            classesToCreate = parseRecords(json);
          } else {
            set.status = "Bad Request";
            return {
              message:
                "Unsupported file type. Only CSV and XLSX are supported.",
            };
          }

          if (classesToCreate.length === 0) {
            set.status = "Bad Request";
            return { message: "No valid data found in the file." };
          }

          const result = await ClassService.createMany(classesToCreate);

          set.status = "Created";
          return {
            data: result,
            message: "Classes imported successfully",
          };
        } catch (error: any) {
          console.error("Error importing classes:", error);
          set.status = "Internal Server Error";
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        body: t.Object({
          file: t.File(),
        }),
        response: {
          201: t.Object({
            data: t.Array(ClassWithRelationsSchema),
            message: t.String(),
          }),
          400: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Classes"],
      }
    )

    .get(
        "/template",
        async ({ set }) => {
            try {
                const worksheet = xlsx.utils.aoa_to_sheet([
                    ["ชื่อชั้นเรียน", "ระดับชั้น", "ชั้นปี/ห้อง", "รหัสสาขาวิชา (ID)", "จำนวนผู้เข้าสอบ"]
                ]);
                const workbook = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(workbook, worksheet, "Classes");
                const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
                
                set.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                set.headers['Content-Disposition'] = 'attachment; filename=class_template.xlsx';
                
                return buffer;
            } catch (error: any) {
                set.status = "Internal Server Error";
                return { message: error.message || "Internal Server Error" };
            }
        },
        {
            tags: ["Classes"],
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
          const search = query.search ?? "";

          // เรียก service
          const result = await ClassService.findAll({
            page,
            itemsPerPage,
            search,
          });

          if (result.data.length === 0 && result.meta_data.total > 0) {
            set.status = "No Content"; // 204
            return { message: "No content for this page/query." };
          }

          // แปลงข้อมูลให้ตรง schema (department เป็น object แล้ว, ไม่ต้องแปลง)
          const transformed = {
            data: result.data.map((cls) => ({
              ...cls,
              // department เป็น object ไม่ใช่อาร์เรย์
              department: cls.department,
            })),
            meta_data: result.meta_data,
          };

          return transformed;
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
            data: t.Array(ClassWithRelationsSchema),
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
        tags: ["Classes"],
      }
    )
    .get(
      "/count",
      async ({ set }) => {
        try {
          const count = await ClassService.count();
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
        tags: ["Classes"],
      }
    )

    .get(
      "/:id",
      async ({ params, set }) => {
        try {
          const result = await ClassService.findById(params.id);
          set.status = "OK";
          return result;
        } catch (error: any) {
          set.status = "Internal Server Error";
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        params: t.Object({ id: t.Number() }),
        response: {
          200: t.Union([ClassWithRelationsSchema, t.Null()]),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Classes"],
      }
    )

    .patch(
      "/:id",
      async ({ params, body, set }) => {
        try {
          const result = await ClassService.update(params.id, body);
          set.status = "OK";
          return result;
        } catch (error: any) {
          set.status = "Internal Server Error";
          if ("message" in error) return error.message;
          return "Internal Server Error";
        }
      },
      {
        params: t.Object({ id: t.Number() }),
        body: t.Partial(ClassCreateUpdateSchema),
        response: {
          200: t.Object({ data: ClassWithRelationsSchema }),
          500: t.String(),
        },
        tags: ["Classes"],
      }
    )

    .delete(
      "/clear",
      async ({ set }) => {
        try {
          await ClassService.deleteAll();
          set.status = "OK";
          return { message: "All classes deleted successfully" };
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
        tags: ["Classes"],
      }
    )

    .delete(
      "/:id",
      async ({ params, set }) => {
        try {
          const deleteClass = await ClassService.deleteById(params.id);
          set.status = "OK";
          return {
            deletedClass: deleteClass,
            message: "Class deleted successfully",
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
            deletedClass: ClassWithRelationsSchema,
            message: t.String(),
          }),
          500: t.String(),
        },
        tags: ["Classes"],
      }
    );
}
