import { Elysia, t } from "elysia";
import { ExamPlanService } from "./examPlan.service";
import { ExamPlanBulkCreate, ExamPlanSchema, ExamPlanBulkCreateSchema } from "./examPlan.schema";
import { generateSchedulePDF } from "@/shared/utils/pdf-generator";

import { authMiddleware } from "../../shared/middleware/auth";
import { Role } from "@/providers/database/generated/enums";

export namespace ExamPlanController {
  export const examPlanController = new Elysia({ prefix: "/exam-plans" })
    .use(authMiddleware)
    .post("/bulk-create", async (ctx) => {
      const data = ctx.body as ExamPlanBulkCreate[];
      await ExamPlanService.bulkCreate(data);
      return { message: "Exam plans created successfully" };
    },
    {
      body: t.Array(ExamPlanBulkCreateSchema),
      response: {
        201: t.Object({ message: t.String() }),
        500: t.Object({ message: t.String() }),
      },
      tags: ["ExamPlans"],
      role: Role.ADMIN,
    }
  )
    .get("/", async (ctx) => {
      const { semester, academicYear, departmentName } = ctx.query;
      const data = await ExamPlanService.getAll(semester, academicYear, departmentName);
      
      if (data.length > 0) {
        console.log(`[DEBUG] ExamPlan Data Sample:`, {
          id: data[0].id,
          roomNumber: data[0].roomNumber,
          raw: JSON.stringify(data[0]).substring(0, 200)
        });
      }
      
      return data;
    },
    {
      query: t.Object({
        semester: t.Optional(t.String()),
        academicYear: t.Optional(t.String()),
        departmentName: t.Optional(t.String()),
      }),
      response: {
        200: t.Array(ExamPlanSchema),
        500: t.Object({ message: t.String() }),
      },
      tags: ["ExamPlans"],
      isLoggedIn: true,
    }
  )
    .get("/exam/pdf", async ({ query, set }) => {
      try {
        const { semester, academicYear, departmentName } = query;
        const data = await ExamPlanService.getAll(semester, academicYear, departmentName);
        const pdfBuffer = await generateSchedulePDF(data, semester, academicYear);

        set.headers["Content-Type"] = "application/pdf";
        set.headers["Content-Disposition"] =
          'attachment; filename="exam-plan.pdf"';

        return pdfBuffer;
      } catch (error: any) {
        console.error("PDF Generation Error:", error);
        set.status = 500;
        return { message: "Failed to generate PDF", error: error.message };
      }
    },
    {
      query: t.Object({
        semester: t.Optional(t.String()),
        academicYear: t.Optional(t.String()),
        departmentName: t.Optional(t.String()),
      }),
      response: {
        200: t.Any(),
        500: t.Object({ message: t.String(), error: t.String() }),
      },
      tags: ["ExamPlans"],
      isLoggedIn: true,
    })
    .delete("/clear", async (ctx) => {
      const { semester, academicYear } = ctx.query;
      
      if (!semester || !academicYear) {
        return { message: "Semester and Academic Year are required" };
      }
      
      await ExamPlanService.deleteAll(semester, academicYear);
      return { message: "Exam plans deleted successfully" };
    },
    {
      query: t.Object({
        semester: t.Optional(t.String()),
        academicYear: t.Optional(t.String()),
      }),
      response: {
        200: t.Object({ message: t.String() }),
        500: t.Object({ message: t.String() }),
      },
      tags: ["ExamPlans"],
      role: Role.ADMIN,
    })
}

