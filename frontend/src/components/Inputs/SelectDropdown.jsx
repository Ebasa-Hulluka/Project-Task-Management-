import React, { useState, useRef, useEffect } from "react";
import { LuChevronDown, LuCheck, LuX } from "react-icons/lu";

const SelectDropdown = ({
  options = [],
  value,
  onChange,
  placeholder = "Select an option",
  label,
  error,
  disabled = false,
  required = false,
  searchable = false,
  clearable = false,
  multiple = false,
  maxHeight = "max-h-60",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;

    const calculateDirection = () => {
      const rect = dropdownRef.current.getBoundingClientRect();
      const estimatedMenuHeight = 260;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setOpenUpward(spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow);
    };

    calculateDirection();
    window.addEventListener("resize", calculateDirection);
    window.addEventListener("scroll", calculateDirection, true);

    return () => {
      window.removeEventListener("resize", calculateDirection);
      window.removeEventListener("scroll", calculateDirection, true);
    };
  }, [isOpen]);

  const selectedOptions = multiple
    ? options.filter((opt) => value?.includes(opt.value))
    : options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSelect = (optionValue) => {
    if (multiple) {
      const newValue = value?.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...(value || []), optionValue];
      onChange(newValue);
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(multiple ? [] : null);
  };

  const handleRemoveTag = (e, optionValue) => {
    e.stopPropagation();
    if (multiple) {
      onChange(value.filter((v) => v !== optionValue));
    }
  };

  const getDisplayValue = () => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return <span className="text-gray-400">{placeholder}</span>;
    }

    if (multiple) {
      return (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map((opt) => (
            <span
              key={opt.value}
              className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full flex items-center gap-1"
            >
              {opt.label}
              {!disabled && (
                <button
                  onClick={(e) => handleRemoveTag(e, opt.value)}
                  className="hover:text-red-500"
                >
                  <LuX className="text-xs" />
                </button>
              )}
            </span>
          ))}
        </div>
      );
    }

    return selectedOptions?.label || placeholder;
  };

  return (
    <div className="w-full" ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Dropdown Button */}
      <div
        className={`relative w-full bg-white border rounded-lg transition-all ${
          error
            ? "border-red-300"
            : isOpen
              ? "border-primary ring-1 ring-primary/20"
              : "border-gray-200 hover:border-gray-300"
        } ${disabled ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer"}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="min-h-[42px] px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex-1 text-sm text-gray-700">
            {getDisplayValue()}
          </div>

          <div className="flex items-center gap-1">
            {clearable && value && (multiple ? value.length > 0 : true) && (
              <button
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
              >
                <LuX className="text-sm" />
              </button>
            )}
            <LuChevronDown
              className={`text-gray-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {/* Dropdown Menu */}
        {isOpen && !disabled && (
          <div
            className={`absolute z-[80] w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden ${maxHeight} ${
              openUpward ? "bottom-full mb-1" : "top-full mt-1"
            }`}
          >
            {/* Search Input */}
            {searchable && (
              <div className="p-2 border-b border-gray-100">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:border-primary focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Options */}
            <div className="overflow-y-auto max-h-48">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const isSelected = multiple
                    ? value?.includes(option.value)
                    : value === option.value;

                  return (
                    <div
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <span className="text-sm">{option.label}</span>
                      {isSelected && (
                        <LuCheck className="text-primary text-sm" />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center text-sm text-gray-400">
                  No options found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default SelectDropdown;
