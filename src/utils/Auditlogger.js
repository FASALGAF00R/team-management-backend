import AuditLog from "../../models/audit.model.js";

const auditLogger = async ({
  userId,
  action,
  entity,
  entityId,
  ipAddress,
}) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      entity,
      entityId,
      ipAddress,
    });
  } catch (error) {
    console.error("Audit log failed:", error.message);
  }
};

export default auditLogger;
