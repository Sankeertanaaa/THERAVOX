import { generateSummary } from '../utils/summaryGenerator';

const ReportCard = ({ report }) => (
    <div className="bg-[#f8f9fa] p-4 rounded-xl shadow-sm mb-3">
      <p><strong>Transcript:</strong> {report.transcript}</p>
      <p><strong>Emotions:</strong> {report.emotions.join(", ")}</p>
      <p><strong>Pitch:</strong> {report.pitch.toFixed(2)} Hz</p>
      <p><strong>Silence:</strong> {report.silence.toFixed(2)} s</p>
      <p><strong>Pace:</strong> {report.pace.toFixed(2)} wpm</p>
      <p><strong>Summary:</strong> {generateSummary(report)}</p>
      <a href={`/api/reports/${report._id}/pdf`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View PDF</a>
    </div>
  );
  
  export default ReportCard;
  