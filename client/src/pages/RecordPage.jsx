import React, { useState, useRef } from "react";
import { API } from "../api";
import { Box, Typography, Paper, Button, Stack } from "@mui/material";

export default function RecordPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [report, setReport] = useState(null);
  const [pdfURL, setPdfURL] = useState("");
  const [error, setError] = useState("");
  const audioRef = useRef();

  // Implement your recording logic here

  const handleAudioUpload = (e) => {
    // handle file upload logic
  };

  const startRecording = () => {
    // start recording logic
  };

  const stopRecording = () => {
    // stop recording logic
  };

  const sendAudio = async () => {
    // send audio to backend and set report/pdfURL
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Paper elevation={6} sx={{ p: 5, maxWidth: 500, width: "100%" }}>
        <Typography variant="h4" align="center" gutterBottom>
          Record or Upload Audio
        </Typography>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            {!isRecording ? (
              <Button variant="contained" color="primary" onClick={startRecording}>
                Start Recording
              </Button>
            ) : (
              <Button variant="contained" color="error" onClick={stopRecording}>
                Stop Recording
              </Button>
            )}
            <input
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
              style={{ marginTop: 8 }}
            />
          </Stack>
          {audioURL && (
            <div>
              <audio controls src={audioURL} ref={audioRef}></audio>
              <Button
                variant="contained"
                color="primary"
                onClick={sendAudio}
                sx={{ mt: 2 }}
              >
                Analyze
              </Button>
            </div>
          )}
          {report && (
            <Paper elevation={3} sx={{ mt: 4, p: 2 }}>
              <Typography variant="h6" color="primary">Analysis Report</Typography>
              <Typography><b>Transcript:</b> {report.transcript}</Typography>
              <Typography><b>Emotions:</b> {report.emotions.join(", ")}</Typography>
              <Typography><b>Pitch:</b> {report.pitch} Hz</Typography>
              <Typography><b>Pace:</b> {report.pace} words/minute</Typography>
              <Typography><b>Silence:</b> {report.silence} seconds</Typography>
              <Typography><b>Summary:</b> {report.summary}</Typography>
              <Button
                href={pdfURL}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                sx={{ mt: 2 }}
              >
                Download PDF
              </Button>
            </Paper>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
