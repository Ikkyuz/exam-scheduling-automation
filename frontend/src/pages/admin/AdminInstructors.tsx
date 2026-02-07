import React, { useEffect, useState } from 'react';
import type { Teacher } from '../../types/teacher';
import type { Department } from '../../types/department';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import InstructorForm from '../../components/forms/InstructorForm';
import type { InstructorFormInputs } from '../../types/teacher'; // Changed type import
import { Plus, Edit, Trash2, FileUp, FileDown } from 'lucide-react'; // Added FileUp
import { motion } from 'framer-motion';
import api from '../../services/api';
import FileUploadModal from '../../components/ui/FileUploadModal'; // Import FileUploadModal
import SlideDownPanel from '../../components/ui/SlideDownPanel'; // Import SlideDownPanel
import axios from 'axios';
import Pagination from '../../components/ui/Pagination';
import { toast } from 'react-hot-toast';

const AdminInstructors: React.FC = () => {
    const [instructors, setInstructors] = useState<Teacher[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingInstructor, setEditingInstructor] = useState<Teacher | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [deletingInstructor, setDeletingInstructor] = useState<Teacher | null>(null);
    const [isSubmittingDelete, setIsSubmittingDelete] = useState<boolean>(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    // New states for choice and upload modals
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const [isAddPanelOpen, setIsAddPanelOpen] = useState<boolean>(false); // New state for slide-down panel

    const fetchInstructors = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const response = await api.get('/teachers', {
                params: { page, search, itemsPerPage: 10 }
            });
            setInstructors(response.data.data || []);
            setTotalPages(response.data.meta_data.totalPages);
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.status === 404) {
                setInstructors([]);
            } else {
                console.error('ไม่สามารถดึงข้อมูลครูผู้สอนได้', err);
            }
        }
        finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await api.get('/departments', { params: { itemsPerPage: -1 } });
            console.log('Fetched departments:', response.data.data);
            setDepartments(response.data.data);
        } catch (err: unknown) {
            console.error('ไม่สามารถดึงข้อมูลภาควิชาได้', err);
        }
    };

    useEffect(() => {
        fetchInstructors(currentPage, searchQuery);
        fetchDepartments();
    }, [currentPage, searchQuery]);

    const handleOpenAddModal = () => {
        setEditingInstructor(null);
        setIsAddPanelOpen(true);
        setIsDropdownOpen(false); // Close dropdown after selecting manual add
    };

    const handleOpenEditModal = (instructor: Teacher) => {
        setEditingInstructor(instructor);
        setIsModalOpen(true);
    };

    const handleCloseAddPanel = () => {
        setIsAddPanelOpen(false);
    };

    const handleCloseEditModal = () => {
        setIsModalOpen(false);
        setEditingInstructor(null);
    };

    const handleSaveInstructor = async (data: InstructorFormInputs) => {
        setIsSubmitting(true);
        try {
            const instructorDataForApi = {
                ...data,
                department_ids: [data.department_id], // Convert single department_id to an array
            };
            if (editingInstructor) {
                await api.patch(`/teachers/${editingInstructor.id}`, instructorDataForApi);
                handleCloseEditModal();
            } else {
                await api.post('/teachers', [instructorDataForApi]); // Ensure array for creation
                handleCloseAddPanel();
            }
            fetchInstructors(currentPage, searchQuery);
        } catch (error: unknown) {
            console.error("ไม่สามารถบันทึกข้อมูลครูผู้สอนได้", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenDeleteModal = (instructor: Teacher) => {
        setDeletingInstructor(instructor);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setDeletingInstructor(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingInstructor) return;
        setIsSubmittingDelete(true);
        try {
            await api.delete(`/teachers/${deletingInstructor.id}`);
            fetchInstructors(currentPage, searchQuery);
            handleCloseDeleteModal();
        } catch (error: unknown) {
            console.error("ไม่สามารถลบครูผู้สอนได้", error);
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
        fetchInstructors(currentPage, searchQuery); // Refresh data after upload
    };

    const handleFileUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            // Assuming the backend has an import endpoint for teachers
            await api.post('/teachers/import', formData, {
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
            const response = await api.get('/teachers/template', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'teacher_template.xlsx');
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

    const getDepartmentName = (departmentId: number) => {
        return departments.find(d => d.id === departmentId)?.name || 'ไม่พบสาขาวิชา';
    }

    const tableHeaders = ['ลำดับ', 'ชื่อ', 'นามสกุล', 'สาขาวิชา', 'เบอร์โทรศัพท์', ''];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">จัดการครูผู้สอน</h1>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={handleDownloadTemplate}
                        className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 hover:text-blue-600 transition-all duration-200"
                    >
                        <FileDown size={20} className="mr-2"/>
                        ดาวน์โหลดแบบฟอร์ม
                    </button>
                    <div className="relative flex-1 sm:flex-none">
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full sm:w-auto flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <Plus size={20} className="mr-2"/>
                            เพิ่มครูผู้สอน
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

            {/* SlideDownPanel for adding new instructor */}
            <SlideDownPanel isOpen={isAddPanelOpen} onClose={handleCloseAddPanel} title="เพิ่มครูผู้สอนใหม่">
                <InstructorForm
                    onSubmit={handleSaveInstructor}
                    onCancel={handleCloseAddPanel}
                    initialData={null} // Always null for new additions
                    isSubmitting={isSubmitting}
                    departments={departments}
                />
            </SlideDownPanel>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="ค้นหาครูผู้สอน..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <Table headers={tableHeaders}>
                    {loading ? (
                        <tr>
                            <td colSpan={tableHeaders.length} className="text-center py-12 text-gray-400">
                                กำลังโหลดข้อมูล...
                            </td>
                        </tr>
                    ) : instructors.length > 0 ? (
                        instructors.map((instructor, index) => (
                            <motion.tr 
                                key={instructor.id} 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                transition={{ duration: 0.3 }} 
                                className="hover:bg-slate-50 transition-colors"
                            >
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-normal text-gray-800">{(currentPage - 1) * 10 + index + 1}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-normal font-medium text-gray-900">{instructor.firstname}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-normal font-medium text-gray-900">{instructor.lastname}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-normal text-gray-800">{instructor.department_id ? getDepartmentName(instructor.department_id) : 'ไม่พบสาขาวิชา'}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-normal text-gray-800">{instructor.tel}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-right font-medium space-x-2">
                                    <button 
                                        onClick={() => handleOpenEditModal(instructor)} 
                                        className="p-2 text-indigo-600 hover:text-indigo-500 rounded-full hover:bg-indigo-50 transition-colors"
                                        title="แก้ไข"
                                    >
                                        <Edit size={18}/>
                                    </button>
                                    <button 
                                        onClick={() => handleOpenDeleteModal(instructor)} 
                                        className="p-2 text-rose-600 hover:text-rose-500 rounded-full hover:bg-rose-50 transition-colors"
                                        title="ลบ"
                                    >
                                        <Trash2 size={18}/>
                                    </button>
                                </td>
                            </motion.tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={tableHeaders.length} className="text-center py-12 text-gray-400">
                                ไม่มีข้อมูลครูผู้สอน
                            </td>
                        </tr>
                    )}
                </Table>
            </div>

            <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            <Modal isOpen={isModalOpen} onClose={handleCloseEditModal} title={editingInstructor ? 'แก้ไขครูผู้สอน' : 'เพิ่มครูผู้สอนใหม่'}>
                <InstructorForm
                    onSubmit={handleSaveInstructor}
                    onCancel={handleCloseEditModal}
                    initialData={editingInstructor}
                    isSubmitting={isSubmitting}
                    departments={departments}
                />
            </Modal>

            {/* File Upload Modal */}
            <FileUploadModal
                isOpen={isUploadModalOpen}
                onClose={handleCloseUploadModal}
                title="นำเข้าครูผู้สอนจากไฟล์"
                onFileUpload={handleFileUpload}
            />

            <ConfirmationDialog
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleDeleteConfirm}
                title="ลบครูผู้สอน"
                message={`คุณแน่ใจหรือไม่ว่าต้องการลบครูผู้สอน "${deletingInstructor?.firstname} ${deletingInstructor?.lastname}"? การกระทำนี้ไม่สามารถยกเลิกได้`}
                isConfirming={isSubmittingDelete}
            />

</motion.div>
    );
};

export default AdminInstructors;
