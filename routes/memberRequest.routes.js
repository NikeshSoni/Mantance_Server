import express from "express";

import {
  createMemberRequest,
  getMemberRequests,
  getMemberRequestById,
  approveMemberRequest,
  rejectMemberRequest,
} from "../controllers/memberRequest.controller.js";

import {
  protect,
  adminOnly,
} from "../middleware/auth.middleware.js";

const router = express.Router();

/*
 * NEW USER / RESIDENT
 * No login required
 */
router.post("/", createMemberRequest);

/*
 * AUTHENTICATED
 * Admin: all pending requests | Resident: own request by email
 */
router.get(
  "/",
  protect,
  getMemberRequests
);

/*
 * NEW USER
 * Check request status using request ID
 */
router.get("/:id", getMemberRequestById);

/*
 * ADMIN
 * Approve → Create User
 */
router.put(
  "/:id/approve",
  protect,
  adminOnly,
  approveMemberRequest
);

/*
 * ADMIN
 * Reject request
 */
router.put(
  "/:id/reject",
  protect,
  adminOnly,
  rejectMemberRequest
);

export default router;