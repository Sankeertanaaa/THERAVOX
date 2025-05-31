const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Report = require('../models/Report');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'reports');
if (!fs.existsSync(uploadsDir)) {
  console.log(`[Reports Router] Creating uploads directory: ${uploadsDir}`);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware to log all requests reaching this router
router.use((req, res, next) => {
  console.log(`[Reports Router] ${req.method} ${req.originalUrl}`);
  next();
});

// Get all reports for a patient
router.get('/user', auth, async (req, res) => {
  try {
    console.log(`[Reports Router] Fetching reports for patient: ${req.user.id}`);
    const reports = await Report.find({ patient: req.user.id })
      .populate('doctor', 'name')
      .sort({ createdAt: -1 });
    console.log(`[Reports Router] Found ${reports.length} reports for patient`);
    res.json({ reports });
  } catch (err) {
    console.error('[Reports Router] Error fetching patient reports:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all reports for a doctor (with optional age filter)
router.get('/doctor', auth, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      console.log(`[Reports Router] Unauthorized access attempt by user ${req.user.id} with role ${req.user.role}`);
      return res.status(403).json({ error: 'Not authorized' });
    }

    const doctorId = req.user.id;
    const { minAge, maxAge } = req.query;
    console.log(`[Reports Router] Fetching reports for doctor ${doctorId} with filters:`, { minAge, maxAge });

    let pipeline = [
      {
        $match: { 
          doctor: new mongoose.Types.ObjectId(doctorId)
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'patient',
          foreignField: '_id',
          as: 'patientDetails'
        }
      },
      { $unwind: '$patientDetails' }
    ];

    if (minAge || maxAge) {
      let ageMatch = {};
      if (minAge) ageMatch.$gte = parseInt(minAge);
      if (maxAge) ageMatch.$lte = parseInt(maxAge);
      pipeline.push({
        $match: { 'patientDetails.age': ageMatch }
      });
    }

    pipeline.push({
      $project: {
        _id: 1,
        emotions: 1,
        transcript: 1,
        pitch: 1,
        pace: 1,
        pdfPath: 1,
        createdAt: 1,
        patient: {
          _id: '$patientDetails._id',
          name: '$patientDetails.name',
          age: '$patientDetails.age',
          gender: '$patientDetails.gender'
        }
      }
    });

    pipeline.push({ $sort: { createdAt: -1 } });

    const reports = await Report.aggregate(pipeline);
    console.log(`[Reports Router] Found ${reports.length} reports for doctor ${doctorId}`);
    res.json({ reports });

  } catch (err) {
    console.error('[Reports Router] Error fetching doctor reports:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve PDF report
router.get('/:id/pdf', auth, async (req, res) => {
  try {
    const reportId = req.params.id;
    console.log(`[Reports Router] Attempting to serve PDF for report ${reportId}`);
    console.log(`[Reports Router] User requesting PDF: ${req.user.id} (${req.user.role})`);

    const report = await Report.findById(reportId)
      .populate('patient', 'name age gender')
      .populate('doctor', 'name');
    
    if (!report) {
      console.log(`[Reports Router] Report ${reportId} not found`);
      return res.status(404).json({ error: 'Report not found' });
    }
    
    console.log(`[Reports Router] Found report:`, {
      id: report._id,
      patient: report.patient?._id,
      doctor: report.doctor?._id,
      pdfPath: report.pdfPath
    });
    
    if (!report.pdfPath) {
      console.log(`[Reports Router] PDF path missing for report ${reportId}`);
      return res.status(404).json({ error: 'PDF not found (pdfPath missing)' });
    }

    // Check if user has permission to access this report
    const isPatient = report.patient && report.patient._id.toString() === req.user.id;
    const isConcernedDoctor = report.doctor && report.doctor._id.toString() === req.user.id;
    
    console.log(`[Reports Router] Access check:`, {
      isPatient,
      isConcernedDoctor,
      reportPatientId: report.patient?._id,
      reportDoctorId: report.doctor?._id,
      requestingUserId: req.user.id
    });
    
    if (!isPatient && !isConcernedDoctor) {
      console.log(`[Reports Router] Unauthorized PDF access attempt by user ${req.user.id} (${req.user.role})`);
      return res.status(403).json({ error: 'Not authorized to access this PDF' });
    }
    
    // Extract the filename from the absolute path
    const filename = path.basename(report.pdfPath);
    const pdfPath = path.join(__dirname, '..', 'uploads', 'reports', filename);
    console.log(`[Reports Router] Attempting to serve PDF from: ${pdfPath}`);

    // Add logging for debugging the path
    console.log(`[Reports Router] PDF path from DB: ${report.pdfPath}`);
    console.log(`[Reports Router] Constructed server path: ${pdfPath}`);

    try {
      // Check if file exists
      if (!fs.existsSync(pdfPath)) {
        console.error(`[Reports Router] PDF file does not exist: ${pdfPath}`);
        return res.status(404).json({ error: 'PDF file not found' });
      }

      // Check file permissions
      await fs.promises.access(pdfPath, fs.constants.R_OK);
      const stats = await fs.promises.stat(pdfPath);
      
      if (stats.size === 0) {
        console.error(`[Reports Router] PDF file is empty: ${pdfPath}`);
        return res.status(500).json({ error: 'PDF file is empty' });
      }

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Stream the file
      const fileStream = fs.createReadStream(pdfPath);
      
      fileStream.on('error', (error) => {
        console.error(`[Reports Router] Error streaming PDF: ${error.message}`);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error streaming PDF file' });
        }
      });

      fileStream.on('end', () => {
        console.log(`[Reports Router] Successfully streamed PDF for report ${reportId}`);
      });

      fileStream.pipe(res);

    } catch (err) {
      console.error(`[Reports Router] Error accessing PDF: ${err.message}`);
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'PDF file not found' });
      }
      return res.status(500).json({ error: 'Error accessing PDF file' });
    }
  } catch (err) {
    console.error(`[Reports Router] Server error serving PDF: ${err.message}`);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single report
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('patient', 'name age gender')
      .populate('doctor', 'name');

    if (!report) {
      console.log(`[Reports Router] Report ${req.params.id} not found`);
      return res.status(404).json({ error: 'Report not found' });
    }

    if (report.patient._id.toString() !== req.user.id && 
        report.doctor._id.toString() !== req.user.id && 
        req.user.role !== 'doctor') {
      console.log(`[Reports Router] Unauthorized access attempt by user ${req.user.id} (${req.user.role})`);
      return res.status(403).json({ error: 'Not authorized' });
    }

    console.log(`[Reports Router] Successfully retrieved report ${req.params.id}`);
    res.json(report);
  } catch (err) {
    console.error(`[Reports Router] Error fetching report: ${err.message}`);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add notes to a report (doctor only)
router.put('/:id/notes', auth, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      console.log(`[Reports Router] Unauthorized notes update attempt by user ${req.user.id} (${req.user.role})`);
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { notes } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      console.log(`[Reports Router] Report ${req.params.id} not found for notes update`);
      return res.status(404).json({ error: 'Report not found' });
    }

    if (report.doctor.toString() !== req.user.id) {
      console.log(`[Reports Router] Unauthorized notes update attempt by doctor ${req.user.id} for report ${req.params.id}`);
      return res.status(403).json({ error: 'Only the uploading doctor can add notes' });
    }

    report.notes = notes;
    await report.save();
    console.log(`[Reports Router] Successfully updated notes for report ${req.params.id}`);

    res.json(report);
  } catch (err) {
    console.error(`[Reports Router] Error updating notes: ${err.message}`);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;