import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import type { Room, RoomFormInputs } from '../../types/room';

interface RoomFormProps {
    onSubmit: SubmitHandler<RoomFormInputs>;
    onCancel: () => void;
    initialData?: Room | null;
    isSubmitting: boolean;
}

const RoomForm: React.FC<RoomFormProps> = ({ onSubmit, onCancel, initialData, isSubmitting }) => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<RoomFormInputs>({
        defaultValues: initialData || { roomNumber: '', building: '', floor: '', capacity: 30 }
    });

    useEffect(() => {
        reset(initialData || { roomNumber: '', building: '', floor: '', capacity: 30 });
    }, [initialData, reset]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="roomNumber" className="block text-sm font-bold text-slate-700 mb-2">หมายเลขห้อง</label>
                    <input
                        id="roomNumber"
                        {...register('roomNumber', { required: 'ต้องระบุหมายเลขห้อง' })}
                        className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        placeholder="เช่น 1201"
                    />
                    {errors.roomNumber && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.roomNumber.message}</p>}
                </div>

                <div>
                    <label htmlFor="building" className="block text-sm font-bold text-slate-700 mb-2">อาคาร</label>
                    <input
                        id="building"
                        {...register('building', { required: 'ต้องระบุอาคาร' })}
                        className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        placeholder="ชื่ออาคาร หรือหมายเลขอาคาร"
                    />
                    {errors.building && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.building.message}</p>}
                </div>

                <div>
                    <label htmlFor="floor" className="block text-sm font-bold text-slate-700 mb-2">ชั้น</label>
                    <input
                        id="floor"
                        {...register('floor', { required: 'ต้องระบุชั้น' })}
                        className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        placeholder="เช่น 2"
                    />
                    {errors.floor && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.floor.message}</p>}
                </div>

                <div>
                    <label htmlFor="capacity" className="block text-sm font-bold text-slate-700 mb-2">ความจุ</label>
                    <input
                        id="capacity"
                        type="number"
                        {...register('capacity', { required: 'ต้องระบุความจุ', valueAsNumber: true, min: { value: 1, message: 'ความจุต้องมีอย่างน้อย 1' } })}
                        className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
                        placeholder="30"
                    />
                    {errors.capacity && <p className="text-sm text-rose-500 mt-1 font-medium">{errors.capacity.message}</p>}
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

export default RoomForm;
