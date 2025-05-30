const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  audioFile: {
    type: String,
    required: true
  },
  emotions: [{
    type: String,
    enum: ['angry', 'calm', 'disgust', 'fearful', 'happy', 'neutral', 'sad', 'surprised']
  }],
  transcript: {
    type: String,
    required: true
  },
  pitch: {
    type: Number,
    required: true
  },
  pace: {
    type: Number,
    required: true
  },
  silence: {
    type: Number,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  pdfPath: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', reportSchema);
