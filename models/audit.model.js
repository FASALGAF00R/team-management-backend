import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    action: {
      type: String,
      required: true,
      enum: ["CREATE", "UPDATE", "DELETE", "LOGIN"],
    },

    entity: {
      type: String,
      required: true, // User, Role, Team
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    // ipAddress: {
    //   type: String,
    // },
  },
  { timestamps: true }
);

export default mongoose.model("auditlogs", auditLogSchema);
