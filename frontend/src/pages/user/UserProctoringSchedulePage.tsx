import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, ArrowLeft } from 'lucide-react'; // Import ArrowLeft
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import Table from '../../components/ui/Table'; // Generic table for proctoring
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import type { ProctoringScheduleResult } from '../admin/AdminProctoringSchedulePage'; // Reusing type

const UserProctoringSchedulePage: React.FC = () => {
    const navigate = useNavigate(); // Initialize navigate
    const { user } = useAuth();
    const [proctoringSchedule, setProctoringSchedule] = useState<ProctoringScheduleResult[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user?.id) {
            fetchProctoringSchedule(user.id);
        }
    }, [user?.id]);

    const fetchProctoringSchedule = async (userId: number) => {
        setLoading(true);
        setError(null);
        try {
            // Adjust API endpoint and parameters as needed for your backend
            // Assuming an endpoint like /users/{userId}/schedule/proctoring
            const response = await api.get(`/users/${userId}/schedule/proctoring`);
            const formattedSchedule: ProctoringScheduleResult[] = response.data.data.map((item: { proctorName: string; courseName: string; roomNumber: string; timeStart: string; timeEnd: string; date: string }) => ({
                proctorName: item.proctorName,
                courseName: item.courseName,
                roomNumber: item.roomNumber,
                timeStart: item.timeStart,
                timeEnd: item.timeEnd,
                date: item.date,
            }));
            setProctoringSchedule(formattedSchedule);
            toast.success('ดึงข้อมูลตารางคุมสอบของคุณสำเร็จ', { id: 'fetch-user-proctoring-schedule-success' });
        } catch (err) {
            console.error('Error fetching user proctoring schedule:', err);
            setError('ไม่สามารถดึงข้อมูลตารางคุมสอบของคุณได้');
            toast.error('ไม่สามารถดึงข้อมูลตารางคุมสอบของคุณได้', { id: 'fetch-user-proctoring-schedule-error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!user?.id) {
            toast.error('ไม่พบข้อมูลผู้ใช้สำหรับการดาวน์โหลด', { id: 'download-user-proctoring-pdf-no-user' });
            return;
        }
        try {
            const response = await api.get(`/users/${user.id}/schedule/proctoring/pdf`, {
                responseType: 'blob', // Important for downloading files
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `ตารางคุมสอบของคุณ-ล่าสุด.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('ดาวน์โหลดตารางคุมสอบของคุณสำเร็จ', { id: 'download-user-proctoring-pdf-success' });
        } catch (err) {
            console.error('Error downloading user proctoring schedule PDF:', err);
            toast.error('ไม่สามารถดาวน์โหลดตารางคุมสอบของคุณได้', { id: 'download-user-proctoring-pdf-error' });
        }
    };

    const tableHeaders = [
        'ผู้คุมสอบ',
        'วิชา',
        'ห้องสอบ',
        'เวลาเริ่ม',
        'เวลาสิ้นสุด',
        'วันที่',
    ];

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
                    <h1 className="text-3xl font-bold text-gray-900">ตารางคุมสอบของฉัน</h1>
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
                    <p className="text-center text-gray-500">กำลังโหลดตารางคุมสอบของคุณ...</p>
                ) : error ? (
                    <p className="text-center text-rose-500">{error}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <Table headers={tableHeaders}>
                            {proctoringSchedule.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.proctorName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.courseName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.roomNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.timeStart}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.timeEnd}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                                </tr>
                            ))}
                        </Table>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default UserProctoringSchedulePage;