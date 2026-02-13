import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, User, Lock, Eye, EyeOff, Workflow, Copyright } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import axios from "axios";
import toast from "react-hot-toast"; // Added toast import

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isTeacher, setIsTeacher] = useState(true);
  const [error, setError] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError([]);
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { username, password });
      const { access_token, refresh_token, user } = response.data;

      if (!access_token || !refresh_token || !user) {
        throw new Error("การตอบสนองจากเซิร์ฟเวอร์ไม่ถูกต้อง");
      }

      login(access_token, refresh_token, user);
      // toast.success handled in AuthContext
      if (user.role === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
      } else if (user.role === "USER") {
        navigate("/user/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMessage =
          err.response?.data.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
        setError([errorMessage]);
        toast.error("เข้าสู่ระบบไม่สำเร็จ!", {
          position: "top-right",
          id: "login-error",
        }); // Added error toast
      } else {
        setError(["เกิดข้อผิดพลาดที่ไม่คาดคิด"]);
        toast.error("เข้าสู่ระบบไม่สำเร็จ!", {
          position: "top-right",
          id: "login-error",
        }); // Added error toast
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-indigo-100 flex flex-col items-center p-4">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-400 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-indigo-400 rounded-full blur-[120px]"
        />
      </div>

      <div className="flex-1 flex items-center justify-center w-full max-w-md z-10">
        <motion.div
          className="relative w-full"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-blue-900/10 p-6 md:p-10 border border-white">
            <div className="text-center mb-6 md:mb-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2,
                }}
                className="inline-flex items-center justify-center mb-6"
              >
                <div className="relative">
                  <motion.div
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 rounded-2xl blur-xl opacity-70"
                  />
                  <motion.div
                    animate={{
                      rotate: [0, -5, 5, -5, 5, 0],
                      scale: [1, 1.05, 1, 1.05, 1],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      repeatType: "reverse",
                    }}
                    className="relative bg-gradient-to-br from-indigo-100 to-purple-100 p-4 rounded-2xl shadow-2xl"
                  >
                    <Workflow className="h-12 w-12 text-indigo-600" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
                  Exam
                  <span className="relative inline-block ml-1">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Flow</span>
                    <motion.span 
                      className="absolute -bottom-1 left-0 w-full h-1 bg-blue-500/20 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ delay: 1, duration: 0.8 }}
                    />
                  </span>
                </h1>

                <div className="flex flex-col items-center">
                  <h2 className="text-lg font-extrabold text-slate-800 tracking-normal">
                    ระบบจัดตารางสอบอัตโนมัติ
                  </h2>
                  <div className="mt-1.5 h-0.5 w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full opacity-60" />
                </div>

                <p className="text-slate-600 font-bold text-sm uppercase tracking-[0.15em]">
                  วิทยาลัยอาชีวศึกษานครปฐม
                </p>
              </motion.div>
            </div>

            <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
              <button
                onClick={() => { setIsTeacher(true); setUsername(""); setPassword(""); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isTeacher ? 'bg-white shadow-sm text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}
              >
                ครูผู้สอน
              </button>
              <button
                onClick={() => { setIsTeacher(false); setUsername(""); setPassword(""); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isTeacher ? 'bg-white shadow-sm text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}
              >
                ผู้ดูแลระบบ
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-500 group-focus-within:text-blue-700 transition-colors" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all duration-200"
                    placeholder={isTeacher ? "ชื่อ - นามสกุล" : "ชื่อผู้ใช้"}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-blue-700 transition-colors" />
                  </div>
                  <input
                    id="password"
                    type={isTeacher ? "text" : (showPassword ? "text" : "password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all duration-200"
                    placeholder={isTeacher ? "เบอร์โทรศัพท์" : "รหัสผ่าน"}
                    required
                    disabled={loading}
                  />
                  {!isTeacher && (
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-800 transition-colors focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {error.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-sm text-rose-600 text-center font-medium"
                >
                  {error.map((msg, index) => (
                    <p key={index}>{msg}</p>
                  ))}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                ) : (
                  <>
                    <span className="mr-2">เข้าสู่ระบบ</span>
                    <LogIn className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>

      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="w-full py-8 px-6 z-10 mt-auto"
      >
        <div className="flex flex-col items-center space-y-4">
          {/* Subtle Divider */}
          <div className="w-full max-w-[336px] h-px bg-gradient-to-r from-transparent via-slate-300/50 to-transparent" />
          
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="flex items-center space-x-2">
              <Copyright className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.1em]">
                Powered by
              </p>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-black text-sm tracking-tight">
                ExamFlow
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center sm:space-x-2 space-y-1 sm:space-y-0 text-slate-500 text-xs font-bold">
              <span>วิทยาลัยอาชีวศึกษานครปฐม</span>
              <span className="hidden sm:block w-1 h-1 bg-slate-300 rounded-full" />
              <span className="text-slate-400 font-medium tracking-tight">Nakhon Pathom Vocational College</span>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default LoginPage;
