import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#4CAF50", "#2196F3", "#FF5722"];

function Reports() {
  const [filterSteps, setFilterSteps] = useState("all");
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // fetch reports data from backend
  useEffect(() => {
    const fetchReports = async () => {
      try {
        let url = "http://localhost:5000/api/reports/summary";
        if (filterSteps !== "all") {
          url += `?limit=${filterSteps}`;
        }
        const res = await fetch(url);
        const json = await res.json();
        setReportData(json.data || []);
        setSummary(json.summary || null);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      }
    };
    fetchReports();
  }, [filterSteps]);

  const latestData =
    reportData.length > 0
      ? reportData[reportData.length - 1]
      : { plants: 0, herbivores: 0, carnivores: 0 };

  const pieData = [
    { name: "Plants 🌱", value: latestData.plants },
    { name: "Herbivores 🐇", value: latestData.herbivores },
    { name: "Carnivores 🦊", value: latestData.carnivores },
  ];

  const handleClearDatabase = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/simulation/clear", {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Database cleared successfully 🚀");
        setReportData([]);
        setSummary(null);
      } else {
        alert("❌ Failed to clear database");
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Error connecting to backend");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData.length) return;
    const headers = ["step,plants,herbivores,carnivores"];
    const rows = reportData.map(
      (d) => `${d.step},${d.plants},${d.herbivores},${d.carnivores}`
    );
    const csvContent = [headers, ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "simulation_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
        📑 Ecosystem Reports
      </h2>

      <div className="flex gap-2 items-center">
        <label className="text-gray-700 dark:text-gray-300">Show:</label>
        <select
          value={filterSteps}
          onChange={(e) => setFilterSteps(e.target.value)}
          className="border p-1 rounded"
        >
          <option value="all">All</option>
          <option value="10">Last 10</option>
          <option value="50">Last 50</option>
        </select>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-4 my-4">
          {["plants", "herbivores", "carnivores"].map((key) => (
            <div key={key} className="card text-center">
              <h4 className="font-bold capitalize">{key}</h4>
              <p>Avg: {summary.avg[key]}</p>
              <p>Max: {summary.max[key]}</p>
              <p>Min: {summary.min[key]}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Population Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={reportData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="step" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="plants" fill="#4CAF50" />
            <Bar dataKey="herbivores" fill="#2196F3" />
            <Bar dataKey="carnivores" fill="#FF5722" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Trend Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={reportData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="step" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="plants"
              stroke="#4CAF50"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="herbivores"
              stroke="#2196F3"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="carnivores"
              stroke="#FF5722"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Current Population Ratio</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
        >
          Export CSV 📥
        </button>
        <button
          onClick={handleClearDatabase}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Clearing..." : "Clear Database 🗑️"}
        </button>
      </div>
    </div>
  );
}

export default Reports;
