import mongoose from "mongoose";
import MemberRequest from "../models/MemberRequest.js";
import User from "../models/User.js";
import PendingRegistration from "../models/PendingRegistration.js";

/**
 * POST /api/member-requests
 * Submit a new membership request linked with PendingRegistration
 */

export const createMemberRequest = async (req, res) => {
  try {
    const {
      registrationId,
      email,
      buildingName,
      flatNumber,
      floorNumber,
      flatType,
      ownershipType,
      moveInDate,
      fullName,
      profilePhoto,
      gender,
      dateOfBirth,
      phone,
      alternatePhone,
      aadhaarNumber,
      occupation,
      companyName,
      totalFamilyMembers,
      familyMembers,
      emergencyContact,
    } = req.body;

    if (!buildingName || !flatNumber || !fullName || !phone) {
      return res.status(400).json({
        success: false,
        message: "Building name, flat number, full name, and phone are required.",
      });
    }

    let memberEmail = email;

    // If registrationId is provided, verify it exists
    if (registrationId) {
      const pending = await PendingRegistration.findById(registrationId);
      if (pending) {
        memberEmail = pending.email;
      }
    }

    // Check duplicate pending request for same flat
    const existingFlatRequest = await MemberRequest.findOne({
      buildingName,
      flatNumber,
      status: "pending",
    });

    if (existingFlatRequest) {
      return res.status(400).json({
        success: false,
        message: "A pending membership request already exists for this flat.",
      });
    }

    // Check duplicate pending request for same email
    if (memberEmail) {
      const existingEmailRequest = await MemberRequest.findOne({
        email: memberEmail.toLowerCase().trim(),
        status: "pending",
      });

      if (existingEmailRequest) {
        return res.status(400).json({
          success: false,
          message: "A pending membership request already exists for this email address.",
        });
      }
    }

    const request = await MemberRequest.create({
      registrationId: registrationId || null,
      email: memberEmail ? memberEmail.toLowerCase().trim() : "",
      buildingName,
      flatNumber,
      floorNumber: Number(floorNumber) || 0,
      flatType: flatType || "2BHK",
      ownershipType: ownershipType || "owner",
      moveInDate: moveInDate ? new Date(moveInDate) : new Date(),
      fullName,
      profilePhoto: profilePhoto || "",
      gender: gender || "",
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      phone,
      alternatePhone: alternatePhone || "",
      aadhaarNumber: aadhaarNumber || "",
      occupation: occupation || "",
      companyName: companyName || "",
      totalFamilyMembers: familyMembers?.length || Number(totalFamilyMembers) || 0,
      familyMembers: familyMembers || [],
      emergencyContact: emergencyContact || {},
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Membership request submitted successfully.",
      data: {
        _id: request._id,
        status: request.status,
        fullName: request.fullName,
        email: request.email,
      },
    });
  } catch (error) {
    console.error("Create Member Request Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit member request.",
    });
  }
};

/**
* PUT /api/member-requests/:id/approve
* Admin approves a request -> converts PendingRegistration to active User
*/

export const approveMemberRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await MemberRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Member request not found.",
      });
    }

    if (request.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Request has already been approved.",
      });
    }

    // Find linked PendingRegistration
    let registration = null;
    if (request.registrationId) {
      registration = await PendingRegistration.findById(request.registrationId);
    }
    if (!registration && request.email) {
      registration = await PendingRegistration.findOne({ email: request.email.toLowerCase() });
    }

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Pending registration details not found for this request.",
      });
    }

    const email = registration.email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `An active user with email ${email} already exists.`,
      });
    }

    // Create REAL active User with already-hashed password from PendingRegistration
    const user = await User.create({
      name: request.fullName || registration.name,
      email: email,
      password: registration.password, // Already hashed
      role: "resident",
      isActive: true,
      buildingName: request.buildingName,
      flatNumber: request.flatNumber,
      floorNumber: request.floorNumber,
      flatType: request.flatType,
      ownershipType: request.ownershipType,
      moveInDate: request.moveInDate,
      profilePhoto: request.profilePhoto || "",
      gender: request.gender || "",
      dateOfBirth: request.dateOfBirth || null,
      phone: request.phone,
      alternatePhone: request.alternatePhone || "",
      aadhaarNumber: request.aadhaarNumber || "",
      occupation: request.occupation || "",
      companyName: request.companyName || "",
      totalFamilyMembers: request.totalFamilyMembers || request.familyMembers?.length || 0,
      familyMembers: request.familyMembers || [],
      emergencyContact: request.emergencyContact || {},
    });

    // Update PendingRegistration
    registration.status = "approved";
    await registration.save();

    // Update MemberRequest
    request.status = "approved";
    request.approvedUser = user._id;
    request.reviewedBy = req.user?._id || null;
    request.reviewedAt = new Date();
    await request.save();

    return res.status(200).json({
      success: true,
      message: "Resident approved and account created successfully.",
      data: {
        userId: user._id,
        requestId: request._id,
        status: request.status,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Approve member error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to approve member request.",
    });
  }
};

/**
 * PUT /api/member-requests/:id/reject
 * Admin rejects a member request
 */

export const rejectMemberRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await MemberRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Member request not found.",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This request has already been processed.",
      });
    }

    request.status = "rejected";
    request.reviewedBy = req.user?._id || null;
    request.reviewedAt = new Date();
    await request.save();

    // Update PendingRegistration if linked
    if (request.registrationId) {
      await PendingRegistration.findByIdAndUpdate(request.registrationId, {
        status: "rejected",
      });
    } else if (request.email) {
      await PendingRegistration.findOneAndUpdate(
        { email: request.email.toLowerCase() },
        { status: "rejected" }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Member request rejected successfully.",
    });
  } catch (error) {
    console.error("Reject member request error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reject member request.",
    });
  }
};

/**
 * GET /api/member-requests
 * Admin gets all requests (or filtered by status); Resident gets their own
*/

export const getMemberRequests = async (req, res) => {
  try {
    if (req.user?.role === "admin") {
      const { status } = req.query;
      const filter = status ? { status } : { status: "pending" };
      const requests = await MemberRequest.find(filter).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: requests,
      });
    }

    const request = await MemberRequest.findOne({
      email: req.user.email.toLowerCase(),
    }).sort({ createdAt: -1 });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "No membership request found for this user.",
      });
    }

    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error("Get member requests error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get member requests.",
    });
  }
};

/**
 * GET /api/member-requests/:id
 * Public status check for a specific request ID (used by /resident/request-status)
 */
export const getMemberRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid membership request ID format.",
      });
    }

    const request = await MemberRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Membership request not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error("Get member request by id error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch request status.",
    });
  }
};
