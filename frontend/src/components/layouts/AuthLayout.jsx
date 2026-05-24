import React from "react";
import { Link } from "react-router-dom";

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="flex min-h-screen app-bg">
      {/* Left Section - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 lg:px-16 xl:px-24 py-12">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-2xl md:text-3xl font-extrabold text-primary leading-tight">Project Manager</h1>
          </Link>
        </div>

        {/* Header */}
        {(title || subtitle) && (
          <div className="mb-8">
            {title && (
              <h2 className="text-3xl font-bold app-text mb-2">{title}</h2>
            )}
            {subtitle && <p className="app-text-muted">{subtitle}</p>}
          </div>
        )}

        {/* Content */}
        <div className="flex-1">{children}</div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm app-text-muted">
          <p>© {new Date().getFullYear()} Project Manager. All rights reserved.</p>
        </div>
      </div>

      {/* Right Section - Illustration */}
      <div
        className="hidden lg:block lg:w-1/2 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--app-surface-hover), var(--app-surface))",
        }}
      >
        <div className="absolute inset-0 bg-[url('/bg-pattern.svg')] opacity-10"></div>
        <div className="relative h-full flex items-center justify-center p-12">
          <div className="max-w-md text-center">
            <img
              src="/illustration.svg"
              alt="Project Manager Illustration"
              className="w-full mb-8"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
              }}
            />
            <h3 className="text-2xl font-semibold app-text mb-4">
              Manage Your Tasks Efficiently
            </h3>
            <p className="app-text-muted">
              Organize, track, and collaborate on tasks with your team in
              real-time.
            </p>

            {/* Feature List */}
            <div className="mt-8 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-primary">&#10003;</span>
                </div>
                <span className="app-text">Create and assign tasks</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-primary">&#10003;</span>
                </div>
                <span className="app-text">
                  Track progress in real-time
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-primary">&#10003;</span>
                </div>
                <span className="app-text">
                  Collaborate with your team
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;




