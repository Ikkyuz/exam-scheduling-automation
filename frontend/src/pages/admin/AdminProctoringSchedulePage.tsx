import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import Table from '../../components/ui/Table';
import api from '../../services/api';
import toast from 'react-hot-toast';

export interface ProctoringScheduleResult {
    proctorName: string;
    courseName: string;
    roomNumber: string;
    timeStart: string;
    timeEnd: string;
    date: string;
}

const AdminProctoringSchedulePage: React.FC = () => {
    const [proctoringSchedule, setProctoringSchedule] = useState<ProctoringScheduleResult[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProctoringSchedule();
    }, []);

    const fetchProctoringSchedule = async () => {
        setLoading(true);
        setError(null);
        try {
            // Adjust API endpoint and parameters as needed for your backend
            const response = await api.get('/schedule/proctoring');
            // Assuming the backend returns data in a format suitable for display
            // For now, let's map it to a generic ScheduleResult if structure is similar
            const formattedSchedule: ProctoringScheduleResult[] = response.data.data.map((item: { proctorName: string; courseName: string; roomNumber: string; timeStart: string; timeEnd: string; date: string }) => ({
                proctorName: item.proctorName,
                courseName: item.courseName,
                roomNumber: item.roomNumber,
                timeStart: item.timeStart,
                timeEnd: item.timeEnd,
                date: item.date,
            }));
            setProctoringSchedule(formattedSchedule);
            toast.success('ดึงข้อมูลตารางคุมสอบสำเร็จ', { id: 'fetch-proctoring-schedule-success' });
        } catch (err) {
            console.error('Error fetching proctoring schedule:', err);
            setError('ไม่สามารถดึงข้อมูลตารางคุมสอบได้');
            toast.error('ไม่สามารถดึงข้อมูลตารางคุมสอบได้', { id: 'fetch-proctoring-schedule-error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        try {
            const response = await api.get('/schedule/proctoring/pdf', {
                responseType: 'blob', // Important for downloading files
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `ตารางคุมสอบ-ล่าสุด.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('ดาวน์โหลดตารางคุมสอบสำเร็จ', { id: 'download-proctoring-pdf-success' });
        } catch (err) {
            console.error('Error downloading proctoring schedule PDF:', err);
            toast.error('ไม่สามารถดาวน์โหลดตารางคุมสอบได้', { id: 'download-proctoring-pdf-error' });
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
                <h1 className="text-3xl font-bold text-gray-900">ตารางคุมสอบ</h1>
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
                    <p className="text-center text-gray-700">กำลังโหลดตารางคุมสอบ...</p>
                ) : error ? (
                    <p className="text-center text-rose-500">{error}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <Table headers={tableHeaders}>
                            {proctoringSchedule.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.proctorName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.courseName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.roomNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.timeStart}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.timeEnd}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.date}</td>
                                </tr>
                            ))}
                        </Table>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default AdminProctoringSchedulePage;