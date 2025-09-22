import React, { useEffect, useState } from "react";
import axios from "axios";
import { AlertTriangle, AlertOctagon, CheckCircle } from "lucide-react";

const AlertsPanel = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem("token"); // 🔑 assumes JWT stored in localStorage
        const res = await axios.get("/api/alerts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAlerts(res.data.alerts || []);
      } catch (err) {
        console.error("❌ Error fetching alerts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000); // 🔄 auto-refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const getAlertStyle = (type) => {
    switch (type) {
      case "danger":
        return "bg-red-100 text-red-800 border-red-400";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-400";
      default:
        return "bg-green-100 text-green-800 border-green-400";
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case "danger":
        return <AlertOctagon className="w-5 h-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  if (loading) {
    return <p className="text-gray-500">Loading alerts...</p>;
  }

  if (alerts.length === 0) {
    return (
      <div className="p-4 bg-green-100 border border-green-400 rounded-xl flex items-center gap-2 text-green-800">
        <CheckCircle className="w-5 h-5" />
        <span>✅ Ecosystem stable – no active alerts.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-gray-800">⚡ Live Alerts</h2>
      {alerts.map((alert, idx) => (
        <div
          key={idx}
          className={`p-3 border rounded-xl flex items-center gap-2 shadow-sm ${getAlertStyle(
            alert.type
          )}`}
        >
          {getAlertIcon(alert.type)}
          <span>{alert.message}</span>
        </div>
      ))}
    </div>
  );
};

export default AlertsPanel;
