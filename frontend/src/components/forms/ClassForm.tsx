import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import type { Class, ClassFormInputs } from '../../types/class';
import type { Department } from '../../types/department';

interface ClassFormProps {
    onSubmit: SubmitHandler<ClassFormInputs>;
    onCancel: () => void;
    initialData?: Class | null;
    isSubmitting: boolean;
    departments: Department[];
}

const ClassForm: React.FC<ClassFormProps> = ({ onSubmit, onCancel, initialData, isSubmitting, departments }) => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<ClassFormInputs>({
        defaultValues: initialData || { name: '', level: 'ปวช.', classYear: '', department_id: 0, amount: 0 }
    });

    useEffect(() => {
        reset(initialData || { name: '', level: 'ปวช.', classYear: '', department_id: 0, amount: 0 });
    }, [initialData, reset]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">ชื่อชั้นเรียน</label>
                    <input
                        id="name"
                        {...register('name', { required: 'ต้องระบุชั้นเรียน' })}
                        className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        placeholder="เช่น ปวช.1/1"
                    />
                    {errors.name && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.name.message}</p>}
                </div>

                <div>
                    <label htmlFor="level" className="block text-sm font-bold text-slate-700 mb-2">ระดับชั้น</label>
                    <div className="relative">
                        <select
                            id="level"
                            {...register('level', { required: 'ต้องระบุระดับชั้น' })}
                            className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm appearance-none"
                        >
                            <option>ปวช.</option>
                            <option>ปวส.</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                        </div>
                    </div>
                    {errors.level && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.level.message}</p>}
                </div>

                <div>
                    <label htmlFor="classYear" className="block text-sm font-bold text-slate-700 mb-2">ชั้นปี</label>
                    <input
                        id="classYear"
                        {...register('classYear', { required: 'ต้องระบุชั้นปี' })}
                        className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        placeholder="เช่น 1"
                    />
                    {errors.classYear && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.classYear.message}</p>}
                </div>

                <div>
                    <label htmlFor="department_id" className="block text-sm font-bold text-slate-700 mb-2">สาขาวิชา</label>
                    <div className="relative">
                        <select
                            id="department_id"
                            {...register('department_id', { required: 'ต้องระบุสาขาวิชา', valueAsNumber: true })}
                            className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm appearance-none"
                        >
                            <option value={0} disabled>เลือกสาขาวิชา</option>
                            {departments.map(dep => (
                                <option key={dep.id} value={dep.id}>{dep.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                        </div>
                    </div>
                    {errors.department_id && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.department_id.message}</p>}
                </div>

                <div>
                    <label htmlFor="amount" className="block text-sm font-bold text-slate-700 mb-2">จำนวนผู้เข้าสอบ</label>
                    <input
                        id="amount"
                        type="number"
                        {...register('amount', { required: 'ต้องระบุจำนวนผู้เข้าสอบ', valueAsNumber: true, min: { value: 1, message: 'จำนวนต้องมีอย่างน้อย 1' } })}
                        className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        placeholder="0"
                    />
                    {errors.amount && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.amount.message}</p>}
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

export default ClassForm;
