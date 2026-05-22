const Team = require("../models/Team");
const User = require("../models/User");
const mongoose = require("mongoose");
const { notifyAdmins } = require("../utils/notificationService");
const { getUserRoles } = require("../utils/userRoles");

const TEAM_MEMBER_ONLY_MESSAGE = "Only active team members can be selected for a team.";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findTeamByNameCaseInsensitive = (trimmedName) =>
  Team.findOne({ name: new RegExp(`^${escapeRegExp(trimmedName)}$`, "i") });

const validateTeamMemberIds = async (memberIds) => {
  if (!memberIds.length) return true;

  if (memberIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    return false;
  }

  const usersCount = await User.countDocuments({
    _id: { $in: memberIds },
    isActive: { $ne: false },
    status: "active",
    $or: [
      { roles: "teamMember" },
      { role: "teamMember", roles: { $exists: false } },
      { role: "teamMember", roles: { $size: 0 } },
    ],
  });

  return usersCount === memberIds.length;
};

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private (Admin only)
const createTeam = async (req, res) => {
  try {
    const { name, description, members, lead } = req.body;

    const trimmedName = typeof name === "string" ? name.trim() : "";
    if (!trimmedName) {
      return res.status(400).json({ message: "Team name is required" });
    }

    const existingTeam = await findTeamByNameCaseInsensitive(trimmedName);
    if (existingTeam) {
      return res
        .status(400)
        .json({ message: "Team with this name already exists" });
    }

    const memberIds = Array.isArray(members) ? [...new Set(members)] : [];

    if (lead && !memberIds.includes(lead)) {
      return res
        .status(400)
        .json({ message: "Team lead must be selected from team members" });
    }

    if (memberIds.length > 0) {
      const hasValidMembers = await validateTeamMemberIds(memberIds);
      if (!hasValidMembers) {
        return res.status(400).json({ message: TEAM_MEMBER_ONLY_MESSAGE });
      }
    }

    const team = await Team.create({
      name: trimmedName,
      description,
      members: memberIds,
      lead: lead || null,
      createdBy: req.user._id,
    });

    // Update users with team reference
    if (memberIds.length > 0) {
      await User.updateMany({ _id: { $in: memberIds } }, { team: team._id });
    }

    if (lead) {
      await User.findByIdAndUpdate(lead, { team: team._id });
    }

    const populatedTeam = await Team.findById(team._id)
      .populate("members", "name email profileImageUrl")
      .populate("lead", "name email profileImageUrl")
      .populate("createdBy", "name email");

    await notifyAdmins({
      type: "team_created",
      message: `New team created: ${team.name}`,
      link:
        req.user.role === "projectManager" ? "/manager/teams" : "/admin/teams",
    });

    res.status(201).json({
      success: true,
      message: "Team created successfully",
      team: populatedTeam,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Team with this name already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get all teams
// @route   GET /api/teams
// @access  Private
const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("members", "name email profileImageUrl")
      .populate("lead", "name email profileImageUrl")
      .populate("projects", "name status")
      .populate("createdBy", "name email");

    // Add member count to each team
    const teamsWithCount = teams.map((team) => ({
      ...team._doc,
      memberCount: team.members?.length || 0,
      projectCount: team.projects?.length || 0,
    }));

    res.json(teamsWithCount);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get team by ID
// @route   GET /api/teams/:id
// @access  Private
const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid team ID format" });
    }

    const team = await Team.findById(id)
      .populate("members", "name email profileImageUrl role")
      .populate("lead", "name email profileImageUrl")
      .populate("projects", "name status progress")
      .populate("createdBy", "name email");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private (Admin only)
const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid team ID format" });
    }

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const { name, description, members, lead } = req.body;

    if (name !== undefined && name !== null) {
      const trimmedName = typeof name === "string" ? name.trim() : "";
      if (!trimmedName) {
        return res.status(400).json({ message: "Team name cannot be empty" });
      }
      const nameChanged =
        trimmedName.toLowerCase() !== String(team.name || "").toLowerCase();
      if (nameChanged) {
        const duplicate = await findTeamByNameCaseInsensitive(trimmedName);
        if (duplicate && duplicate._id.toString() !== id) {
          return res
            .status(400)
            .json({ message: "Team with this name already exists" });
        }
      }
      team.name = trimmedName;
    }
    if (description !== undefined) {
      team.description = description;
    }
    const memberIds = Array.isArray(members)
      ? [...new Set(members.map((id) => id.toString()))]
      : null;

    if (lead && memberIds && !memberIds.includes(lead.toString())) {
      return res
        .status(400)
        .json({ message: "Team lead must be selected from team members" });
    }

    if (memberIds) {
      const hasValidMembers = await validateTeamMemberIds(memberIds);
      if (!hasValidMembers) {
        return res.status(400).json({ message: TEAM_MEMBER_ONLY_MESSAGE });
      }
    }

    team.lead = lead || (memberIds && !memberIds.includes(team.lead?.toString()) ? null : team.lead);

    // Update members if changed
    if (memberIds) {
      // Remove team reference from old members
      await User.updateMany(
        { team: id, _id: { $nin: memberIds } },
        { $unset: { team: "" } },
      );

      // Add team reference to new members
      await User.updateMany({ _id: { $in: memberIds } }, { team: id });

      team.members = memberIds;
    }

    const updatedTeam = await team.save();

    const populatedTeam = await Team.findById(updatedTeam._id)
      .populate("members", "name email profileImageUrl")
      .populate("lead", "name email profileImageUrl")
      .populate("projects", "name status");

    res.json({
      message: "Team updated successfully",
      team: populatedTeam,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({
        message: "Team with this name already exists",
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private (Admin only)
const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid team ID format" });
    }

    // Check if team has projects
    const Team = require("../models/Team");
    const team = await Team.findById(id).populate("projects");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.projects && team.projects.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete team with assigned projects. Remove projects first.",
      });
    }

    // Remove team reference from users
    await User.updateMany({ team: id }, { $unset: { team: "" } });

    await team.deleteOne();
    res.json({ message: "Team deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Add member to team
// @route   POST /api/teams/:id/members
// @access  Private (Admin only)
const addMemberToTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isTeamMember =
      getUserRoles(user).includes("teamMember") &&
      user.isActive !== false &&
      user.status === "active";

    if (!isTeamMember) {
      return res.status(400).json({ message: TEAM_MEMBER_ONLY_MESSAGE });
    }

    // Check if user is already in team
    if (team.members.includes(userId)) {
      return res
        .status(400)
        .json({ message: "User is already a member of this team" });
    }

    team.members.push(userId);
    await team.save();

    // Update user's team reference
    user.team = id;
    await user.save();

    const updatedTeam = await Team.findById(id).populate(
      "members",
      "name email profileImageUrl",
    );

    res.json({
      message: "Member added to team successfully",
      team: updatedTeam,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Remove member from team
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private (Admin only)
const removeMemberFromTeam = async (req, res) => {
  try {
    const { id, userId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if user is in team
    if (!team.members.includes(userId)) {
      return res
        .status(400)
        .json({ message: "User is not a member of this team" });
    }

    // Remove user from team
    team.members = team.members.filter(
      (member) => member.toString() !== userId,
    );

    // If user was team lead, remove lead
    if (team.lead && team.lead.toString() === userId) {
      team.lead = null;
    }

    await team.save();

    // Remove team reference from user
    await User.findByIdAndUpdate(userId, { $unset: { team: "" } });

    const updatedTeam = await Team.findById(id).populate(
      "members",
      "name email profileImageUrl",
    );

    res.json({
      message: "Member removed from team successfully",
      team: updatedTeam,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update team lead
// @route   PUT /api/teams/:id/lead
// @access  Private (Admin only)
const updateTeamLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { lead } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid team ID format" });
    }

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (lead) {
      if (!mongoose.Types.ObjectId.isValid(lead)) {
        return res.status(400).json({ message: "Invalid lead ID format" });
      }
      const isMember = team.members.some((member) => member.toString() === lead);
      if (!isMember) {
        return res
          .status(400)
          .json({ message: "Team lead must be selected from team members" });
      }
      const user = await User.findById(lead);
      if (!user || user.role !== "teamMember" || user.isActive === false || user.status !== "active") {
        return res.status(400).json({ message: TEAM_MEMBER_ONLY_MESSAGE });
      }
      team.lead = lead;
    } else {
      team.lead = null;
    }

    await team.save();

    const updatedTeam = await Team.findById(id)
      .populate("members", "name email profileImageUrl")
      .populate("lead", "name email profileImageUrl")
      .populate("projects", "name status");

    res.json({
      message: "Team lead updated successfully",
      team: updatedTeam,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createTeam,
  getAllTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addMemberToTeam,
  removeMemberFromTeam,
  updateTeamLead,
};
