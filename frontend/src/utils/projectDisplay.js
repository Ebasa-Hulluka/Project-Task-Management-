/**
 * Display name for project lists (e.g. "Testing Project 1" → "Project 1").
 */
export const getProjectDisplayName = (name) => {
  if (!name || typeof name !== "string") {
    return "Untitled Project";
  }

  const trimmed = name.trim();
  const testingMatch = trimmed.match(/^testing\s+project\s+(\d+)\s*$/i);
  if (testingMatch) {
    return `Project ${testingMatch[1]}`;
  }

  const stripped = trimmed.replace(/^testing\s+/i, "").trim();
  return stripped || trimmed;
};

export const sortProjectsByDisplayName = (projects = []) =>
  [...projects].sort((a, b) =>
    getProjectDisplayName(a?.name).localeCompare(getProjectDisplayName(b?.name), undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
