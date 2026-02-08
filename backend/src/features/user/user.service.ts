import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { UserRepository } from "./user.repository";
import { UserCreate, UserUpdate } from "./user.schema";
import { getPaginationParams } from "@/shared/utils/pagination";
import { TokenService } from "../token/token.service";
import { Role } from "@/providers/database/generated/enums";
import { TeacherRepository } from "../teacher/teacher.repository";

type JWTInstance = {
  sign: (payload: any) => Promise<string>;
  verify: (jwt?: string, options?: any) => Promise<any>;
};

export namespace UserService {
  export async function create(user: UserCreate) {
    if (!user.firstname || user.firstname.trim() === "") {
      throw new Error("User firstname is required and cannot be empty.");
    }
    if (!user.lastname || user.lastname.trim() === "") {
      throw new Error("User lastname is required and cannot be empty.");
    }
    if (!user.username || user.username.trim() === "") {
      throw new Error("User username is required and cannot be empty.");
    }
    if (!user.password || user.password.trim() === "") {
      throw new Error("User password is required and cannot be empty.");
    }
    try {
      const hashPassword = await Bun.password.hash(user.password);
      const newUser = await UserRepository.create({
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        email: user.email,
        password: hashPassword,
        role: user.role, // Add this line to pass the role
      });
      return newUser;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error("Username already exists");
      }
      throw error;
    }
  }

  export async function importUsers(users: UserCreate[]) {
    const usersWithHashedPasswords = await Promise.all(
      users.map(async (user) => {
        const hashPassword = await Bun.password.hash(
          user.password || "default_password"
        ); // Hash password, provide default if missing
        return {
          ...user,
          password: hashPassword,
          role: user.role ?? Role.USER,
        };
      })
    );

    try {
      return await UserRepository.createMany(usersWithHashedPasswords);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error("One or more usernames or emails already exist");
      }
      throw error;
    }
  }

  export async function findAll(
    options: { page?: number; itemsPerPage?: number; search?: string } = {}
  ) {
    const page = options.page ?? 1;
    const itemsPerPage = options.itemsPerPage ?? 10;
    const search = options.search;

    let skip: number | undefined;
    let take: number | undefined;

    if (itemsPerPage === -1) {
      skip = undefined;
      take = undefined;
    } else {
      const params = getPaginationParams(page, itemsPerPage);
      skip = params.skip;
      take = params.take;
    }

    const users = await UserRepository.findAll({ skip, take, search });
    const total = await UserRepository.countAll(search);

    const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(total / itemsPerPage);
    const nextPage = page < totalPages;
    const previousPage = page > 1;

    return {
      data: users,
      meta_data: {
        page,
        itemsPerPage,
        total,
        totalPages,
        nextPage,
        previousPage,
      },
    };
  }

  export async function findById(id: string) {
    const existing = await UserRepository.findById(id);
    if (!existing) {
      throw new Error("User not found");
    }

    // ถ้าเป็น Role USER ลองหาข้อมูลสาขาวิชาจากตาราง Teacher
    let departmentName = null;
    if (existing.role === Role.USER) {
      // Trim names to handle accidental spaces
      const fname = existing.firstname.trim();
      const lname = existing.lastname.trim();
      const teacher = await TeacherRepository.findByName(fname, lname);
      if (teacher) {
        departmentName = teacher.department.name;
      } else {
        // Try searching with split username if first/last didn't work
        const nameParts = existing.username.trim().split(/\s+/);
        if (nameParts.length >= 2) {
           const t2 = await TeacherRepository.findByName(nameParts[0], nameParts.slice(1).join(" "));
           if (t2) departmentName = t2.department.name;
        }
      }
    }

    return {
      ...existing,
      departmentName
    };
  }

  export async function update(id: string, user: Partial<UserUpdate>) {
    try {
      const data = { ...user };
      const existing = await UserRepository.findById(id);
      if (!existing) {
        throw new Error("User not found");
      }

      if (user.password) {
        data.password = await Bun.password.hash(user.password);
      }
      return await UserRepository.update(id, data);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error("Username already exists");
      }
      throw error;
    }
  }

  export async function deleteById(id: string) {
    return UserRepository.deleteById(id);
  }

  export async function login(
    username: string,
    passwordOrTel: string,
    jwt: JWTInstance
  ) {
    // 1. ลองหาในตาราง User ปกติก่อน (สำหรับ ADMIN)
    let user = await UserRepository.findUserByUsername(username);
    let isTeacher = false;
    let teacherInfo: any = null;

    if (!user) {
      // 2. ถ้าไม่เจอ ให้ลองหาในตาราง Teacher โดยแยก username เป็น firstname และ lastname
      const nameParts = username.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        const firstname = nameParts[0].trim();
        const lastname = nameParts.slice(1).join(" ").trim();
        teacherInfo = await TeacherRepository.findByNameAndTel(firstname, lastname, passwordOrTel);
        
        if (teacherInfo) {
          isTeacher = true;
          
          // 2.1 ตรวจสอบว่ามี User นี้ในระบบหรือยัง
          const fullUsername = `${teacherInfo.firstname} ${teacherInfo.lastname}`;
          let existingUser = await UserRepository.findUserByUsername(fullUsername);
          
          if (!existingUser) {
            existingUser = await UserRepository.create({
              firstname: teacherInfo.firstname,
              lastname: teacherInfo.lastname,
              username: fullUsername,
              password: await Bun.password.hash(passwordOrTel),
              role: Role.USER,
              email: null
            });
          }
          user = existingUser;
        }
      }
    }

    if (!user) {
      throw new Error("User not found");
    }

    // Always try to fetch teacher info for USER role to get departmentName if it's missing
    if (user.role === Role.USER && !teacherInfo) {
        teacherInfo = await TeacherRepository.findByName(user.firstname.trim(), user.lastname.trim());
    }

    if (!isTeacher) {
      // ตรวจสอบรหัสผ่านสำหรับ User ปกติ
      let isPasswordValid = false;
      try {
        isPasswordValid = await Bun.password.verify(passwordOrTel, user.password);
      } catch (_error) {
        throw new Error("Invalid password");
      }

      if (!isPasswordValid) {
        throw new Error("Invalid password");
      }
    }

    const payload = {
      role: user.role,
      username: user.username,
      sub: user.id,
    };

    // สร้าง JWT token
    const jwtToken = await jwt.sign(payload);

    // สร้าง token ในฐานข้อมูล
    const dbToken = await TokenService.generateToken(user.id.toString());

    return {
      access_token: jwtToken,
      refresh_token: dbToken.token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        departmentName: teacherInfo?.department?.name || null, // ส่งชื่อสาขาวิชาไปด้วย
      },
    };
  }
}
