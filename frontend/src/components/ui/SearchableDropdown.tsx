import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X, Search } from 'lucide-react';

interface Option<T> {
  id: number | string;
  label: string;
  subLabel?: string;
  value: T;
}

interface SearchableDropdownProps<T> {
  options: Option<T>[];
  onSelect: (value: T) => void;
  onClear?: () => void;
  placeholder?: string;
  label?: string; // For accessibility/UI
  className?: string;
}

const SearchableDropdown = <T,>({
  options,
  onSelect,
  onClear,
  placeholder = "เลือกข้อมูล...",
  className = "",
}: SearchableDropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOption, setSelectedOption] = useState<Option<T> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.subLabel && option.subLabel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (option: Option<T>) => {
    setSelectedOption(option);
    onSelect(option.value);
    setIsOpen(false);
    setSearchTerm(""); 
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOption(null);
    setSearchTerm("");
    if (onClear) onClear();
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div
        className="relative w-full border border-slate-300 rounded-xl bg-white cursor-pointer shadow-sm hover:border-blue-400 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center px-4 py-3 min-h-[50px]">
          {/* Search Input embedded in the trigger area */}
          <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            className="w-full bg-transparent outline-none text-lg text-slate-700 placeholder:text-slate-400 cursor-pointer"
            placeholder={selectedOption ? selectedOption.label : placeholder}
            value={isOpen ? searchTerm : (selectedOption ? selectedOption.label : "")}
            onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!isOpen) setIsOpen(true);
            }}
          />
          
          <div className="flex items-center ml-2">
            {selectedOption && (
                <button 
                    onClick={handleClear}
                    className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 mr-1 transition-colors"
                >
                    <X size={20} />
                </button>
            )}
            <ChevronDown size={20} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[300px] overflow-y-auto">
          {filteredOptions.length > 0 ? (
            <ul className="py-2">
              {filteredOptions.map((option) => (
                <li
                  key={option.id}
                  onClick={() => handleSelect(option)}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex flex-col border-b border-slate-50 last:border-0"
                >
                  <span className="text-lg font-medium text-slate-700">{option.label}</span>
                  {/* {option.subLabel && (
                    <span className="text-sm text-slate-500 mt-0.5">{option.subLabel}</span>
                  )} */}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-slate-500 text-lg">
              ไม่พบข้อมูล
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
