const Report = require('../models/Report');

const uploadReport = async (req, res) => {
  const { transcript, emotions, pitch, pace, silence, summary } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: "No audio file uploaded" });
  }
  if (!transcript || !emotions || !pitch || !pace || !silence || !summary) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const audioPath = req.file.path;

  try {
    const report = await Report.create({
      userId: req.user.id,
      audioPath,
      transcript,
      emotions,
      pitch,
      pace,
      silence,
      summary
    });
    res.status(201).json(report);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { uploadReport, getReports };
