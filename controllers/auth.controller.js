import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import { setAuthCookie } from "../middleware/auth.middleware.js";
import PendingRegistration from "../models/PendingRegistration.js";
import MemberRequest from "../models/MemberRequest.js";
import Admin from "../models/Admin.js";

export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "resident",
      adminPasscode,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

  // ==========================================
// 1. ADMIN REGISTRATION
// ==========================================
if (role === "admin") {
  // Check Admin collection
  const existingAdmin = await Admin.findOne({
    email: normalizedEmail,
  });

  if (existingAdmin) {
    return res.status(400).json({
      success: false,
      message: "An admin account already exists with this email.",
    });
  }

  // Verify admin passcode
  const expectedPasscode =
    process.env.ADMIN_PASSCODE || "MySociety@2026";

  if (!adminPasscode || adminPasscode !== expectedPasscode) {
    return res.status(403).json({
      success: false,
      message: "Invalid Admin Passcode. Verification failed.",
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create Admin
  const adminUser = await Admin.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    isActive: true,
  });

  // JWT
  const token = jwt.sign(
    {
      id: adminUser._id,
      role: "admin",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  setAuthCookie(res, token);

  return res.status(201).json({
    success: true,
    message: "Admin registered successfully.",
    token,
    user: {
      id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      role: "admin",
    },
  });
}

    // ==========================================
    // 2. CHECK USER COLLECTION
    // ==========================================
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account already exists with this email address.",
      });
    }

    // ==========================================
    // 3. RESIDENT REGISTRATION
    // ==========================================
    const hashedPassword = await bcrypt.hash(password, 10);

    let pending = await PendingRegistration.findOne({
      email: normalizedEmail,
    });

    if (pending) {
      if (pending.status === "approved") {
        return res.status(400).json({
          success: false,
          message: "Registration already approved. Please sign in.",
        });
      }

      pending.name = name.trim();
      pending.password = hashedPassword;
      pending.role = "resident";
      pending.status = "pending";

      await pending.save();
    } else {
      pending = await PendingRegistration.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "resident",
        status: "pending",
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "Registration started. Please complete your member details.",
      registrationId: pending._id,
      data: {
        _id: pending._id,
        name: pending.name,
        email: pending.email,
        role: pending.role,
        status: pending.status,
      },
    });
  } catch (err) {
    console.error("Register Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Registration failed",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ==========================================
    // 1. CHECK ADMIN COLLECTION
    // ==========================================
    const admin = await Admin.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (admin) {
      // Check active status
      if (admin.isActive === false) {
        return res.status(403).json({
          success: false,
          message:
            "Admin account is inactive. Please contact the system administrator.",
        });
      }

      // Check password
      const match = await bcrypt.compare(
        password,
        admin.password
      );

      if (!match) {
        return res.status(400).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      // Create Admin JWT
      const token = jwt.sign(
        {
          id: admin._id,
          role: "admin",
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      setAuthCookie(res, token);

      return res.status(200).json({
        success: true,
        message: "Admin login successful",
        token,
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: "admin",
          phone: admin.phone || "",
          profilePhoto: admin.profilePhoto || "",
        },
      });
    }

    // ==========================================
    // 2. CHECK USER COLLECTION
    // ==========================================
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      // Check pending registration
      const pendingReg = await PendingRegistration.findOne({
        email: normalizedEmail,
      });

      // Check pending member request
      const pendingReq = await MemberRequest.findOne({
        email: normalizedEmail,
        status: "pending",
      });

      if (
        pendingReq ||
        (pendingReg && pendingReg.status === "pending")
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your registration is waiting for admin approval. You can login once approved.",
        });
      }

      return res.status(404).json({
        success: false,
        message: "User not found with this email.",
      });
    }

    // ==========================================
    // 3. CHECK USER ACTIVE STATUS
    // ==========================================
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message:
          "Account is inactive. Please contact your society admin.",
      });
    }

    // ==========================================
    // 4. CHECK USER PASSWORD
    // ==========================================
    const match = await bcrypt.compare(
      password,
      user.password
    );

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // ==========================================
    // 5. CREATE USER JWT
    // ==========================================
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        buildingName: user.buildingName || "",
        flatNumber: user.flatNumber || "",
        phone: user.phone || "",
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {

  try {
    const { email } = req.body;

    console.log(email);


    const user = await User.findOne({ email });

    if (!user) {

      return res.status(404).json({
        message: "No account found"
      });

    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    console.log(resetToken, "resetToken");


    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    console.log(resetUrl, "resetUrl");


    await sendEmail(
      user.email,
      "Password Reset",
      `
                <h2>Password Reset</h2>

                <p>Click below link</p>

                <a href="${resetUrl}">
                Reset Password
                </a>

                <p>Link expires in 15 minutes.</p>
            `
    );

    res.json({
      message: "Reset link sent successfully"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }

}

export const resetPassword = async (req, res) => {

  const token = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({

    resetPasswordToken: token,

    resetPasswordExpire: {
      $gt: Date.now()
    }

  });

  if (!user) {

    return res.status(400).json({
      message: "Invalid or expired token"
    });

  }

  const hash = await bcrypt.hash(req.body.password, 10);

  user.password = hash;

  user.resetPasswordToken = undefined;

  user.resetPasswordExpire = undefined;

  await user.save();

  res.json({
    message: "Password updated successfully"
  });

}