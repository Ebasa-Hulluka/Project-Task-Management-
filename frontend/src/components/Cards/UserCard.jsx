import React, { useEffect, useRef, useState } from "react";
import {
  LuUser,
  LuMail,
  LuEllipsisVertical,
  LuTrash2,
  LuUserX,
  LuCheck,
  LuCircleCheck,
  LuCrown,
  LuStar,
  LuUserCheck,
} from "react-icons/lu";
import { USER_ROLES } from "../../utils/data";
import { getInitials } from "../../utils/helper";
import ReactivateButton from "../ReactivateButton";

const UserCard = ({
  user,
  onDelete,
  onDeactivate,
  onRoleChange,
  onReactivate,
  statusActionLoading = false,
  showActions = false,
  currentUserRole = "",
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
        setShowRoleDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (!user) return null;

  const {
    _id,
    name,
    email,
    role,
    profileImageUrl,
    team,
    pendingTasks = 0,
    inProgressTasks = 0,
    completedTasks = 0,
    totalTasks = 0,
    status = "active",
    isActive = true,
  } = user;

  const requesterIsSuperAdmin = currentUserRole === "superAdmin";
  const requesterIsAdmin =
    currentUserRole === "superAdmin" || currentUserRole === "admin";
  const targetIsSuperAdmin = role === "superAdmin";
  const targetIsAdmin = role === "admin";
  const canChangeRole =
    requesterIsAdmin &&
    !targetIsSuperAdmin &&
    (!targetIsAdmin || requesterIsSuperAdmin);
  const effectiveStatus = isActive === false ? "deactivated" : status;
  const isDeactivated = effectiveStatus === "deactivated";
  const canDeactivate =
    requesterIsAdmin &&
    !isDeactivated &&
    !targetIsSuperAdmin &&
    (!targetIsAdmin || requesterIsSuperAdmin);
  const canManageActions = canChangeRole || canDeactivate;

  const getStatusBadgeStyles = (value) => {
    switch (value) {
      case "deactivated":
        return "bg-slate-100 text-slate-700 border-slate-300";
      default:
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
  };

  const getCardBorderStyles = (value) => {
    switch (value) {
      case "deactivated":
        return "border-slate-300";
      default:
        return "border-green-200";
    }
  };
  const roleOptions = requesterIsSuperAdmin
    ? [{ label: "Admin", value: "admin" }, ...USER_ROLES]
    : USER_ROLES;

  const getRoleBadgeColor = () => {
    switch (role) {
      case "superAdmin":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "admin":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "projectManager":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "teamMember":
        return "bg-green-100 text-green-700 border-green-200";
      case "tester":
        return "bg-violet-100 text-violet-700 border-violet-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case "superAdmin":
        return <LuCrown className="text-rose-600" />;
      case "admin":
        return <LuCrown className="text-amber-600" />;
      case "projectManager":
        return <LuStar className="text-blue-600" />;
      case "teamMember":
        return <LuUserCheck className="text-green-600" />;
      case "tester":
        return <LuCircleCheck className="text-violet-600" />;
      default:
        return <LuUser className="text-gray-600" />;
    }
  };

  const getRoleDisplay = () => {
    switch (role) {
      case "superAdmin":
        return "Super Admin";
      case "admin":
        return "Admin";
      case "projectManager":
        return "Project Manager";
      case "teamMember":
        return "Team Member";
      case "tester":
        return "Tester";
      default:
        return role;
    }
  };

  const handleRoleChange = async (newRole) => {
    setShowRoleDropdown(false);
    setShowMenu(false);
    if (onRoleChange) {
      await onRoleChange(_id, newRole);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg p-4 shadow-sm border hover:shadow transition-all relative ${getCardBorderStyles(effectiveStatus)}`}
    >
      {showActions && canManageActions && (
        <div ref={menuRef} className="absolute top-2 right-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <LuEllipsisVertical className="text-gray-500 text-sm" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <div className="py-1">
                {canChangeRole && (
                  <div className="relative">
                    <button
                      onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span>Change Role</span>
                      <span className="text-xs">-&gt;</span>
                    </button>

                    {showRoleDropdown && (
                      <div className="absolute left-full top-0 ml-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200">
                        {roleOptions.map((r) => (
                          <button
                            key={r.value}
                            onClick={() => handleRoleChange(r.value)}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
                            disabled={r.value === role}
                          >
                            <span>{r.label}</span>
                            {r.value === role && (
                              <LuCheck className="text-green-600 text-xs" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {canDeactivate && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowRoleDropdown(false);
                      if (onDeactivate) onDeactivate(_id);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                  >
                    <LuUserX className="text-xs" />
                    Deactivate User
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowRoleDropdown(false);
                    if (onDelete) onDelete(_id);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LuTrash2 className="text-xs" />
                  Delete User
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mb-3">
        <div className="flex flex-col items-center gap-2 pr-6 text-center">
          {profileImageUrl ? (
            <button
              type="button"
              onClick={() => setShowImagePreview(true)}
              className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30"
              title="Click to enlarge"
            >
              <img
                src={profileImageUrl}
                alt={name}
                className="w-[84px] h-[84px] rounded-full object-cover border border-gray-200"
              />
            </button>
          ) : (
            <div className="w-[84px] h-[84px] rounded-full bg-primary/10 border border-gray-200 flex items-center justify-center shrink-0">
              <span className="text-xl font-semibold text-primary">
                {getInitials(name)}
              </span>
            </div>
          )}
          <div className="min-w-0 w-full">
            <h3 className="font-semibold text-base text-gray-800 break-words">{name}</h3>
            <div className="w-full mt-0.5 overflow-x-auto">
              <p className="text-sm text-gray-500 inline-flex items-center gap-1 whitespace-nowrap min-w-max mx-auto">
                <LuMail className="text-gray-400 shrink-0" />
                <span>{email}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 mt-2.5">
          <div
            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor()} flex items-center gap-1`}
          >
            {getRoleIcon()}
            <span>{getRoleDisplay()}</span>
          </div>
          <div
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeStyles(effectiveStatus)}`}
          >
            {effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)}
          </div>
        </div>

        {team && (
          <p className="text-[11px] text-gray-500 mt-1.5 truncate">
            Team: {typeof team === "object" ? team.name : team}
          </p>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 pt-2.5 border-t border-gray-100">
        <div className="text-center">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-sm font-semibold text-gray-800">{totalTasks}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-sm font-semibold text-yellow-600">
            {pendingTasks}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">In Prog.</p>
          <p className="text-sm font-semibold text-blue-600">
            {inProgressTasks}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Done</p>
          <p className="text-sm font-semibold text-green-600">
            {completedTasks}
          </p>
        </div>
      </div>

      {showActions && requesterIsAdmin && isDeactivated && !targetIsSuperAdmin && (
        <div className="flex items-center justify-center gap-2 mt-2.5 pt-2.5 border-t border-gray-100">
          <ReactivateButton
            onClick={() => onReactivate && onReactivate(_id)}
            loading={statusActionLoading}
          />
        </div>
      )}

      {showImagePreview && profileImageUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setShowImagePreview(false)}
        >
          <div
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={profileImageUrl}
              alt={`${name} profile`}
              className="w-[260px] h-[260px] md:w-[340px] md:h-[340px] rounded-2xl object-cover border-2 border-white/70 shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setShowImagePreview(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-gray-700 text-sm font-bold shadow hover:bg-gray-100"
            >
              x
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserCard;
