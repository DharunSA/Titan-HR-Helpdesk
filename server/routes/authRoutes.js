import express from "express";
import dotenv from "dotenv";
import { body } from "express-validator";
import authMiddleware from "../controllers/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { validateFields } from "../middleware/validate.js";
import { changePassword, forgotPassword, getCurrentUser, loginUser, registerUser, resetPassword, updateProfile } from "../controllers/authController.js";

dotenv.config();
const router = express.Router();

// ✅ Register Route (Admin only)
router.post(
  "/register",
  authMiddleware,
  authorizeRoles("admin"),
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Provide a valid email address").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").optional().isIn(["admin", "employee"]).withMessage("Invalid role"),
    validateFields,
  ],
  registerUser
);

// ✅ Login Route
router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().withMessage("Provide a valid email address").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
    validateFields,
  ],
  loginUser
);

// ✅ Forgot Password — sends a reset link by email
router.post(
  "/forgot-password",
  authLimiter,
  [
    body("email").isEmail().withMessage("Provide a valid email address").normalizeEmail(),
    validateFields,
  ],
  forgotPassword
);

// ✅ Reset Password — consumes the emailed token
router.post(
  "/reset-password/:token",
  authLimiter,
  [
    body("newPassword").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    validateFields,
  ],
  resetPassword
);

// ✅ Current user profile (canonical source of truth)
router.get("/me", authMiddleware, getCurrentUser);

// ✅ Update own account (name + login email)
router.put(
  "/profile",
  authMiddleware,
  [
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("email").optional().isEmail().withMessage("Provide a valid email address").normalizeEmail(),
    validateFields,
  ],
  updateProfile
);

// ✅ Change Password (requires valid JWT)
router.put(
  "/change-password",
  authMiddleware,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
    validateFields,
  ],
  changePassword
);

export default router;
