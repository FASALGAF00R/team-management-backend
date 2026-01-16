import Team from "../models/team.model.js";
import User from "../models/user.model.js";
import auditLogger from "../src/utils/Auditlogger.js";

/**
 * Create Team
 */
export const createTeam = async (req, res) => {
  try {
    const { name } = req.body;

    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      return res.status(400).json({ message: "Team already exists" });
    }

    const team = await Team.create({ name });


  await auditLogger({
  userId: req.user._id,
  action: "CREATE",
  entity: "Team",
  entityId: team._id,
  // ipAddress: req.ip,
});


    res.status(201).json({
      success: true,
      message: "Team created successfully",
      team,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get All Teams
 */
export const getTeams = async (req, res) => {
  try {
    const teams = await Team.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      teams,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update Team Name/members
 */
export const updateTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (name) team.name = name;

    await team.save();

    res.json({
      success: true,
      message: "Team updated successfully",
      team,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete Team (only if no users)
 */
export const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    const usersInTeam = await User.countDocuments({ team: teamId });
    if (usersInTeam > 0) {
      return res.status(400).json({
        message: "Cannot delete team with assigned users",
      });
    }

    const team = await Team.findByIdAndDelete(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
