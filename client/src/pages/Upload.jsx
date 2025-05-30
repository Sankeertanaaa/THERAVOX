import React, { useState, useRef, useEffect } from "react";
import { API, getPatients } from "../api";
import {
  Box, Typography, Paper, Button, Stack, LinearProgress, IconButton, Slider, Alert, CircularProgress, Card, CardContent, Grid,
  FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import {
  Mic, Stop, PlayArrow, Pause, Upload as UploadIcon, ContentCut, Save, Delete, Audiotrack, GraphicEq
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import api from '../utils/api';
import { generateSummary } from '../utils/summaryGenerator';

export default function Upload() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [trimmedBlob, setTrimmedBlob] = useState(null);
  const [trimRange, setTrimRange] = useState([0, 0]);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getPatients();
        setPatients(data);
      } catch (err) {
        setError("Failed to fetch patients");
      }
    };

    if (user?.role === "doctor") {
      fetchPatients();
    }
  }, [user]);

  // Handle file upload
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setAudioURL(URL.createObjectURL(selectedFile));
    setRecordedBlob(null);
    setTrimmedBlob(null);
    setReport(null);
    setError("");
  };

  // Start recording
  const startRecording = async () => {
    setError("");
    setReport(null);
    setFile(null);
    setRecordedBlob(null);
    setTrimmedBlob(null);
    setAudioURL(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setRecordedBlob(audioBlob);
        setAudioURL(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError("Microphone access denied or not available.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // When audio loads, set duration and default trim range
  const handleLoadedMetadata = () => {
    const duration = audioRef.current.duration;
    setAudioDuration(duration);
    // Only set trim range initially or if it's [0,0]
    if (trimRange[0] === 0 && trimRange[1] === 0) {
        setTrimRange([0, duration]);
    }
  };


  // Trim audio using Web Audio API
  const handleTrim = async () => {
    try {
      const blob = file || recordedBlob;
      if (!blob) {
        setError("No audio file to trim");
        return;
      }

      setLoading(true);
      const arrayBuffer = await blob.arrayBuffer();
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      const [start, end] = trimRange;
      const startSample = Math.floor(start * audioBuffer.sampleRate);
      const endSample = Math.floor(end * audioBuffer.sampleRate);
      const trimmedLength = endSample - startSample;

      if (trimmedLength <= 0) {
        setError("Invalid trim range");
        setLoading(false);
        audioCtx.close(); // Close context on error
        return;
      }

      const trimmedBuffer = audioCtx.createBuffer(
        audioBuffer.numberOfChannels,
        trimmedLength,
        audioBuffer.sampleRate
      );

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel).slice(startSample, endSample);
        trimmedBuffer.copyToChannel(channelData, channel, 0);
      }

      // Calculate duration of the trimmed audio
      const newDuration = trimmedBuffer.length / trimmedBuffer.sampleRate;


      // Export trimmed buffer to WAV
      const wavBlob = await bufferToWavBlob(trimmedBuffer);
      setTrimmedBlob(wavBlob);
      setAudioURL(URL.createObjectURL(wavBlob));
      setFile(null); // So we don't accidentally upload the original
      setRecordedBlob(null);

      // Update duration and reset trim range for the trimmed audio
      setAudioDuration(newDuration);
      setTrimRange([0, newDuration]);


      audioCtx.close();
      setLoading(false);
    } catch (err) {
      console.error("Error trimming audio:", err);
      setError("Failed to trim audio");
      setLoading(false);
    }
  };

  // Helper: Convert AudioBuffer to WAV Blob
  async function bufferToWavBlob(buffer) {
    // This is a minimal WAV encoder for PCM 16-bit
    function encodeWAV(audioBuffer) {
      const numChannels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const format = 1; // PCM
      const bitDepth = 16;
      const samples = audioBuffer.length;
      const blockAlign = numChannels * bitDepth / 8;
      const byteRate = sampleRate * blockAlign;
      const dataLength = samples * blockAlign;
      const bufferLength = 44 + dataLength;
      const arrayBuffer = new ArrayBuffer(bufferLength);
      const view = new DataView(arrayBuffer);

      function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      }

      let offset = 0;
      writeString(view, offset, 'RIFF'); offset += 4;
      view.setUint32(offset, 36 + dataLength, true); offset += 4;
      writeString(view, offset, 'WAVE'); offset += 4;
      writeString(view, offset, 'fmt '); offset += 4;
      view.setUint32(offset, 16, true); offset += 4;
      view.setUint16(offset, format, true); offset += 2;
      view.setUint16(offset, numChannels, true); offset += 2;
      view.setUint32(offset, sampleRate, true); offset += 4;
      view.setUint32(offset, byteRate, true); offset += 4;
      view.setUint16(offset, blockAlign, true); offset += 2;
      view.setUint16(offset, bitDepth, true); offset += 2;
      writeString(view, offset, 'data'); offset += 4;
      view.setUint32(offset, dataLength, true); offset += 4;

      // Write PCM samples
      for (let i = 0; i < samples; i++) {
        for (let channel = 0; channel < numChannels; channel++) {
          let sample = audioBuffer.getChannelData(channel)[i];
          sample = Math.max(-1, Math.min(1, sample));
          view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
          offset += 2;
        }
      }
      return new Blob([arrayBuffer], { type: "audio/wav" });
    }
    return encodeWAV(buffer);
  }

  // Helper to format and filter emotions for display
  const formatAndFilterEmotions = (emotions) => {
    if (!Array.isArray(emotions) || emotions.length === 0) {
      return "No emotion data available"; // More descriptive message
    }

    // Parse emotions to extract name and probability
    const parsedEmotions = emotions.map(emotionStr => {
      const match = emotionStr.match(/^([^\s(]+)\s*(\(\d+\.?\d*)%?\)/); // Regex to extract name and percentage
      if (match) {
        const name = match[1];
        const probability = parseFloat(match[2]); // Keep as percentage for easier comparison
        return { name, probability, original: emotionStr };
      } else {
        // Handle cases where the format might be unexpected, maybe just the name
        // Assign a default low probability if format is unexpected
        return { name: emotionStr, probability: 0, original: emotionStr };
      }
    });

    // Sort by probability descending
    parsedEmotions.sort((a, b) => b.probability - a.probability);

    if (parsedEmotions.length === 0) {
        return "No emotion data available"; // Fallback if parsing failed for all
    }

    const topEmotion = parsedEmotions[0];
    // Return only the top emotion formatted for display
    return `${topEmotion.name.charAt(0).toUpperCase() + topEmotion.name.slice(1)} (${topEmotion.probability.toFixed(2)}%)`;
  };


  // Upload and analyze
  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setReport(null);

    try {
      const formData = new FormData();
      if (trimmedBlob) {
        formData.append("audio", new File([trimmedBlob], "trimmed_audio.wav", { type: "audio/wav" }));
      } else if (file) {
        formData.append("audio", file);
      } else if (recordedBlob) {
        formData.append("audio", new File([recordedBlob], "recorded_audio.wav", { type: "audio/wav" }));
      } else {
        setError("Please upload or record an audio file.");
        setLoading(false);
        return;
      }

      // Set patient ID based on user role
      if (user?.role === "doctor") {
        if (!selectedPatient) {
          setError("Please select a patient first.");
          setLoading(false);
          return;
        }
        formData.append("patientId", selectedPatient);
      } else {
        formData.append("patientId", user?.id);
      }

      const token = localStorage.getItem("token");
      const res = await API.post("/upload/audio", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      setReport(res.data);
      console.log('Report data received:', res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setLoading(false);
    }
  };


  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleDownload = async (reportId) => {
    try {
      console.log('Attempting download from Upload page:', `/api/reports/${reportId}/pdf`);
      const response = await api.get(`/api/reports/${reportId}/pdf`, {
        responseType: 'blob'
      });
      
      // Create a blob from the PDF Stream
      const file = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a URL for the blob
      const fileURL = window.URL.createObjectURL(file);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = `report-${reportId}.pdf`;
      
      // Append to html link element page
      document.body.appendChild(link);
      
      // Start download
      link.click();
      
      // Clean up and remove the link
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(fileURL);
    } catch (error) {
      console.error('Error during PDF download:', error);
      // Show error message to user
      setError('Failed to download PDF. Please try again later.');
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
      <Card elevation={3} sx={{ maxWidth: 800, width: "100%" }}>
        <CardContent>
          <Stack spacing={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <Mic color="primary" fontSize="large" />
              <Typography variant="h4" component="h1" gutterBottom>
                Upload Audio File 🎵
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}
            {report && <Alert severity="success">Analysis complete! 🎉</Alert>}

            {user?.role === "doctor" && (
              <FormControl fullWidth>
                <InputLabel>Select Patient</InputLabel>
                <Select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  label="Select Patient"
                >
                  {patients.map((patient) => (
                    <MenuItem key={patient._id} value={patient._id}>
                      {patient.name} (Age: {patient.age}, Gender: {patient.gender})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {report && (
              <Box sx={{ mt: 2, mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: 'background.paper' }}>
                <Typography variant="h6" gutterBottom>Analysis Results</Typography>
                <Typography><b>Emotion Prediction:</b> {Array.isArray(report.emotions) ? report.emotions.join(", ") : report.emotions}</Typography>
                <Typography><b>Transcription:</b> {report.transcript}</Typography>
                <Typography><b>Pitch:</b> {report.pitch}</Typography>
                <Typography><b>Pace:</b> {report.pace}</Typography>
                <Typography><b>Silence:</b> {report.silence}</Typography>
                <Typography><b>Summary:</b> {generateSummary(report)}</Typography>
                {report.pdfPath && (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => handleDownload(report._id)}
                    sx={{ mt: 2 }}
                    startIcon={<Save />}
                  >
                    Download PDF
                  </Button>
                )}
              </Box>
            )}

            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                bgcolor: 'background.paper',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  bgcolor: 'action.hover',
                  transform: 'scale(1.01)',
                },
              }}
            >
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="audio-upload"
                disabled={isRecording}
              />
              <label htmlFor="audio-upload">
                <Button
                  component="span"
                  variant="contained"
                  startIcon={<UploadIcon />}
                  sx={{ mb: 2 }}
                  disabled={isRecording}
                >
                  Choose Audio File
                </Button>
              </label>
              {file && (
                <Typography variant="body1" color="textSecondary">
                  Selected: {file.name} 🎧
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
              <IconButton
                color={isRecording ? "error" : "primary"}
                onClick={isRecording ? stopRecording : startRecording}
                aria-label={isRecording ? "Stop recording" : "Start recording"}
                sx={{
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.1)' },
                }}
              >
                {isRecording ? <Stop /> : <Mic />}
              </IconButton>
              <Typography>
                {isRecording ? "🎙️ Recording..." : " Record Audio"}
              </Typography>
            </Stack>

            {(file || recordedBlob || trimmedBlob) && (
              <Box>
                <Box sx={{ mb: 2 }}>
                  <IconButton
                    onClick={() => {
                      if (isPlaying) {
                        audioRef.current.pause();
                      } else {
                        audioRef.current.play();
                      }
                      setIsPlaying(!isPlaying);
                    }}
                    color="primary"
                    size="large"
                    sx={{
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.1)' },
                    }}
                  >
                    {isPlaying ? <Pause /> : <PlayArrow />}
                  </IconButton>
                  <Typography variant="body2" color="textSecondary" component="span">
                    {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                  </Typography>
                </Box>

                <Box sx={{ px: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Trim Audio ✂️
                  </Typography>
                  <Slider
                    value={trimRange}
                    onChange={(e, newValue) => setTrimRange(newValue)}
                    valueLabelDisplay="auto"
                    min={0}
                    max={audioDuration}
                    valueLabelFormat={(value) => `${value.toFixed(1)}s`}
                    sx={{
                      '& .MuiSlider-thumb': {
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'scale(1.2)' },
                      },
                    }}
                  />
                  <Box display="flex" justifyContent="space-between" mt={1}>
                    <Typography variant="caption">
                      Start: {trimRange[0].toFixed(1)}s
                    </Typography>
                    <Typography variant="caption">
                      End: {trimRange[1].toFixed(1)}s
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<ContentCut />}
                    onClick={handleTrim}
                    sx={{ mt: 2 }}
                    disabled={!file && !recordedBlob}
                  >
                    Trim Audio
                  </Button>
                </Box>

                <audio
                  ref={audioRef}
                  src={audioURL}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  style={{ display: 'none' }}
                />
              </Box>
            )}

            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={(!file && !recordedBlob && !trimmedBlob) || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              sx={{
                mt: 2,
                py: 1.5,
                fontSize: '1.1rem',
              }}
            >
              {loading ? 'Processing...' : 'Upload & Analyze'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}