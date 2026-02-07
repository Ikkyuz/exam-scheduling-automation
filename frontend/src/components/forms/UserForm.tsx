import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import type { User, Role, UserFormInputs } from "../../types/user"; // Import UserFormInputs and Role

interface UserFormProps {
  onSubmit: SubmitHandler<UserFormInputs>;
  onCancel: () => void;
  initialData?: User | null;
  isSubmitting: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isSubmitting,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormInputs>({
    defaultValues: initialData || {
      username: "",
      password: "",
      firstname: "",
      lastname: "",
      email: "",
      role: "USER" as Role,
    }, // Default role to USER
  });

  useEffect(() => {
    reset(
      initialData || {
        username: "",
        password: "",
        firstname: "",
        lastname: "",
        email: "",
        role: "USER" as Role,
      }
    );
  }, [initialData, reset]);

  const isEditing = !!initialData;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstname" className="block text-sm font-bold text-slate-700 mb-2">ชื่อจริง</label>
          <input
            id="firstname"
            {...register("firstname")}
            className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
            placeholder="ชื่อจริง"
          />
          {errors.firstname && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.firstname.message}</p>}
        </div>

        <div>
          <label htmlFor="lastname" className="block text-sm font-bold text-slate-700 mb-2">นามสกุล</label>
          <input
            id="lastname"
            {...register("lastname")}
            className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
            placeholder="นามสกุล"
          />
          {errors.lastname && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.lastname.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="username" className="block text-sm font-bold text-slate-700 mb-2">ชื่อผู้ใช้</label>
          <input
            id="username"
            {...register("username", { required: "ต้องระบุชื่อผู้ใช้" })}
            className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm disabled:bg-slate-100 disabled:text-slate-500"
            disabled={isEditing}
            placeholder="Username"
          />
          {errors.username && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.username.message}</p>}
        </div>

        {!isEditing && (
          <div className="md:col-span-2">
            <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">รหัสผ่าน</label>
            <input
              id="password"
              type="password"
              {...register("password", {
                required: "ต้องระบุรหัสผ่าน",
                minLength: {
                  value: 6,
                  message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
                },
              })}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.password.message}</p>}
          </div>
        )}

        <div className="md:col-span-2">
          <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">อีเมล</label>
          <input
            id="email"
            type="email"
            {...register("email", {
              pattern: { value: /^\S+@\S+$/i, message: "รูปแบบอีเมลไม่ถูกต้อง" },
            })}
            className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
            placeholder="example@email.com"
          />
          {errors.email && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-bold text-slate-700 mb-2">บทบาท</label>
          <div className="relative">
            <select
              id="role"
              {...register("role", { required: "ต้องระบุบทบาท" })}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm appearance-none"
            >
              <option value="USER">ครูผู้สอน</option>
              <option value="ADMIN">ผู้ดูแลระบบ</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
            </div>
          </div>
          {errors.role && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.role.message}</p>}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              กำลังบันทึก...
            </div>
          ) : (
            "บันทึกข้อมูล"
          )}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
