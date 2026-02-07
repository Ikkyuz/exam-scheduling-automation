import { t } from "elysia";
import { EnrollmentSchema } from "../enrollment/enrollment.schema";
import { CourseGroupSchema } from "../courseGroup/courseGroup.schema"; 

export const CourseSchema = t.Object({
  id: t.Number(),
  code: t.String(),
  name: t.String(),
  duration: t.Number(),
  examType: t.Optional(t.String()),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export type Course = typeof CourseSchema.static;

export const CourseWithRelationsSchema = t.Composite([
  CourseSchema,
  t.Object({
    enrollments: t.Array(t.Omit(EnrollmentSchema, ["createdAt", "updatedAt"])),
    courseGroups: t.Array(t.Omit(CourseGroupSchema, ["createdAt", "updatedAt"])),
  }),
]);

export type CourseWithRelations = typeof CourseWithRelationsSchema.static;

export const CourseCreateUpdateSchema = t.Omit(CourseSchema, [
  "id",
  "createdAt",
  "updatedAt",
]);

export type CourseCreateUpdate = typeof CourseCreateUpdateSchema.static;
