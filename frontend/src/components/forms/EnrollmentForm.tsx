import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import type { Enrollment } from '../../types/enrollment';
import type { Class } from '../../types/class';
import type { Course } from '../../types/course';
import { Check, Search } from 'lucide-react';

interface ExtendedEnrollmentFormInputs {
    class_id: number;
    course_ids: number[];
}

interface EnrollmentFormProps {
    onSubmit: (data: ExtendedEnrollmentFormInputs) => void;
    onCancel: () => void;
    initialData?: Enrollment | null;
    isSubmitting: boolean;
    classes: Class[];
    courses: Course[];
}

const EnrollmentForm: React.FC<EnrollmentFormProps> = ({ onSubmit, onCancel, initialData, isSubmitting, classes, courses }) => {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ExtendedEnrollmentFormInputs>({
        defaultValues: {
            class_id: initialData?.class_id || 0,
            course_ids: initialData ? [initialData.course_id] : []
        }
    });

    const selectedIds = watch('course_ids');
    const [searchTerm, setSearchQuery] = useState('');

    useEffect(() => {
        if (initialData) {
            setValue('class_id', initialData.class_id);
            setValue('course_ids', [initialData.course_id]);
        } else {
            setValue('class_id', 0);
            setValue('course_ids', []);
        }
    }, [initialData, setValue]);

    const handleToggleCourse = (courseId: number) => {
        const currentIds = selectedIds || [];
        if (currentIds.includes(courseId)) {
            setValue('course_ids', currentIds.filter(id => id !== courseId));
        } else {
            setValue('course_ids', [...currentIds, courseId]);
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredCourses.length) {
            setValue('course_ids', []);
        } else {
            setValue('course_ids', filteredCourses.map(c => c.id));
        }
    };

    const filteredCourses = courses.filter(c => 
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const onFormSubmit: SubmitHandler<ExtendedEnrollmentFormInputs> = (data) => {
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            <div>
                <label htmlFor="class_id" className="block text-sm font-bold text-slate-700 mb-2">ชื่อชั้นเรียน</label>
                <div className="relative">
                    <select
                        id="class_id"
                        {...register('class_id', { required: 'ต้องระบุชื่อชั้นเรียน', valueAsNumber: true })}
                        className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm appearance-none"
                    >
                        <option value={0} disabled>เลือกชั้นเรียน</option>
                        {classes.map(klass => (
                            <option key={klass.id} value={klass.id}>{klass.name}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                    </div>
                </div>
                {errors.class_id && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.class_id.message}</p>}
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-slate-800">เลือกรายวิชา</label>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        เลือกแล้ว {selectedIds?.length || 0} วิชา
                    </span>
                </div>

                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="ค้นหารหัส หรือชื่อวิชา..."
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
                                checked={filteredCourses.length > 0 && selectedIds?.length === filteredCourses.length}
                                onChange={handleSelectAll}
                            />
                            <span className="ml-2 text-sm text-slate-600 font-medium">เลือกทั้งหมด ({filteredCourses.length})</span>
                        </label>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2 space-y-1 bg-white">
                        {filteredCourses.length > 0 ? (
                            filteredCourses.map(course => (
                                <label 
                                    key={course.id} 
                                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
                                        selectedIds?.includes(course.id) 
                                            ? 'bg-indigo-50 border border-indigo-100' 
                                            : 'hover:bg-slate-50 border border-transparent'
                                    }`}
                                >
                                    <div className="flex items-center overflow-hidden">
                                        <div className={`
                                            flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors mr-3
                                            ${selectedIds?.includes(course.id) 
                                                ? 'bg-indigo-600 border-indigo-600' 
                                                : 'border-slate-300 group-hover:border-indigo-400 bg-white'}
                                        `}>
                                            {selectedIds?.includes(course.id) && <Check size={12} className="text-white" strokeWidth={3} />}
                                        </div>
                                        <div className="truncate">
                                            <div className="text-sm font-bold text-slate-800">{course.code}</div>
                                            <div className="text-xs text-slate-500 truncate">{course.name}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-semibold text-slate-400 bg-white px-2 py-1 rounded border border-slate-100 group-hover:border-slate-200">
                                        {course.duration} นาที
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="hidden"
                                        checked={selectedIds?.includes(course.id)}
                                        onChange={() => handleToggleCourse(course.id)}
                                    />
                                </label>
                            ))
                        ) : (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                ไม่พบรายวิชา
                            </div>
                        )}
                    </div>
                </div>
                {errors.course_ids && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.course_ids.message}</p>}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200"
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
                    ) : 'บันทึกข้อมูล'}
                </button>
            </div>
        </form>
    );
};

export default EnrollmentForm;
