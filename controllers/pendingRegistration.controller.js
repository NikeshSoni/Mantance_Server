import bcrypt from "bcryptjs";
import  PendingRegistration from "../models/PendingRegistration.js";

export const createPendingRegistration =
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role,
      } = req.body;

      if (
        !name ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All fields are required.",
        });
      }

      /*
       * Check if already pending
       */
      const existing =
        await  PendingRegistration.findOne({
          email,
        });

      if (existing) {
        return res.status(400).json({
          success: false,
          message:
            "A registration request already exists for this email.",
        });
      }

      /*
       * Hash password
       */
      const hashedPassword =
        await bcrypt.hash(password, 10);

      /*
       * Create pending registration
       */
      const registration =
        await PendingRegistration.create({
          name,
          email,
          password: hashedPassword,
          role: role || "resident",
          status: "pending",
        });

      res.status(201).json({
        success: true,
        message:
          "Registration started. Please complete your information.",
        data: {
          _id: registration._id,
          name: registration.name,
          email: registration.email,
          role: registration.role,
          status: registration.status,
        },
      });
    } catch (error) {
      console.error(
        "Pending registration error:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };