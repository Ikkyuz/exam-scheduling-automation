import React from "react";
import { School, MapPin, Phone, Globe } from "lucide-react";

const UserFooter: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 pt-12 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          <div className="col-span-1 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <School className="text-blue-600" size={32} />
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                วิทยาลัยอาชีวศึกษานครปฐม
              </h3>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-md">
              มุ่งมั่นจัดการศึกษาอาชีวศึกษาให้มีคุณภาพได้มาตรฐานสากล
              เน้นการเรียนรู้ด้วยการปฏิบัติจริง (Active Learning) 
              และเทคโนโลยีที่ทันสมัย เพื่อผลิตกำลังคนที่มีสมรรถนะสูงสู่ตลาดแรงงาน
            </p>
          </div>

          <div className="lg:col-span-2 flex md:justify-end">
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">
                ข้อมูลการติดต่อ
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-slate-500">
                  <MapPin className="text-blue-500 shrink-0" size={18} />
                  <span>เลขที่ 2 ถ.เทศา ต.พระปฐมเจดีย์ อ.เมือง จ.นครปฐม 73000</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-500">
                  <Phone className="text-blue-500 shrink-0" size={18} />
                  <span>034-252-790</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-500">
                  <Globe className="text-blue-500 shrink-0" size={18} />
                  <a href="https://www.ncvc.ac.th" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                    www.ncvc.ac.th
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-medium text-slate-400">
            © {new Date().getFullYear()} วิทยาลัยอาชีวศึกษานครปฐม. สงวนลิขสิทธิ์.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider">Privacy Policy</a>
            <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default UserFooter;
