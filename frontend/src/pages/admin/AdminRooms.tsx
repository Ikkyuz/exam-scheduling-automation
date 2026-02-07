import React, { useEffect, useState } from 'react';
import type { Room } from '../../types/room';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import RoomForm from '../../components/forms/RoomForm';
import type { RoomFormInputs } from '../../types/room';
import { Plus, Edit, Trash2, FileUp, FileDown } from 'lucide-react'; // Added FileUp
import { motion } from 'framer-motion';
import api from '../../services/api';
import FileUploadModal from '../../components/ui/FileUploadModal'; // Import FileUploadModal
import SlideDownPanel from '../../components/ui/SlideDownPanel'; // Import SlideDownPanel
import axios from 'axios';
import Pagination from '../../components/ui/Pagination';
import { toast } from 'react-hot-toast';

const AdminRooms: React.FC = () => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);

    const [isSubmittingDelete, setIsSubmittingDelete] = useState<boolean>(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    // New states for choice and upload modals
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const [isAddPanelOpen, setIsAddPanelOpen] = useState<boolean>(false); // New state for slide-down panel

const fetchRooms = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const response = await api.get('/rooms', {
                params: { page, search }
            });
            setRooms(response.data.data || []);
            setTotalPages(response.data.meta_data.totalPages);
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.status === 404) {
                setRooms([]);
            } else {
                console.error('ไม่สามารถดึงข้อมูลห้องเรียนได้', err);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms(currentPage, searchQuery);
    }, [currentPage, searchQuery]);

    const handleOpenAddModal = () => {
        setEditingRoom(null);
        setIsAddPanelOpen(true);
        setIsDropdownOpen(false); // Close dropdown after selecting manual add
    };

    const handleOpenEditModal = (room: Room) => {
        setEditingRoom(room);
        setIsModalOpen(true);
    };

    const handleCloseAddPanel = () => {
        setIsAddPanelOpen(false);
    };

    const handleCloseEditModal = () => {
        setIsModalOpen(false);
        setEditingRoom(null);
    };

    const handleSaveRoom = async (data: RoomFormInputs) => {
        setIsSubmitting(true);
        try {
            if (editingRoom) {
                await api.patch(`/rooms/${editingRoom.id}`, data);
                handleCloseEditModal();
            } else {
                await api.post('/rooms', [data]);
                handleCloseAddPanel();
            }
            fetchRooms(currentPage, searchQuery);
        } catch (error: unknown) {
            console.error("ไม่สามารถบันทึกข้อมูลห้องเรียนได้", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenDeleteModal = (room: Room) => {
        setDeletingRoom(room);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setDeletingRoom(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingRoom) return;
        setIsSubmittingDelete(true);
        try {
            await api.delete(`/rooms/${deletingRoom.id}`);
            fetchRooms(currentPage, searchQuery);
            handleCloseDeleteModal();
        } catch (error: unknown) {
            console.error("ไม่สามารถลบห้องเรียนได้", error);
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
        fetchRooms(currentPage, searchQuery); // Refresh data after upload
    };

    const handleFileUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            // Assuming the backend has an import endpoint for rooms
            await api.post('/rooms/import', formData, {
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
            const response = await api.get('/rooms/template', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'room_template.xlsx');
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

    const tableHeaders = ['ลำดับ', 'หมายเลขห้อง', 'อาคาร', 'ชั้น', 'ความจุ', ''];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">จัดการห้องเรียน</h1>
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
                            เพิ่มห้องเรียน
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

            {/* SlideDownPanel for adding new room */}
            <SlideDownPanel isOpen={isAddPanelOpen} onClose={handleCloseAddPanel} title="เพิ่มห้องเรียนใหม่">
                <RoomForm 
                    onSubmit={handleSaveRoom} 
                    onCancel={handleCloseAddPanel} 
                    initialData={null} // Always null for new additions
                    isSubmitting={isSubmitting}
                />
            </SlideDownPanel>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="ค้นหาห้องเรียน..."
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
                    ) : rooms.length > 0 ? (
                        rooms.map((room, index) => (
                            <motion.tr 
                                key={room.id} 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                transition={{ duration: 0.3 }}
                                className="hover:bg-slate-50 transition-colors"
                            >
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap font-medium text-gray-900">{(currentPage - 1) * 10 + index + 1}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-gray-700">{room.roomNumber}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-gray-700">{room.building}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-gray-700">{room.floor}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-gray-700">{room.capacity}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-right font-medium space-x-2">
                                    <button 
                                        onClick={() => handleOpenEditModal(room)} 
                                        className="p-2 text-indigo-600 hover:text-indigo-500 rounded-full hover:bg-indigo-50 transition-colors"
                                        title="แก้ไข"
                                    >
                                        <Edit size={18}/>
                                    </button>
                                    <button 
                                        onClick={() => handleOpenDeleteModal(room)} 
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
                                ไม่มีข้อมูลห้องเรียน
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

            <Modal isOpen={isModalOpen} onClose={handleCloseEditModal} title={editingRoom ? 'แก้ไขห้องเรียน' : 'เพิ่มห้องเรียนใหม่'}>
                <RoomForm 
                    onSubmit={handleSaveRoom} 
                    onCancel={handleCloseEditModal} 
                    initialData={editingRoom}
                    isSubmitting={isSubmitting}
                />
            </Modal>

            {/* File Upload Modal */}
            <FileUploadModal
                isOpen={isUploadModalOpen}
                onClose={handleCloseUploadModal}
                title="นำเข้าห้องเรียนจากไฟล์"
                onFileUpload={handleFileUpload}
            />

            <ConfirmationDialog
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleDeleteConfirm}
                title="ลบห้องเรียน"
                message={`คุณแน่ใจหรือไม่ว่าต้องการลบห้องเรียน "${deletingRoom?.roomNumber}"? การกระทำนี้ไม่สามารถยกเลิกได้`}
                isConfirming={isSubmittingDelete}
            />

</motion.div>
    );
};

export default AdminRooms;
