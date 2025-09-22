import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const { authFetch, token } = useAuth();
  const [stats, setStats] = useState({
    plants: 0,
    herbivores: 0,
    carnivores: 0,
    tick: 0,
  });
  const [trend, setTrend] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔄 Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("http://localhost:5000/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      const data = await res.json();
      setStats(data.stats || {});
      setTrend(data.trend || []);
      setAlerts(data.alerts || []); // ⬅️ Day 26: alerts integration
    } catch (err) {
      console.error("❌ Dashboard fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, authFetch]);

  // ⏱ Auto-refresh every 5s
  useEffect(() => {
    if (token) {
      fetchDashboard();
      const interval = setInterval(fetchDashboard, 5000);
      return () => clearInterval(interval);
    }
  }, [token, fetchDashboard]);

  return (
    <DashboardContext.Provider
      value={{
        stats,
        trend,
        alerts,
        loading,
        error,
        refreshDashboard: fetchDashboard,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);
