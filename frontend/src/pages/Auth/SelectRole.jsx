import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  LuCrown,
  LuStar,
  LuUserCheck,
  LuCircleCheck,
  LuShield,
} from "react-icons/lu";

import AuthLayout from "../../components/layouts/AuthLayout";
import { useUser } from "../../context/userContext";
import { getDashboardPath, getRoleLabel } from "../../utils/userRoles";

const PENDING_LOGIN_KEY = "pendingLogin";

const roleIcons = {
  superAdmin: LuCrown,
  admin: LuShield,
  projectManager: LuStar,
  teamMember: LuUserCheck,
  tester: LuCircleCheck,
};

const SelectRole = () => {
  const navigate = useNavigate();
  const { selectLoginRole } = useUser();
  const [pending, setPending] = useState(null);
  const [loadingRole, setLoadingRole] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING_LOGIN_KEY);
    if (!raw) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setPending(JSON.parse(raw));
    } catch {
      sessionStorage.removeItem(PENDING_LOGIN_KEY);
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const handleSelect = async (role) => {
    if (!pending?.selectionToken) return;

    try {
      setLoadingRole(role);
      const result = await selectLoginRole(role, pending.selectionToken);

      if (result.success) {
        sessionStorage.removeItem(PENDING_LOGIN_KEY);
        toast.success(`Signed in as ${getRoleLabel(role)}`);
        navigate(getDashboardPath(role), { replace: true });
      } else {
        toast.error(result.error || "Could not sign in with that role");
      }
    } finally {
      setLoadingRole("");
    }
  };

  if (!pending) {
    return (
      <AuthLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      </AuthLayout>
    );
  }

  const roles = pending.roles || [];

  return (
    <AuthLayout>
      <div className="w-full lg:w-[78%] mx-auto">
        <div className="text-center mb-8">
          <h3 className="text-base md:text-lg font-bold app-text">Choose how to sign in</h3>
          <p className="text-xs app-text-muted mt-2 font-medium">
            {pending.user?.name || "Your account"} has multiple roles. Pick one for this session.
          </p>
        </div>

        <div className="space-y-3">
          {roles.map((role) => {
            const Icon = roleIcons[role] || LuUserCheck;
            const isLoading = loadingRole === role;

            return (
              <button
                key={role}
                type="button"
                disabled={Boolean(loadingRole)}
                onClick={() => handleSelect(role)}
                className="w-full flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 text-left shadow-sm hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-60"
              >
                <span className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="text-primary text-lg" />
                </span>
                <span className="flex-1">
                  <span className="block font-semibold text-gray-800">
                    {getRoleLabel(role)}
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    Open the {getRoleLabel(role).toLowerCase()} workspace
                  </span>
                </span>
                {isLoading && (
                  <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="mt-6 w-full text-sm text-gray-500 hover:text-gray-700"
          onClick={() => {
            sessionStorage.removeItem(PENDING_LOGIN_KEY);
            navigate("/login", { replace: true });
          }}
        >
          Back to login
        </button>
      </div>
    </AuthLayout>
  );
};

export default SelectRole;
