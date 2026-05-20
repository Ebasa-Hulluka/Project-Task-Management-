import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/Inputs/Input";
import {
  validateEmail,
  getLocalStorage,
  setLocalStorage,
} from "../../utils/helper";
import { useUser } from "../../context/userContext";

const SAVED_EMAILS_KEY = "login_saved_emails";
const EMAIL_DATALIST_ID = "login-email-suggestions";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [savedEmails, setSavedEmails] = useState([]);

  const { login } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = getLocalStorage(SAVED_EMAILS_KEY);
    if (Array.isArray(saved)) setSavedEmails(saved);
  }, []);

  const updateSavedEmails = (newEmail) => {
    const normalized = newEmail.trim().toLowerCase();
    if (!normalized) return;

    setSavedEmails((prev) => {
      const next = [normalized, ...prev.filter((item) => item !== normalized)].slice(0, 8);
      setLocalStorage(SAVED_EMAILS_KEY, next);
      return next;
    });
  };

  const getDashboardPath = (role) => {
    if (role === "superAdmin" || role === "admin") return "/admin/dashboard";
    if (role === "projectManager") return "/manager/dashboard";
    if (role === "tester") return "/tester/dashboard";
    return "/member/dashboard";
  };

  // Handle Login Form Submit
  const handleLogin = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    // Reset errors before validating
    let newErrors = {};

    if (!validateEmail(normalizedEmail)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Please enter the password";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Update state with the error object
    setError(newErrors);

    // If there are any keys in the error object, stop the submission
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(normalizedEmail, password);

      if (result.success) {
        updateSavedEmails(normalizedEmail);
        toast.success("Login successful!");

        // Redirect based on role
        navigate(getDashboardPath(result.user.role), { replace: true });
      } else {
        const normalizedError = (result.error || "").toLowerCase();
        let message = result.error;

        if (normalizedError.includes("deactivated")) {
          message = "This account is deactivated. Contact the super admin.";
        }

        setError({ form: message });
        toast.error(message);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Login failed. Please try again.";
      setError({ form: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full lg:w-[78%] h-3/4 md:h-full mx-auto flex flex-col justify-center">
        <div className="text-center">
          <h3 className="text-base md:text-lg font-bold app-text">Welcome Back</h3>
          <p className="text-xs app-text-muted mt-2 mb-8 font-medium">
            Please enter your details to log in
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Field */}
          <div className="relative">
            <Input
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error.email) setError({ ...error, email: "" });
              }}
              label="Email Address"
              placeholder="ebasahuluka1@gmail.com"
              type="email"
              name="email"
              list={savedEmails.length ? EMAIL_DATALIST_ID : undefined}
              autoComplete="email"
              disabled={isLoading}
              required
            />
            {savedEmails.length > 0 && (
              <datalist id={EMAIL_DATALIST_ID}>
                {savedEmails.map((savedEmail) => (
                  <option key={savedEmail} value={savedEmail} />
                ))}
              </datalist>
            )}
            {error.email && (
              <p className="text-red-500 text-xs mt-1">{error.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <Input
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error.password) setError({ ...error, password: "" });
              }}
              label="Password"
              placeholder="Enter your password"
              type="password"
              name="password"
              autoComplete="off"
              disabled={isLoading}
              required
            />
            {error.password && (
              <p className="text-red-500 text-xs mt-1">{error.password}</p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-primary hover:underline focus:outline-none"
            >
              Forgot Password?
            </button>
          </div>

          {/* Form Error */}
          {error.form && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm text-center">{error.form}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>LOGGING IN...</span>
              </div>
            ) : (
              "LOGIN"
            )}
          </button>

        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;
