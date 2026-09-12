import Complaint from "../models/Complaint.js";

export const createComplaint = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      image,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const complaint = await Complaint.create({
      resident: req.user.id,
      title,
      description,
      category,
      priority,
      image,
    });

    return res.status(201).json({
      success: true,
      message: "Complaint raised successfully",
      complaint,
    });
  } catch (error) {
    console.error("Create Complaint Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create complaint",
      error: error.message,
    });
  }
};


export const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      resident: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      complaints,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaints",
    });
  }
};


export const getAllComplaints = async (req, res) => {
  try {
    const { status, category, priority } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const complaints = await Complaint.find(filter)
      .populate("resident", "name email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      complaints,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaints",
    });
  }
};



export const takeComplaintAction = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      status,
      actionTaken,
      adminRemark,
    } = req.body || {};

    console.log("Complaint ID:", id);
    console.log("Request Body:", req.body);
    console.log("Admin User:", req.user);

    if (!status && !actionTaken && !adminRemark) {
      return res.status(400).json({
        success: false,
        message: "At least one action field is required",
      });
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (status) {
      complaint.status = status;
    }

    if (actionTaken) {
      complaint.actionTaken = actionTaken;
    }

    if (adminRemark) {
      complaint.adminRemark = adminRemark;
    }

    if (status === "Resolved") {
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    return res.status(200).json({
      success: true,
      message: "Complaint action updated successfully",
      complaint,
    });

  } catch (error) {
    console.error("Take Complaint Action Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update complaint",
      error: error.message,
    });
  }
};


// export const takeComplaintAction = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // const { id } = req.params;

//     console.log("=================================");
//     console.log("Complaint ID:", id);
//     console.log("Request Method:", req.method);
//     console.log("Request Body:", req.body);
//     console.log("Authenticated User:", req.user);
//     console.log("=================================");

//     const {
//       status,
//       actionTaken,
//       adminRemark,
//     } = req.body || {};

//     console.log("Complaint ID:", id);
//     console.log("Request Body:", req.body);
//     console.log("Admin User:", req.user);

//     if (!status && !actionTaken && !adminRemark) {
//       return res.status(400).json({
//         success: false,
//         message: "At least one action field is required",
//       });
//     }

//     const complaint = await Complaint.findById(id);

//     if (!complaint) {
//       return res.status(404).json({
//         success: false,
//         message: "Complaint not found",
//       });
//     }

//     if (status) {
//       complaint.status = status;
//     }

//     if (actionTaken) {
//       complaint.actionTaken = actionTaken;
//     }

//     if (adminRemark) {
//       complaint.adminRemark = adminRemark;
//     }

//     if (status === "Resolved") {
//       complaint.resolvedAt = new Date();
//     }

//     await complaint.save();

//     return res.status(200).json({
//       success: true,
//       message: "Complaint action updated successfully",
//       complaint,
//     });

//   } catch (error) {
//     console.error("Take Complaint Action Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to update complaint",
//       error: error.message,
//     });
//   }
// };