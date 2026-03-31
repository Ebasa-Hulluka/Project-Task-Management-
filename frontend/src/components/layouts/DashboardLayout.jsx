import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useUser } from "../../context/userContext";

import Navbar from "./Navbar";
import SideMenu from "./SideMenu";

const DashboardLayout = ({ children }) => {
  const { user, loading } = useUser();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (isMobile) {
      const id = setTimeout(() => setSidebarOpen(false), 0);
      return () => clearTimeout(id);
    }
  }, [location.pathname, isMobile]);

  // Get current page title from path
  const getPageTitle = () => {
    const path = location.pathname.split("/").filter(Boolean);
    if (path.length === 0) return "Dashboard";

    const lastSegment = path[path.length - 1];
    return lastSegment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 app-text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center">
        <div className="text-center">
          <p className="app-text-muted">Please log in to access the dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-bg app-text">
      {/* Navbar */}
      <Navbar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        pageTitle={getPageTitle()}
      />

      {/* Sidebar */}
      <SideMenu
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isMobile={isMobile}
      />

      {/* Main Content */}
      <main
        className={`
        transition-all duration-300 ease-in-out
        ${sidebarOpen && !isMobile ? "lg:ml-64" : ""}
        pt-16 min-h-screen
      `}
      >
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>

      {/* Footer */}
      <footer
        className={`
        transition-all duration-300 ease-in-out
        ${sidebarOpen && !isMobile ? "lg:ml-64" : ""}
        app-surface app-border-top py-4 px-6
      `}
      >
        <div className="text-center text-sm app-text-muted">
          © {new Date().getFullYear()} Task Manager. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;
