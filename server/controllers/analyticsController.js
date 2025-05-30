const Report = require("../models/Report");
const User = require("../models/User");

exports.getAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.role !== "doctor") {
      return res.status(403).json({ error: "Access Denied" });
    }

    const reports = await Report.aggregate([
      {
        $group: {
          _id: "$userId",
          avgPitch: { $avg: "$pitch" },
          emotionCount: { $push: "$emotions" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: "$patient" },
    ]);

    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
