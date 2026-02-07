import { motion } from 'framer-motion';
import { Frown, Home, ArrowLeft, LifeBuoy } from 'lucide-react';

const NotFoundPage = () => {
  // ฟังก์ชันจำลองการกลับหน้าหลัก
  const goHome = () => {
    window.location.href = '/';
  };

  // แอนิเมชันสำหรับไอคอนลอยตัว
  const floatingAnimation = {
    y: [0, -20, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] overflow-hidden relative p-6">
      {/* องค์ประกอบตกแต่งพื้นหลัง (Background Decorative Elements) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200 rounded-full blur-[120px] opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200 rounded-full blur-[120px] opacity-60"></div>

      <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">
        
        {/* ไอคอนหลักพร้อมแอนิเมชันลอยตัว */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="relative mb-12"
                >
                  <motion.div animate={floatingAnimation}>
                    <div className="p-8 bg-white rounded-[2.5rem] shadow-2xl shadow-purple-200/50 relative z-10">
                      <Frown className="w-24 h-24 text-indigo-600" strokeWidth={1.5} />
                    </div>
                  </motion.div>          {/* เงาใต้ไอคอน */}
          <motion.div 
            animate={{ scale: [1, 0.8, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" as const }}
            className="w-20 h-4 bg-indigo-900/10 blur-md rounded-full mx-auto mt-4"
          />
        </motion.div>

        {/* ข้อความเนื้อหา */}
        <div className="space-y-4 text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-indigo-600 to-purple-800 tracking-tighter">
              404
            </h1>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              ไม่พบหน้าสิ่งที่คุณค้นหา
            </h2>
          </motion.div>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed"
          >
            ขออภัย หน้าที่คุณพยายามเข้าถึงอาจถูกลบ ย้ายชื่อ <br className="hidden md:block" /> หรือไม่เคยมีอยู่ตั้งแต่แรก
          </motion.p>
        </div>

        {/* ปุ่ม Action */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <button
            onClick={goHome}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transform transition-all active:scale-95 group"
          >
            <Home className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
            กลับสู่หน้าหลัก
          </button>

          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-700 font-bold rounded-2xl border border-gray-200 hover:bg-gray-50 transform transition-all active:scale-95 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            ย้อนกลับ
          </button>
        </motion.div>

        {/* ส่วนท้าย - ความช่วยเหลือเพิ่มเติม */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 flex items-center gap-2 text-gray-400 text-sm font-medium hover:text-purple-500 cursor-pointer transition-colors"
        >
          <LifeBuoy className="w-4 h-4" />
          <span>ต้องการความช่วยเหลือ? ติดต่อฝ่ายสนับสนุน</span>
        </motion.div>

      </div>
      
      {/* ลายน้ำเลข 404 ขนาดใหญ่ที่พื้นหลัง */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] select-none">
        <span className="text-[30vw] font-black italic">NOT FOUND</span>
      </div>
    </div>
  );
};

export default function App() {
  return <NotFoundPage />;
}
