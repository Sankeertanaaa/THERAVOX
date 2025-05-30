const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, age, gender, phone } = req.body;
    
    // Build profile object
    const profileFields = {};
    if (name) profileFields.name = name;
    if (email) profileFields.email = email;
    if (age) profileFields.age = age;
    if (gender) profileFields.gender = gender;
    if (phone) profileFields.phone = phone;

    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user
    user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: profileFields },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all doctors (for patients)
router.get('/doctors', auth, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const doctors = await User.find({ role: 'doctor' })
      .select('name email specialization');
    res.json(doctors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all patients for a doctor
router.get('/patients', auth, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    console.log('Fetching patients for doctor ID:', req.user.id);

    // Get all patients who have appointments with this doctor
    const patients = await User.aggregate([
      {
        $lookup: {
          from: 'appointments',
          let: { patientId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$patient', '$$patientId'] },
                    { $eq: ['$doctor', new mongoose.Types.ObjectId(req.user.id)] }
                  ]
                }
              }
            }
          ],
          as: 'appointments'
        }
      },
      {
        $match: {
          role: 'patient',
          'appointments.0': { $exists: true } // Only include patients who have at least one appointment
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          age: 1,
          gender: 1
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);
    
    console.log('Found patients:', patients);
    res.json(patients);
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Debug route to check appointments (temporary)
router.get('/debug/appointments', auth, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const appointments = await mongoose.model('Appointment').find({
      doctor: req.user.id
    }).populate('patient', 'name email age gender');

    console.log('Debug - Appointments for doctor:', appointments);
    res.json({ appointments });
  } catch (err) {
    console.error('Error in debug route:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 