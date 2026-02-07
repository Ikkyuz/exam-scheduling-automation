import { t } from "elysia";

export const MinimalDepartmentSchema = t.Object({
  id: t.Number(),
  name: t.String(),
});

export const TeacherSchema = t.Object({
  id: t.Number(),
  firstname: t.String(),
  lastname: t.String(),
  department_id: t.Number(),
  tel: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export type Teacher = typeof TeacherSchema.static;

export const TeacherWithRelationsSchema = t.Composite([
  TeacherSchema,
  t.Object({
    department: MinimalDepartmentSchema,
    proctorPairs: t.Array(t.Object({
      id: t.Number(),
      teacher_id: t.Number(),
    })),
  }),
]);

export const TeacherCreateUpdateSchema = t.Omit(TeacherSchema, [
  "id",
  "createdAt",
  "updatedAt",
]);

export type TeacherCreateUpdate = typeof TeacherCreateUpdateSchema.static;