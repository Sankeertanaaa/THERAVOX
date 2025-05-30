import { useEffect, useState } from "react";
import { API } from "../api";
import EmotionChart from "../components/EmotionChart";
import ReportCard from "../components/ReportCard";

const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchReports = async () => {
      const res = await API.get("/upload/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(res.data.reports);
    };
    fetchReports();
  }, []);

  return (
    <div className="p-6 bg-[#f1f2f6] min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-[#2d3436]">Your Reports</h1>
      {reports.length > 0 ? (
        <>
          <EmotionChart reports={reports} />
          <div className="mt-6 space-y-4">
            {reports.map((r) => (
              <ReportCard key={r._id} report={r} />
            ))}
          </div>
        </>
      ) : (
        <p>No reports yet. Upload audio to see results.</p>
      )}
    </div>
  );
};

export default Dashboard;
