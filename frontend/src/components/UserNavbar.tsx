import React from "react";
import { LogOut, Workflow, User as UserIcon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";

const UserNavbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 5, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Workflow className="text-white" size={20} />
              </motion.div>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">
                Exam<span className="text-blue-600">Flow</span>
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Student & Instructor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-base font-bold text-slate-700 leading-none">
                {user?.firstname ? `${user.firstname} ${user.lastname || ''}` : user?.username}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1 italic">
                {user?.departmentName || (user?.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งานทั่วไป')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shadow-inner">
                <UserIcon size={20} />
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200"
              title="ออกจากระบบ"
            >
              <LogOut size={22} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default UserNavbar;
