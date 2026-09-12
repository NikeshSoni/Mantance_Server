import express from "express";

import {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  takeComplaintAction,
} from "../controllers/complaintController.js";

import { protect } from "../middleware/auth.middleware.js";
import { adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// Resident routes
router.post("/", protect, createComplaint);

router.get("/my", protect, getMyComplaints);

// Admin routes
router.get("/", protect, adminOnly,  getAllComplaints);

router.patch(
  "/:id/action",
  protect,
  adminOnly,
  takeComplaintAction
);

export default router;