import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  School,
  Building2,
  ClipboardList,
  DoorOpen,
  GraduationCap,
  Users,
  UserCog,
  AlertTriangle,
  Wand2,
  CalendarDays,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navSections = [
  {
    title: "หน้าหลัก",
    items: [
      {
        to: "/admin/dashboard",
        icon: <LayoutDashboard size={24} color="#06b6d4" />, // Cyan
        label: "แดชบอร์ด",
      },
    ],
  },
  {
    title: "จัดการข้อมูล",
    items: [
      {
        to: "/admin/courses",
        icon: <BookOpen size={24} color="#6366f1" />, // Indigo
        label: "รายวิชา",
      },
      {
        to: "/admin/courseGroups",
        icon: <Layers size={24} color="#a855f7" />, // Purple
        label: "กลุ่มรายวิชา",
      },
      {
        to: "/admin/classes",
        icon: <School size={24} color="#10b981" />, // Emerald
        label: "ชั้นเรียน",
      },
      {
        to: "/admin/departments",
        icon: <Building2 size={24} color="#f59e0b" />, // Amber
        label: "สาขาวิชา",
      },
      {
        to: "/admin/enrollments",
        icon: <ClipboardList size={24} color="#ec4899" />, // Pink
        label: "การลงทะเบียน",
      },
      {
        to: "/admin/rooms",
        icon: <DoorOpen size={24} color="#0ea5e9" />, // Sky
        label: "ห้องเรียน",
      },
      {
        to: "/admin/instructors",
        icon: <GraduationCap size={24} color="#f43f5e" />, // Rose
        label: "ครูผู้สอน",
      },
      {
        to: "/admin/users",
        icon: <UserCog size={24} color="#64748b" />, // Slate
        label: "ผู้ใช้งาน",
      },
    ],
  },
  {
    title: "จัดการตารางสอบ",
    items: [
      {
        to: "/admin/constraints",
        icon: <AlertTriangle size={24} color="#ef4444" />, // Red
        label: "ข้อจำกัด",
      },
      {
        to: "/admin/scheduling",
        icon: <Wand2 size={24} color="#f97316" />, // Orange
        label: "การจัดตารางสอบ",
      },
    ],
  },
];

const NavItem: React.FC<{
  item: (typeof navSections)[0]["items"][0];
  isCollapsed: boolean;
  onClick?: () => void;
}> = ({ item, isCollapsed, onClick }) => {
  return (
    <NavLink
      to={item.to}
      end
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center px-3 py-2 my-1 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
          isCollapsed ? "justify-center" : ""
        } ${
          isActive
            ? "text-white shadow-lg"
            : "text-slate-600 hover:bg-slate-100/75 hover:text-blue-700"
        }`
      }
      style={({ isActive }) =>
        isActive
          ? {
              backgroundColor: (item.icon as React.ReactElement).props.color,
              boxShadow: `0 8px 12px -3px ${(item.icon as React.ReactElement).props.color}55`,
            }
          : {}
      }
    >
      {({ isActive }) => (
        <>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center justify-center transition-all duration-300 ${
              isActive
                ? "bg-white shadow-md"
                : "shadow-sm group-hover:shadow-md group-hover:shadow-blue-200/50"
            } p-1.5 rounded-xl`}
            style={{
              backgroundColor: isActive
                ? "#ffffff"
                : `${(item.icon as React.ReactElement).props.color}15`, // 15 is ~10% opacity in hex
            }}
          >
            {item.icon}
          </motion.div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="ml-3 font-medium whitespace-nowrap text-sm tracking-wide"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>

          {isActive && !isCollapsed && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute right-0 w-1 h-6 bg-white/30 rounded-l-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </>
      )}
    </NavLink>
  );
};

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();

  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleNavLinkClick = () => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-white text-gray-900 font-sans">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed && !isMobileMenuOpen ? 84 : 312,
        }}
        transition={{ duration: 0.3 }}
        className={`transform top-0 left-0 h-full z-50 flex-shrink-0 flex flex-col bg-white shadow-lg
                            fixed transition-transform duration-300 ease-in-out
                            ${
                              isMobileMenuOpen
                                ? "translate-x-0"
                                : "-translate-x-full"
                            }
                            lg:static lg:translate-x-0`}
      >
        <div
          className={`flex items-center ${
            isCollapsed && !isMobileMenuOpen
              ? "justify-center"
              : "justify-between"
          } p-4 h-16 border-b border-gray-200`}
        >
          {!(isCollapsed && !isMobileMenuOpen) && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
                <motion.div
                  animate={{
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: [1, 1.1, 1, 1.1, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Zap className="text-white fill-white" size={24} />
                </motion.div>
              </div>
              <div>
                <h2 className="text-xl font-black whitespace-nowrap tracking-tight text-slate-800">
                  ExamFlow <span className="text-blue-600">AI</span>
                </h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest -mt-1">
                  Scheduler
                </p>
              </div>
            </motion.div>
          )}

          <button
            onClick={() =>
              isMobileMenuOpen
                ? setIsMobileMenuOpen(false)
                : setIsCollapsed(!isCollapsed)
            }
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            {isMobileMenuOpen ? <X size={24} /> : isCollapsed ? <Menu size={24} /> : <X size={24} />}
          </button>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-3 overflow-y-auto bg-white">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.title && !isCollapsed && (
                <div className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 mt-3">
                  {section.title}
                </div>
              )}
              {section.title && isCollapsed && (
                <div className="border-t border-gray-100 my-3" />
              )}
              {section.items.map((item) => (
                <NavItem
                  key={item.to}
                  item={item}
                  isCollapsed={isCollapsed && !isMobileMenuOpen}
                  onClick={handleNavLinkClick}
                />
              ))}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div
            className={`flex transition-all duration-300 ${
              isCollapsed
                ? "flex-col items-center space-y-3"
                : "flex-row items-center p-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md justify-between"
            }`}
          >
            <div
              className={`flex items-center transition-all duration-300 ${
                isCollapsed
                  ? "w-12 h-12 justify-center rounded-lg bg-white border border-slate-200 shadow-sm"
                  : "space-x-3 overflow-hidden"
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md ring-1 ring-white flex-shrink-0">
                {user?.username?.charAt(0).toUpperCase()}
              </div>

              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <p className="font-bold text-base text-slate-800 truncate leading-tight">
                    {user?.username}
                  </p>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Administrator
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              title="ออกจากระบบ"
              className={`transition-all duration-200 flex items-center justify-center flex-shrink-0 ${
                isCollapsed
                  ? "w-12 h-12 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 shadow-sm hover:bg-rose-100"
                  : "p-2 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-100"
              }`}
            >
              <LogOut size={24} />
            </button>
          </div>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center justify-between p-4 bg-white shadow-md h-16 sticky top-0 z-30 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">ExamFlow AI</h1>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {" "}
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="w-full px-4 md:px-6 py-4 md:py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
