import { Elysia, t } from "elysia";
import { ScheduleService } from "./schedule.service";
import { ScheduleBulkCreate, ScheduleSchema, ScheduleBulkCreateSchema } from "./schedule.schema";
import { generateSchedulePDF } from "@/shared/utils/pdf-generator";

export namespace ScheduleController {
  export const scheduleController = new Elysia({ prefix: "/schedules" })
    .post("/bulk-create", async (ctx) => {
      const data = ctx.body as ScheduleBulkCreate[];
      await ScheduleService.bulkCreate(data);
      return { message: "Schedules created successfully" };
    },
    {
      body: t.Array(ScheduleBulkCreateSchema),
      response: {
        201: t.Object({ message: t.String() }),
        500: t.Object({ message: t.String() }),
      },
      tags: ["Schedules"],
    }
  )
    .get("/generate", async (ctx) => {
      const { semester, academicYear, departmentName } = ctx.query;
      return await ScheduleService.getAll(semester, academicYear, departmentName);
    },
    {
      query: t.Object({
        semester: t.Optional(t.String()),
        academicYear: t.Optional(t.String()),
        departmentName: t.Optional(t.String()),
      }),
      response: {
        200: t.Array(ScheduleSchema),
        500: t.Object({ message: t.String() }),
      },
      tags: ["Schedules"],
    }
  )
    .get("/", async (ctx) => {
      const { semester, academicYear, departmentName } = ctx.query;
      return await ScheduleService.getAll(semester, academicYear, departmentName);
    },
    {
      query: t.Object({
        semester: t.Optional(t.String()),
        academicYear: t.Optional(t.String()),
        departmentName: t.Optional(t.String()),
      }),
      response: {
        200: t.Array(ScheduleSchema),
        500: t.Object({ message: t.String() }),
      },
      tags: ["Schedules"],
    }
  )
    .get("/exam/pdf", async ({ query, set }) => {
      try {
        const { semester, academicYear, departmentName } = query;
        const data = await ScheduleService.getAll(semester, academicYear, departmentName);
        const pdfBuffer = await generateSchedulePDF(data);

        set.headers["Content-Type"] = "application/pdf";
        set.headers["Content-Disposition"] =
          'attachment; filename="exam-schedule.pdf"';

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
      tags: ["Schedules"],
    })
    .delete("/clear", async (ctx) => {
      const { semester, academicYear } = ctx.query;
      console.log(`DELETE /schedules/clear received: semester=${semester}, academicYear=${academicYear}`);
      
      if (!semester || !academicYear) {
        return { message: "Semester and Academic Year are required to clear schedules", received: { semester, academicYear } };
      }
      
      await ScheduleService.deleteAll(semester, academicYear);
      return { message: "Schedules deleted successfully" };
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
      tags: ["Schedules"],
    })
}
