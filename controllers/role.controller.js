import Role from "../models/role.model.js";
import auditLogger from "../src/utils/Auditlogger.js";

/**
 * Create Role
 */
export const createRole = async (req, res) => {
  try {
    const { name, permissions, description, validFrom, validTill } = req.body;

    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ message: "Role already exists" });
    }

    const role = await Role.create({
      name,
      permissions,
      description,
      validFrom: validFrom || new Date(),
      validTill: validTill || null,
    });

     await auditLogger({
      userId: req.user._id,
      action: "CREATE",
      entity: "Role",
      entityId: role._id,
      ipAddress: req.ip,
    });


    res.status(201).json({
      success: true,
      message: "Role created successfully",
      role,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get All Roles
 */
export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });
    res.json({ success: true, roles });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get Public Roles (for registration form - no auth required)
 * Returns only role names and IDs for dropdown selection
 */
export const getPublicRoles = async (req, res) => {
  try {
    const roles = await Role.find({ isActive: true })
      .select("_id name")
      .sort({ name: 1 });
    res.json({ success: true, roles });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update Role Permissions
 */
export const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissions, description, validFrom, validTill, name } = req.body;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Check if user has this role - prevent editing own role
    const userHasThisRole = req.user.roles?.some(
      r => r.role?._id?.toString() === roleId || r.role?.toString() === roleId
    );
    
    if (userHasThisRole) {
      return res.status(400).json({ 
        message: "You cannot edit the role you currently have. Another admin must do this." 
      });
    }

    if (permissions) role.permissions = permissions;
    if (description !== undefined) role.description = description;
    if (name !== undefined) role.name = name;
    if (validFrom !== undefined) role.validFrom = validFrom;
    if (validTill !== undefined) role.validTill = validTill;

    await role.save();

    res.json({
      success: true,
      message: "Role updated successfully",
      role,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete Role
 */
export const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    // Check if user has this role - prevent deleting own role
    const userHasThisRole = req.user.roles?.some(
      r => r.role?._id?.toString() === roleId || r.role?.toString() === roleId
    );
    
    if (userHasThisRole) {
      return res.status(400).json({ 
        message: "You cannot delete the role you currently have. Another admin must do this." 
      });
    }

    const role = await Role.findByIdAndDelete(roleId);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
