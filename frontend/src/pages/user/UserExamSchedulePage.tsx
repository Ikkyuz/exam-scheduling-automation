import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, ArrowLeft } from 'lucide-react'; // Import ArrowLeft
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import ScheduleTable from '../../components/ui/ScheduleTable';
import api from '../../services/api';
import toast from 'react-hot-toast';
import type { ScheduleResult } from '../admin/AdminScheduling'; // Reusing type from admin scheduling page
import { useAuth } from '../../contexts/AuthContext';

const UserExamSchedulePage: React.FC = () => {
    const navigate = useNavigate(); // Initialize navigate
    const { user } = useAuth();
    const [schedule, setSchedule] = useState<ScheduleResult[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user?.departmentName) {
            fetchSchedule(user.departmentName);
        }
    }, [user?.departmentName]);

    const fetchSchedule = async (deptName: string) => {
        setLoading(true);
        setError(null);
        try {
            // เรียกใช้ /exam-plans และส่ง departmentName ไปกรอง
            const response = await api.get('/exam-plans', {
                params: { departmentName: deptName }
            });
            setSchedule(response.data);
            toast.success(`ดึงข้อมูลตารางสอบสาขา ${deptName} สำเร็จ`, { id: 'fetch-user-exam-schedule-success' });
        } catch (err) {
            console.error('Error fetching user exam schedule:', err);
            setError('ไม่สามารถดึงข้อมูลตารางสอบได้');
            toast.error('ไม่สามารถดึงข้อมูลตารางสอบได้', { id: 'fetch-user-exam-schedule-error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!user?.departmentName) {
            toast.error('ไม่พบข้อมูลสาขาวิชาสำหรับการดาวน์โหลด', { id: 'download-user-exam-pdf-no-dept' });
            return;
        }
        try {
            const response = await api.get('/exam-plans/exam/pdf', {
                params: { departmentName: user.departmentName },
                responseType: 'blob', // Important for downloading files
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `ตารางสอบของคุณ-ล่าสุด.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('ดาวน์โหลดตารางสอบของคุณสำเร็จ', { id: 'download-user-exam-pdf-success' });
        } catch (err) {
            console.error('Error downloading user exam schedule PDF:', err);
            toast.error('ไม่สามารถดาวน์โหลดตารางสอบของคุณได้', { id: 'download-user-exam-pdf-error' });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center"> {/* Group back button and title */}
                    <button
                        onClick={() => navigate(-1)} // Go back to the previous page
                        className="p-2 mr-2 rounded-full hover:bg-gray-200 transition-colors duration-200"
                        title="ย้อนกลับ"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">ตารางสอบของฉัน</h1>
                </div>
                <button
                    onClick={handleDownloadPdf}
                    className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all duration-200"
                >
                    <Download size={20} className="mr-2" />
                    ดาวน์โหลด PDF
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6">
                {loading ? (
                    <p className="text-center text-gray-500">กำลังโหลดตารางสอบของคุณ...</p>
                ) : error ? (
                    <p className="text-center text-rose-500">{error}</p>
                ) : (
                    <ScheduleTable schedule={schedule} />
                )}
            </div>
        </motion.div>
    );
};

export default UserExamSchedulePage;