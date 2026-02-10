import React from "react";
import { School, MapPin, Phone, Globe } from "lucide-react";

const UserFooter: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Logo & Name */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
              <School size={28} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              วิทยาลัยอาชีวศึกษานครปฐม
            </h3>
          </div>

          {/* Contact Info Grid */}
          <div className="mb-10 w-full max-w-2xl">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">
              ข้อมูลการติดต่อ
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-blue-500">
                  <MapPin size={18} />
                </div>
                <span className="text-sm text-slate-600 leading-relaxed">
                  เลขที่ 2 ถ.เทศา ต.พระปฐมเจดีย์<br/>อ.เมือง จ.นครปฐม 73000
                </span>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-blue-500">
                  <Phone size={18} />
                </div>
                <span className="text-sm text-slate-600">034-252-790</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-blue-500">
                  <Globe size={18} />
                </div>
                <a 
                  href="https://www.ncvc.ac.th" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-slate-600 hover:text-blue-600 transition-colors font-medium"
                >
                  www.ncvc.ac.th
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-slate-100 w-full">
            <p className="text-xs font-medium text-slate-400">
              © {new Date().getFullYear()} วิทยาลัยอาชีวศึกษานครปฐม. สงวนลิขสิทธิ์.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default UserFooter;