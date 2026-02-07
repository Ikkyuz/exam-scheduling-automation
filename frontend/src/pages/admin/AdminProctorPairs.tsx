import React, { useEffect, useState } from "react";
import type { ProctorPair } from "../../types/proctorPair";
import type { Teacher } from "../../types/teacher";
import Modal from "../../components/ui/Modal";
import ProctorPairForm from "../../components/forms/ProctorPairForm";
import ConfirmationDialog from "../../components/ui/ConfirmationDialog";
import { Plus, Trash2, FileUp, FileDown } from "lucide-react";
import { motion } from "framer-motion";
import api from "../../services/api";
import FileUploadModal from "../../components/ui/FileUploadModal";
import SlideDownPanel from "../../components/ui/SlideDownPanel";
import axios from "axios";
import Pagination from "../../components/ui/Pagination";
import { toast } from "react-hot-toast";
import SearchableDropdown from "../../components/ui/SearchableDropdown";

interface ProctorPairFormData {
  teacher_ids: number[];
  groupNum?: number;
}

const AdminProctorPairs: React.FC = () => {
  // State
  const [groupedProctorPairs, setGroupedProctorPairs] = useState<
    Record<number, ProctorPair[]>
  >({});
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal & Panel States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProctorPair, setEditingProctorPair] =
    useState<ProctorPair | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deletingProctorPair, setDeletingProctorPair] =
    useState<ProctorPair | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState<boolean>(false);

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // UI Toggles
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isAddPanelOpen, setIsAddPanelOpen] = useState<boolean>(false);

  // State to track selected teacher for each group (for the "Add" button confirmation flow)
  const [selectedTeachersMap, setSelectedTeachersMap] = useState<Record<number, number | null>>({});
  // State to force re-render/reset SearchableDropdown after successful add
  const [dropdownResetKeys, setDropdownResetKeys] = useState<Record<number, number>>({});

  // Fetch Data
  const fetchTeachers = async () => {
    try {
      const response = await api.get("/teachers", {
        params: { itemsPerPage: -1 },
      });
      setTeachers(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch teachers", error);
    }
  };

  const fetchProctorPairs = async (search = "") => {
    setLoading(true);
    try {
      const response = await api.get("/proctorPairs", {
        params: { search, itemsPerPage: -1 },
      });
      const allPairs: ProctorPair[] = response.data.data || [];

      // Group logic
      const groups: Record<number, ProctorPair[]> = {};
      allPairs.forEach((item) => {
        const gNum =
          item.groupNum && item.groupNum > 0 ? item.groupNum : -item.id;
        if (!groups[gNum]) {
          groups[gNum] = [];
        }
        groups[gNum].push(item);
      });

      setGroupedProctorPairs(groups);
      setTotalPages(Math.ceil(Object.keys(groups).length / 10) || 1);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setGroupedProctorPairs({});
        setTotalPages(1);
      } else {
        console.error("ไม่สามารถดึงข้อมูลคู่ผู้คุมสอบได้", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchProctorPairs(searchQuery);
  }, [currentPage, searchQuery]);

  // Helpers
  const getTeacherName = (id: number) => {
    const t = teachers.find((t) => t.id === id);
    return t ? `${t.firstname} ${t.lastname}` : `Unknown ID: ${id}`;
  };

  const getTeacherTel = (id: number) => {
    const t = teachers.find((t) => t.id === id);
    return t ? t.tel : "-";
  };

  const handleSaveProctorPair = async (
    data: ProctorPairFormData & { groupNum?: number },
  ) => {
    setIsSubmitting(true);
    try {
      if (data.teacher_ids && Array.isArray(data.teacher_ids)) {
        if (data.teacher_ids.length > 0) {
          let targetGroupNum = data.groupNum;

          if (!targetGroupNum) {
            const existingGroupNums = Object.keys(groupedProctorPairs)
              .map(Number)
              .filter((n) => n > 0);
            targetGroupNum =
              existingGroupNums.length > 0
                ? Math.max(...existingGroupNums) + 1
                : 1;
          }

          const payload = data.teacher_ids.map((id: number) => ({
            teacher_id: id,
            groupNum: targetGroupNum,
          }));

          await api.post("/proctorPairs", payload);
          toast.success("บันทึกข้อมูลสำเร็จ");
          handleCloseAddPanel();
          handleCloseEditModal();
        }
      }
      fetchProctorPairs(searchQuery);
    } catch (error: unknown) {
      console.error("ไม่สามารถบันทึกคู่ผู้คุมสอบได้", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get("/proctorPairs/template", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "proctor_pair_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("ไม่สามารถดาวน์โหลดแบบฟอร์มได้");
    }
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post("/proctorPairs/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("นำเข้าข้อมูลสำเร็จ");
      handleCloseUploadModal();
      fetchProctorPairs(searchQuery);
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("นำเข้าข้อมูลไม่สำเร็จ");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProctorPair) return;
    setIsSubmittingDelete(true);
    try {
      await api.delete(`/proctorPairs/${deletingProctorPair.id}`);
      toast.success("ลบข้อมูลสำเร็จ");
      handleCloseDeleteModal();
      fetchProctorPairs(searchQuery);
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("ลบข้อมูลไม่สำเร็จ");
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  // Modal/Panel Control Functions
  const handleOpenAddModal = () => {
    setEditingProctorPair(null);
    setIsAddPanelOpen(true);
    setIsDropdownOpen(false);
  };

  const handleCloseAddPanel = () => {
    setIsAddPanelOpen(false);
  };

  const handleCloseEditModal = () => {
    setIsModalOpen(false);
    setEditingProctorPair(null);
  };

  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  const handleOpenDeleteModal = (pair: ProctorPair) => {
    setDeletingProctorPair(pair);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingProctorPair(null);
  };

  // Render Helpers
  const renderProctorGroups = () => {
    const entries = Object.entries(groupedProctorPairs);
    const startIndex = (currentPage - 1) * 10;
    const pageEntries = entries.slice(startIndex, startIndex + 10);

    return pageEntries.map(([groupNumStr, items], index) => {
      const groupNum = Number(groupNumStr);
      const isGroup = groupNum > 0;
      return (
        <motion.div
          key={groupNum}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible hover:shadow-md transition-shadow duration-200 flex flex-col"
        >
          <div className="px-5 py-4 bg-blue-50 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-6 rounded-full ${isGroup ? "bg-blue-500" : "bg-slate-400"}`}
              ></div>
              <h3 className="font-bold text-slate-700">
                {isGroup ? `คู่ที่: ${(currentPage - 1) * 10 + index + 1}` : "ยังไม่ได้จัดกลุ่ม"}
              </h3>
            </div>
          </div>

          <div className="p-5 flex-grow">
            <table className="w-full text-left">
              <thead className="text-slate-500 uppercase bg-slate-50/50 rounded-lg">
                <tr>
                  <th className="px-2 py-2 font-semibold">ชื่อ-นามสกุล</th>
                  <th className="px-2 py-2 font-semibold">
                    เบอร์โทรศัพท์
                  </th>
                  <th className="px-2 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-2 py-3 font-medium text-slate-700">
                      {getTeacherName(item.teacher_id)}
                    </td>
                    <td className="px-2 py-3 text-slate-600 font-medium">
                      {getTeacherTel(item.teacher_id)}
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

          {isGroup && (
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex gap-4 items-center">
              <div className="flex-1">
                <SearchableDropdown
                    key={dropdownResetKeys[groupNum] || 0}
                    options={teachers.map(t => ({
                        id: t.id,
                        label: `${t.firstname} ${t.lastname}`,
                        subLabel: `เบอร์โทร: ${t.tel}`,
                        value: t.id
                    }))}
                    onSelect={(val) => setSelectedTeachersMap(prev => ({ ...prev, [groupNum]: val }))}
                    onClear={() => setSelectedTeachersMap(prev => ({ ...prev, [groupNum]: null }))}
                    placeholder="ค้นหาอาจารย์เพื่อเพิ่ม..."
                />
              </div>
              <button
                onClick={async () => {
                    const selectedId = selectedTeachersMap[groupNum];
                    if (selectedId) {
                        const exists = (groupedProctorPairs[groupNum] || []).some(p => p.teacher_id === selectedId);
                        if (exists) {
                            toast.error('อาจารย์ท่านนี้อยู่ในกลุ่มนี้แล้ว');
                            return;
                        }
                        await handleSaveProctorPair({ teacher_ids: [selectedId], groupNum });
                        // Reset
                        setSelectedTeachersMap(prev => ({ ...prev, [groupNum]: null }));
                        setDropdownResetKeys(prev => ({ ...prev, [groupNum]: (prev[groupNum] || 0) + 1 }));
                        toast.success('เพิ่มผู้คุมสอบเรียบร้อยแล้ว');
                    }
                }}
                disabled={!selectedTeachersMap[groupNum] || isSubmitting}
                className={`px-6 py-3 font-bold rounded-xl shadow-sm text-base transition-all ${
                    !selectedTeachersMap[groupNum] || isSubmitting
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                }`}
              >
                เพิ่ม
              </button>
            </div>
          )}
        </motion.div>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">จัดการคู่ผู้คุมสอบ</h1>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleDownloadTemplate}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 hover:text-blue-600 transition-all duration-200 group relative"
          >
            <FileDown size={20} className="mr-2" />
            ดาวน์โหลดแบบฟอร์ม
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              คลิกเพื่อโหลดไฟล์ต้นแบบ .xlsx สำหรับจับคู่
            </div>
          </button>
          <div className="relative flex-1 sm:flex-none">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full sm:w-auto flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all duration-200"
            >
              <Plus size={20} className="mr-2" />
              เพิ่มคู่ผู้คุมสอบ
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-10 overflow-hidden">
                <button
                  onClick={handleOpenAddModal}
                  className="flex items-center w-full px-4 py-3 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors font-medium"
                >
                  <Plus size={18} className="mr-3 text-slate-400" />
                  กรอกข้อมูล
                </button>
                <button
                  onClick={handleOpenUploadModal}
                  className="flex items-center w-full px-4 py-3 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors font-medium border-t border-slate-50"
                >
                  <FileUp size={18} className="mr-3 text-slate-400" />
                  นำเข้าไฟล์
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <SlideDownPanel
        isOpen={isAddPanelOpen}
        onClose={handleCloseAddPanel}
        title="เพิ่มคู่ผู้คุมสอบใหม่"
      >
        <ProctorPairForm
          onSubmit={handleSaveProctorPair}
          onCancel={handleCloseAddPanel}
          initialData={editingProctorPair}
          isSubmitting={isSubmitting}
          teachers={teachers}
        />
      </SlideDownPanel>

      <div className="mb-4">
        <input
          type="text"
          placeholder="ค้นหาคู่ผู้คุมสอบ (ชื่ออาจารย์)..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl shadow-sm border border-slate-200">
          กำลังโหลดข้อมูล...
        </div>
      ) : Object.keys(groupedProctorPairs).length > 0 ? (
        <div className="grid grid-cols-1 gap-6">{renderProctorGroups()}</div>
      ) : (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl shadow-sm border border-slate-200">
          ไม่มีข้อมูลคู่ผู้คุมสอบ
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseEditModal}
        title={
          editingProctorPair ? "แก้ไขคู่ผู้คุมสอบ" : "เพิ่มคู่ผู้คุมสอบใหม่"
        }
      >
        <ProctorPairForm
          onSubmit={handleSaveProctorPair}
          onCancel={handleCloseEditModal}
          initialData={editingProctorPair}
          isSubmitting={isSubmitting}
          teachers={teachers}
        />
      </Modal>

      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={handleCloseUploadModal}
        title="นำเข้าคู่ผู้คุมสอบจากไฟล์"
        onFileUpload={handleFileUpload}
        instruction="ระบุ 'รหัสอาจารย์' (Teacher ID) ในไฟล์ ระบบจะจับคู่อาจารย์ที่อยู่ในแถวเดียวกันหรือกลุ่มเดียวกันให้โดยอัตโนมัติ"
      />

      <ConfirmationDialog
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteConfirm}
        title="ลบคู่ผู้คุมสอบ"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบคู่ผู้คุมสอบนี้? การกระทำนี้ไม่สามารถยกเลิกได้`}
        isConfirming={isSubmittingDelete}
      />

      <datalist id="teacherOptions">
        {teachers.map((teacher) => (
          <option
            key={teacher.id}
            value={`${teacher.firstname} ${teacher.lastname}`}
          >
            {teacher.firstname} {teacher.lastname}
          </option>
        ))}
      </datalist>
    </motion.div>
  );
};

export default AdminProctorPairs;