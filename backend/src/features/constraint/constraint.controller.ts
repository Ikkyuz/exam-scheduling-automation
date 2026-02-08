import Elysia, { t } from "elysia";
import * as xlsx from "xlsx";
import { parse as csvParse } from "csv-parse";
import { Buffer } from "buffer"; // Explicitly import Buffer
import {
  constraintSchema,
  constraintCreateUpdateSchema,
  ConstraintCreateUpdate,
} from "./constraint.schema";
import { ConstraintService } from "./constraint.service";

export namespace ConstraintController {
  export const constraintController = new Elysia({ prefix: "/constraint" })
    .post(
      "/",
      async ({ body, set }) => {
        try {
          const result = await ConstraintService.create(body);
          set.status = "Created";
          return {
            data: result,
            message: "Constraints created successfully",
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
        body: constraintCreateUpdateSchema, // Expect array for consistency with import
        response: {
          201: t.Object({
            data: constraintSchema,
            message: t.String(),
          }),
          409: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Constraints"],
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
          const fileExtension = file.name.split(".").pop()?.toLowerCase(); // Ensure lowercase
          let constraintsToCreate: ConstraintCreateUpdate[] = [];

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

              const levelRaw = getValue(['level', 'ระดับ']);
              const levelValue = typeof levelRaw === "string" ? levelRaw.toUpperCase() : undefined;
              
              const categoryValue = getValue(['category', 'ประเภท']);

              return {
                category: categoryValue,
                level: levelValue,
                constraint: getValue(['constraint', 'ข้อจำกัด']),
              };
            });
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
            constraintsToCreate = parseRecords(records);
          } else if (fileExtension === "xlsx") {
            const workbook = xlsx.read(buffer, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = xlsx.utils.sheet_to_json(sheet);
            constraintsToCreate = parseRecords(json);
          } else {
            set.status = "Bad Request";
            return {
              message:
                "Unsupported file type. Only CSV and XLSX are supported.",
            };
          }

          if (constraintsToCreate.length === 0) {
            set.status = "Bad Request";
            return { message: "No valid data found in the file." };
          }

          await ConstraintService.importConstraints(constraintsToCreate);

          set.status = "Created";
          return {
            message: "Constraints imported successfully",
          };
        } catch (error: any) {
          console.error("Error importing constraints:", error);
          set.status = "Internal Server Error";
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        body: t.Object({
          file: t.File(),
        }),
        response: {
          201: t.Object({ message: t.String() }),
          400: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Constraints"],
      }
    )

    .get(
        "/template",
        async ({ set }) => {
            try {
                const worksheet = xlsx.utils.aoa_to_sheet([
                    ["ประเภท", "ระดับ", "ข้อจำกัด"]
                ]);
                const workbook = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(workbook, worksheet, "Constraints");
                const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
                
                set.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                set.headers['Content-Disposition'] = 'attachment; filename=constraint_template.xlsx';
                
                return buffer;
            } catch (error: any) {
                set.status = "Internal Server Error";
                return { message: error.message || "Internal Server Error" };
            }
        },
        {
            tags: ["Constraints"],
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

          const result = await ConstraintService.findAll({
            page,
            itemsPerPage,
            search: search || undefined,
          });

          if (result.data.length === 0 && result.meta_data.total > 0) {
             set.status = 204;
             return;
          }

          return result;
        } catch (error: any) {
          set.status = 500;
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        query: t.Object({
          page: t.Optional(t.Any()),
          itemsPerPage: t.Optional(t.Any()),
          search: t.Optional(t.String()),
        }),
        response: {
          200: t.Object({
            data: t.Array(constraintSchema),
            meta_data: t.Object({
              page: t.Number(),
              itemsPerPage: t.Number(),
              total: t.Number(),
              totalPages: t.Number(),
              nextPage: t.Boolean(),
              previousPage: t.Boolean(),
            }),
          }),
          204: t.Void(),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Constraints"],
      }
    )
    .get(
      "/:id",
      async ({ params, set }) => {
        try {
          const result = await ConstraintService.findById(params.id);
        return {
          data: result,
          message: "Constraints retrieved successfully",
        };
        } catch (error: any) {
          set.status = "Internal Server Error";
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        params: t.Object({
          id: t.Number(),
        }),
        response: {
          200: t.Object({
            data: constraintSchema,
            message: t.String(),
          }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Constraints"],
      }
    )
    .patch(
      "/:id",
      async ({ params, body, set }) => {
        console.log("ID:", params.id);
        console.log("Body:", body);
        try {
          const result = await ConstraintService.update(
            Number(params.id),
            body
          );
          return {
            data: result,
            message: "Constraint updated successfully",
          };
        } catch (error: any) {
          console.error("Database Error:", error);
          set.status = "Internal Server Error";
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        params: t.Object({
          id: t.Number(),
        }),
        body: t.Partial(constraintCreateUpdateSchema),
        response: {
          200: t.Object({
            data: constraintSchema,
            message: t.String(),
          }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Constraints"],
      }
    )

    .delete(
      "/clear",
      async ({ set }) => {
        try {
          await ConstraintService.deleteAll();
          return {
            message: "All constraints deleted successfully",
          };
        } catch (error: any) {
          set.status = "Internal Server Error";
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        response: {
          200: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Constraints"],
      }
    )

    .delete(
      "/:id",
      async ({ params, set }) => {
        try {
          await ConstraintService.deleteById(params.id);
          return {
            message: "Constraint deleted successfully",
          };
        } catch (error: any) {
          set.status = "Internal Server Error";
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        params: t.Object({
          id: t.Number(),
        }),
        response: {
          200: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Constraints"],
      }
    );
}
