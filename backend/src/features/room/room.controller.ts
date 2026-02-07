import Elysia, { t } from "elysia";
import * as xlsx from 'xlsx';
import { parse as csvParse } from 'csv-parse';
import { Buffer } from 'buffer'; // Explicitly import Buffer
import { RoomSchema, RoomCreateUpdateSchema, RoomCreateUpdate } from "./room.schema";
import { RoomService } from "./room.service";

export namespace RoomController {
  export const roomController = new Elysia({ prefix: "/rooms" })
    .post(
      "/",
      async ({ body, set }) => {
        try {
          const newRoom = await RoomService.createMany(body);
          set.status = 201;
          return {
            newRoom, // array ของ Room objects
            message: "Rooms created successfully",
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
        body: t.Array(RoomCreateUpdateSchema),
        response: {
          201: t.Object({
            newRoom: t.Array(RoomSchema), // ต้องเป็น array
            message: t.String(),
          }),
          409: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Rooms"],
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
          let roomsToCreate: RoomCreateUpdate[] = [];

          const parseRecords = (records: any[]) => {
            return records.map(record => {
              const getValue = (keys: string[]) => {
                for (const key of keys) {
                  if (record[key] !== undefined && record[key] !== null) return record[key];
                  const lowerKey = Object.keys(record).find(k => k.toLowerCase().trim() === key.toLowerCase().trim());
                  if (lowerKey) return record[lowerKey];
                }
                // Partial match for complex headers like "capacity (จำนวนที่นั่ง)"
                const partialKey = Object.keys(record).find(k => {
                    const lk = k.toLowerCase();
                    return keys.some(target => lk.includes(target.toLowerCase()));
                });
                if (partialKey) return record[partialKey];
                return undefined;
              };

              const rawCapacity = getValue(['capacity', 'size', 'ความจุ', 'จำนวนที่นั่ง']);
              let capacityVal = 0;
              if (typeof rawCapacity === 'number') {
                capacityVal = rawCapacity;
              } else if (typeof rawCapacity === 'string') {
                capacityVal = parseInt(rawCapacity.replace(/[^0-9]/g, ''), 10);
              }

              return {
                roomNumber: String(getValue(['roomNumber', 'room_number', 'หมายเลขห้อง', 'room']) || '').trim(),
                building: String(getValue(['building', 'อาคาร', 'ตึก']) || '').trim(),
                floor: String(getValue(['floor', 'ชั้น']) || '').trim(),
                capacity: isNaN(capacityVal) ? 0 : capacityVal,
              };
            }).filter((r) => r.roomNumber !== '') as RoomCreateUpdate[];
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
            roomsToCreate = parseRecords(records);
          } else if (fileExtension === 'xlsx') {
            const workbook = xlsx.read(buffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = xlsx.utils.sheet_to_json(sheet);
            roomsToCreate = parseRecords(json);
          } else {
            set.status = "Bad Request";
            return { message: "Unsupported file type. Only CSV and XLSX are supported." };
          }

          if (roomsToCreate.length === 0) {
            set.status = "Bad Request";
            return { message: "No valid data found in the file." };
          }

          const result = await RoomService.createMany(roomsToCreate);

          set.status = "Created";
          return {
            data: result,
            message: "Rooms imported successfully",
          };
        } catch (error: any) {
          console.error("Error importing rooms:", error);
          set.status = "Internal Server Error";
          return { message: error.message || "Internal Server Error" };
        }
      },
      {
        body: t.Object({
          file: t.File(),
        }),
        response: {
          201: t.Object({ data: t.Array(RoomSchema), message: t.String() }),
          400: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Rooms"],
      }
    )

    .get(
        "/template",
        async ({ set }) => {
            try {
                const worksheet = xlsx.utils.aoa_to_sheet([
                    ["หมายเลขห้อง", "อาคาร", "ชั้น", "ความจุ"]
                ]);
                const workbook = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(workbook, worksheet, "Rooms");
                const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
                
                set.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                set.headers['Content-Disposition'] = 'attachment; filename=room_template.xlsx';
                
                return buffer;
            } catch (error: any) {
                set.status = "Internal Server Error";
                return { message: error.message || "Internal Server Error" };
            }
        },
        {
            tags: ["Rooms"],
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

          const result = await RoomService.findAll({
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
            data: t.Array(RoomSchema),
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
        tags: ["Rooms"],
      }
    )
    .get(
      "/:id",
      async ({ params, set }) => {
        try {
          const result = await RoomService.findById(params.id);
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
          200: RoomSchema,
          500: t.Object({ message: t.String() }),
        },
        tags: ["Rooms"],
      }
    )
    .patch(
      "/:id",
      async ({ params, body, set }) => {
        try {
          const updatedRoom = await RoomService.update(params.id, body);
          set.status = "OK"; // 200
          return { updatedRoom, message: "Room updated successfully" };
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
        body: RoomSchema,
        response: {
          200: t.Object({
            updatedRoom: RoomCreateUpdateSchema,
            message: t.String(),
          }),
          409: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Rooms"],
      }
    )
    .delete(
      "/clear",
      async ({ set }) => {
        try {
          await RoomService.deleteAll();
          set.status = "OK"; // 200
          return { message: "All Rooms deleted successfully" };
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
        tags: ["Rooms"],
      }
    )
    .delete(
      "/:id",
      async ({ params, set }) => {
        try {
          const deletedRoom = await RoomService.deleteById(params.id);
          set.status = "OK"; // 200
          return { deletedRoom, message: "Room deleted successfully" };
        } catch (error: any) {
          if (
            error.message.includes(
              "Cannot delete Room because it has related records"
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
            deletedRoom: RoomSchema,
            message: t.String(),
          }),
          409: t.Object({ message: t.String() }),
          500: t.Object({ message: t.String() }),
        },
        tags: ["Rooms"],
      }
    );
}
