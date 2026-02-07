import { t } from "elysia";

export const ProctorPairSchema = t.Object({
  id: t.Number(),
  teacher_id: t.Number(),
  groupNum: t.Optional(t.Number()),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export type ProctorPair = typeof ProctorPairSchema.static;

export const ProctorPairWithRelationsSchema = t.Composite([
  ProctorPairSchema,
  t.Object({
    teacher: t.Array(t.Object({
      id: t.Number(),
      firstname: t.String(),
      lastname: t.String(),
      department_id: t.Number(),
      tel: t.String(),
      createdAt: t.Optional(t.Date()),
      updatedAt: t.Optional(t.Date()),
    })),
  }),
]);

export type ProctorPairWithRelations = typeof ProctorPairWithRelationsSchema.static;

export const ProctorPairCreateUpdateSchema = t.Object({
  teacher_id: t.Number(),
  groupNum: t.Optional(t.Number())
});

export type ProctorPairCreateUpdate =
  typeof ProctorPairCreateUpdateSchema.static;