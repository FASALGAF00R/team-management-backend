import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Role from "../models/role.model.js";
import auditLogger from "../src/utils/Auditlogger.js";

/**
 * REGISTER USER
 * (Usually only Admin will call this later,
 * but for now we keep it open for testing)
 */
export const register = async (req, res) => {
  const { name, email, password, roleId, teamId } = req.body;

  // Check existing user
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Check role
  const role = await Role.findById(roleId);
  if (!role) {
    return res.status(400).json({ message: "Invalid role" });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user with roles array as per schema
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    roles: [{ role: roleId }],
    team: teamId || null,
  });

  // Log registration event
  await auditLogger({
    userId: user._id,
    action: "REGISTER",
    entity: "User",
    entityId: user._id,
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: role.name,
    },
  });
};

/**
 * LOGIN USER
 */

export const login = async (req, res) => {
  const { email, password } = req.body;

  // Find user + password + populate the role reference inside roles array
  const user = await User.findOne({ email }).select("+password").populate("roles.role");
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.isActive) {
    return res.status(403).json({ message: "User is inactive" });
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Get the first active (non-revoked) role from the roles array
  const activeRole = user.roles.find(r => !r.revoked && r.role);
  const roleData = activeRole?.role; // This is the populated Role document

  // Generate token
  const token = jwt.sign(
    {
      userId: user._id,
      roleId: roleData?._id || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: "10d" }
  );

  await auditLogger({
    userId: user._id,
    action: "LOGIN",
    entity: "User",
    entityId: user._id,
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: {
        id: roleData?._id,
        name: roleData?.name || null,
        permissions: roleData?.permissions || [],
      },
    },
  });
};
