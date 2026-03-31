import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { LuBell, LuSave } from "react-icons/lu";

import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { getErrorMessage, getLocalStorage, setLocalStorage } from "../../utils/helper";

const STORAGE_KEY = "notification_preferences";

const NotificationsSection = () => {
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [preferences, setPreferences] = useState({
    taskAssignments: true,
    taskUpdates: true,
    projectDeadlines: true,
    teamUpdates: true,
    systemAnnouncements: true,
  });

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.NOTIFICATIONS.GET_SETTINGS);
        const payload = response?.data || {};
        setPreferences({
          taskAssignments: payload.taskAssignments ?? true,
          taskUpdates: payload.taskUpdates ?? true,
          projectDeadlines:
            payload.projectDeadlines ?? payload.projectUpdates ?? true,
          teamUpdates: payload.teamUpdates ?? true,
          systemAnnouncements:
            payload.systemAnnouncements ?? payload.inAppNotifications ?? true,
        });
        setLocalStorage(STORAGE_KEY, {
          taskAssignments: payload.taskAssignments ?? true,
          taskUpdates: payload.taskUpdates ?? true,
          projectDeadlines:
            payload.projectDeadlines ?? payload.projectUpdates ?? true,
          teamUpdates: payload.teamUpdates ?? true,
          systemAnnouncements:
            payload.systemAnnouncements ?? payload.inAppNotifications ?? true,
        });
      } catch (apiError) {
        const cached = getLocalStorage(STORAGE_KEY);
        if (cached) {
          setPreferences({
            taskAssignments: cached.taskAssignments ?? true,
            taskUpdates: cached.taskUpdates ?? true,
            projectDeadlines:
              cached.projectDeadlines ?? cached.projectUpdates ?? true,
            teamUpdates: cached.teamUpdates ?? true,
            systemAnnouncements:
              cached.systemAnnouncements ?? cached.inAppNotifications ?? true,
          });
        } else {
          toast.error(getErrorMessage(apiError));
        }
      } finally {
        setInitializing(false);
      }
    };

    loadPreferences();
  }, []);

  const toggle = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    setLoading(true);
    try {
      await axiosInstance.put(API_PATHS.NOTIFICATIONS.UPDATE_SETTINGS, preferences);
      setLocalStorage(STORAGE_KEY, preferences);
      setHasChanges(false);
      toast.success("Notification preferences updated");
    } catch (apiError) {
      toast.error(getErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-card rounded-xl p-5 space-y-5">
      <div>
        <h3 className="text-lg font-semibold app-text">Notifications</h3>
        <p className="text-sm app-text-muted mt-1">Control how you receive updates.</p>
      </div>

      {initializing ? (
        <div className="flex justify-center items-center py-8">
          <span className="w-6 h-6 border-2 border-[#1368ec] border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : (
        <div className="space-y-3">
          {[
            { key: "taskAssignments", label: "Task Assignments" },
            { key: "taskUpdates", label: "Task Updates" },
            { key: "projectDeadlines", label: "Project Deadlines" },
            { key: "teamUpdates", label: "Team Updates" },
            { key: "systemAnnouncements", label: "System Announcements" },
          ].map((item) => (
            <label
              key={item.key}
              className="w-full flex items-center justify-between rounded-lg app-border px-4 py-3"
            >
              <span className="text-sm font-medium app-text flex items-center gap-2">
                <LuBell className="app-text-muted" />
                {item.label}
              </span>
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggle(item.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences[item.key] ? "bg-[#1368ec]" : "bg-[var(--app-border)]"
                  }`}
                  aria-label={item.label}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-[var(--app-surface)] transition-transform ${
                      preferences[item.key] ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-xs font-medium app-text-muted w-8 text-right">
                  {preferences[item.key] ? "ON" : "OFF"}
                </span>
              </span>
            </label>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="btn-primary flex items-center gap-2"
          disabled={loading || initializing || !hasChanges}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Saving...
            </>
          ) : (
            <>
              <LuSave />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationsSection;
