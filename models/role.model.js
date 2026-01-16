import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      uppercase: true, // ADMIN, MANAGER
      trim: true,
    },
    validFrom: { type: Date, default: Date.now },
    validTill: Date,
    isActive: { type: Boolean, default: true },
    permissions: [
      {
        key: String, // user.read
        scope: {
          type: String,
          enum: ["self", "team", "global"],
          default: "global",
        },
        validFrom: Date,
        validTill: Date,
        revoked: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
      },
    ],

    description: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Role", roleSchema);
