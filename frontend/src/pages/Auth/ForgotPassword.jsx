import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/Inputs/Input";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { validateEmail } from "../../utils/helper";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!validateEmail(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccessMessage("");
      const response = await axiosInstance.post(API_PATHS.AUTH.FORGOT_PASSWORD, {
        email: normalizedEmail,
      });
      const message = response.data?.message || "Password reset request sent.";
      setSuccessMessage(message);
      toast.success("Request sent to super admin");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to send password reset request";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full lg:w-[78%] h-3/4 md:h-full mx-auto flex flex-col justify-center">
        <div className="text-center">
          <h3 className="text-base md:text-lg font-bold app-text">Forgot Password</h3>
          <p className="text-xs app-text-muted mt-2 mb-8 font-medium">
            Enter your account email. The super admin will review your request.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (error) setError("");
            }}
            label="Email Address"
            placeholder="you@example.com"
            type="email"
            name="email"
            autoComplete="email"
            disabled={isLoading}
            required
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-emerald-700 text-sm text-center">{successMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "SENDING REQUEST..." : "SEND REQUEST"}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
