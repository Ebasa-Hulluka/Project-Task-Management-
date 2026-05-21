import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LuLayoutDashboard,
  LuFolder,
  LuUsers,
  LuClipboardCheck,
  LuUser,
  LuChartBar,
  LuSettings,
  LuLogOut,
  LuChevronLeft,
  LuChevronRight,
  LuPlus,
  LuCalendar,
  LuMessageSquare,
  LuUserCheck,
} from "react-icons/lu";
import { toast } from "react-hot-toast";

import { useUser } from "../../context/userContext";
import { getInitials } from "../../utils/helper";

// Menu items configuration based on role
const getMenuItems = (role) => {
  const commonItems = [
    {
      id: "chat",
      label: "Chat",
      path: "/chat",
      icon: LuMessageSquare,
    },
    {
      id: "profile",
      label: "Profile",
      path: "/profile",
      icon: LuUser,
    },
    {
      id: "settings",
      label: "Settings",
      path: "/settings",
      icon: LuSettings,
    },
    {
      id: "logout",
      label: "Logout",
      path: "logout",
      icon: LuLogOut,
    },
  ];

  const adminItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: LuLayoutDashboard,
    },
    {
      id: "projects",
      label: "Projects",
      path: "/admin/projects",
      icon: LuFolder,
    },
    {
      id: "teams",
      label: "Teams",
      path: "/admin/teams",
      icon: LuUsers,
    },
    {
      id: "tasks",
      label: "Tasks",
      path: "/admin/tasks",
      icon: LuClipboardCheck,
    },
    {
      id: "users",
      label: "Users",
      path: "/admin/users",
      icon: LuUser,
    },
    {
      id: "reports",
      label: "Reports",
      path: "/admin/reports",
      icon: LuChartBar,
    },
  ];

  const managerItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      path: "/manager/dashboard",
      icon: LuLayoutDashboard,
    },
    {
      id: "projects",
      label: "My Projects",
      path: "/manager/projects",
      icon: LuFolder,
    },
    {
      id: "create-project",
      label: "Create Project",
      path: "/manager/projects/create",
      icon: LuPlus,
    },
    {
      id: "tasks",
      label: "Tasks",
      path: "/manager/tasks",
      icon: LuClipboardCheck,
    },
    {
      id: "teams",
      label: "Teams",
      path: "/manager/teams",
      icon: LuUsers,
    },
    {
      id: "testers",
      label: "Testers",
      path: "/manager/testers",
      icon: LuUserCheck,
    },
    {
      id: "calendar",
      label: "Calendar",
      path: "/member/calendar",
      icon: LuCalendar,
    },
  ];

  const memberItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      path: "/member/dashboard",
      icon: LuLayoutDashboard,
    },
    {
      id: "my-tasks",
      label: "My Tasks",
      path: "/member/tasks",
      icon: LuClipboardCheck,
    },
    {
      id: "calendar",
      label: "Calendar",
      path: "/member/calendar",
      icon: LuCalendar,
    },
  ];

  const testerItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      path: "/tester/dashboard",
      icon: LuLayoutDashboard,
    },
    {
      id: "testing-tasks",
      label: "Testing Tasks",
      path: "/tester/tasks",
      icon: LuClipboardCheck,
    },
    {
      id: "calendar",
      label: "Calendar",
      path: "/tester/calendar",
      icon: LuCalendar,
    },
  ];

  let roleItems = [];
  switch (role) {
    case "superAdmin":
    case "admin":
      roleItems = adminItems;
      break;
    case "projectManager":
      roleItems = managerItems;
      break;
    case "teamMember":
      roleItems = memberItems;
      break;
    case "tester":
      roleItems = testerItems;
      break;
    default:
      roleItems = [];
  }

  return [...roleItems, ...commonItems];
};

const SideMenu = ({ isOpen, setIsOpen, isMobile }) => {
  const { user, logout, getRoleLabel } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const desktopNavRef = useRef(null);
  const mobileNavRef = useRef(null);

  const SCROLL_STORAGE_KEY = "sidebarMenuScrollTop";

  const menuItems = useMemo(
    () => (user ? getMenuItems(user.role) : []),
    [user]
  );
  const [collapsed, setCollapsed] = useState(false);
  const [showProfilePreview, setShowProfilePreview] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Keep only one active menu item by using the longest matching path.
  const activePath = useMemo(() => {
    const currentPath = location.pathname;
    const candidates = menuItems
      .filter((item) => item.path && item.path !== "logout")
      .map((item) => item.path)
      .filter(
        (path) =>
          currentPath === path ||
          currentPath.startsWith(`${path}/`),
      )
      .sort((a, b) => b.length - a.length);

    return candidates[0] || "";
  }, [location.pathname, menuItems]);

  const isActive = (path) => path === activePath;

  const handleNavigation = (path) => {
    if (path === "logout") {
      handleLogout();
      return;
    }

    const activeNav = isMobile ? mobileNavRef.current : desktopNavRef.current;
    if (activeNav) {
      sessionStorage.setItem(
        SCROLL_STORAGE_KEY,
        String(activeNav.scrollTop || 0),
      );
    }

    if (location.pathname === path) {
      if (isMobile && setIsOpen) {
        setIsOpen(false);
      }
      return;
    }

    navigate(path);

    // Close sidebar on mobile after navigation
    if (isMobile && setIsOpen) {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/", { replace: true });
    setShowLogoutConfirm(false);
  };

  useEffect(() => {
    const saved = Number(sessionStorage.getItem(SCROLL_STORAGE_KEY) || "0");

    const applySavedScroll = () => {
      const activeNav = isMobile ? mobileNavRef.current : desktopNavRef.current;
      if (activeNav) {
        activeNav.scrollTop = saved;
      }
    };

    const id = window.requestAnimationFrame(applySavedScroll);
    return () => window.cancelAnimationFrame(id);
  }, [location.pathname, isMobile]);

  // Don't render if no user
  if (!user) return null;

  const menuWidth = collapsed ? "w-20" : "w-64";

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 h-full app-surface app-border-right shadow-lg flex flex-col
        transition-all duration-300 ease-in-out z-40
        ${isMobile ? "hidden" : "block"}
        ${menuWidth}
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-4 app-border-bottom">
          {!collapsed ? (
            <h1 className="text-xl font-bold text-primary">Task Manager</h1>
          ) : (
            <h1 className="text-xl font-bold text-primary mx-auto">TM</h1>
          )}

          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-[var(--app-surface-hover)] transition-colors"
          >
            {collapsed ? (
              <LuChevronRight className="app-text-muted" />
            ) : (
              <LuChevronLeft className="app-text-muted" />
            )}
          </button>
        </div>

        {/* User Profile Section */}
        <div
          className={`
          p-4 app-border-bottom
          ${collapsed ? "text-center" : ""}
        `}
        >
          <div className="flex flex-col items-center text-center gap-2">
            {/* Avatar */}
            {user?.profileImageUrl ? (
              <button
                type="button"
                onClick={() => setShowProfilePreview(true)}
                className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30"
                title="Click to enlarge"
              >
                <img
                  src={user.profileImageUrl}
                  alt={user.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowProfilePreview(true)}
                className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                title="Click to enlarge"
              >
                <span className="text-2xl font-medium text-primary">
                  {getInitials(user?.name)}
                </span>
              </button>
            )}

            {/* User Info - Hidden when collapsed */}
            {!collapsed && (
              <div className="w-full">
                <p className="text-sm font-medium app-text truncate">{user?.name}</p>
                <p className="text-xs app-text-muted break-all">{user?.email}</p>
              </div>
            )}
          </div>

          {/* Role Badge - Hidden when collapsed */}
          {!collapsed && (
            <div className="mt-2 text-center">
              <span
                className={`
                inline-block px-2 py-0.5 text-xs rounded-full
                ${
                  user?.role === "superAdmin"
                    ? "bg-rose-100 text-rose-700"
                    : user?.role === "admin"
                    ? "bg-amber-100 text-amber-700"
                    : user?.role === "projectManager"
                      ? "bg-sky-100 text-sky-700"
                      : user?.role === "tester"
                        ? "bg-violet-100 text-violet-700"
                      : "bg-emerald-100 text-emerald-700"
                }
              `}
              >
                {getRoleLabel(user?.role)}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav
          ref={desktopNavRef}
          className="p-3 flex-1 min-h-0 overflow-y-auto pb-6"
        >
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1
                transition-all duration-200
                ${
                  item.id === "logout"
                    ? "text-red-600 hover:bg-red-50"
                    : isActive(item.path)
                      ? "bg-primary text-white"
                      : "app-text hover:bg-[var(--app-surface-hover)]"
                }
                ${collapsed ? "justify-center" : ""}
              `}
              title={collapsed ? item.label : ""}
            >
              <item.icon
                className={`text-xl ${
                  item.id === "logout"
                    ? "text-red-600"
                    : isActive(item.path)
                      ? "text-white"
                      : "app-text-muted"
                }`}
              />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      {isMobile && (
        <>
          {/* Backdrop */}
          {isOpen && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
          )}

          {/* Mobile Menu */}
          <aside
            className={`
            fixed top-0 left-0 h-full w-64 app-surface shadow-xl z-50 flex flex-col
            transition-transform duration-300 ease-in-out
            ${isOpen ? "translate-x-0" : "-translate-x-full"}
          `}
          >
            {/* Mobile Logo */}
            <div className="h-16 flex items-center px-4 app-border-bottom">
              <h1 className="text-xl font-bold text-primary">Task Manager</h1>
            </div>

            {/* Mobile User Profile */}
            <div className="p-4 app-border-bottom">
              <div className="flex flex-col items-center text-center gap-2">
                {user?.profileImageUrl ? (
                  <button
                    type="button"
                    onClick={() => setShowProfilePreview(true)}
                    className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30"
                    title="Click to enlarge"
                  >
                    <img
                      src={user.profileImageUrl}
                      alt={user.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowProfilePreview(true)}
                    className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                    title="Click to enlarge"
                  >
                    <span className="text-2xl font-medium text-primary">
                      {getInitials(user?.name)}
                    </span>
                  </button>
                )}
                <div className="w-full min-w-0">
                  <p className="text-sm font-medium app-text truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs app-text-muted break-all">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Navigation */}
            <nav
              ref={mobileNavRef}
              className="p-3 flex-1 min-h-0 overflow-y-auto pb-6"
            >
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1
                    transition-colors
                    ${
                      item.id === "logout"
                        ? "text-red-600 hover:bg-red-50"
                        : isActive(item.path)
                        ? "bg-primary text-white"
                        : "app-text hover:bg-[var(--app-surface-hover)]"
                    }
                  `}
                >
                  <item.icon
                    className={`text-xl ${
                      item.id === "logout"
                        ? "text-red-600"
                        : isActive(item.path)
                          ? "text-white"
                          : "app-text-muted"
                    }`}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        </>
      )}

      {showProfilePreview && (
        <div
          className="fixed inset-0 z-[120] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setShowProfilePreview(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={`${user?.name} profile`}
                className="w-[260px] h-[260px] md:w-[340px] md:h-[340px] rounded-2xl object-cover border-2 border-white/70 shadow-2xl"
              />
            ) : (
              <div className="w-[260px] h-[260px] md:w-[340px] md:h-[340px] rounded-2xl bg-primary/10 border-2 border-white/70 shadow-2xl flex items-center justify-center">
                <span className="text-7xl font-bold text-primary">
                  {getInitials(user?.name)}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowProfilePreview(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-gray-700 text-sm font-bold shadow hover:bg-gray-100"
            >
              x
            </button>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[130] bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="app-card rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <h3 className="text-lg font-semibold app-text">Confirm logout</h3>
            <p className="text-sm app-text-muted mt-2">
              Are you sure you want to log out?
            </p>
            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-sm font-medium app-text hover:bg-[var(--app-surface-hover)] transition-colors"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
                onClick={confirmLogout}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SideMenu;
