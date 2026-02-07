import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import type { Course, CourseFormInputs } from '../../types/course';

interface CourseFormProps {
    onSubmit: SubmitHandler<CourseFormInputs>;
    onCancel: () => void;
    initialData?: Course | null;
    isSubmitting: boolean;
}

const CourseForm: React.FC<CourseFormProps> = ({ onSubmit, onCancel, initialData, isSubmitting }) => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<CourseFormInputs>({
        defaultValues: initialData || { code: '', name: '', duration: 60, examType: 'ในตาราง' }
    });

    useEffect(() => {
        reset(initialData || { code: '', name: '', duration: 60, examType: 'ในตาราง' });
    }, [initialData, reset]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="code" className="block text-sm font-bold text-slate-700 mb-2">รหัสวิชา</label>
                    <input
                        id="code"
                        {...register('code', { required: 'ต้องระบุรหัสวิชา' })}
                        className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        placeholder="เช่น 20000-1101"
                    />
                    {errors.code && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.code.message}</p>}
                </div>

                <div>
                    <label htmlFor="duration" className="block text-sm font-bold text-slate-700 mb-2">เวลาสอบ (นาที)</label>
                    <input
                        id="duration"
                        type="number"
                        {...register('duration', { required: 'ต้องระบุเวลาสอบ', valueAsNumber: true, min: { value: 30, message: 'ระยะเวลาต้องมีอย่างน้อย 30 นาที' } })}
                        className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        placeholder="60"
                    />
                    {errors.duration && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.duration.message}</p>}
                </div>

                <div className="md:col-span-2">
                    <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">ชื่อวิชา</label>
                    <input
                        id="name"
                        {...register('name', { required: 'ต้องระบุชื่อวิชา' })}
                        className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        placeholder="ชื่อวิชาภาษาไทย หรือภาษาอังกฤษ"
                    />
                    {errors.name && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.name.message}</p>}
                </div>

                <div className="md:col-span-2">
                    <label htmlFor="examType" className="block text-sm font-bold text-slate-700 mb-2">ประเภทการสอบ</label>
                    <div className="relative">
                        <select
                            id="examType"
                            {...register('examType', { required: 'ต้องระบุประเภทการสอบ' })}
                            className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm appearance-none"
                        >
                            <option value="ในตาราง">ในตาราง</option>
                            <option value="นอกตาราง">นอกตาราง</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                        </div>
                    </div>
                    {errors.examType && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.examType.message}</p>}
                </div>
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
                    disabled={isSubmitting}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5"
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

export default CourseForm;
