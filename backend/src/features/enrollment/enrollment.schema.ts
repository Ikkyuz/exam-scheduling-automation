import { t } from "elysia";

export const EnrollmentSchema = t.Object({
  id: t.Number(),
  class_id: t.Number(),
  course_id: t.Number(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const EnrollmentCreateUpdateSchema = t.Omit(EnrollmentSchema, [
    "id",
    "createdAt",
    "updatedAt",
]);

export const EnrollmentWithRelationsSchema = t.Composite([
    EnrollmentSchema,
    t.Object({
        class: t.Object({
            id: t.Number(),
            name: t.String(),
            level: t.Optional(t.String()),
            classYear: t.String(),
        }),
        course: t.Object({
            id: t.Number(),
            code: t.String(),
            name: t.String(),
            duration: t.Number(),
            examType: t.Optional(t.String()),
        }),
    }), 
]);

export type Enrollment = typeof EnrollmentSchema.static;
export type EnrollmentCreateUpdate = typeof EnrollmentCreateUpdateSchema.static;
export type EnrollmentWithRelations = typeof EnrollmentWithRelationsSchema.static;
