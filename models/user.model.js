import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      select: false, 
    },

   roles: [
  {
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },
    validFrom: Date,
    validTill: Date,
    revoked: { type: Boolean, default: false }

  },
],
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
