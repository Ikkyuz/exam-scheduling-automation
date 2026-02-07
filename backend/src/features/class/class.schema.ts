import { t } from "elysia";

export const ClassSchema = t.Object({
    id: t.Number(),
    name: t.String(),
    level: t.Optional(t.String()),
    classYear: t.String(),
    department_id: t.Number(),
    amount: t.Number(),
    createdAt: t.Date(),
    updatedAt: t.Date(),
});

export type Class = typeof ClassSchema.static;

// Schema for Relations
export const ClassWithRelationsSchema = t.Composite([
    ClassSchema,
    t.Object({
        department: t.Object({
            id: t.Number(),
            name: t.String(),
          }),
        enrollments: t.Array(
          t.Omit(t.Object({
            id: t.Number(),
            createdAt: t.Date(),
            updatedAt: t.Date(),
            class_id: t.Number(),
            course_id: t.Number(),
          }), ["createdAt", "updatedAt"])
        ),
      }),
    ],
);

export type ClassWithRelations = typeof ClassWithRelationsSchema.static;

export const ClassCreateUpdateSchema = t.Omit(ClassSchema, [
    "id",
    "createdAt",
    "updatedAt",
]);

export type ClassCreateUpdate = typeof ClassCreateUpdateSchema.static;
