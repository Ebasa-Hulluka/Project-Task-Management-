import React from "react";
import { LuLaptop, LuMoon, LuSun } from "react-icons/lu";
import { useTheme } from "../../context/themeContext";

const AppearanceSection = () => {
  const { theme, resolvedTheme, setThemePreference } = useTheme();

  const themeCards = [
    {
      id: "light",
      title: "Light Mode",
      description: "Primary blue #194f87 with green #0f5841 accents.",
      icon: LuSun,
      iconClass: "text-amber-500",
      preview: {
        shell: "bg-white border-gray-200",
        linePrimary: "bg-[#194f87]",
        lineSecondary: "bg-gray-200",
      },
    },
    {
      id: "dark",
      title: "Dark Mode",
      description: "Brand blue and green adapted for dark surfaces.",
      icon: LuMoon,
      iconClass: "text-blue-400",
      preview: {
        shell: "bg-gray-800 border-gray-700",
        linePrimary: "bg-[#2e6aa3]",
        lineSecondary: "bg-gray-600",
      },
    },
    {
      id: "system",
      title: "System",
      description: "Follow your operating system preference.",
      icon: LuLaptop,
      iconClass: "text-slate-500",
      preview: {
        shell: resolvedTheme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200",
        linePrimary: resolvedTheme === "dark" ? "bg-[#2e6aa3]" : "bg-[#194f87]",
        lineSecondary: resolvedTheme === "dark" ? "bg-gray-600" : "bg-gray-200",
      },
    },
  ];

  return (
    <div className="app-card rounded-xl p-5 space-y-5">
      <div>
        <h3 className="text-lg font-semibold app-text">Appearance</h3>
        <p className="text-sm app-text-muted mt-1">Choose your preferred theme.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {themeCards.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setThemePreference(item.id)}
            className={`rounded-lg border p-4 text-left transition-colors ${
              theme === item.id
                ? "border-[var(--app-primary)] bg-[var(--app-surface-hover)]"
                : "border-[var(--app-border)] hover:bg-[var(--app-surface-hover)]"
            }`}
          >
            <item.icon className={`text-xl mb-2 ${item.iconClass}`} />
            <p className="text-sm font-semibold app-text">{item.title}</p>
            <p className="text-xs app-text-muted mt-1">{item.description}</p>

            <div className={`mt-3 rounded-md border p-3 ${item.preview.shell}`}>
              <div className={`h-2 w-14 rounded ${item.preview.linePrimary}`} />
              <div className={`h-2 w-20 rounded mt-2 ${item.preview.lineSecondary}`} />
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-lg app-border p-4">
        <p className="text-sm font-semibold app-text">Preview</p>
        <p className="text-xs app-text-muted mt-1">
          Selected: <span className="font-medium app-text">{theme}</span> | Active:{" "}
          <span className="font-medium app-text">{resolvedTheme}</span>
        </p>
        <p className="text-xs app-text-muted mt-2">
          Theme preference is saved locally and applied after reload.
        </p>
      </div>
    </div>
  );
};

export default AppearanceSection;

