import React, { useEffect, useMemo, useState } from "react";
import { LuSave, LuUser, LuMail, LuLock } from "react-icons/lu";
import { toast } from "react-hot-toast";

import { useUser } from "../../context/userContext";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { getErrorMessage, validateEmail } from "../../utils/helper";
import Input from "../Inputs/Input";
import ProfilePhotoSelector from "../Inputs/ProfilePhotoSelector";

const ProfileSection = () => {
  const { user, fetchUserProfile } = useUser();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [originalForm, setOriginalForm] = useState({ name: "", email: "" });

  useEffect(() => {
    if (!user) return;
    const nextForm = {
      name: user.name || "",
      email: user.email || "",
    };
    setFormData(nextForm);
    setOriginalForm(nextForm);
    setProfileImage(user.profileImageUrl || null);
    setUploadedImageUrl(user.profileImageUrl || "");
    setCurrentPassword("");
  }, [user]);

  const isIdentityChanged = useMemo(() => {
    return (
      formData.name.trim() !== originalForm.name.trim() ||
      formData.email.trim().toLowerCase() !== originalForm.email.trim().toLowerCase()
    );
  }, [formData, originalForm]);

  const hasChanges = useMemo(() => {
    return (
      isIdentityChanged ||
      Boolean(uploadedImageUrl) !== Boolean(user?.profileImageUrl) ||
      uploadedImageUrl !== (user?.profileImageUrl || "")
    );
  }, [isIdentityChanged, uploadedImageUrl, user]);

  const handleUploadImage = async (file) => {
    const payload = new FormData();
    payload.append("profileImage", file);

    const response = await axiosInstance.post(API_PATHS.IMAGE.UPLOAD_IMAGE, payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const imageUrl = response?.data?.imageUrl;
    if (!imageUrl) throw new Error("Image URL missing in upload response");

    setUploadedImageUrl(imageUrl);
    return imageUrl;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email");
      return;
    }
    if (isIdentityChanged && !currentPassword.trim()) {
      toast.error("Current password is required to confirm profile changes.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        profileImageUrl: uploadedImageUrl || user?.profileImageUrl || "",
      };

      if (isIdentityChanged) {
        payload.currentPassword = currentPassword;
      }

      await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, payload);

      await fetchUserProfile();
      setOriginalForm({
        name: formData.name.trim(),
        email: formData.email.trim(),
      });
      setCurrentPassword("");

      toast.success("Profile updated successfully");
      setProfileImage(uploadedImageUrl || user?.profileImageUrl || null);
    } catch (apiError) {
      toast.error(getErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="app-card rounded-xl p-5 space-y-5">
      <div>
        <h3 className="text-lg font-semibold app-text">Profile Information</h3>
        <p className="text-sm app-text-muted mt-1">Update your name, email, and profile picture.</p>
      </div>

      <ProfilePhotoSelector
        image={profileImage}
        setImage={setProfileImage}
        onUpload={handleUploadImage}
        onRemove={() => setUploadedImageUrl("")}
        disabled={loading}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Full name"
          icon={LuUser}
          required
        />

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="Email address"
          icon={LuMail}
          required
        />
      </div>

      {isIdentityChanged && (
        <Input
          label="Current Password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Enter current password to confirm name/email change"
          icon={LuLock}
          required
        />
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          className="btn-primary flex items-center gap-2 disabled:opacity-60"
          disabled={loading || !hasChanges}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Saving...
            </>
          ) : (
            <>
              <LuSave />
              Save Profile
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ProfileSection;
