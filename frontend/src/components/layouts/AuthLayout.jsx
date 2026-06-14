import React from "react";
import { Link } from "react-router-dom";
import deboLogo from "../../pages/assets/images/debo-logo.png";

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="auth-light-scope flex min-h-screen bg-gradient-to-br from-[#e8f4ef] via-white to-[#e8eef7]">
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 lg:px-16 xl:px-24 py-12">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <img
              src={deboLogo}
              alt="Debo Engineering"
              className="h-16 w-auto"
            />
            <div className="leading-tight">
              <h1 className="text-3xl md:text-4xl font-black text-primary leading-tight">
                Debo
              </h1>
              <p className="text-sm font-semibold text-[#0f5841] tracking-wide">
                Project Manager
              </p>
            </div>
          </Link>
          <p className="mt-3 text-sm text-[#5f6f82] font-semibold">
            Build better teams and deliver projects faster.
          </p>
        </div>

        {(title || subtitle) && (
          <div className="mb-8">
            {title && (
              <h2 className="text-3xl font-bold text-[#172033] mb-2">
                {title}
              </h2>
            )}
            {subtitle && <p className="text-sm text-[#5f6f82]">{subtitle}</p>}
          </div>
        )}

        <div className="flex-1 rounded-2xl border border-[#dbe5ef] bg-white shadow-[0_25px_80px_rgba(25,79,135,0.12)] p-6 sm:p-8">
          {children}
        </div>

        <div className="mt-8 text-center text-sm text-[#5f6f82]">
          <p>
            &copy; {new Date().getFullYear()} Debo Project Manager. All rights
            reserved.
          </p>
        </div>
      </div>

      <div
        className="hidden lg:block lg:w-1/2 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(25,79,135,0.10), rgba(15,88,65,0.10), #ffffff)",
        }}
      >
        <div className="absolute inset-0 bg-[url('/bg-pattern.svg')] opacity-10" />
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
            <h3 className="text-2xl font-semibold text-[#172033] mb-4">
              Manage Your Tasks Efficiently
            </h3>
            <p className="text-[#5f6f82]">
              Organize, track, and collaborate on tasks with your team in
              real-time.
            </p>

            <div className="mt-8 space-y-4 text-left">
              {[
                "Create and assign tasks",
                "Track progress in real-time",
                "Collaborate with your team",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center">
                    <span className="text-primary">&#10003;</span>
                  </div>
                  <span className="text-[#172033]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
