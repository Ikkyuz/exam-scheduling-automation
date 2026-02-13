import Elysia, { t } from "elysia";
import * as xlsx from 'xlsx';
import { parse as csvParse } from 'csv-parse';
import { Buffer } from 'buffer'; // Explicitly import Buffer
import {
  ProctorPairCreateUpdateSchema,
  ProctorPairWithRelationsSchema,
  ProctorPairCreateUpdate,
} from "./proctorPair.schema";
import { ProctorPairService } from "./proctorPair.service";

import { authMiddleware } from "../../shared/middleware/auth";
import { Role } from "@/providers/database/generated/enums";

export namespace ProctorPairController {
  export const proctorPairController = new Elysia({ prefix: "/proctorPairs" })
    .use(authMiddleware)
    .post(
      "/",
      async ({ body, set }) => {
        try {
          const newProctorPair = await ProctorPairService.createMany(body);
          set.status = "Created";
          return {
            newProctorPair, // array ของ ProctorPair objects พร้อม teacher
            message: "ProctorPair created successfully",
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
        body: t.Array(ProctorPairCreateUpdateSchema),
        response: {
          201: t.Object({
            newProctorPair: t.Array(ProctorPairWithRelationsSchema), // ใช้ schema พร้อม relations
            message: t.String(),
          }),
          409: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["ProctorPairs"],
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

          const allTeachers = await ProctorPairService.getAllTeachers();
          const groupsMap: Record<string, number[]> = {};

          for (const record of records) {
            let teacherIdValue: number | undefined;
            let groupIdentifier: string = "default";
            let groupKeyFound: string | null = null;

            // 1. หาข้อมูลกลุ่ม
            const groupKeys = ['group', 'groupnum', 'กลุ่ม', 'ชุด', 'no', 'ลำดับ'];
            for (const key of Object.keys(record)) {
              if (groupKeys.includes(key.toLowerCase().trim())) {
                groupIdentifier = String(record[key]).trim();
                groupKeyFound = key;
                break;
              }
            }

            // 2. หาข้อมูลอาจารย์ โดยข้ามคอลัมน์ที่เป็นกลุ่ม
            for (const [key, val] of Object.entries(record)) {
              if (key === groupKeyFound) continue;

              const strVal = String(val).trim();
              if (!strVal || strVal === 'null') continue;

              const numVal = Number(strVal);
              if (!isNaN(numVal)) {
                const foundTeacher = allTeachers.find(t => t.id === numVal);
                if (foundTeacher) {
                  teacherIdValue = foundTeacher.id;
                  break;
                }
              }

              const foundTeacherByName = allTeachers.find(t => 
                t.firstname === strVal || 
                t.lastname === strVal || 
                `${t.firstname} ${t.lastname}` === strVal ||
                t.tel === strVal
              );
              if (foundTeacherByName) {
                teacherIdValue = foundTeacherByName.id;
                break;
              }
            }

            if (teacherIdValue) {
              if (!groupsMap[groupIdentifier]) groupsMap[groupIdentifier] = [];
              if (!groupsMap[groupIdentifier].includes(teacherIdValue)) {
                groupsMap[groupIdentifier].push(teacherIdValue);
              }
            }
          }

          const groupKeys = Object.keys(groupsMap);
          if (groupKeys.length === 0) {
            set.status = "Bad Request";
            return { message: "ไม่พบข้อมูลอาจารย์ที่ถูกต้องในระบบจากไฟล์ที่อัปโหลด" };
          }

          const finalResults = [];
          for (const key of groupKeys) {
            const teacherIds = groupsMap[key];
            // แปลง key เป็น number ถ้าเป็นตัวเลข
            const groupNum = isNaN(Number(key)) ? undefined : Number(key);
            const payload = teacherIds.map(id => ({ 
              teacher_id: id,
              groupNum: groupNum 
            }));
            const result = await ProctorPairService.createMany(payload);
            finalResults.push(...result);
          }

          set.status = "Created";
          return {
            data: finalResults,
            message: `นำเข้าข้อมูลสำเร็จ ${groupKeys.length} คู่`,
          };
        } catch (error: any) {
          console.error("Error importing proctor pairs:", error);
          set.status = "Internal Server Error";
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        body: t.Object({
          file: t.File(),
        }),
        response: {
          201: t.Object({ data: t.Array(ProctorPairWithRelationsSchema), message: t.String() }),
          400: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["ProctorPairs"],
        role: Role.ADMIN,
      }
    )

    .get(
        "/template",
        async ({ set }) => {
            try {
                const worksheet = xlsx.utils.aoa_to_sheet([
                    ["กลุ่ม", "ชื่อ-นามสกุลอาจารย์"]
                ]);
                const workbook = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(workbook, worksheet, "ProctorPairs");
                const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
                
                set.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                set.headers['Content-Disposition'] = 'attachment; filename=proctor_pair_template.xlsx';
                
                return buffer;
            } catch (error: any) {
                set.status = "Internal Server Error";
                return { message: error.message || "Internal Server Error" };
            }
        },
        {
            tags: ["ProctorPairs"],
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

          const result = await ProctorPairService.findAll({
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
            data: t.Array(ProctorPairWithRelationsSchema),
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
        tags: ["ProctorPairs"],
        isLoggedIn: true,
      }
    )
    .get(
        "/count",
        async ({ set }) => {
            try {
                const count = await ProctorPairService.count();
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
            tags: ["ProctorPairs"],
            isLoggedIn: true,
        }
    )

    .get(
      "/:id",
      async ({ params, set }) => {
        try {
          const result = await ProctorPairService.findById(params.id);
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
          200: ProctorPairWithRelationsSchema,
          500: t.String(),
        },
        tags: ["ProctorPairs"],
        isLoggedIn: true,
      }
    )

    .patch(
      "/:id",
      async ({ params, body, set }) => {
        try {
          const updatedProctorPair = await ProctorPairService.update(
            params.id,
            body
          );
          set.status = "OK"; // 200
          return {
            data: updatedProctorPair,
            message: "ProctorPair updated successfully",
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
        body: t.Partial(ProctorPairCreateUpdateSchema),
        response: {
          200: t.Object({
            data: ProctorPairWithRelationsSchema, // ต้อง match relations
            message: t.String(),
          }),
          409: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["ProctorPairs"],
        role: Role.ADMIN,
      }
    )

    .delete(
      "/clear",
      async ({ set }) => {
        try {
          await ProctorPairService.deleteAll();
          set.status = "OK";
          return {
            message: "All proctorPairs deleted successfully",
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
        tags: ["ProctorPairs"],
        role: Role.ADMIN,
      }
    )

    .delete(
      "/:id",
      async ({ params, set }) => {
        try {
          const deleteProctorPair = await ProctorPairService.deleteById(
            params.id
          );
          set.status = "OK";
          return {
            deleteProctorPair,
            message: "ProctorPair deleted successfully",
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
            deleteProctorPair: ProctorPairWithRelationsSchema,
            message: t.String(),
          }),
          500: t.String(),
        },
        tags: ["ProctorPairs"],
        role: Role.ADMIN,
      }
    );
}