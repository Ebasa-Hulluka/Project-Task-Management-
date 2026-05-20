/**
 * Projects store `team` as an array of Team refs. When populated, each item
 * includes `name`, `members`, and `lead`. This flattens members for avatars
 * and collects display names.
 */
export function getProjectTeamDisplay(projectTeams) {
  if (!Array.isArray(projectTeams) || projectTeams.length === 0) {
    return { teamNames: [], users: [] };
  }

  const teamNames = [];
  const byId = new Map();

  for (const t of projectTeams) {
    if (!t || typeof t !== "object") continue;

    if (t.name) teamNames.push(t.name);

    const addUser = (u) => {
      if (u && typeof u === "object" && u._id) {
        byId.set(String(u._id), {
          _id: u._id,
          name: u.name || "Member",
          email: u.email,
          profileImageUrl: u.profileImageUrl,
          role: u.role || "teamMember",
        });
      }
    };

    (t.members || []).forEach(addUser);
    if (t.lead) addUser(typeof t.lead === "object" ? t.lead : null);
  }

  return {
    teamNames,
    users: [...byId.values()],
  };
}
