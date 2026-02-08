import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Calendar, Search, Filter, BookOpen, Clock, MapPin, Hash, Phone } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  
  // Get semester and year from the first item if available
  const currentSemester = schedule.length > 0 ? schedule[0].semester : "";
  const currentYear = schedule.length > 0 ? schedule[0].academicYear : "";

  // ใช้ departmentName จาก user object (ถ้ามี) หรือใช้ค่าจาก localStorage
  const [selectedDept, setSelectedDept] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'USER' && user.departmentName) {
        console.log("UserDashboard: Setting department from user info:", user.departmentName);
        setSelectedDept(user.departmentName);
      } else if (user.role === 'ADMIN') {
        const preferred = localStorage.getItem("user_preferred_dept");
        setSelectedDept(preferred || "all");
      }
    }
  }, [user, authLoading]);

  const fetchSchedule = async () => {
    // Wait for auth to finish loading to know the correct department
    if (authLoading) return;

    setLoading(true);
    try {
      const params: any = {};
      
      // Strict enforcement for USER role
      if (user?.role === 'USER') {
        if (!user.departmentName) {
          console.warn("UserDashboard: USER role has no department assigned.");
          setSchedule([]);
          setLoading(false);
          return;
        }
        params.departmentName = user.departmentName;
      } else if (selectedDept !== 'all') {
        params.departmentName = selectedDept;
      }

      console.log("UserDashboard: Fetching schedule with params:", params);
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

  // เมื่อสาขาเปลี่ยน ให้บันทึกไว้ใน localStorage เพื่อความสะดวกในครั้งถัดไป
  useEffect(() => {
    if (selectedDept !== "all" && user?.role === 'ADMIN') {
      localStorage.setItem("user_preferred_dept", selectedDept);
    }
  }, [selectedDept, user]);

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

  const departments = Array.from(new Set(schedule.map(s => s.departmentName))).sort();

  const filteredSchedule = schedule.filter(item => {
    const matchesSearch = 
      item.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.className.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Flexible matching for department name
    const cleanSelected = selectedDept.replace(/^(สาขาวิชา|สาขา)/, '').trim().toLowerCase();
    const cleanItemDept = item.departmentName.replace(/^(สาขาวิชา|สาขา)/, '').trim().toLowerCase();
    
    const matchesDept = selectedDept === "all" || cleanItemDept.includes(cleanSelected) || cleanSelected.includes(cleanItemDept);
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-10">
      {/* Welcome & Info Section */}
      <section className="relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <AnimatePresence>
              {(currentSemester || currentYear) && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4"
                >
                  <Calendar size={14} />
                  ตารางสอบล่าสุด ภาคเรียนที่ {currentSemester}/{currentYear}
                </motion.div>
              )}
            </AnimatePresence>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none"
            >
              ตรวจสอบ <span className="text-blue-600">ตารางสอบ</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-500 mt-4 text-lg max-w-xl"
            >
              {user?.role === 'USER' && user?.departmentName 
                ? `ตารางสอบสาขาวิชา${user.departmentName} ของท่าน`
                : "ค้นหาวันเวลาสอบและห้องสอบของท่านได้ง่ายๆ โดยเลือกสาขาวิชาที่ท่านสังกัดด้านล่างนี้"}
            </motion.p>
          </div>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all duration-300"
          >
            <Download size={20} />
            ดาวน์โหลด PDF
          </motion.button>
        </div>
      </section>

      {/* Schedule Table Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden"
      >
        {loading ? (
          <div className="py-32 text-center">
            <div className="relative inline-flex mb-6">
                <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">กำลังจัดเตรียมข้อมูล...</p>
          </div>
        ) : filteredSchedule.length > 0 ? (
          <div className="p-2 sm:p-4">
            <ScheduleTable schedule={filteredSchedule} />
          </div>
        ) : (
          <div className="py-32 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200">
              <BookOpen size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">ไม่พบตารางสอบที่คุณค้นหา</h3>
            <p className="text-slate-400 mt-2 max-w-xs mx-auto">
              ลองเลือกสาขาวิชาอื่น หรือใช้คำค้นหาที่สั้นลงเพื่อให้พบข้อมูลที่ต้องการ
            </p>
            <button 
                onClick={() => {setSearchTerm(""); setSelectedDept("all");}}
                className="mt-6 text-blue-600 font-bold text-sm hover:underline"
            >
                ล้างการค้นหาทั้งหมด
            </button>
          </div>
        )}
      </motion.div>

    </div>
  );
};

export default UserDashboard;