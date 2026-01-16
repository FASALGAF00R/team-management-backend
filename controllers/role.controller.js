import Role from "../models/role.model.js";
import auditLogger from "../src/utils/Auditlogger.js";

/**
 * Create Role
 */
export const createRole = async (req, res) => {
  try {
    const { name, permissions, description } = req.body;

    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ message: "Role already exists" });
    }

    const role = await Role.create({
      name,
      permissions,
      description,
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
 * Update Role Permissions
 */
export const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissions, description } = req.body;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    if (permissions) role.permissions = permissions;
    if (description !== undefined) role.description = description;

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
 * Delete Role (Optional)
 */
export const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;

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
