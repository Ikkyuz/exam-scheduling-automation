import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  School,
  CalendarDays,
  ShieldCheck,
  BarChart3,
  Layout,
} from "lucide-react";
import { fetchCourseCount, fetchClassCount } from "../services/api";
import { useNavigate, Link } from "react-router-dom";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
    },
  }),
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const [courseCount, setCourseCount] = useState<number | null>(null);
  const [classCount, setClassCount] = useState<number | null>(null);

  useEffect(() => {
    const getCounts = async () => {
      try {
        const cCount = await fetchCourseCount();
        setCourseCount(cCount);
        const clCount = await fetchClassCount();
        setClassCount(clCount);
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };
    getCounts();
  }, []);

  const statsData = [
    {
      title: "รายวิชาทั้งหมด",
      value: courseCount !== null ? courseCount.toString() : "...",
      icon: <BookOpen className="w-8 h-8 text-white" />,
      link: "/user/courses",
      color: "from-indigo-500 to-indigo-600",
      textColor: "text-indigo-500",
      bgColor: "bg-indigo-50",
      hoverIconBg: "group-hover:bg-indigo-500",
      hoverTitleColor: "group-hover:text-indigo-500",
      borderColor: "hover:border-indigo-200",
      blobColor: "bg-indigo-500",
    },
    {
      title: "ชั้นเรียนทั้งหมด",
      value: classCount !== null ? classCount.toString() : "...",
      icon: <School className="w-8 h-8 text-white" />,
      link: "/user/classes",
      color: "from-emerald-500 to-emerald-600",
      textColor: "text-emerald-500",
      bgColor: "bg-emerald-50",
      hoverIconBg: "group-hover:bg-emerald-500",
      hoverTitleColor: "group-hover:text-emerald-500",
      borderColor: "hover:border-emerald-200",
      blobColor: "bg-emerald-500",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-3 md:p-4"
    >
      <div className="mb-6 md:mb-8 bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-lg md:shadow-xl border border-blue-50 relative overflow-hidden">
        <div className="absolute -top-4 -right-4 md:top-0 md:right-0 p-4 md:p-6 opacity-5 text-slate-900">
          <School
            size={120}
            className="md:w-[180px] md:h-[180px] w-[120px] h-[120px]"
          />
        </div>

        <div className="relative z-10">
          {/* หัวข้อหลัก - ปรับขนาด Font และการตัดคำ */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-800 mb-2 md:mb-2 tracking-tight leading-tight">
            ระบบจัดตารางสอบ
            <span className="text-blue-600 block sm:inline">
              มาตรฐานรายวิชา
            </span>
          </h1>

          {/* หัวข้อรอง - ปรับขนาดแถบสีและตัวอักษร */}
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-500 flex items-center gap-2 md:gap-3">
            <div className="w-1 h-5 md:w-1.5 md:h-6 bg-orange-400 rounded-full"></div>
            วิทยาลัยอาชีวศึกษานครปฐม
          </h2>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2 px-1">
          <BarChart3 className="text-slate-400" size={20} />
          จำนวนข้อมูล
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((item, index) => {
            return (
              <motion.div
                key={index}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className={`relative bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg ${item.borderColor} transition-all duration-300 cursor-pointer group flex items-center justify-between overflow-hidden`}
                onClick={() => item.link && navigate(item.link)}
              >
                {/* Background Blob Effect */}
                <div
                  className={`absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 translate-x-1/2 -translate-y-1/2 ${item.blobColor}`}
                ></div>

                <div className="relative z-10 flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${item.bgColor} ${item.textColor} ${item.hoverIconBg} group-hover:text-white transition-colors duration-300 shadow-sm`}
                  >
                    {React.cloneElement(item.icon as React.ReactElement, {
                      size: 24,
                      className: "text-current",
                    })}
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-800 tracking-tight leading-none group-hover:text-slate-900">
                      {item.value}
                    </p>
                    <p
                      className={`text-slate-500 text-[11px] font-bold mt-1.5 truncate uppercase tracking-wider ${item.hoverTitleColor} transition-colors`}
                    >
                      {item.title}
                    </p>
                  </div>
                </div>

                {/* Sliding Arrow Effect */}
                <div
                  className={`relative z-10 flex-shrink-0 ${item.textColor} opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300`}
                >
                  <span className="text-xl">→</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Schedule Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="mt-8"
      >
        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2 px-1">
          <Layout className="text-slate-400" size={20} />
          จัดการตาราง
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/user/exam-schedule"
            className="group relative overflow-hidden bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300 flex items-center justify-between"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 translate-x-1/2 -translate-y-1/2"></div>

            <div className="relative z-10 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                <CalendarDays size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none group-hover:text-slate-900">
                  ตารางสอบ
                </h3>
                <p className="text-slate-500 text-[11px] font-bold mt-1.5 truncate uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                  จัดการวันเวลาสอบ
                </p>
              </div>
            </div>

            {/* Sliding Arrow Effect */}
            <div className="relative z-10 flex-shrink-0 text-blue-600 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
              <span className="text-xl">→</span>
            </div>
          </Link>

          <Link
            to="/user/proctoring-schedule"
            className="group relative overflow-hidden bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-fuchsia-200 transition-all duration-300 flex items-center justify-between"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 translate-x-1/2 -translate-y-1/2"></div>

            <div className="relative z-10 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center bg-fuchsia-50 text-fuchsia-600 group-hover:bg-fuchsia-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none group-hover:text-slate-900">
                  ตารางคุมสอบ
                </h3>
                <p className="text-slate-500 text-[11px] font-bold mt-1.5 truncate uppercase tracking-wider group-hover:text-fuchsia-600 transition-colors">
                  จัดการผู้คุมสอบ
                </p>
              </div>
            </div>

            {/* Sliding Arrow Effect */}
            <div className="relative z-10 flex-shrink-0 text-fuchsia-600 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
              <span className="text-xl">→</span>
            </div>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserDashboard;
