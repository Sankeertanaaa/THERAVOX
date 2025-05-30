import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";

const EmotionChart = ({ reports }) => {
  const data = reports.map((r, i) => ({
    name: `Report ${i + 1}`,
    pitch: r.pitch,
    pace: r.pace,
    silence: r.silence,
  }));

  return (
    <div className="bg-white p-4 rounded-2xl shadow-md">
      <h2 className="text-xl font-bold mb-2">Audio Metrics</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="pitch" stroke="#8884d8" />
          <Line type="monotone" dataKey="pace" stroke="#82ca9d" />
          <Line type="monotone" dataKey="silence" stroke="#ffc658" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EmotionChart;
