import User from "../models/User.js";

export const getDashboardStats = async (req, res) => {
  try {
    const totalResidents = await User.countDocuments({
      role: "resident",
    });

    res.status(200).json({
      success: true,
      data: {
        totalResidents,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};