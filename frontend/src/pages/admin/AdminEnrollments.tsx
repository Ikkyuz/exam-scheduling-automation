import React, { useEffect, useState } from 'react';
import type { Enrollment } from '../../types/enrollment';
import type { Class } from '../../types/class';

import type { Course } from '../../types/course';
import Modal from '../../components/ui/Modal';
import EnrollmentForm from '../../components/forms/EnrollmentForm';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { Plus, Trash2, FileUp, FileDown } from 'lucide-react'; // Added FileUp
import { motion } from 'framer-motion';
import api from '../../services/api';
import FileUploadModal from '../../components/ui/FileUploadModal'; // Import FileUploadModal
import SlideDownPanel from '../../components/ui/SlideDownPanel'; // Import SlideDownPanel
import Pagination from '../../components/ui/Pagination';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import SearchableDropdown from '../../components/ui/SearchableDropdown';

interface EnrollmentFormData {
    class_id: number;
    course_ids: number[];
}

const AdminEnrollments: React.FC = () => {
    // Removed unused enrollments state
    const [groupedEnrollments, setGroupedEnrollments] = useState<Record<number, Enrollment[]>>({});
    const [classes, setClasses] = useState<Class[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [deletingEnrollment, setDeletingEnrollment] = useState<Enrollment | null>(null);
    const [isSubmittingDelete, setIsSubmittingDelete] = useState<boolean>(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [totalPages, setTotalPages] = useState(1);

    // New states for choice and upload modals
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const [isAddPanelOpen, setIsAddPanelOpen] = useState<boolean>(false); // New state for slide-down panel

    // State to track selected course for each class (for the "Add" button confirmation flow)
    const [selectedCoursesMap, setSelectedCoursesMap] = useState<Record<number, number | null>>({});
    // State to force re-render/reset SearchableDropdown after successful add
    const [dropdownResetKeys, setDropdownResetKeys] = useState<Record<number, number>>({});

    const fetchEnrollments = async (search = '') => {
        setLoading(true);
        try {
            const response = await api.get('/enrollments', {
                params: { search, itemsPerPage: -1 }
            });
            const allEnrollments: Enrollment[] = response.data.data || [];
            
            // Group by class_id
            const groups: Record<number, Enrollment[]> = {};
            allEnrollments.forEach(item => {
                const cId = item.class_id;
                if (!groups[cId]) {
                    groups[cId] = [];
                }
                groups[cId].push(item);
            });
            
            setGroupedEnrollments(groups);
            setTotalPages(Math.ceil(Object.keys(groups).length / 10) || 1);
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.status === 404) {
                setGroupedEnrollments({});
                setTotalPages(1);
            } else {
                console.error('ไม่สามารถดึงข้อมูลการลงทะเบียนได้', err);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await api.get('/class', { params: { itemsPerPage: -1 } });
            setClasses(response.data.data);
        } catch (err: unknown) {
            console.error('ไม่สามารถดึงข้อมูลคลาสได้', err);
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await api.get('/courses', { params: { itemsPerPage: -1 } });
            setCourses(response.data.data);
        } catch (err: unknown) {
            console.error('ไม่สามารถดึงข้อมูลรายวิชาได้', err);
        }
    };

    useEffect(() => {
        fetchEnrollments(searchQuery);
        fetchClasses();
        fetchCourses();
    }, [currentPage, searchQuery]);

    const handleOpenAddModal = () => {
        setEditingEnrollment(null);
        setIsAddPanelOpen(true);
        setIsDropdownOpen(false); // Close dropdown after selecting manual add
    };

    // Removed handleOpenEditModal

    const handleCloseAddPanel = () => {
        setIsAddPanelOpen(false);
    };

    const handleCloseEditModal = () => {
        setIsModalOpen(false);
        setEditingEnrollment(null);
    };

    const handleSaveEnrollment = async (data: EnrollmentFormData) => {
        setIsSubmitting(true);
        try {
            if (data.course_ids && Array.isArray(data.course_ids) && data.course_ids.length > 0) {
                if (editingEnrollment) {
                    // Update single enrollment
                    // We take the first selected course if multiple are selected in edit mode (though UI implies selection)
                    const singleCourseId = data.course_ids[0];
                    await api.patch(`/enrollments/${editingEnrollment.id}`, {
                        class_id: data.class_id,
                        course_id: singleCourseId
                    });
                    handleCloseEditModal();
                } else {
                    // Create new enrollments (bulk)
                    const payload = data.course_ids.map((cid: number) => ({
                        class_id: data.class_id,
                        course_id: cid
                    }));
                    await api.post('/enrollments', payload);
                    handleCloseAddPanel();
                }
            }
            fetchEnrollments(searchQuery);
        } catch (error: unknown) {
            console.error("ไม่สามารถบันทึกการลงทะเบียนได้", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenDeleteModal = (enrollment: Enrollment) => {
        setDeletingEnrollment(enrollment);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setDeletingEnrollment(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingEnrollment) return;
        setIsSubmittingDelete(true);
        try {
            await api.delete(`/enrollments/${deletingEnrollment.id}`);
            fetchEnrollments(searchQuery);
            handleCloseDeleteModal();
        } catch (error: unknown) {
            console.error("ไม่สามารถลบการลงทะเบียนได้", error);
        } finally {
            setIsSubmittingDelete(false);
        }
    };

    const handleOpenUploadModal = () => {
        setIsUploadModalOpen(true);
        setIsDropdownOpen(false); // Close dropdown after selecting upload
    };

    const handleCloseUploadModal = () => {
        setIsUploadModalOpen(false);
        fetchEnrollments(searchQuery); // Refresh data after upload
    };

    const handleFileUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            // Assuming the backend has an import endpoint for enrollments
            await api.post('/enrollments/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('File uploaded successfully');
            toast.success('นำเข้าข้อมูลสำเร็จ');
            handleCloseUploadModal();
        } catch (error: unknown) {
            console.error("ไม่สามารถอัปโหลดไฟล์ได้", error);
            toast.error('ไม่สามารถนำเข้าข้อมูลได้');
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await api.get('/enrollments/template', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'enrollment_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('ดาวน์โหลดแบบฟอร์มสำเร็จ');
        } catch (error) {
            console.error("ไม่สามารถดาวน์โหลดแบบฟอร์มได้", error);
            toast.error('ไม่สามารถดาวน์โหลดแบบฟอร์มได้');
        }
    };

    const getClassName = (classId: number) => {
        return classes.find(c => c.id === classId)?.name || 'ไม่พบชั้นเรียน';
    }

    const getDepartmentName = (classId: number) => {
        return classes.find(c => c.id === classId)?.department?.name || 'ไม่พบชั้นเรียน';
    }
    
    const getCourseCode = (courseId: number) => {
        return courses.find(c => c.id === courseId)?.code || '-';
    }

    const getCourseName = (courseId: number) => {
        return courses.find(c => c.id === courseId)?.name || 'ไม่พบรายวิชา';
    }

    const getCourseDuration = (courseId: number) => {
        return courses.find(c => c.id === courseId)?.duration || '-';
    }

    const renderClassGroups = () => {
        const entries = Object.entries(groupedEnrollments);
        const startIndex = (currentPage - 1) * 10;
        const pageEntries = entries.slice(startIndex, startIndex + 10);

        return pageEntries.map(([classIdStr, items]) => {
            const classId = Number(classIdStr);
            return (
             <motion.div 
                key={classId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible hover:shadow-md transition-shadow duration-200 flex flex-col"
            >
                <div className="px-5 py-4 bg-blue-50 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                        <h3 className="font-bold text-slate-700">ระดับชั้น {getClassName(classId)} สาขาวิชา {getDepartmentName(classId)}</h3>
                    </div>
                </div>
                
                <div className="p-5 flex-grow">
                    <table className="w-full text-left">
                        <thead className="text-slate-500 uppercase bg-slate-50/50 rounded-lg">
                            <tr>
                                <th className="px-2 py-2 font-semibold">รหัสวิชา</th>
                                <th className="px-2 py-2 font-semibold">ชื่อวิชา</th>
                                <th className="px-2 py-2 font-semibold">เวลาสอบ (นาที)</th>
                                <th className="px-2 py-2 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map(item => (
                                <tr key={item.id}>
                                    <td className="px-2 py-3 font-medium text-slate-700">{getCourseCode(item.course_id)}</td>
                                    <td className="px-2 py-3 text-slate-600 truncate max-w-[200px]" title={getCourseName(item.course_id)}>
                                        {getCourseName(item.course_id)}
                                    </td>
                                    <td className="px-2 py-3 text-slate-600">
                                        {getCourseDuration(item.course_id)}
                                    </td>
                                    <td className="px-2 py-3 text-right">
                                        <button 
                                            onClick={() => handleOpenDeleteModal(item)}
                                            className="text-slate-400 hover:text-rose-600 transition-colors"
                                            title="ลบ"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex gap-4 items-center">
                    <div className="flex-1">
                        <SearchableDropdown
                             key={dropdownResetKeys[classId] || 0}
                             options={courses.map(c => ({
                                 id: c.id,
                                 label: `${c.code} - ${c.name}`,
                                 subLabel: c.name,
                                 value: c.id
                             }))}
                             onSelect={(val) => setSelectedCoursesMap(prev => ({ ...prev, [classId]: val }))}
                             onClear={() => setSelectedCoursesMap(prev => ({ ...prev, [classId]: null }))}
                             placeholder="ค้นหารายวิชาเพื่อลงทะเบียน..."
                        />
                    </div>
                    <button
                        onClick={async () => {
                            const selectedId = selectedCoursesMap[classId];
                            if (selectedId) {
                                const exists = (groupedEnrollments[classId] || []).some(e => e.course_id === selectedId);
                                if (exists) {
                                    toast.error('รายวิชานี้ถูกลงทะเบียนในชั้นเรียนนี้แล้ว');
                                    return;
                                }
                                await handleSaveEnrollment({ class_id: classId, course_ids: [selectedId] });
                                // Reset
                                setSelectedCoursesMap(prev => ({ ...prev, [classId]: null }));
                                setDropdownResetKeys(prev => ({ ...prev, [classId]: (prev[classId] || 0) + 1 }));
                                toast.success('เพิ่มการลงทะเบียนเรียบร้อยแล้ว');
                            }
                        }}
                        disabled={!selectedCoursesMap[classId] || isSubmitting}
                        className={`px-6 py-3 font-bold rounded-xl shadow-sm text-base transition-all ${
                            !selectedCoursesMap[classId] || isSubmitting
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                        }`}
                    >
                        เพิ่ม
                    </button>
                </div>
            </motion.div>
            );
        });
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">จัดการการลงทะเบียน</h1>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={handleDownloadTemplate}
                        className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 hover:text-blue-600 transition-all duration-200 group relative"
                    >
                        <FileDown size={20} className="mr-2"/>
                        ดาวน์โหลดแบบฟอร์ม
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            คลิกเพื่อโหลดไฟล์ต้นแบบ .xlsx
                        </div>
                    </button>
                    <div className="relative flex-1 sm:flex-none">
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full sm:w-auto flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <Plus size={20} className="mr-2"/>
                            เพิ่มการลงทะเบียน
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-10 overflow-hidden">
                                <button
                                    onClick={handleOpenAddModal}
                                    className="flex items-center w-full px-4 py-3 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors font-medium"
                                >
                                    <Plus size={18} className="mr-3 text-slate-400"/>
                                    กรอกข้อมูล
                                </button>
                                <button
                                    onClick={handleOpenUploadModal}
                                    className="flex items-center w-full px-4 py-3 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors font-medium border-t border-slate-50"
                                >
                                    <FileUp size={18} className="mr-3 text-slate-400"/>
                                    นำเข้าไฟล์
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SlideDownPanel for adding new enrollment */}
            <SlideDownPanel isOpen={isAddPanelOpen} onClose={handleCloseAddPanel} title="เพิ่มการลงทะเบียนใหม่">
                <EnrollmentForm 
                    onSubmit={handleSaveEnrollment} 
                    onCancel={handleCloseAddPanel} 
                    initialData={null} // Always null for new additions
                    isSubmitting={isSubmitting}
                    courses={courses}
                    classes={classes}
                />
            </SlideDownPanel>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="ค้นหาการลงทะเบียน (ชั้นเรียน)..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400 bg-white rounded-2xl shadow-sm border border-slate-200">
                    กำลังโหลดข้อมูล...
                </div>
            ) : Object.keys(groupedEnrollments).length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                    {renderClassGroups()}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-400 bg-white rounded-2xl shadow-sm border border-slate-200">
                    ไม่มีข้อมูลการลงทะเบียน
                </div>
            )}

            <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            <Modal isOpen={isModalOpen} onClose={handleCloseEditModal} title={editingEnrollment ? 'แก้ไขการลงทะเบียน' : 'เพิ่มการลงทะเบียนใหม่'}>
                <EnrollmentForm 
                    onSubmit={handleSaveEnrollment} 
                    onCancel={handleCloseEditModal} 
                    initialData={editingEnrollment}
                    isSubmitting={isSubmitting}
                    courses={courses}
                    classes={classes}
                />
            </Modal>

            {/* File Upload Modal */}
            <FileUploadModal
                isOpen={isUploadModalOpen}
                onClose={handleCloseUploadModal}
                title="นำเข้าการลงทะเบียนจากไฟล์"
                onFileUpload={handleFileUpload}
                instruction="ไฟล์ต้องมีคอลัมน์ 'รหัสวิชา' และ 'ชื่อชั้นเรียน' ที่ตรงกับฐานข้อมูล หากไม่พบข้อมูลระบบจะข้ามรายการนั้น"
            />

            <ConfirmationDialog
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleDeleteConfirm}
                title="ลบการลงทะเบียน"
                message={`คุณแน่ใจหรือไม่ว่าต้องการลบการลงทะเบียนนี้? การกระทำนี้ไม่สามารถยกเลิกได้`}
                isConfirming={isSubmittingDelete}
            />
            
</motion.div>
    );
};

export default AdminEnrollments;
