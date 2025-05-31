const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Report = require('../models/Report');
const { spawn } = require('child_process');
const { generateReportPDF } = require('../utils/pdfGenerator');
const User = require('../models/User');

// Configure multer for audio file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'audio');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only WAV, MP3, WebM files are allowed.'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Upload audio file and generate report
router.post('/audio', auth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    // Check if patient ID is provided
    if (!req.body.patientId) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }

    // If user is a patient, they can only upload for themselves
    if (req.user.role === 'patient' && req.body.patientId !== req.user.id) {
      return res.status(403).json({ error: 'Patients can only upload audio for themselves' });
    }

    // Ensure PDF directory exists with proper permissions
    const pdfDir = path.join(__dirname, '..', 'uploads', 'reports');
    if (!fs.existsSync(pdfDir)) {
      console.log('Creating PDF directory:', pdfDir);
      fs.mkdirSync(pdfDir, { recursive: true, mode: 0o755 });
    }

    // Fetch patient details
    const patient = await User.findById(req.body.patientId);
    const patientName = patient ? patient.name : 'N/A';
    const patientAge = patient ? patient.age : 'N/A';
    const patientGender = patient ? patient.gender : 'N/A';

    // Process audio using Python script
    console.log('Spawning Python process...');
    const pythonScriptPath = path.join(__dirname, '../../ml/process_audio.py');
    const audioFilePath = req.file.path;
    
    const pythonArgs = [
      pythonScriptPath,
      audioFilePath,
      patientName,
      patientAge,
      patientGender
    ];

    const pythonProcess = spawn('python', pythonArgs);

    let analysisData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      analysisData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error('Python script stderr:', data.toString());
      errorData += data.toString();
    });

    pythonProcess.on('close', async (code) => {
      if (code !== 0) {
        console.error('Python process exited with code', code);
        console.error('Python process stderr output:', errorData);
        if (errorData.includes('ModuleNotFoundError')) {
          return res.status(500).json({ error: 'Required Python libraries not installed on the server.' });
        }
        return res.status(500).json({ error: 'Audio processing failed on the server.' });
      }

      try {
        const analysis = JSON.parse(analysisData);
        console.log('Analysis data received from Python script:', analysis);
        
        // Extract just the emotion names without percentages from audioEmotions
        const emotionsToSave = Array.isArray(analysis.audioEmotions) 
          ? analysis.audioEmotions.map(emotion => emotion.split(' (')[0].toLowerCase())
          : [];

        console.log('Emotions to save:', emotionsToSave);

        // Create the report without the pdfPath initially
        const report = new Report({
          patient: req.body.patientId,
          doctor: req.user.role === 'doctor' ? req.user.id : null,
          audioFile: req.file.path,
          emotions: emotionsToSave,
          transcript: analysis.transcript,
          pitch: analysis.pitch,
          pace: analysis.pace,
          silence: analysis.silence,
          summary: analysis.summary,
        });

        // Save the report to get the _id
        console.log('Saving report with patient ID:', req.body.patientId);
        await report.save();
        console.log('Report saved successfully with ID:', report._id);

        try {
          // Generate PDF using the saved report
          console.log('Generating PDF for report ID:', report._id);
          const pdfPath = await generateReportPDF(report);
          console.log('PDF generated successfully at:', pdfPath);

          // Store the absolute path in the database
          report.pdfPath = pdfPath;
          await report.save();
          console.log('Report updated with PDF path successfully');

          // Verify PDF file exists and is readable
          try {
            await fs.promises.access(pdfPath, fs.constants.R_OK);
            const stats = await fs.promises.stat(pdfPath);
            console.log('PDF file verified:', {
              path: pdfPath,
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime
            });
          } catch (err) {
            console.error('PDF file verification failed:', err);
            // Don't throw error here, just log it
          }

          // Populate the patient field before generating and sending the response
          const populatedReport = await Report.findById(report._id)
            .populate('patient', 'name age gender')
            .populate('doctor', 'name');

          // Now generate PDF with the populated report
          console.log('Generating PDF with populated report for ID:', populatedReport._id);
          // Note: generateReportPDF expects the full report object, not just path
          const finalPdfPath = await generateReportPDF(populatedReport);
          console.log('PDF regenerated with populated data at:', finalPdfPath);
          
          // Update report with final PDF path (should be the same, but good practice)
          if (populatedReport.pdfPath !== finalPdfPath) {
              populatedReport.pdfPath = finalPdfPath;
              await populatedReport.save();
              console.log('Report PDF path updated after regeneration.');
          }

          console.log('Sending populated report:', populatedReport);
          res.json(populatedReport);
        } catch (pdfError) {
          console.error('Error generating PDF:', pdfError);
          // Still return the report even if PDF generation fails
          res.json(report);
        }
      } catch (err) {
        console.error('Error processing report:', err);
        res.status(500).json({ error: 'Error processing report' });
      }
    });
  } catch (err) {
    console.error('Error uploading audio:', err);
    res.status(500).json({ error: 'Error uploading audio' });
  }
});

module.exports = router;
