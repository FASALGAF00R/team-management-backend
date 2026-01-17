import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Role from "../models/role.model.js";
import User from "../models/user.model.js";

dotenv.config();
// for admin role
const ADMIN_PERMISSIONS = [
  { key: "user.create", scope: "global" },
  { key: "user.read", scope: "global" },
  { key: "user.update", scope: "global" },
  { key: "user.delete", scope: "global" },
  { key: "team.create", scope: "global" },
  { key: "team.read", scope: "global" },
  { key: "team.update", scope: "global" },
  { key: "team.delete", scope: "global" },
  { key: "role.create", scope: "global" },
  { key: "role.read", scope: "global" },
  { key: "role.update", scope: "global" },
  { key: "role.delete", scope: "global" },
  { key: "audit.read", scope: "global" },
];


const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(" Connected to MongoDB");

    let adminRole = await Role.findOne({ name: "ADMIN" });

    if (!adminRole) {
      adminRole = await Role.create({
        name: "ADMIN",
        description: "Super Admin role with all  globalpermissions",
        isActive: true,
        permissions: ADMIN_PERMISSIONS.map((perm) => ({
          key: perm.key,
          scope: perm.scope,
          revoked: false,
          isActive: true,
        })),
      });
      console.log(" ADMIN role created successfully");
    } else {
      console.log("  ADMIN role already exists");
    }

    const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const adminPassword = process.env.ADMIN_PASSWORD || "admin@123";
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const adminUser = await User.create({
        name: "Super Admin",
        email: adminEmail,
        password: hashedPassword,
        isActive: true,
        roles: [
          {
            role: adminRole._id,
            revoked: false,
          },
        ],
      });
      console.log(" Admin user created successfully");
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${process.env.ADMIN_PASSWORD || "Admin@123"}`);
    } else {
      console.log("ℹ  Admin user already exists");
    }

    console.log("\n Seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error(" Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
