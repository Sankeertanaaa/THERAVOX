const { exec } = require("child_process");
const path = require("path");
const Report = require("../models/Report");
const User = require("../models/User");

const handleAudioUpload = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file uploaded" });
  }
  const audioPath = req.file.path;
  const userId = req.user.id;
  const pyScript = path.resolve(__dirname, "../../ml/process_audio.py");

  exec(`py -3.10 "C:/Users/DELL/SPEECH-EMOTION-RECOGNITION/ml/process_audio.py" "${audioPath}"`, async (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr });
    try {
      const result = JSON.parse(stdout);
      if (!result.transcript || !result.emotions) {
        return res.status(400).json({ error: "Invalid model output" });
      }
      const report = new Report({ userId, audioPath, ...result });
      await report.save();
      res.json({ report });
    } catch (err) {
      res.status(500).json({ error: "Failed to parse model output" });
    }
  });
};

const getUserReports = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    let reports;
    if (user.role === "doctor") {
      reports = await Report.find().populate("user", "email role").sort({ createdAt: -1 });
    } else {
      reports = await Report.find({ userId: req.user.id }).sort({ createdAt: -1 });
    }

    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

module.exports = { handleAudioUpload, getUserReports };
