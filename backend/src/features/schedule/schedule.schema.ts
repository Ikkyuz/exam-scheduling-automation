import { t } from "elysia";

export const ScheduleSchema = t.Object({
  id: t.Number(),
  className: t.String(),
  departmentName: t.String(),
  courseCode: t.String(),
  courseName: t.String(),
  timeStart: t.Any(), // Allow both Date and String
  timeEnd: t.Any(),   // Allow both Date and String
  duration: t.Number(),
  roomNumber: t.String(),
  semester: t.String(),
  academicYear: t.String(),
  createdAt: t.Optional(t.Any()),
  updatedAt: t.Optional(t.Any()),
});

export type Schedule = typeof ScheduleSchema.static;

export const ScheduleBulkCreateSchema = t.Omit(ScheduleSchema, [
  "id",
  "createdAt",
  "updatedAt",
]);

export type ScheduleBulkCreate = typeof ScheduleBulkCreateSchema.static;