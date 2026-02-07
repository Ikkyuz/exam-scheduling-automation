import React, { useEffect, useState } from "react";
import type { CourseGroup } from "../../types/courseGroup";
import type { Course } from "../../types/course";
import Modal from "../../components/ui/Modal";
import CourseGroupForm from "../../components/forms/CourseGroupForm";
import ConfirmationDialog from "../../components/ui/ConfirmationDialog";
import { Plus, Trash2, FileUp, FileDown } from "lucide-react"; 
import { motion } from "framer-motion";
import api from "../../services/api";
import FileUploadModal from "../../components/ui/FileUploadModal"; 
import SlideDownPanel from "../../components/ui/SlideDownPanel"; 
import Pagination from '../../components/ui/Pagination';
import { toast } from "react-hot-toast";
import axios from "axios";
import SearchableDropdown from "../../components/ui/SearchableDropdown";

interface CourseGroupFormData {
  course_ids: number[];
}

const AdminCourseGroups: React.FC = () => {
  // Removed unused courseGroups state
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isAddPanelOpen, setIsAddPanelOpen] = useState<boolean>(false);
  const [editingCourseGroup, setEditingCourseGroup] =
    useState<CourseGroup | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deletingCourseGroup, setDeletingCourseGroup] =
    useState<CourseGroup | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false); // New state for dropdown
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  // State to track selected course for each group (for the "Add" button confirmation flow)
  const [selectedCoursesMap, setSelectedCoursesMap] = useState<Record<number, number | null>>({});
  // State to force re-render/reset SearchableDropdown after successful add
  const [dropdownResetKeys, setDropdownResetKeys] = useState<Record<number, number>>({});

  const [groupedCourseGroups, setGroupedCourseGroups] = useState<
    Record<number, CourseGroup[]>
  >({});

  const fetchCourseGroups = async (search = "") => {
    setLoading(true);
    try {
      const response = await api.get("/courseGroups", {
        params: { search, itemsPerPage: -1 }, // Fetch all to group properly on client side
      });

      const allGroups: CourseGroup[] = response.data.data || [];

      // Group by groupNum
      const groups: Record<number, CourseGroup[]> = {};
      allGroups.forEach((cg) => {
        const gNum = cg.groupNum || cg.id; // Fallback to ID if groupNum is 0/undefined
        if (!groups[gNum]) {
          groups[gNum] = [];
        }
        groups[gNum].push(cg);
      });

      setGroupedCourseGroups(groups);
      setTotalPages(Math.ceil(Object.keys(groups).length / 10) || 1);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setGroupedCourseGroups({});
        setTotalPages(1);
      } else {
        console.error("ไม่สามารถดึงข้อมูลกลุ่มรายวิชาได้", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get("/courses", {
        params: { itemsPerPage: -1 },
      });
      setCourses(response.data.data);
    } catch (err: unknown) {
      console.error("ไม่สามารถดึงข้อมูลรายวิชาได้", err);
    }
  };

  useEffect(() => {
    fetchCourseGroups(searchQuery);
    fetchCourses();
  }, [currentPage, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingCourseGroup(null);
    setIsAddPanelOpen(true);
    setIsDropdownOpen(false);
  };

  const handleCloseModal = () => {
    setIsAddPanelOpen(false);
    setIsModalOpen(false);
    setEditingCourseGroup(null);
  };

  const handleSaveCourseGroup = async (
    data: CourseGroupFormData & { groupNum?: number },
  ) => {
    setIsSubmitting(true);
    try {
      if (
        data.course_ids &&
        Array.isArray(data.course_ids) &&
        data.course_ids.length > 0
      ) {
        const payload = data.course_ids.map((id: number) => ({
          course_id: id,
          groupNum: data.groupNum, // Pass groupNum if adding to existing group
        }));

        await api.post("/courseGroups", payload);
      }
      fetchCourseGroups(searchQuery);
      handleCloseModal();
    } catch (error: unknown) {
      console.error("ไม่สามารถบันทึกกลุ่มรายวิชาได้", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to render groups
  const renderGroups = () => {
    const entries = Object.entries(groupedCourseGroups);
    const startIndex = (currentPage - 1) * 10;
    const pageEntries = entries.slice(startIndex, startIndex + 10);

    return pageEntries.map(([groupNum, items]) => (
      <motion.div
        key={groupNum}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible hover:shadow-md transition-shadow duration-200 flex flex-col"
      >
        <div className="px-5 py-4 bg-blue-50 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
            <h3 className="font-bold text-slate-700">กลุ่มที่: {groupNum}</h3>
          </div>
        </div>

        <div className="p-5 flex-grow">
          <table className="w-full text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 rounded-lg">
              <tr>
                <th className="px-2 py-2 font-semibold">รหัสวิชา</th>
                <th className="px-2 py-2 font-semibold">ชื่อวิชา</th>
                <th className="px-2 py-2 font-semibold">เวลาสอบ (นาที)</th>
                <th className="px-2 py-2 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-2 py-3 font-medium text-slate-700">
                    {getCourseCode(item.course_id)}
                  </td>
                  <td
                    className="px-2 py-3 text-slate-600 truncate max-w-[150px]"
                    title={getCourseName(item.course_id)}
                  >
                    {getCourseName(item.course_id)}
                  </td>
                  <td className="px-2 py-3 text-slate-600">
                    {getCourseDuration(item.course_id)}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <button
                      onClick={() => handleOpenDeleteModal(item)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                      title="ลบออกจากกลุ่ม"
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
                key={dropdownResetKeys[Number(groupNum)] || 0}
                options={courses.map(c => ({
                    id: c.id,
                    label: `${c.code} - ${c.name}`,
                    subLabel: c.name,
                    value: c.id
                }))}
                onSelect={(val) => setSelectedCoursesMap(prev => ({ ...prev, [Number(groupNum)]: val }))}
                onClear={() => setSelectedCoursesMap(prev => ({ ...prev, [Number(groupNum)]: null }))}
                placeholder="ค้นหารายวิชาเพื่อเพิ่ม..."
             />
          </div>
          <button
            onClick={async () => {
                const selectedId = selectedCoursesMap[Number(groupNum)];
                if (selectedId) {
                    await handleSaveCourseGroup({ course_ids: [selectedId], groupNum: Number(groupNum) });
                    // Reset selection and dropdown
                    setSelectedCoursesMap(prev => ({ ...prev, [Number(groupNum)]: null }));
                    setDropdownResetKeys(prev => ({ ...prev, [Number(groupNum)]: (prev[Number(groupNum)] || 0) + 1 }));
                    toast.success('เพิ่มรายวิชาเรียบร้อยแล้ว');
                }
            }}
            disabled={!selectedCoursesMap[Number(groupNum)] || isSubmitting}
            className={`px-6 py-3 font-bold rounded-xl shadow-sm text-base transition-all ${
                !selectedCoursesMap[Number(groupNum)] || isSubmitting
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
            }`}
          >
            เพิ่ม
          </button>
        </div>
      </motion.div>
    ));
  };

  const handleOpenDeleteModal = (courseGroup: CourseGroup) => {
    setDeletingCourseGroup(courseGroup);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingCourseGroup(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCourseGroup) return;
    setIsSubmittingDelete(true);
    try {
      await api.delete(`/courseGroups/${deletingCourseGroup.id}`);
      fetchCourseGroups(searchQuery);
      handleCloseDeleteModal();
    } catch (error: unknown) {
      console.error("ไม่สามารถลบกลุ่มรายวิชาได้", error);
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
    fetchCourseGroups(searchQuery);
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post("/courseGroups/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("File uploaded successfully");
      toast.success("นำเข้าข้อมูลสำเร็จ");
      handleCloseUploadModal();
    } catch (error: unknown) {
      console.error("ไม่สามารถอัปโหลดไฟล์ได้", error);
      toast.error("ไม่สามารถนำเข้าข้อมูลได้");
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get("/courseGroups/template", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "course_group_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("ดาวน์โหลดแบบฟอร์มสำเร็จ");
    } catch (error) {
      console.error("ไม่สามารถดาวน์โหลดแบบฟอร์มได้", error);
      toast.error("ไม่สามารถดาวน์โหลดแบบฟอร์มได้");
    }
  };

  const getCourseDuration = (courseId: number) => {
    return courses.find((c) => c.id === courseId)?.duration || "ไม่มีข้อมูล";
  };

  const getCourseCode = (courseId: number) => {
    return courses.find((c) => c.id === courseId)?.code || "ไม่มีข้อมูล";
  };

  const getCourseName = (courseId: number) => {
    return courses.find((c) => c.id === courseId)?.name || "ไม่พบรายวิชา";
  };

      return (
          <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
          >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">จัดการกลุ่มรายวิชา</h1>
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                      <button
                          onClick={handleDownloadTemplate}
                          className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 hover:text-blue-600 transition-all duration-200 group"
                      >
                          <FileDown size={20} className="mr-2" />
                          <span>ดาวน์โหลดแบบฟอร์ม</span>
                          {/* Tooltip for download instruction */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                              คลิกเพื่อโหลดไฟล์ต้นแบบ .xlsx
                          </div>
                      </button>
                      <div className="relative flex-1 sm:flex-none">
                          <button
                              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                              className="w-full sm:w-auto flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all duration-200"
                          >
                              <Plus size={20} className="mr-2" />
                              เพิ่มกลุ่มรายวิชา
                          </button>            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-10 overflow-hidden">
                <button
                  onClick={() => handleOpenAddModal()}
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

      {/* SlideDownPanel for ADDING new course group */}
      <SlideDownPanel
        isOpen={isAddPanelOpen}
        onClose={handleCloseModal}
        title="เพิ่มกลุ่มรายวิชาใหม่"
      >
        <CourseGroupForm
          onSubmit={handleSaveCourseGroup}
          onCancel={handleCloseModal}
          initialData={editingCourseGroup}
          isSubmitting={isSubmitting}
          courses={courses}
        />
      </SlideDownPanel>

      <div className="mb-6">
        <input
          type="text"
          placeholder="ค้นหากลุ่มรายวิชา (รหัสวิชา, ชื่อวิชา)..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl shadow-sm border border-slate-200">
          กำลังโหลดข้อมูล...
        </div>
      ) : Object.keys(groupedCourseGroups).length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {renderGroups()}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl shadow-sm border border-slate-200">
          ไม่มีข้อมูลกลุ่มรายวิชา
        </div>
      )}

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modal for EDITING existing course group */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="แก้ไขกลุ่มรายวิชา"
      >
        <CourseGroupForm
          onSubmit={handleSaveCourseGroup}
          onCancel={handleCloseModal}
          initialData={editingCourseGroup}
          isSubmitting={isSubmitting}
          courses={courses}
        />
      </Modal>

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={handleCloseUploadModal}
        title="นำเข้ากลุ่มรายวิชาจากไฟล์"
        onFileUpload={handleFileUpload}
        instruction="กรุณาใช้ไฟล์ .xlsx ที่ได้จากการดาวน์โหลดแบบฟอร์ม โดยระบุ 'รหัสวิชา' หรือ 'ชื่อวิชา' ให้ถูกต้องเพื่อจับคู่เข้ากลุ่ม"
      />

      <ConfirmationDialog
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteConfirm}
        title="ลบกลุ่มรายวิชา"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบกลุ่มรายวิชานี้? การกระทำนี้ไม่สามารถยกเลิกได้`}
        isConfirming={isSubmittingDelete}
      />
    </motion.div>
  );
};

export default AdminCourseGroups;
