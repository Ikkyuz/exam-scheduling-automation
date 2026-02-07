import React, { useEffect, useState } from 'react';
import type { User } from '../../types/user';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import UserForm from '../../components/forms/UserForm'; // Will create this
import type { UserFormInputs } from '../../types/user'; // Will define this
import { Plus, Edit, Trash2, FileUp, FileDown, User as UserIcon } from 'lucide-react'; 
import { motion } from 'framer-motion';
import api from '../../services/api';
import FileUploadModal from '../../components/ui/FileUploadModal'; 
import SlideDownPanel from '../../components/ui/SlideDownPanel'; // Import SlideDownPanel
import axios from 'axios';
import Pagination from '../../components/ui/Pagination';
import { toast } from 'react-hot-toast';

const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [isSubmittingDelete, setIsSubmittingDelete] = useState<boolean>(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const [isAddPanelOpen, setIsAddPanelOpen] = useState<boolean>(false); // New state for slide-down panel

    const fetchUsers = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const response = await api.get('/users', {
                params: { page, search }
            });
            setUsers(response.data.data || []);
            setTotalPages(response.data.meta_data.totalPages);
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.status === 404) {
                setUsers([]);
            } else {
                console.error('ไม่สามารถดึงข้อมูลผู้ใช้ได้', err);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(currentPage, searchQuery);
    }, [currentPage, searchQuery]);

    const handleOpenAddModal = () => {
        setEditingUser(null);
        setIsAddPanelOpen(true);
        setIsDropdownOpen(false); 
    };

    const handleOpenEditModal = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseAddPanel = () => {
        setIsAddPanelOpen(false);
    };

    const handleCloseEditModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleSaveUser = async (data: UserFormInputs) => {
        setIsSubmitting(true);
        try {
            if (editingUser) {
                await api.patch(`/users/${editingUser.id}`, data);
                handleCloseEditModal();
            } else {
                await api.post('/users', data);
                handleCloseAddPanel();
            }
            fetchUsers(currentPage, searchQuery);
            handleCloseEditModal(); // Changed to handleCloseEditModal() if editing, else handleCloseAddPanel()
        } catch (error: unknown) {
            console.error("ไม่สามารถบันทึกข้อมูลผู้ใช้ได้", error);
            let errorMessage = 'ไม่สามารถบันทึกข้อมูลผู้ใช้ได้';
            if (axios.isAxiosError(error) && error.response?.data) {
                // Assuming backend returns a string message for errors
                errorMessage = error.response.data;
            }
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenDeleteModal = (user: User) => {
        setDeletingUser(user);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setDeletingUser(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingUser) return;
        setIsSubmittingDelete(true);
        try {
            await api.delete(`/users/${deletingUser.id}`);
            fetchUsers(currentPage, searchQuery);
            handleCloseDeleteModal();
        } catch (error: unknown) {
            console.error("ไม่สามารถลบผู้ใช้ได้", error);
        } finally {
            setIsSubmittingDelete(false);
        }
    };

    const handleOpenUploadModal = () => {
        setIsUploadModalOpen(true);
        setIsDropdownOpen(false); 
    };

    const handleCloseUploadModal = () => {
        setIsUploadModalOpen(false);
        fetchUsers(currentPage, searchQuery); 
    };

    const handleFileUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            await api.post('/users/import', formData, {
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
            const response = await api.get('/users/template', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'user_template.xlsx');
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

    const getRoleDisplayName = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'ผู้ดูแลระบบ';
            case 'USER': return 'ครูผู้สอน';
            default: return role;
        }
    }

    const tableHeaders = ['ชื่อผู้ใช้', 'ชื่อจริง', 'นามสกุล', 'อีเมล', 'บทบาท', ''];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">จัดการผู้ใช้</h1>
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
                            เพิ่มผู้ใช้
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-10 overflow-hidden">
                                <button
                                    onClick={handleOpenAddModal}
                                    className="flex items-center w-full px-4 py-3 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors font-medium"
                                >
                                    <UserIcon size={18} className="mr-3 text-slate-400"/>
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

            {/* SlideDownPanel for adding new user */}
            <SlideDownPanel isOpen={isAddPanelOpen} onClose={handleCloseAddPanel} title="เพิ่มผู้ใช้ใหม่">
                <UserForm
                    onSubmit={handleSaveUser}
                    onCancel={handleCloseAddPanel}
                    initialData={null} // Always null for new additions
                    isSubmitting={isSubmitting}
                />
            </SlideDownPanel>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="ค้นหาผู้ใช้..."
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
                    ) : users.length > 0 ? (
                        users.map((user) => (
                            <motion.tr 
                                key={user.id} 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                transition={{ duration: 0.3 }}
                                className="hover:bg-slate-50 transition-colors"
                            >
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-normal font-medium text-gray-900">{user.username}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-normal text-gray-700">{user.firstname || 'ไม่มีข้อมูล'}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-normal text-gray-700">{user.lastname || 'ไม่มีข้อมูล'}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-normal text-gray-700">{user.email || 'ไม่มีข้อมูล'}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-normal text-gray-700">{getRoleDisplayName(user.role)}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-right font-medium space-x-2">
                                    <button 
                                        onClick={() => handleOpenEditModal(user)} 
                                        className="p-2 text-indigo-600 hover:text-indigo-500 rounded-full hover:bg-indigo-50 transition-colors"
                                        title="แก้ไข"
                                    >
                                        <Edit size={18}/>
                                    </button>
                                    <button 
                                        onClick={() => handleOpenDeleteModal(user)} 
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
                                ไม่มีข้อมูลผู้ใช้
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

            <Modal isOpen={isModalOpen} onClose={handleCloseEditModal} title={editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}>
                <UserForm
                    onSubmit={handleSaveUser}
                    onCancel={handleCloseEditModal}
                    initialData={editingUser}
                    isSubmitting={isSubmitting}
                />
            </Modal>

            <FileUploadModal
                isOpen={isUploadModalOpen}
                onClose={handleCloseUploadModal}
                title="นำเข้าผู้ใช้จากไฟล์"
                onFileUpload={handleFileUpload}
            />

            <ConfirmationDialog
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleDeleteConfirm}
                title="ลบผู้ใช้"
                message={`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ "${deletingUser?.username}"? การกระทำนี้ไม่สามารถยกเลิกได้`}
                isConfirming={isSubmittingDelete}
            />
        </motion.div>
    );
};

export default AdminUsers;
