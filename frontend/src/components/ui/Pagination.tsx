import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    const [inputPage, setInputPage] = useState(currentPage.toString());

    useEffect(() => {
        setInputPage(currentPage.toString());
    }, [currentPage]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow only numbers
        const value = e.target.value.replace(/[^0-9]/g, '');
        setInputPage(value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleGoToPage();
            (e.target as HTMLInputElement).blur(); // Remove focus
        }
    };

    const handleGoToPage = () => {
        let page = parseInt(inputPage, 10);
        if (isNaN(page) || page < 1) {
            page = 1;
        } else if (page > totalPages) {
            page = totalPages;
        }
        
        onPageChange(page);
        setInputPage(page.toString());
    };

    const handleBlur = () => {
        handleGoToPage();
    }

    if (totalPages <= 1) return null;

    return (
        <>
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full px-2 py-2 border border-slate-200 z-50 flex items-center gap-3">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2.5 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-700 bg-white border border-slate-100 shadow-sm"
                    title="หน้าก่อนหน้า"
                >
                    <ChevronLeft size={20} strokeWidth={2.5} />
                </button>

                <div className="flex items-center gap-2 px-2">
                    <span className="text-sm font-bold text-slate-600">หน้า</span>
                    <input
                        type="text"
                        value={inputPage}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        className="w-12 text-center font-bold text-slate-800 border-2 border-slate-200 rounded-lg px-1 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-slate-50 transition-all"
                    />
                    <span className="text-sm font-bold text-slate-500">จาก {totalPages}</span>
                </div>

                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2.5 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-700 bg-white border border-slate-100 shadow-sm"
                    title="หน้าถัดไป"
                >
                    <ChevronRight size={20} strokeWidth={2.5} />
                </button>
            </div>
            {/* Spacer to prevent content from being hidden behind pagination */}
            <div className="h-24"></div> 
        </>
    );
};

export default Pagination;
