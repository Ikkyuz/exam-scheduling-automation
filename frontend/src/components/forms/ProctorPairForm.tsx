import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import type { ProctorPair } from '../../types/proctorPair';
import type { Teacher } from '../../types/teacher';
import { Check, Search } from 'lucide-react';

// Extend FormInputs to handle array of IDs for multi-select
interface ExtendedProctorPairFormInputs {
    teacher_ids: number[];
}

interface ProctorPairFormProps {
    onSubmit: (data: ExtendedProctorPairFormInputs) => void;
    onCancel: () => void;
    initialData?: ProctorPair | null;
    isSubmitting: boolean;
    teachers: Teacher[];
}

const ProctorPairForm: React.FC<ProctorPairFormProps> = ({ onSubmit, onCancel, initialData, isSubmitting, teachers }) => {
    const { handleSubmit, setValue, watch, formState: { errors } } = useForm<ExtendedProctorPairFormInputs>({
        defaultValues: { teacher_ids: initialData ? [initialData.teacher_id] : [] }
    });

    const selectedIds = watch('teacher_ids');
    const [searchTerm, setSearchQuery] = useState('');

    useEffect(() => {
        if (initialData) {
            setValue('teacher_ids', [initialData.teacher_id]);
        } else {
            setValue('teacher_ids', []);
        }
    }, [initialData, setValue]);

    const handleToggleTeacher = (teacherId: number) => {
        const currentIds = selectedIds || [];
        if (currentIds.includes(teacherId)) {
            setValue('teacher_ids', currentIds.filter(id => id !== teacherId));
        } else {
            setValue('teacher_ids', [...currentIds, teacherId]);
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredTeachers.length) {
            setValue('teacher_ids', []);
        } else {
            setValue('teacher_ids', filteredTeachers.map(t => t.id));
        }
    };

    const filteredTeachers = teachers.filter(t => 
        (t.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         t.lastname?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const onFormSubmit: SubmitHandler<ExtendedProctorPairFormInputs> = (data) => {
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-slate-800">เลือกผู้คุมสอบ</label>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        เลือกแล้ว {selectedIds?.length || 0} คน
                    </span>
                </div>

                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="ค้นหาชื่ออาจารย์..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center">
                        <label className="inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                checked={filteredTeachers.length > 0 && selectedIds?.length === filteredTeachers.length}
                                onChange={handleSelectAll}
                            />
                            <span className="ml-2 text-sm text-slate-600 font-medium">เลือกทั้งหมด ({filteredTeachers.length})</span>
                        </label>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2 space-y-1 bg-white">
                        {filteredTeachers.length > 0 ? (
                            filteredTeachers.map(teacher => (
                                <label 
                                    key={teacher.id} 
                                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
                                        selectedIds?.includes(teacher.id) 
                                            ? 'bg-indigo-50 border border-indigo-100' 
                                            : 'hover:bg-slate-50 border border-transparent'
                                    }`}
                                >
                                    <div className="flex items-center overflow-hidden">
                                        <div className={`
                                            flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors mr-3
                                            ${selectedIds?.includes(teacher.id) 
                                                ? 'bg-indigo-600 border-indigo-600' 
                                                : 'border-slate-300 group-hover:border-indigo-400 bg-white'}
                                        `}>
                                            {selectedIds?.includes(teacher.id) && <Check size={12} className="text-white" strokeWidth={3} />}
                                        </div>
                                        <div className="truncate">
                                            <div className="text-sm font-bold text-slate-800">{teacher.firstname} {teacher.lastname}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-semibold text-slate-400 bg-white px-2 py-1 rounded border border-slate-100 group-hover:border-slate-200">
                                        {teacher.tel}
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="hidden"
                                        checked={selectedIds?.includes(teacher.id)}
                                        onChange={() => handleToggleTeacher(teacher.id)}
                                    />
                                </label>
                            ))
                        ) : (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                ไม่พบรายชื่ออาจารย์
                            </div>
                        )}
                    </div>
                </div>
                {errors.teacher_ids && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.teacher_ids.message}</p>}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 transition-all duration-200"
                >
                    ยกเลิก
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || selectedIds?.length === 0}
                    className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all duration-200 shadow-sm
                        ${(selectedIds?.length === 0 || isSubmitting) 
                            ? 'bg-blue-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5'
                        }
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                    {isSubmitting ? (
                        <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            กำลังบันทึก...
                        </div>
                    ) : `บันทึก (${selectedIds?.length}) รายการ`}
                </button>
            </div>
        </form>
    );
};

export default ProctorPairForm;
