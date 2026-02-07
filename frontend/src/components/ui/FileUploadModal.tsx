import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import type { FileRejection, FileError } from 'react-dropzone';
import { FileUp, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './Modal';

interface FileUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    onFileUpload: (file: File) => Promise<void>;
    accept?: string; // e.g., ".xlsx"
    maxSize?: number; // in bytes, default to 5MB
    instruction?: string; // Optional instruction prop
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
    isOpen,
    onClose,
    title,
    onFileUpload,
    accept = ".xlsx",
    maxSize = 5 * 1024 * 1024, // 5MB
    instruction = "กรุณาใช้ไฟล์ตามรูปแบบที่กำหนดเท่านั้น ตรวจสอบความถูกต้องของข้อมูลก่อนอัปโหลด",
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
        if (fileRejections.length > 0) {
            fileRejections.forEach(({ file, errors }) => {
                errors.forEach((err: FileError) => {
                    if (err.code === 'file-too-large') {
                        toast.error(`ไฟล์ "${file.name}" มีขนาดใหญ่เกินไป (สูงสุด ${maxSize / (1024 * 1024)}MB)`, { id: `file-too-large-${file.name}` });
                    } else if (err.code === 'file-invalid-type') {
                        toast.error(`ไฟล์ "${file.name}" ไม่ใช่ประเภทที่อนุญาต (${accept})`, { id: `file-invalid-type-${file.name}` });
                    } else {
                        toast.error(`เกิดข้อผิดพลาดกับไฟล์ "${file.name}": ${err.message}`, { id: `file-error-${file.name}` });
                    }
                });
            });
            return;
        }

        if (acceptedFiles.length > 0) {
            setSelectedFile(acceptedFiles[0]);
            toast.success(`เลือกไฟล์ "${acceptedFiles[0].name}" แล้ว`, { id: 'file-selected' });
        }
    }, [accept, maxSize]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: accept.split(',').reduce((acc, type) => {
            if (type.trim() === '.xlsx') acc['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] = [];
            return acc;
        }, {} as Record<string, string[]>),
        maxSize: maxSize,
        multiple: false,
    });

    const handleUploadClick = async () => {
        if (!selectedFile) {
            toast.error('กรุณาเลือกไฟล์ก่อนอัปโหลด', { id: 'upload-no-file-selected' });
            return;
        }
        setIsUploading(true);
        try {
            await onFileUpload(selectedFile);
            toast.success('อัปโหลดไฟล์สำเร็จ!', { id: 'upload-success' });
            setSelectedFile(null);
            onClose();
        } catch (error) {
            toast.error('อัปโหลดไฟล์ไม่สำเร็จ', { id: 'upload-error' });
            console.error('File upload error:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setIsUploading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={title}>
            <div className="p-4 space-y-6">
                <div
                    {...getRootProps()}
                    className={`
                        flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer
                        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}
                        transition-all duration-200
                    `}
                >
                    <input {...getInputProps()} />
                    <FileUp className="w-12 h-12 text-gray-400 mb-3" />
                    {isDragActive ? (
                        <p className="text-gray-600 font-medium">วางไฟล์ที่นี่...</p>
                    ) : (
                        <p className="text-gray-600 text-center">
                            ลากและวางไฟล์ที่นี่, หรือ <span className="font-semibold text-blue-600">คลิกเพื่อเลือกไฟล์</span>
                        </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                        รองรับ: {accept.split(',').join(', ')} | สูงสุด: {maxSize / (1024 * 1024)}MB
                    </p>
                </div>

                {/* Instruction Box */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start space-x-3">
                    <div className="flex-shrink-0 text-blue-500 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    </div>
                    <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">คำแนะนำ:</p>
                        <p className="leading-relaxed opacity-90">{instruction}</p>
                    </div>
                </div>

                {selectedFile && (
                    <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-md shadow-sm border border-indigo-200">
                        <div className="flex items-center">
                            <FileText className="w-5 h-5 text-indigo-600 mr-2" />
                            <span className="text-sm font-medium text-indigo-800 break-all">{selectedFile.name}</span>
                        </div>
                        <button
                            onClick={() => setSelectedFile(null)}
                            className="p-1 rounded-full hover:bg-indigo-100 text-indigo-500 hover:text-indigo-700 transition-colors"
                            aria-label="Remove file"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isUploading}
                        className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={handleUploadClick}
                        disabled={!selectedFile || isUploading}
                        className="inline-flex items-center px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {isUploading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                กำลังอัปโหลด...
                            </>
                        ) : (
                            'อัปโหลด'
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default FileUploadModal;