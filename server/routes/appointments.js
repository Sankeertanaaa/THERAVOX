const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');
const mongoose = require('mongoose'); // Import mongoose

// Get patient's appointment history (both upcoming and past)
router.get('/history', auth, async (req, res) => {
  try {
    const currentDate = new Date();
    
    // Get upcoming appointments
    const upcomingAppointments = await Appointment.find({
      patient: req.user.id,
      date: { $gte: currentDate },
      status: { $in: ['upcoming'] }
    })
    .populate('doctor', 'name email specialization')
    .sort({ date: 1 });

    // Get past appointments
    const pastAppointments = await Appointment.find({
      patient: req.user.id,
      $or: [
        { date: { $lt: currentDate } },
        { status: { $in: ['done', 'not_visited', 'cancelled'] } }
      ]
    })
    .populate('doctor', 'name email specialization')
    .sort({ date: -1 });

    res.json({
      upcoming: upcomingAppointments,
      past: pastAppointments
    });
  } catch (error) {
    console.error('Error fetching appointment history:', error);
    res.status(500).json({ error: 'Error fetching appointment history' });
  }
});

// Book an appointment
router.post('/book', auth, async (req, res) => {
  try {
    const { doctorId, date, time, notes } = req.body;
    const patientId = req.user.id;

    // Validate doctor exists
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Create appointment
    const appointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      date: new Date(`${date}T${time}`),
      notes
    });

    await appointment.save();

    // Create notification for doctor
    const notification = new Notification({
      recipient: doctorId,
      sender: patientId,
      type: 'appointment',
      message: `New appointment request from ${req.user.name}`,
      appointment: appointment._id
    });

    await notification.save();

    // Get patient details for the response
    const patient = await User.findById(patientId).select('name email phone');

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: {
        ...appointment.toObject(),
        patient
      }
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: 'Error booking appointment' });
  }
});

// Get doctor's appointments with optional age filter
router.get('/doctor', auth, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const doctorId = req.user.id;
    console.log('Fetching appointments for doctor ID:', doctorId);
    const { minAge, maxAge } = req.query; // Get age filter parameters

    let pipeline = [
      { // Initial match by doctor ID
        $match: { doctor: new mongoose.Types.ObjectId(doctorId) }
      },
      { // Join with users collection to get patient details
        $lookup: {
          from: 'users', 
          localField: 'patient',
          foreignField: '_id',
          as: 'patientDetails'
        }
      },
      { // Deconstruct the patientDetails array, preserving appointments without matching patients
        $unwind: { path: '$patientDetails', preserveNullAndEmptyArrays: true }
      },
    ];

    // Add age filtering if parameters are provided
    if (minAge || maxAge) {
      let ageMatch = {};
      if (minAge) {
        ageMatch.$gte = parseInt(minAge);
      }
      if (maxAge) {
        ageMatch.$lte = parseInt(maxAge);
      }
      pipeline.push({
        $match: {
          $or: [
            { 'patientDetails.age': ageMatch }, // Match if patientDetails exists and age matches
            { patientDetails: null } // Include appointments where patientDetails is null (no patient found)
          ]
        }
      });
    }

     // Reshape the output to match the desired structure including patient details
     pipeline.push({
       $project: {
         _id: 1,
         patient: { 
           _id: '$patientDetails._id', 
           name: '$patientDetails.name', 
           age: '$patientDetails.age', 
           gender: '$patientDetails.gender' 
         },
         doctor: 1,
         date: 1,
         time: 1,
         notes: 1,
         status: 1,
         createdAt: 1
       }
     });

    // Sort by date and time
    pipeline.push({ $sort: { date: 1, time: 1 } }); // Sort upcoming first

    const appointments = await Appointment.aggregate(pipeline);

    // Separate into upcoming and past appointments on the server side
    const now = new Date();
    console.log('Current server time:', now.toISOString());

    const upcoming = appointments.filter(app => {
      // Use the date field directly which is a Date object
      const appointmentDateTime = app.date;
      const isValidDate = appointmentDateTime instanceof Date && !isNaN(appointmentDateTime.getTime());
      console.log(`Checking upcoming: App ID ${app._id}, DateTime: ${isValidDate ? appointmentDateTime.toISOString() : 'Invalid Date'}, Status: ${app.status}, isValidDate: ${isValidDate}, isUpcoming: ${isValidDate && appointmentDateTime >= now && app.status === 'upcoming'}`);
      return isValidDate && appointmentDateTime >= now && app.status === 'upcoming';
    });

    const past = appointments.filter(app => {
      // An appointment is past if it's not upcoming.
      const isUpcoming = app.date >= now && app.status === 'upcoming';
      console.log(`Checking past: App ID ${app._id}, DateTime: ${app.date?.toISOString()}, Status: ${app.status}, isUpcoming: ${isUpcoming}, isPast: ${!isUpcoming}`);
      return !isUpcoming;
    });

    console.log('Server sending appointments - Upcoming:', upcoming);
    console.log('Server sending appointments - Past:', past);

    res.status(200).json({
      upcoming: upcoming,
      past: past
    });

  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ error: 'Error fetching appointments' });
  }
});

// Update appointment status (done/not visited)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Only doctor can update status
    if (req.user.role !== 'doctor' || appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate status
    if (!['done', 'not_visited'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    appointment.status = status;
    await appointment.save();

    // Create notification for patient
    const notification = new Notification({
      recipient: appointment.patient,
      sender: req.user.id,
      type: 'appointment',
      message: `Your appointment has been marked as ${status === 'done' ? 'completed' : 'not visited'}`,
      appointment: appointment._id
    });

    await notification.save();

    res.json({ message: 'Appointment status updated', appointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Error updating appointment' });
  }
});

// Cancel an appointment
router.delete('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Only patient can cancel the appointment
    if (appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    // Create notification for doctor
    const notification = new Notification({
      recipient: appointment.doctor,
      sender: req.user.id,
      type: 'appointment',
      message: `Appointment has been cancelled by ${req.user.name}`,
      appointment: appointment._id
    });

    await notification.save();

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Error cancelling appointment' });
  }
});

module.exports = router; 