import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // Hide password by default
    },

    role: {
      type: String,
      enum: ["admin", "resident", "security", "secretary"],
      default: "resident",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Resident Profile & Flat details (populated upon approval)
    buildingName: {
      type: String,
      default: "",
    },

    flatNumber: {
      type: String,
      default: "",
    },

    floorNumber: {
      type: Number,
      default: null,
    },

    flatType: {
      type: String,
      default: "",
    },

    ownershipType: {
      type: String,
      enum: ["owner", "tenant", ""],
      default: "",
    },

    moveInDate: {
      type: Date,
      default: null,
    },

    phone: {
      type: String,
      default: "",
    },

    alternatePhone: {
      type: String,
      default: "",
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    gender: {
      type: String,
      default: "",
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    aadhaarNumber: {
      type: String,
      default: "",
    },

    occupation: {
      type: String,
      default: "",
    },

    companyName: {
      type: String,
      default: "",
    },

    totalFamilyMembers: {
      type: Number,
      default: 0,
    },

    familyMembers: [
      {
        name: String,
        relationship: String,
        gender: String,
        dateOfBirth: Date,
        phone: String,
        occupation: String,
      },
    ],

    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpire: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);