import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface SlideDownPanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const SlideDownPanel: React.FC<SlideDownPanelProps> = ({ isOpen, onClose, title, children }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="relative bg-white rounded-xl shadow-lg border border-gray-100 p-4 md:p-6 mb-6 overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SlideDownPanel;
