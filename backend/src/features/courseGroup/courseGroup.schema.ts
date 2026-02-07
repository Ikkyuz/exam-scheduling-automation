import { t } from "elysia";

export const CourseGroupSchema = t.Object({
  id: t.Number(),
  course_id: t.Number(),
  groupNum: t.Number(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export type CourseGroup = typeof CourseGroupSchema.static;

// Schema สำหรับ Relations
export const CourseGroupWithRelationsSchema = t.Composite([
  CourseGroupSchema,
  t.Object({
    course: t.Array(t.Object({
      id: t.Number(),
      code: t.String(),
      name: t.String(),
      duration: t.Number(),
      examType: t.Optional(t.String()),
    })),
  }),
]);

export type CourseGroupWithRelations =
  typeof CourseGroupWithRelationsSchema.static;

// Schema สำหรับ Create/Update
export const CourseGroupCreateUpdateSchema = t.Object({
  course_id: t.Number(),
  groupNum: t.Optional(t.Number()),
});

export type CourseGroupCreateUpdate =
  typeof CourseGroupCreateUpdateSchema.static;
