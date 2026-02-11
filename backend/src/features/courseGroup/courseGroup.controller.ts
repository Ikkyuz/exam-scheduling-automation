import Elysia, { t } from "elysia";
import * as xlsx from 'xlsx';
import { parse as csvParse } from 'csv-parse';
import { Buffer } from 'buffer'; // Explicitly import Buffer
import {
  CourseGroupCreateUpdateSchema,
  CourseGroupWithRelationsSchema,
  CourseGroupCreateUpdate,
} from "./courseGroup.schema";
import { CourseGroupService } from "./courseGroup.service";

export namespace CourseGroupController {
  export const courseGroupController = new Elysia({ prefix: "/courseGroups" })
    .post(
      "/",
      async ({ body, set }) => {
        try {
          const newCourseGroup = await CourseGroupService.createMany(body);
          set.status = "Created";
          return {
            newCourseGroup, // array ของ CourseGroup พร้อม course
            message: "CourseGroup created successfully",
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
        body: t.Array(CourseGroupCreateUpdateSchema),
        response: {
          201: t.Object({
            newCourseGroup: t.Array(CourseGroupWithRelationsSchema), // ใช้ schema พร้อม relations
            message: t.String(),
          }),
          409: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["CourseGroups"],
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
            // ใช้ defval: null เพื่อให้แยกแยะแถวว่างได้ชัดเจนขึ้น
            records = xlsx.utils.sheet_to_json(sheet, { defval: null });
          } else {
            set.status = "Bad Request";
            return { message: "Unsupported file type. Only CSV and XLSX are supported." };
          }

          if (records.length === 0) {
            set.status = "Bad Request";
            return { message: "ไม่พบข้อมูลในไฟล์" };
          }

          const getValue = (record: any, keys: string[]) => {
            // 1. หาตามชื่อที่ระบุ
            for (const key of keys) {
              const val = record[key];
              if (val !== undefined && val !== null && String(val).trim() !== "") return val;
              
              const lowerKey = Object.keys(record).find(k => k.toLowerCase() === key.toLowerCase());
              if (lowerKey) {
                const lowerVal = record[lowerKey];
                if (lowerVal !== undefined && lowerVal !== null && String(lowerVal).trim() !== "") return lowerVal;
              }
            }
            
            // 2. ถ้าไม่เจอเลย ให้เอาค่าจากคอลัมน์แรกมา (เผื่อหัวตารางชื่อไม่ตรง)
            const firstKey = Object.keys(record)[0];
            if (firstKey) {
              const firstVal = record[firstKey];
              if (firstVal !== undefined && firstVal !== null && String(firstVal).trim() !== "") return firstVal;
            }

            return undefined;
          };

          const courseGroupsToCreate: CourseGroupCreateUpdate[] = [];
          const allCourses = await CourseGroupService.getAllCourses();
          
          // โครงสร้างสำหรับเก็บข้อมูลแยกตามกลุ่ม: { "group1": [id1, id2], "group2": [id3] }
          const groupsMap: Record<string, number[]> = {};

          for (const record of records) {
            let courseIdValue: number | undefined;
            let groupIdentifier: string = "default";
            let groupKeyFound: string | null = null;

            // 1. หาคอลัมน์กลุ่ม (Identifier)
            const groupKeys = ['group', 'groupnum', 'กลุ่ม', 'ชุด', 'no', 'ลำดับ'];
            for (const key of Object.keys(record)) {
              if (groupKeys.includes(key.toLowerCase().trim())) {
                const rawValue = record[key];
                if (typeof rawValue === 'number' && rawValue > 30000) {
                  try {
                    const dateObj = xlsx.SSF.parse_date_code(rawValue);
                    groupIdentifier = `${dateObj.d}/${dateObj.m}`;
                  } catch (e) {
                    groupIdentifier = String(rawValue).trim();
                  }
                } else {
                  groupIdentifier = String(rawValue || '').trim();
                }
                groupKeyFound = key;
                break;
              }
            }

            // 2. หาข้อมูลวิชา (ID หรือ Code) โดยข้ามคอลัมน์ที่เป็นคอลัมน์กลุ่ม
            for (const [key, val] of Object.entries(record)) {
              if (key === groupKeyFound) continue; // ข้ามคอลัมน์กลุ่ม
              
              const strVal = String(val).trim();
              if (!strVal) continue;

              // ตรวจสอบว่าเป็น ID หรือไม่
              const numVal = Number(strVal);
              if (!isNaN(numVal)) {
                const foundById = allCourses.find(c => c.id === numVal);
                if (foundById) {
                  courseIdValue = foundById.id;
                  break;
                }
              }

              // ตรวจสอบว่าเป็น Code หรือไม่
              const foundByCode = allCourses.find(c => c.code === strVal);
              if (foundByCode) {
                courseIdValue = foundByCode.id;
                break;
              }
            }

            if (courseIdValue) {
              if (!groupsMap[groupIdentifier]) groupsMap[groupIdentifier] = [];
              if (!groupsMap[groupIdentifier].includes(courseIdValue)) {
                groupsMap[groupIdentifier].push(courseIdValue);
              }
            }
          }

          const groupKeys = Object.keys(groupsMap);
          if (groupKeys.length === 0) {
            set.status = "Bad Request";
            return { message: "ไม่พบข้อมูลรหัสวิชาที่ถูกต้องในระบบ" };
          }

          // ประมวลผลทีละกลุ่ม
          const finalResults = [];
          for (const key of groupKeys) {
            const courseIds = groupsMap[key];
            const payload = courseIds.map(id => ({ course_id: id }));
            const result = await CourseGroupService.createMany(payload);
            finalResults.push(...result);
          }

          set.status = "Created";
          return {
            data: finalResults,
            message: `นำเข้าข้อมูลสำเร็จ ${groupKeys.length} กลุ่ม`,
          };
        } catch (error: any) {
          console.error("Error importing course groups:", error);
          set.status = "Internal Server Error";
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        body: t.Object({
          file: t.File(),
        }),
        response: {
          201: t.Object({ data: t.Array(CourseGroupWithRelationsSchema), message: t.String() }),
          400: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["CourseGroups"],
      }
    )

    .get(
        "/template",
        async ({ set }) => {
            try {
                const worksheet = xlsx.utils.aoa_to_sheet([
                    ["กลุ่ม", "รหัสวิชา"]
                ]);
                const workbook = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(workbook, worksheet, "CourseGroups");
                const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
                
                set.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                set.headers['Content-Disposition'] = 'attachment; filename=course_group_template.xlsx';
                
                return buffer;
            } catch (error: any) {
                set.status = "Internal Server Error";
                return { message: error.message || "Internal Server Error" };
            }
        },
        {
            tags: ["CourseGroups"],
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

          const result = await CourseGroupService.findAll({
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
            data: t.Array(CourseGroupWithRelationsSchema),
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
        tags: ["CourseGroups"],
      }
    )
    .get(
        "/count",
        async ({ set }) => {
            try {
                const count = await CourseGroupService.count();
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
            tags: ["CourseGroups"],
        }
    )

    .get(
      "/:id",
      async ({ params, set }) => {
        try {
          const result = await CourseGroupService.findById(params.id);
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
          200: CourseGroupWithRelationsSchema,
          500: t.String(),
        },
        tags: ["CourseGroups"],
      }
    )

    .patch(
      "/:id",
      async ({ params, body, set }) => {
        try {
          const updatedCourseGroup = await CourseGroupService.update(
            params.id,
            body
          );
          set.status = "OK"; // 200
          return {
            data: updatedCourseGroup,
            message: "CourseGroup updated successfully",
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
        body: t.Partial(CourseGroupCreateUpdateSchema),
        response: {
          200: t.Object({
            data: CourseGroupWithRelationsSchema, // ต้อง match relations
            message: t.String(),
          }),
          409: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["CourseGroups"],
      }
    )

    .delete(
      "/clear",
      async ({ set }) => {
        try {
          await CourseGroupService.deleteAll();
          set.status = "OK";
          return {
            message: "All courseGroups deleted successfully",
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
        tags: ["CourseGroups"],
      }
    )

    .delete(
      "/:id",
      async ({ params, set }) => {
        try {
          const deleteCourseGroup = await CourseGroupService.deleteById(
            params.id
          );
          set.status = "OK";
          return {
            deleteCourseGroup,
            message: "CourseGroup deleted successfully",
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
            deleteCourseGroup: CourseGroupWithRelationsSchema,
            message: t.String(),
          }),
          500: t.String(),
        },
        tags: ["CourseGroups"],
      }
    );
}
