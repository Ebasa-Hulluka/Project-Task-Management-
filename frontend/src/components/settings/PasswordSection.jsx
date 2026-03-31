import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { LuLock, LuSave } from "react-icons/lu";

import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { getErrorMessage } from "../../utils/helper";
import Input from "../Inputs/Input";

const PasswordSection = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error("All password fields are required");
      return;
    }
    if (formData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post(API_PATHS.AUTH.CHANGE_PASSWORD, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success("Password changed successfully");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (apiError) {
      const message = getErrorMessage(apiError);
      if (message.toLowerCase().includes("not found")) {
        toast.error("Password change endpoint is not available yet");
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="app-card rounded-xl p-5 space-y-5">
      <div>
        <h3 className="text-lg font-semibold app-text">Security</h3>
        <p className="text-sm app-text-muted mt-1">Change your account password.</p>
      </div>

      <div className="space-y-4">
        {[
          { key: "currentPassword", label: "Current Password" },
          { key: "newPassword", label: "New Password" },
          { key: "confirmPassword", label: "Confirm New Password" },
        ].map((field) => (
          <Input
            key={field.key}
            label={field.label}
            type="password"
            value={formData[field.key]}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
            }
            icon={LuLock}
            required
          />
        ))}
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Updating...
            </>
          ) : (
            <>
              <LuSave />
              Update Password
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default PasswordSection;
