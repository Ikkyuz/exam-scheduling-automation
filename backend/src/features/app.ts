import { Elysia } from "elysia";
import prisma from "@/providers/database/database.provider";
import { DepartmentController } from "./department/department.controller";
import { CourseController } from "./course/course.controller";
import { ClassController } from "./class/class.controller";
import { CourseGroupController } from "./courseGroup/courseGroup.controller";
import { EnrollmentController } from "./enrollment/enrollment.controller";
import { RoomController } from "./room/room.controller";
import { TeacherController } from "./teacher/teacher.controller";
import { ProctorPairController } from "./proctorPair/proctorPair.controller";
import { TokenController } from "./token/token.controller";
import { UserController } from "./user/user.controller";
import { AuthController } from "./auth/auth.controller";
import { ConstraintController } from "./constraint/constraint.controller";
import { ScheduleController } from "./schedule/schedule.controller";
import { ExamPlanController } from "./examPlan/examPlan.controller";

import { authMiddleware } from "../shared/middleware/auth";

export const app = () =>
  new Elysia()
    .onError(({ code, error, set, request }) => {
      const url = new URL(request.url);
      console.error(`Error [${code}] at ${request.method} ${url.pathname}:`, error);
      
      if (code === "VALIDATION") {
        set.status = "Bad Request";
        return {
          message: "Validation Error",
          method: request.method,
          path: url.pathname,
          errors: error.all,
        };
      }

      if (code === "NOT_FOUND") {
        set.status = "Not Found";
        return { message: "Route not found" };
      }

      set.status = "Internal Server Error";
      return { 
        message: error.message || "Internal Server Error",
        code
      };
    })
    .group("/api", (app) => {
      app.use(authMiddleware);
      app.use(AuthController.authController);
      app.use(ClassController.classController);
      app.use(ConstraintController.constraintController);
      app.use(CourseController.courseController);
      app.use(CourseGroupController.courseGroupController);
      app.use(DepartmentController.departmentController);
      app.use(EnrollmentController.enrollmentController);
      app.use(ExamPlanController.examPlanController);
      app.use(ProctorPairController.proctorPairController);
      app.use(RoomController.roomController);
      app.use(ScheduleController.scheduleController);
      app.use(TeacherController.teacherController);
      app.use(TokenController.tokenController);
      app.use(UserController.userController);

      return app;
    })
    .get("/health", async ({ set }) => {
      try {
        // ทดสอบการเชื่อมต่อฐานข้อมูลด้วยการรัน Query ง่ายๆ
        await prisma.$queryRaw`SELECT 1`;
        console.log(`[${new Date().toLocaleString()}] 🟢 Health Check: Database connection is healthy`);
        return { 
          status: "ok",
          database: "connected" 
        };
      } catch (error: any) {
        console.error(`[${new Date().toLocaleString()}] 🔴 Health Check: Database connection failed!`, error.message);
        set.status = 500;
        return { 
          status: "error",
          database: "disconnected",
          message: error.message || "Unknown error"
        };
      }
    });
