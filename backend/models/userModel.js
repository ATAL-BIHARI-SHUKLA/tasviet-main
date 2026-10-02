import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    displayName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userType: {
      type: String,
      enum: ["employee", "admin", "accountant", "management"],
      required: true,
    },
    
    // Profile fields (editable by user)
    phone: { type: String, default: "" },
    department: { type: String, default: "" },
    position: { type: String, default: "" },
    
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    isSuspended: { type: Boolean, default: false },
    suspendedReason: { type: String },

    requests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Request", // assuming you name the model "Request"
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
