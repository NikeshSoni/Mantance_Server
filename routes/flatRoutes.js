import express from "express";

import {
  createFlat,
  getAllFlats,
  getFlatById,
  updateFlat,
  deleteFlat,
  getFlatStats,
  getFlatsByWing,
} from "../controllers/flatController.js";

import {
  protect,
  adminOnly,
} from "../middleware/auth.middleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET ROUTES
|--------------------------------------------------------------------------
*/

// Get all flats
router.get("/", protect, getAllFlats);

// Get flat statistics
router.get("/stats", protect, getFlatStats);

// Get flats by wing
router.get("/wing/:wing", protect, getFlatsByWing);

// Get single flat
router.get("/:id", protect, getFlatById);


/*
|--------------------------------------------------------------------------
| ADMIN ROUTES
|--------------------------------------------------------------------------
*/

// Create flat
router.post("/", protect, adminOnly, createFlat);

// Update flat
router.put("/:id", protect, adminOnly, updateFlat);

// Delete flat
router.delete("/:id", protect, adminOnly, deleteFlat);


export default router;