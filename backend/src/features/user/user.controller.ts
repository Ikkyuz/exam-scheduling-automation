import Elysia, { t } from "elysia";
import * as xlsx from "xlsx";
import { parse as csvParse } from 'csv-parse';
import { Buffer } from 'buffer';
import {
  UserResponseSchema,
  UserCreateSchema,
  UserUpdateSchema,
  UserCreate,
} from "./user.schema";
import { UserService } from "./user.service";

import { authMiddleware } from "../../shared/middleware/auth";
import { Role } from "@/providers/database/generated/enums";

export namespace UserController {
  export const userController = new Elysia({ prefix: "/users" })
    .use(authMiddleware)
    .post(
      "/",
      async ({ body, set }) => {
        try {
          const newUser = await UserService.create(body);
          set.status = 201;
          return { newUser, message: "User has created" };
        } catch (error: any) {
          if (error.message === "Username already exists") {
            set.status = "Conflict";
            return error.message;
          } else if (
            error.message ===
              "User firstname is required and cannot be empty." ||
            error.message ===
              "User lastname is required and cannot be empty." ||
            error.message ===
              "User username is required and cannot be empty." ||
            error.message === "User password is required and cannot be empty."
          ) {
            set.status = "Bad Request";
            return error.message;
          }
          set.status = "Internal Server Error";
          if ("message" in error) {
            return error.message;
          }
          return "Internal Server Error";
        }
      },
      {
        body: UserCreateSchema,
        response: {
          201: t.Object({
            newUser: UserResponseSchema,
            message: t.String(),
          }),
          409: t.String(),
          500: t.String(),
        },
        tags: ["Users"],
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
          let usersToCreate: UserCreate[] = [];

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
                username: getValue(['username', 'ชื่อผู้ใช้']) || '',
                password: getValue(['password', 'รหัสผ่าน']) || '',
                firstname: getValue(['firstname', 'ชื่อจริง', 'ชื่อ']) || '',
                lastname: getValue(['lastname', 'นามสกุล']) || '',
                email: getValue(['email', 'อีเมล']) || '',
                role: (getValue(['role', 'บทบาท']) || 'USER').toUpperCase(),
              };
            }).filter(u => u.username !== '');
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
            usersToCreate = parseRecords(records);
          } else if (fileExtension === 'xlsx') {
            const workbook = xlsx.read(buffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = xlsx.utils.sheet_to_json(sheet);
            usersToCreate = parseRecords(json);
          } else {
            set.status = "Bad Request";
            return { message: "Unsupported file type. Only CSV and XLSX are supported." };
          }

          if (usersToCreate.length === 0) {
            set.status = "Bad Request";
            return { message: "No valid data found in the file." };
          }

          await UserService.importUsers(usersToCreate);

          set.status = "Created";
          return {
            message: "Users imported successfully",
          };
        } catch (error: any) {
          console.error("Error importing users:", error);
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
        tags: ["Users"],
        role: Role.ADMIN,
      }
    )
    .get(
        "/template",
        async ({ set }) => {
            try {
                const worksheet = xlsx.utils.aoa_to_sheet([
                    ["ชื่อผู้ใช้", "รหัสผ่าน", "ชื่อจริง", "นามสกุล", "อีเมล", "บทบาท"]
                ]);
                const workbook = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(workbook, worksheet, "Users");
                const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
                
                set.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                set.headers['Content-Disposition'] = 'attachment; filename=user_template.xlsx';
                
                return buffer;
            } catch (error: any) {
                set.status = "Internal Server Error";
                return { message: error.message || "Internal Server Error" };
            }
        },
        {
            tags: ["Users"],
            role: Role.ADMIN,
        }
    )
    .get(
      "/",
      async ({ query, set }) => {
        const page = query.page ? Number(query.page) : 1;
        const itemsPerPage = query.itemsPerPage
          ? Number(query.itemsPerPage)
          : 10;
        const search = query.search;

        const result = await UserService.findAll({
          page,
          itemsPerPage,
          search,
        });

        return result;
      },
      {
        query: t.Object({
          page: t.Optional(t.Numeric()),
          itemsPerPage: t.Optional(t.Numeric()),
          search: t.Optional(t.String()),
        }),
        response: {
          200: t.Object({
            data: t.Array(UserResponseSchema),
            meta_data: t.Object({
              page: t.Number(),
              itemsPerPage: t.Number(),
              total: t.Number(),
              totalPages: t.Number(),
              nextPage: t.Boolean(),
              previousPage: t.Boolean(),
            }),
          }),
          500: t.String(),
        },
        tags: ["Users"],
        role: Role.ADMIN,
      }
    )
    .get(
      "/:userId",
      async ({ params, set }) => {
        try {
          const getuserById = await UserService.findById(params.userId);
          return getuserById;
        } catch (error: any) {
          set.status = "Internal Server Error";
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        params: t.Object({
          userId: t.String(),
        }),
        response: {
          200: UserResponseSchema,
          500: t.Object({ message: t.String() }),
        },
        tags: ["Users"],
        role: Role.ADMIN,
      }
    )
    .patch(
      "/:userId",
      async ({ params, body, set }) => {
        try {
          const updateuser = await UserService.update(params.userId, body);
          set.status = "OK";
          return {
            data: updateuser,
            message: "User updated successfully",
          };
        } catch (error: any) {
          if (error.message === "Username already exists") {
            set.status = "Conflict";
            return { message: error.message };
          }
          set.status = "Internal Server Error";
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        body: UserUpdateSchema,
        params: t.Object({
          userId: t.String(),
        }),
        response: {
          200: t.Object({
            data: UserResponseSchema,
            message: t.String(),
          }),
          409: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Users"],
        role: Role.ADMIN,
      }
    )
    .delete(
      "/:userId",
      async ({ params, set }) => {
        try {
          const deleteUser = await UserService.deleteById(params.userId);
          set.status = "OK";
          return { deleteUser, message: "User has deleted" };
        } catch (error: any) {
          set.status = "Internal Server Error";
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        params: t.Object({
          userId: t.String(),
        }),
        response: {
          200: t.Object({
            deleteUser: UserResponseSchema,
            message: t.String(),
          }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Users"],
        role: Role.ADMIN,
      }
    );
}