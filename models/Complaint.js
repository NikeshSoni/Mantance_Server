import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "Maintenance",
        "Water",
        "Electricity",
        "Security",
        "Cleaning",
        "Parking",
        "Noise",
        "Other",
      ],
      default: "Other",
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "In Progress",
        "Resolved",
        "Rejected",
      ],
      default: "Pending",
    },

    adminRemark: {
      type: String,
      default: "",
    },

    actionTaken: {
      type: String,
      default: "",
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    image: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;