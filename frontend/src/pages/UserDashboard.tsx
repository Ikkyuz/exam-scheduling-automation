import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Calendar, Search, Filter, BookOpen, Clock, MapPin, Hash, Phone, Award, Layers, UserCheck, School, ShieldCheck, Zap } from "lucide-react";
import ScheduleTable from "../components/ui/ScheduleTable";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

interface ScheduleResult {
  className: string;
  departmentName: string;
  timeStart: string;
  timeEnd: string;
  duration: number;
  courseCode: string;
  courseName: string;
  roomNumber: string;
  semester?: string;
  academicYear?: string;
}

const UserDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Get semester and year from the first item if available
  const currentSemester = schedule.length > 0 ? schedule[0].semester : "";
  const currentYear = schedule.length > 0 ? schedule[0].academicYear : "";

  // ใช้ departmentName จาก user object (ถ้ามี) หรือใช้ค่าจาก localStorage
  const [selectedDept, setSelectedDept] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'USER' && user.departmentName) {
        setSelectedDept(user.departmentName);
      } else if (user.role === 'ADMIN') {
        const preferred = localStorage.getItem("user_preferred_dept");
        setSelectedDept(preferred || "all");
      }
    }
  }, [user, authLoading]);

  const fetchSchedule = async () => {
    if (authLoading) return;

    setLoading(true);
    try {
      const params: any = {};
      if (user?.role === 'USER') {
        if (!user.departmentName) {
          setSchedule([]);
          setLoading(false);
          return;
        }
        params.departmentName = user.departmentName;
      } else if (selectedDept !== 'all') {
        params.departmentName = selectedDept;
      }

      const response = await api.get("/exam-plans", { params });
      setSchedule(response.data);
    } catch (err) {
      console.error("Error fetching exam schedule:", err);
      toast.error("ไม่สามารถดึงข้อมูลตารางสอบได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [selectedDept, user, authLoading]);

  const handleDownloadPdf = async () => {
    try {
      const params: any = {};
      if (user?.role === 'USER' && user?.departmentName) {
        params.departmentName = user.departmentName;
      } else if (selectedDept !== 'all') {
        params.departmentName = selectedDept;
      }

      const response = await api.get("/exam-plans/exam/pdf", {
        params,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ตารางสอบ-สรุป.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("ดาวน์โหลดตารางสอบสำเร็จ");
    } catch (err) {
      console.error("Error downloading PDF:", err);
      toast.error("ไม่สามารถดาวน์โหลดตารางสอบได้");
    }
  };

  return (
    <div className="space-y-12 relative pb-20">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-40 left-0 -ml-20 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Welcome & Info Section */}
      <section className="relative overflow-hidden bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-blue-50">
        {/* Large Decorative Icon to match AdminDashboard */}
        <div className="absolute -top-4 -right-4 md:top-0 md:right-0 p-4 md:p-6 opacity-5 text-slate-900 pointer-events-none">
          <School
            size={120}
            className="md:w-[220px] md:h-[220px] w-[150px] h-[150px]"
          />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div className="flex-1">
            <AnimatePresence>
              {(currentSemester || currentYear) && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest mb-6 border border-blue-100"
                >
                  <Calendar size={14} className="animate-pulse" />
                  ตารางสอบล่าสุด ภาคเรียนที่ {currentSemester}/{currentYear}
                </motion.div>
              )}
            </AnimatePresence>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 tracking-tight leading-tight"
            >
              ตรวจสอบ <span className="text-blue-600">ตารางสอบ</span>
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6 flex items-center gap-3"
            >
              <div className="w-1.5 h-6 bg-orange-400 rounded-full"></div>
              <p className="text-slate-500 font-bold text-lg md:text-xl">
                วิทยาลัยอาชีวศึกษานครปฐม
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <button
                onClick={handleDownloadPdf}
                className="group flex items-center justify-center gap-3 px-10 py-5 bg-slate-900 text-white font-black rounded-[2rem] shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all duration-300 transform hover:-translate-y-1"
            >
                <Download size={22} className="group-hover:animate-bounce" />
                ดาวน์โหลด PDF
            </button>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {[
          { 
            label: "สาขาวิชาที่สังกัด", 
            value: user?.departmentName || "ทั่วไป", 
            icon: School, 
            color: "from-indigo-500 to-indigo-600",
            light: "bg-indigo-50",
            text: "text-indigo-600"
          },
          { 
            label: "จำนวนวิชาสอบ", 
            value: `${new Set(schedule.map(s => s.courseCode || s.courseId)).size} รายวิชา`, 
            icon: BookOpen, 
            color: "from-rose-500 to-rose-600",
            light: "bg-rose-50",
            text: "text-rose-600"
          },
          { 
            label: "สถานะผู้ใช้งาน", 
            value: user?.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'ยืนยันตัวตนแล้ว', 
            icon: ShieldCheck, 
            color: "from-emerald-500 to-emerald-600",
            light: "bg-emerald-50",
            text: "text-emerald-600"
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (i * 0.1) }}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-6 group hover:border-blue-200 transition-all cursor-default"
          >
            <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{stat.label}</p>
              <h3 className="text-xl font-black text-slate-800 leading-none">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Schedule Table Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[3rem] blur opacity-5 group-hover:opacity-10 transition duration-1000 group-hover:duration-200"></div>
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden relative">
            <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">รายละเอียดตารางสอบทั้งหมด</span>
                </div>
            </div>
            {loading ? (
            <div className="py-40 text-center">
                <div className="relative inline-flex mb-8">
                    <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Zap size={16} className="text-blue-600 animate-pulse" />
                    </div>
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Synchronizing Schedule...</p>
            </div>
            ) : schedule.length > 0 ? (
            <div className="p-2 sm:p-6 overflow-hidden">
                <ScheduleTable schedule={schedule} />
            </div>
            ) : (
            <div className="py-40 text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-inner">
                <BookOpen size={48} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">ไม่พบข้อมูลตารางสอบ</h3>
                <p className="text-slate-400 mt-3 max-w-xs mx-auto font-medium">
                ขณะนี้ยังไม่มีข้อมูลตารางสอบที่ประกาศอย่างเป็นทางการ กรุณาตรวจสอบอีกครั้งในภายหลัง
                </p>
            </div>
            )}
        </div>
      </motion.div>

      {/* Modern Wave Footer */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-100 to-transparent"></div>
    </div>
  );
};

export default UserDashboard;