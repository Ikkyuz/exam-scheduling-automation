import { t } from 'elysia';
  
export const constraintSchema = t.Object({
  id: t.Number(),
  category: t.Optional(t.String()),
  level: t.Optional(t.String()),
  constraint: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const constraintCreateUpdateSchema = t.Omit(constraintSchema, [
  'id',
  'createdAt',
  'updatedAt',
])

export type Constraint = typeof constraintSchema.static;

export type ConstraintCreateUpdate = typeof constraintCreateUpdateSchema.static;
