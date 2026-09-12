import mongoose from "mongoose";

const familyMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    relationship: {
      type: String,
      required: true,
    },

    gender: String,

    dateOfBirth: Date,

    phone: String,

    occupation: String,
  },
  { _id: true }
);

const memberRequestSchema = new mongoose.Schema(
  {
    // Building
    buildingName: {
      type: String,
      required: true,
    },

    flatNumber: {
      type: String,
      required: true,
    },

    floorNumber: {
      type: Number,
      required: true,
    },

    flatType: {
      type: String,
      required: true,
    },

    ownershipType: {
      type: String,
      enum: ["owner", "tenant"],
      required: true,
    },

    moveInDate: {
      type: Date,
      required: true,
    },

    // Member
    fullName: {
      type: String,
      required: true,
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    gender: String,

    dateOfBirth: Date,

    phone: {
      type: String,
      required: true,
    },

    // Linked Pending Registration
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PendingRegistration",
      default: null,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    aadhaarNumber: String,

    occupation: String,

    companyName: String,

    // Family
    totalFamilyMembers: {
      type: Number,
      default: 0,
    },

    familyMembers: [familyMemberSchema],

    // Emergency
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },

    // Request
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Created after approval
    approvedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "MemberRequest",
  memberRequestSchema
);