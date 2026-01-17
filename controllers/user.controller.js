import User from "../models/user.model.js";
import Role from "../models/role.model.js";
import Team from "../models/team.model.js";
import auditLogger from "../src/utils/Auditlogger.js";

export const createUser = async (req, res) => {
  try {
    const { name, email, password, roles, teamId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!Array.isArray(roles) || roles.length === 0) {
  console.warn("Creating user without any role");
}

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    //  Validate & normalize roles

    const normalizedRoles = [];

    if (Array.isArray(roles) && roles.length > 0) {
      for (const r of roles) {
        if (!r.role)
          return res.status(400).json({ message: "Role ID is required" });

        const roleDoc = await Role.findById(r.role);
        if (!roleDoc) return res.status(400).json({ message: "Invalid role" });

        normalizedRoles.push({
          role: roleDoc._id,
          validFrom: r.validFrom ? new Date(r.validFrom) : new Date(),
          validTill: r.validTill ? new Date(r.validTill) : null,
          revoked: false,
        });
      }
    }
    // If roles are empty or missing, normalizedRoles will just stay empty

    // for (const r of roles) {
    //   if (!r.role) {
    //     return res.status(400).json({ message: "Role ID is required" });
    //   }

    //   const roleDoc = await Role.findById(r.role);
    //   if (!roleDoc) {
    //     return res.status(400).json({ message: "Invalid role" });
    //   }

    //   normalizedRoles.push({
    //     role: roleDoc._id,
    //     validFrom: r.validFrom ? new Date(r.validFrom) : new Date(),
    //     validTill: r.validTill ? new Date(r.validTill) : null,
    //     revoked: false // force safe default
    //   });
    // }

    // 4️ Validate team (optional)
    const team = teamId ? await Team.findById(teamId) : null;

    // 5️ Hash password
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6️ Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      roles: normalizedRoles,
      team: team ? team._id : null,
    });

    await auditLogger({
      user: req.user._id, // fasal (admin)
      action: "CREATE",
      entity: "User",
      entityId: user._id,
      // ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: normalizedRoles.map((r) => r.role),
        team: team ? team.name : null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getUsers = async (req, res) => {
  try {

  let query = {};

// Check if user has a "user.read" permission
const permissions = req.user.roles.flatMap(r => r.role.permissions);

if (permissions.some(p => p.key === "user.read" && p.scope === "global")) {
  // Global scope → no filter, can see all users
  query = {};
} else if (permissions.some(p => p.key === "user.read" && p.scope === "team")) {
  // Team scope → filter by team
  query.team = req.user.team?._id;
} else if (permissions.some(p => p.key === "user.read" && p.scope === "self")) {
  // Self scope → filter only own user
  query._id = req.user._id;
}


// Fetch users
const users = await User.find(query)
  .populate("roles.role")
  .populate("team", "name")
  .select("-password");

    // const users = await User.find()
    //   .populate("roles.role")
    //   .populate("team", "name")
    //   .select("-password");

    res.json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update User Role / Team (Admin Only)
 */
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roles: roleUpdates, teamId, isActive, name, email, password } = req.body;

    // 1️⃣ Fetch user to update
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2️⃣ Check permissions
    const permissions = req.user.roles.flatMap(r => r.role.permissions);
    const updatePerm = permissions.find(p => p.key === "user.update");

    if (!updatePerm) {
      return res.status(403).json({ message: "You do not have permission to update users" });
    }

    // 2a️⃣ Scope enforcement
    if (updatePerm.scope === "self" && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Cannot update other users" });
    }

    if (updatePerm.scope === "team" && user.team?.toString() !== req.user.team?.toString()) {
      return res.status(403).json({ message: "Cannot update users outside your team" });
    }

    // 3️⃣ Update allowed fields

    // Self-scope users can only update name, email, password
    if (updatePerm.scope === "self" || updatePerm.scope === "team" || updatePerm.scope === "global") {
      if (name) user.name = name;
      if (email) user.email = email;
      if (password) {
        const bcrypt = await import("bcryptjs");
        user.password = await bcrypt.hash(password, 10);
      }
    }

    // 4️⃣ Update roles (only global scope)
    if (roleUpdates && updatePerm.scope === "global") {
      // Prevent user from changing their own role
      const isSelfUpdate = userId === req.user._id.toString();
      console.log('Role update check:', { userId, reqUserId: req.user._id.toString(), isSelfUpdate });
      
      if (isSelfUpdate) {
        return res.status(400).json({ 
          message: "You cannot change your own role. Another admin must do this." 
        });
      }

      const normalizedRoles = [];
      for (const r of roleUpdates) {
        const roleDoc = await Role.findById(r.role);
        if (!roleDoc) return res.status(400).json({ message: "Invalid role" });

        normalizedRoles.push({
          role: roleDoc._id,
          validFrom: r.validFrom ? new Date(r.validFrom) : new Date(),
          validTill: r.validTill ? new Date(r.validTill) : null,
          revoked: false
        });
      }
      user.roles = normalizedRoles;
    }

    // 5️⃣ Update team (only global scope)
    if (teamId && updatePerm.scope === "global") {
      const newTeam = await Team.findById(teamId);
      if (!newTeam) return res.status(400).json({ message: "Invalid team" });

      // Decrement old team count
      if (user.team) {
        const oldTeam = await Team.findById(user.team);
        if (oldTeam) {
          oldTeam.membersCount = Math.max(0, oldTeam.membersCount - 1);
          await oldTeam.save();
        }
      }

      newTeam.membersCount += 1;
      await newTeam.save();
      user.team = newTeam._id;
    }

    // 6️⃣ Update active status (only global scope)
    if (typeof isActive === "boolean" && updatePerm.scope === "global") {
      user.isActive = isActive;
    }

    // 7️⃣ Save user
    await user.save();

    // 8️⃣ Response
    res.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete User (Admin Only)
 */
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent self-deletion
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ 
        message: "You cannot delete your own account" 
      });
    }

    // Find and delete user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If user belongs to a team, decrement team members count
    if (user.team) {
      const team = await Team.findById(user.team);
      if (team) {
        team.membersCount = Math.max(0, team.membersCount - 1);
        await team.save();
      }
    }

    await User.findByIdAndDelete(userId);

    await auditLogger({
      userId: req.user._id,
      action: "DELETE",
      entity: "User",
      entityId: userId,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
