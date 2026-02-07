import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import type { Department, DepartmentFormInputs } from '../../types/department';

interface DepartmentFormProps {
    onSubmit: SubmitHandler<DepartmentFormInputs>;
    onCancel: () => void;
    initialData?: Department | null;
    isSubmitting: boolean;
}

const DepartmentForm: React.FC<DepartmentFormProps> = ({ onSubmit, onCancel, initialData, isSubmitting }) => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<DepartmentFormInputs>({
        defaultValues: initialData || { name: '' }
    });

    useEffect(() => {
        reset(initialData || { name: '' });
    }, [initialData, reset]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
                <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">ชื่อสาขาวิชา</label>
                <input
                    id="name"
                    {...register('name', { required: 'ต้องระบุชื่อสาขาวิชา' })}
                    className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                    placeholder="เช่น คอมพิวเตอร์ธุรกิจ"
                />
                {errors.name && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.name.message}</p>}
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

export default DepartmentForm;
