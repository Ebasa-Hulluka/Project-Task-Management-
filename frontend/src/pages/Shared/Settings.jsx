import React, { useState } from "react";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import ProfileSection from "../../components/settings/ProfileSection";
import SecuritySection from "../../components/settings/SecuritySection";
import NotificationsSection from "../../components/settings/NotificationsSection";
import AppearanceSection from "../../components/settings/AppearanceSection";

const TABS = [
  { id: "profile", label: "Profile Information" },
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
  { id: "appearance", label: "Appearance" },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileSection />;
      case "security":
        return <SecuritySection />;
      case "notifications":
        return <NotificationsSection />;
      case "appearance":
        return <AppearanceSection />;
      default:
        return <ProfileSection />;
    }
  };

  return (
    <DashboardLayout activeMenu="Settings">
      <div className="my-5 max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-medium app-text">Settings</h2>
          <p className="text-sm app-text-muted mt-1">
            Manage profile, security, notifications, and appearance options.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="app-card rounded-xl p-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-[var(--app-primary)] text-white"
                      : "app-text hover:bg-[var(--app-surface-hover)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">{renderTabContent()}</div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
