import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";
import { LuCheck, LuX } from "react-icons/lu";

const Input = ({
  value,
  onChange,
  label,
  placeholder,
  type = "text",
  name,
  list,
  error,
  success,
  disabled = false,
  required = false,
  icon: Icon,
  onBlur,
  maxLength,
  minLength,
  pattern,
  autoComplete = "off",
  className = "",
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const getInputType = () => {
    if (type === "password") {
      return showPassword ? "text" : "password";
    }
    return type;
  };

  const handleFocus = () => setFocused(true);
  const handleBlur = (e) => {
    setFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-semibold app-text">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {maxLength && value && (
            <span className="text-xs app-text-muted">
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      )}

      {/* Input Container */}
      <div
        className={`relative flex items-center rounded-lg transition-all app-surface app-border ${
          error
            ? "border-red-400/70"
            : success
              ? "border-green-400/70"
              : focused
                ? "border-primary ring-1 ring-primary/20"
                : "hover:bg-[var(--app-surface-hover)]"
        } ${disabled ? "opacity-70 cursor-not-allowed" : ""} ${className}`}
      >
        {/* Left Icon */}
        {Icon && (
          <div className="pl-3 app-text-muted">
            <Icon className="text-lg" />
          </div>
        )}

        {/* Input */}
        <input
          type={getInputType()}
          name={name}
          list={list}
          value={value || ""}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          autoComplete={autoComplete}
          className={`w-full bg-transparent outline-none text-sm app-text placeholder:text-[var(--app-text-muted)] ${
            Icon ? "pl-2" : "pl-3"
          } ${type === "password" ? "pr-10" : "pr-3"} py-2.5 ${
            disabled ? "cursor-not-allowed app-text-muted" : ""
          }`}
        />

        {/* Password Toggle */}
        {type === "password" && (
          <button
            type="button"
            onClick={toggleShowPassword}
            className="absolute right-3 app-text-muted hover:text-primary transition-colors"
            tabIndex="-1"
          >
            {showPassword ? (
              <FaRegEyeSlash size={18} />
            ) : (
              <FaRegEye size={18} />
            )}
          </button>
        )}

        {/* Success/Error Icons */}
        {!type.includes("password") && (
          <div className="absolute right-3">
            {success && <LuCheck className="text-green-500 text-lg" />}
            {error && <LuX className="text-red-500 text-lg" />}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && typeof error === "string" && (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      )}

      {/* Success Message */}
      {success && typeof success === "string" && (
        <p className="mt-1.5 text-xs text-green-500">{success}</p>
      )}

    </div>
  );
};

export default Input;
