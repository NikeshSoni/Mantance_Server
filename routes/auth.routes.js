import express from "express";

import {
    register,
    login,
    forgotPassword,
    resetPassword,
} from "../controllers/auth.controller.js";

import { getDashboardStats } from "../controllers/dashboard.controller.js";
// import { verifyToken, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

router.get(
    "/admin/dashboard/stats",
    // verifyToken,
    // isAdmin,
    getDashboardStats
);

export default router;