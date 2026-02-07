import React, { useEffect, useState } from 'react';
import type { Constraint } from '../../types/constraint';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConstraintForm from '../../components/forms/ConstraintForm';
import type { ConstraintFormInputs } from '../../types/constraint';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { Plus, Edit, Trash2, FileUp, FileDown } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import FileUploadModal from '../../components/ui/FileUploadModal'; // Import FileUploadModal
import SlideDownPanel from '../../components/ui/SlideDownPanel'; // Import SlideDownPanel
import axios from 'axios';
import Pagination from '../../components/ui/Pagination';
import { toast } from 'react-hot-toast';

const AdminConstraints: React.FC = () => {
    const [constraints, setConstraints] = useState<Constraint[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingConstraint, setEditingConstraint] = useState<Constraint | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false); // New state for dropdown
    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [deletingConstraint, setDeletingConstraint] = useState<Constraint | null>(null);
    const [isSubmittingDelete, setIsSubmittingDelete] = useState<boolean>(false);
    const [isAddPanelOpen, setIsAddPanelOpen] = useState<boolean>(false); // New state for slide-down panel

    const fetchConstraints = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const response = await api.get('/constraint', {
                params: { page, search, itemsPerPage: 10 }
            });
            setConstraints(response.data.data || []);
            setTotalPages(response.data.meta_data.totalPages);
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.status === 404) {
                setConstraints([]);
            } else {
                console.error('ไม่สามารถดึงข้อมูลข้อจำกัดได้', err);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConstraints(currentPage, searchQuery);
    }, [currentPage, searchQuery]);

    const handleOpenAddModal = () => {
        setEditingConstraint(null);
        setIsAddPanelOpen(true);
        setIsDropdownOpen(false); // Close dropdown after selecting manual add
    };

    const handleOpenEditModal = (constraint: Constraint) => {
        setEditingConstraint(constraint);
        setIsModalOpen(true);
    };

    const handleCloseAddPanel = () => {
        setIsAddPanelOpen(false);
    };

    const handleCloseEditModal = () => {
        setIsModalOpen(false);
        setEditingConstraint(null);
    };

    const handleSaveConstraint = async (data: ConstraintFormInputs) => {
        setIsSubmitting(true);
        try {
            if (editingConstraint) {
                await api.patch(`/constraint/${editingConstraint.id}`, data);
                handleCloseEditModal();
            } else {
                await api.post('/constraint', data);
                handleCloseAddPanel();
            }
            fetchConstraints();
        } catch (error: unknown) {
            console.error("ไม่สามารถบันทึกข้อจำกัดได้", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenDeleteModal = (constraint: Constraint) => {
        setDeletingConstraint(constraint);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setDeletingConstraint(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingConstraint) return;
        setIsSubmittingDelete(true);
        try {
            await api.delete(`/constraint/${deletingConstraint.id}`);
            fetchConstraints();
            handleCloseDeleteModal();
        } catch (error: unknown) {
            console.error("ไม่สามารถลบข้อจำกัดได้", error);
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
        fetchConstraints(); // Refresh data after upload
    };

    const handleFileUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            // Assuming the backend has an import endpoint for constraints
            await api.post('/constraint/import', formData, {
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
            const response = await api.get('/constraint/template', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'constraint_template.xlsx');
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

    const tableHeaders = ['ลำดับ', 'ประเภท', 'ระดับ', 'ข้อจำกัด', ''];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">จัดการข้อจำกัด</h1>
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
                            เพิ่มข้อจำกัด
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

            {/* SlideDownPanel for adding new constraint */}
            <SlideDownPanel isOpen={isAddPanelOpen} onClose={handleCloseAddPanel} title="เพิ่มข้อจำกัดใหม่">
                <ConstraintForm 
                    onSubmit={handleSaveConstraint} 
                    onCancel={handleCloseAddPanel} 
                    initialData={null} // Always null for new additions
                    isSubmitting={isSubmitting}
                />
            </SlideDownPanel>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="ค้นหาข้อจำกัด..."
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
                    ) : constraints.length > 0 ? (
                        constraints.map((constraint, index) => (
                            <motion.tr 
                                key={constraint.id} 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                transition={{ duration: 0.3 }}
                                className="hover:bg-slate-50 transition-colors"
                            >
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-normal font-medium text-gray-900">{(currentPage - 1) * 10 + index + 1}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-gray-700">{constraint.category}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-gray-700">{constraint.level}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-normal text-gray-700 break-words">{constraint.constraint}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-right font-medium space-x-2">
                                    <button 
                                        onClick={() => handleOpenEditModal(constraint)} 
                                        className="p-2 text-indigo-600 hover:text-indigo-500 rounded-full hover:bg-indigo-50 transition-colors"
                                        title="แก้ไข"
                                    >
                                        <Edit size={18}/>
                                    </button>
                                    <button 
                                        onClick={() => handleOpenDeleteModal(constraint)} 
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
                                ไม่มีข้อมูลข้อจำกัด
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

            <Modal isOpen={isModalOpen} onClose={handleCloseEditModal} title={editingConstraint ? 'แก้ไขข้อจำกัด' : 'เพิ่มข้อจำกัดใหม่'}>
                <ConstraintForm 
                    onSubmit={handleSaveConstraint} 
                    onCancel={handleCloseEditModal} 
                    initialData={editingConstraint}
                    isSubmitting={isSubmitting}
                />
            </Modal>

            {/* File Upload Modal */}
            <FileUploadModal
                isOpen={isUploadModalOpen}
                onClose={handleCloseUploadModal}
                title="นำเข้าข้อจำกัดจากไฟล์"
                onFileUpload={handleFileUpload}
            />

            <ConfirmationDialog
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleDeleteConfirm}
                title="ลบข้อจำกัด"
                message={`คุณแน่ใจหรือไม่ว่าต้องการลบข้อจำกัดนี้? การกระทำนี้ไม่สามารถยกเลิกได้`}
                isConfirming={isSubmittingDelete}
            />

</motion.div>
    );
};

export default AdminConstraints;
