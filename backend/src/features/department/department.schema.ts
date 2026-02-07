import { t } from "elysia";
import { TeacherSchema } from "../teacher/teacher.schema";
import { ClassSchema } from "../class/class.schema";

export const DepartmentSchema = t.Object({
  id: t.Number(),
  name: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export type Department = typeof DepartmentSchema.static;

// Schema for Relations
export const DepartmentWithRelationsSchema = t.Composite([
  DepartmentSchema,
  t.Object({
    classes: t.Array(t.Omit(ClassSchema, ["createdAt", "updatedAt"])),
    teachers: t.Array(t.Omit(TeacherSchema, ["createdAt", "updatedAt"])),
  }),
]);

export type DepartmentWithRelations = typeof DepartmentWithRelationsSchema.static;

export const DepartmentCreateUpdateSchema = t.Omit(DepartmentSchema, [
  "id",
  "createdAt",
  "updatedAt",
]);

export type DepartmentCreateUpdate = typeof DepartmentCreateUpdateSchema.static;
