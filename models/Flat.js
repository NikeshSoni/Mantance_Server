const mongoose = require("mongoose");

const flatSchema = new mongoose.Schema(
  {
    flatNumber: {
      type: String,
      required: [true, "Flat number is required"],
      trim: true,
    },

    wing: {
      type: String,
      required: [true, "Wing is required"],
      trim: true,
      uppercase: true,
    },

    floor: {
      type: Number,
      required: [true, "Floor is required"],
      min: 0,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    occupancyStatus: {
      type: String,
      enum: ["occupied", "vacant"],
      default: "vacant",
    },

    residentType: {
      type: String,
      enum: ["owner", "tenant", "none"],
      default: "none",
    },

    maintenanceStatus: {
      type: String,
      enum: ["paid", "pending"],
      default: "pending",
    },

    monthlyMaintenance: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate flat numbers within the same wing
flatSchema.index(
  {
    flatNumber: 1,
    wing: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Flat", flatSchema);