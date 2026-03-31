import React, { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { LuLock, LuSave } from "react-icons/lu";

import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { getErrorMessage, validatePassword } from "../../utils/helper";
import Input from "../Inputs/Input";

const getStrength = (password) => {
  let score = 0;
  if (password.length >= 6) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "w-1/4" };
  if (score <= 2) return { label: "Fair", color: "bg-orange-500", width: "w-2/4" };
  if (score <= 3) return { label: "Good", color: "bg-yellow-500", width: "w-3/4" };
  return { label: "Strong", color: "bg-green-500", width: "w-full" };
};

const SecuritySection = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const strength = useMemo(
    () => getStrength(formData.newPassword || ""),
    [formData.newPassword],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error("All password fields are required");
      return;
    }
    if (!validatePassword(formData.newPassword)) {
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
      toast.error(getErrorMessage(apiError));
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
        <Input
          label="Current Password"
          type="password"
          value={formData.currentPassword}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, currentPassword: e.target.value }))
          }
          icon={LuLock}
          required
        />

        <div className="space-y-2">
          <Input
            label="New Password"
            type="password"
            value={formData.newPassword}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, newPassword: e.target.value }))
            }
            icon={LuLock}
            minLength={6}
            required
          />
          {formData.newPassword && (
            <div className="px-1">
              <div className="h-2 w-full bg-[var(--app-surface-hover)] rounded-full overflow-hidden">
                <div className={`h-2 ${strength.color} ${strength.width}`} />
              </div>
              <p className="text-xs app-text-muted mt-1">Strength: {strength.label}</p>
            </div>
          )}
        </div>

        <Input
          label="Confirm New Password"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))
          }
          icon={LuLock}
          required
        />
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

export default SecuritySection;
