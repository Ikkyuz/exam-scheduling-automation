import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import ScheduleTable from '../../components/ui/ScheduleTable';
import api from '../../services/api';
import toast from 'react-hot-toast';
import type { ScheduleResult } from './AdminScheduling';

const AdminExamSchedulePage: React.FC = () => {
    const navigate = useNavigate(); // Initialize navigate
    const [schedule, setSchedule] = useState<ScheduleResult[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        setLoading(true);
        setError(null);
        try {
            // Backend endpoint is /api/exam-plans
            const response = await api.get('/exam-plans');
            // Backend returns array directly
            setSchedule(response.data);
            toast.success('ดึงข้อมูลตารางสอบสำเร็จ', { id: 'fetch-schedule-success' });
        } catch (err) {
            console.error('Error fetching exam schedule:', err);
            setError('ไม่สามารถดึงข้อมูลตารางสอบได้');
            toast.error('ไม่สามารถดึงข้อมูลตารางสอบได้', { id: 'fetch-schedule-error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        try {
            const response = await api.get('/exam-plans/exam/pdf', {
                responseType: 'blob', // Important for downloading files
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `ตารางสอบ-ล่าสุด.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('ดาวน์โหลดตารางสอบสำเร็จ', { id: 'download-pdf-success' });
        } catch (err) {
            console.error('Error downloading exam schedule PDF:', err);
            toast.error('ไม่สามารถดาวน์โหลดตารางสอบได้', { id: 'download-pdf-error' });
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
                    <h1 className="text-3xl font-bold text-gray-900">ตารางสอบ</h1>
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
                    <p className="text-center text-gray-500">กำลังโหลดตารางสอบ...</p>
                ) : error ? (
                    <p className="text-center text-rose-500">{error}</p>
                ) : (
                    <ScheduleTable schedule={schedule} />
                )}
            </div>
        </motion.div>
    );
};

export default AdminExamSchedulePage;