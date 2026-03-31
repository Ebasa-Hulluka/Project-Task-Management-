import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineBell,
} from "react-icons/hi";
import { toast } from "react-hot-toast";
import moment from "moment";

import { useUser } from "../../context/userContext";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const Navbar = ({ sidebarOpen, setSidebarOpen, pageTitle }) => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [currentTime, setCurrentTime] = useState(moment().format("hh:mm A"));

  const notificationRef = useRef(null);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format("hh:mm A"));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.NOTIFICATIONS.GET_NOTIFICATIONS,
        { params: { limit: 10 } },
      );
      setNotifications(response.data?.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
    }
  };

  useEffect(() => {
    if (!user?._id) return;
    fetchNotifications();
    const poll = setInterval(fetchNotifications, 60000);
    return () => clearInterval(poll);
  }, [user?._id]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await axiosInstance.put(API_PATHS.NOTIFICATIONS.MARK_AS_READ(id));
      setNotifications((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const clearAllNotifications = async () => {
    if (!notifications.length) return;
    try {
      await axiosInstance.delete(API_PATHS.NOTIFICATIONS.CLEAR_ALL);
      setNotifications([]);
      toast.success("Notifications cleared");
    } catch (error) {
      console.error("Failed to clear notifications:", error);
      toast.error("Failed to clear notifications");
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <nav className="fixed top-0 left-0 right-0 app-surface app-border-bottom z-30 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Menu Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-[var(--app-surface-hover)] transition-colors lg:hidden"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? (
                <HiOutlineX className="text-xl app-text" />
              ) : (
                <HiOutlineMenu className="text-xl app-text" />
              )}
            </button>

            {/* Page Title */}
            <h1 className="text-lg font-semibold app-text hidden sm:block">
              {pageTitle}
            </h1>
          </div>

          {/* Center Section - Time (optional) */}
          <div className="hidden md:flex items-center gap-2 text-sm app-text-muted">
            <span>{currentTime}</span>
            <span>{moment().format("dddd, MMM D")}</span>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-[var(--app-surface-hover)] transition-colors relative"
              >
                <HiOutlineBell className="text-xl app-text" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 app-surface rounded-lg shadow-lg app-border overflow-hidden z-50">
                  <div className="p-3 app-border-bottom bg-[var(--app-surface-hover)]">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium app-text">Notifications</h3>
                      <button
                        type="button"
                        onClick={clearAllNotifications}
                        disabled={notifications.length === 0}
                        className="text-xs text-red-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          className={`p-3 app-border-bottom hover:bg-[var(--app-surface-hover)] cursor-pointer ${
                            !notif.read ? "bg-[var(--app-surface-hover)]" : ""
                          }`}
                          onClick={async () => {
                            if (!notif.read) {
                              await markAsRead(notif._id);
                            }
                            setShowNotifications(false);
                            if (notif.link) navigate(notif.link);
                          }}
                        >
                          <p className="text-sm app-text">{notif.message}</p>
                          <p className="text-xs app-text-muted mt-1">
                            {moment(notif.createdAt).fromNow()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center app-text-muted">
                        No notifications
                      </div>
                    )}
                  </div>

                  <div className="p-2 app-border-top text-center">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        navigate("/notifications");
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      View all
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
