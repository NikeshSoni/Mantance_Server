const Flat = require("../models/Flat");

// ==========================================
// CREATE FLAT
// ==========================================
export const createFlat = async (req, res) => {
  try {
    const {
      flatNumber,
      wing,
      floor,
      owner,
      resident,
      occupancyStatus,
      residentType,
      maintenanceStatus,
      monthlyMaintenance,
    } = req.body;

    if (!flatNumber || !wing || floor === undefined) {
      return res.status(400).json({
        success: false,
        message: "Flat number, wing and floor are required",
      });
    }

    // Check duplicate
    const existingFlat = await Flat.findOne({
      flatNumber: flatNumber.trim(),
      wing: wing.trim().toUpperCase(),
    });

    if (existingFlat) {
      return res.status(409).json({
        success: false,
        message: "This flat already exists in this wing",
      });
    }

    const flat = await Flat.create({
      flatNumber: flatNumber.trim(),
      wing: wing.trim().toUpperCase(),
      floor,
      owner: owner || null,
      resident: resident || null,
      occupancyStatus: occupancyStatus || "vacant",
      residentType: residentType || "none",
      maintenanceStatus: maintenanceStatus || "pending",
      monthlyMaintenance: monthlyMaintenance || 0,
    });

    const populatedFlat = await Flat.findById(flat._id)
      .populate("owner", "name email phone")
      .populate("resident", "name email phone");

    return res.status(201).json({
      success: true,
      message: "Flat created successfully",
      flat: populatedFlat,
    });
  } catch (error) {
    console.error("Create flat error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create flat",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL FLATS
// ==========================================
const getAllFlats = async (req, res) => {
  try {
    const {
      wing,
      floor,
      occupancyStatus,
      residentType,
      maintenanceStatus,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {
      isActive: true,
    };

    if (wing) {
      filter.wing = wing.toUpperCase();
    }

    if (floor !== undefined) {
      filter.floor = Number(floor);
    }

    if (occupancyStatus) {
      filter.occupancyStatus = occupancyStatus;
    }

    if (residentType) {
      filter.residentType = residentType;
    }

    if (maintenanceStatus) {
      filter.maintenanceStatus = maintenanceStatus;
    }

    if (search) {
      filter.$or = [
        {
          flatNumber: {
            $regex: search,
            $options: "i",
          },
        },
        {
          wing: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [flats, total] = await Promise.all([
      Flat.find(filter)
        .populate("owner", "name email phone")
        .populate("resident", "name email phone")
        .sort({
          wing: 1,
          floor: 1,
          flatNumber: 1,
        })
        .skip(skip)
        .limit(Number(limit)),

      Flat.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      flats,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get flats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch flats",
      error: error.message,
    });
  }
};

// ==========================================
// GET SINGLE FLAT
// ==========================================
const getFlatById = async (req, res) => {
  try {
    const { id } = req.params;

    const flat = await Flat.findOne({
      _id: id,
      isActive: true,
    })
      .populate("owner", "name email phone")
      .populate("resident", "name email phone");

    if (!flat) {
      return res.status(404).json({
        success: false,
        message: "Flat not found",
      });
    }

    return res.status(200).json({
      success: true,
      flat,
    });
  } catch (error) {
    console.error("Get flat error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch flat",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE FLAT
// ==========================================
const updateFlat = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      flatNumber,
      wing,
      floor,
      owner,
      resident,
      occupancyStatus,
      residentType,
      maintenanceStatus,
      monthlyMaintenance,
    } = req.body;

    const flat = await Flat.findOne({
      _id: id,
      isActive: true,
    });

    if (!flat) {
      return res.status(404).json({
        success: false,
        message: "Flat not found",
      });
    }

    if (flatNumber !== undefined) {
      flat.flatNumber = flatNumber.trim();
    }

    if (wing !== undefined) {
      flat.wing = wing.trim().toUpperCase();
    }

    if (floor !== undefined) {
      flat.floor = floor;
    }

    if (owner !== undefined) {
      flat.owner = owner || null;
    }

    if (resident !== undefined) {
      flat.resident = resident || null;
    }

    if (occupancyStatus !== undefined) {
      flat.occupancyStatus = occupancyStatus;
    }

    if (residentType !== undefined) {
      flat.residentType = residentType;
    }

    if (maintenanceStatus !== undefined) {
      flat.maintenanceStatus = maintenanceStatus;
    }

    if (monthlyMaintenance !== undefined) {
      flat.monthlyMaintenance = monthlyMaintenance;
    }

    await flat.save();

    const updatedFlat = await Flat.findById(flat._id)
      .populate("owner", "name email phone")
      .populate("resident", "name email phone");

    return res.status(200).json({
      success: true,
      message: "Flat updated successfully",
      flat: updatedFlat,
    });
  } catch (error) {
    console.error("Update flat error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update flat",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE FLAT
// ==========================================
const deleteFlat = async (req, res) => {
  try {
    const { id } = req.params;

    const flat = await Flat.findOne({
      _id: id,
      isActive: true,
    });

    if (!flat) {
      return res.status(404).json({
        success: false,
        message: "Flat not found",
      });
    }

    // Soft delete
    flat.isActive = false;

    await flat.save();

    return res.status(200).json({
      success: true,
      message: "Flat deleted successfully",
    });
  } catch (error) {
    console.error("Delete flat error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete flat",
      error: error.message,
    });
  }
};

// ==========================================
// FLAT STATISTICS
// ==========================================
const getFlatStats = async (req, res) => {
  try {
    const stats = await Flat.aggregate([
      {
        $match: {
          isActive: true,
        },
      },
      {
        $facet: {
          total: [
            {
              $count: "count",
            },
          ],

          occupied: [
            {
              $match: {
                occupancyStatus: "occupied",
              },
            },
            {
              $count: "count",
            },
          ],

          vacant: [
            {
              $match: {
                occupancyStatus: "vacant",
              },
            },
            {
              $count: "count",
            },
          ],

          ownerOccupied: [
            {
              $match: {
                residentType: "owner",
              },
            },
            {
              $count: "count",
            },
          ],

          tenantOccupied: [
            {
              $match: {
                residentType: "tenant",
              },
            },
            {
              $count: "count",
            },
          ],

          maintenancePaid: [
            {
              $match: {
                maintenanceStatus: "paid",
              },
            },
            {
              $count: "count",
            },
          ],

          maintenancePending: [
            {
              $match: {
                maintenanceStatus: "pending",
              },
            },
            {
              $count: "count",
            },
          ],
        },
      },
    ]);

    const result = stats[0];

    const getCount = (data) => data[0]?.count || 0;

    return res.status(200).json({
      success: true,

      stats: {
        totalFlats: getCount(result.total),
        occupiedFlats: getCount(result.occupied),
        vacantFlats: getCount(result.vacant),
        ownerOccupied: getCount(result.ownerOccupied),
        tenantOccupied: getCount(result.tenantOccupied),
        maintenancePaid: getCount(result.maintenancePaid),
        maintenancePending: getCount(result.maintenancePending),
      },
    });
  } catch (error) {
    console.error("Flat stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch flat statistics",
      error: error.message,
    });
  }
};

// ==========================================
// GET FLATS BY WING
// ==========================================
const getFlatsByWing = async (req, res) => {
  try {
    const { wing } = req.params;

    const flats = await Flat.find({
      wing: wing.toUpperCase(),
      isActive: true,
    })
      .populate("owner", "name email phone")
      .populate("resident", "name email phone")
      .sort({
        floor: 1,
        flatNumber: 1,
      });

    return res.status(200).json({
      success: true,
      wing: wing.toUpperCase(),
      count: flats.length,
      flats,
    });
  } catch (error) {
    console.error("Get wing flats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch wing flats",
      error: error.message,
    });
  }
};

module.exports = {
//   createFlat,
  getAllFlats,
  getFlatById,
  updateFlat,
  deleteFlat,
  getFlatStats,
  getFlatsByWing,
};