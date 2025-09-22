import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { io as ioClient } from "socket.io-client";

const SimulationContext = createContext();

export const SimulationProvider = ({ children }) => {
  const { authFetch, token } = useAuth();

  const savedSettings = JSON.parse(localStorage.getItem("simulationSettings")) || {
    plants: 100,
    herbivores: 50,
    carnivores: 20,
    speed: 1000,
  };

  const [settings, setSettings] = useState(savedSettings);
  const [isRunning, setIsRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [data, setData] = useState([]);
  const [logs, setLogs] = useState([]); // real-time logs + alerts

  const socketRef = useRef(null);

  // connect socket when token available
  useEffect(() => {
    if (!token) {
      // disconnect if no token
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // connect (pass token optionally for auth)
    const socket = ioClient("http://localhost:5000", {
      transports: ["websocket"],
      query: { token }, // optional: implement token check server-side if needed
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("alert", (alert) => {
      console.log("Realtime alert:", alert);
      setLogs((prev) => [alert, ...prev].slice(0, 200));
    });

    // Listen for simulation updates
    socket.on("simulation-update", (payload) => {
      console.log("Simulation update received:", payload);
      // Optionally update local state
    });

    // Listen for ecosystem alerts
    socket.on("ecosystem-alerts", (alertData) => {
      console.log("Ecosystem alerts received:", alertData);
      if (alertData.alerts && alertData.alerts.length > 0) {
        alertData.alerts.forEach(alert => {
          const logEntry = {
            id: Date.now() + Math.random(),
            message: alert.message,
            severity: alert.type,
            createdAt: new Date().toISOString(),
            step: alertData.step,
          };
          addLog(logEntry);
        });
      }
    });

    // Listen for simulation toggle events
    socket.on("simulation-toggle", (payload) => {
      console.log("Simulation toggle event:", payload);
      setIsRunning(payload.isRunning);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // Fixed saveSnapshot function - use relative path and proper error handling
  const saveSnapshot = async (snapshot) => {
    if (!token) {
      console.warn("No token available, skipping snapshot save");
      return;
    }
    
    try {
      const response = await authFetch("/api/simulation", {
        method: "POST",
        body: JSON.stringify(snapshot),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("✅ Snapshot saved successfully:", result);
    } catch (err) {
      console.error("❌ Error saving snapshot:", err);
      // Add user-friendly error handling
      addLog({
        id: Date.now(),
        message: "Failed to save simulation data to server",
        severity: "error",
        createdAt: new Date().toISOString(),
        step: snapshot.step || step,
      });
    }
  };

  const loadHistory = async () => {
    if (!token) {
      console.warn("No token available, skipping history load");
      return;
    }
    
    try {
      const res = await authFetch("/api/simulation/logs");
      if (!res.ok) throw new Error(`Failed to load history: ${res.status}`);
      
      const history = await res.json();
      if (Array.isArray(history) && history.length > 0) {
        setData(history);
        setStep(history[history.length - 1].step || 0);
        console.log("✅ History loaded successfully:", history.length, "entries");
      }
    } catch (err) {
      console.error("❌ Error loading history:", err);
      addLog({
        id: Date.now(),
        message: "Failed to load simulation history",
        severity: "error",
        createdAt: new Date().toISOString(),
        step: step,
      });
    }
  };

  // add manual refresh helper to fetch logs from backend /logs
  const refreshHistory = async () => {
    if (!token) return;
    try {
      const res = await authFetch("/api/simulation/logs");
      if (!res.ok) throw new Error(`Failed to refresh history: ${res.status}`);
      
      const history = await res.json();
      setData(history);
      console.log("✅ History refreshed successfully");
    } catch (err) {
      console.error("❌ Error refreshing history:", err);
    }
  };

  // add exportLogs util (return object URL)
  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    return URL.createObjectURL(blob);
  };

  // Helper function to add logs
  const addLog = (log) => setLogs((prev) => [log, ...prev].slice(0, 200));

  // Fixed runStep function with better error handling
  const runStep = () => {
    setStep((prevStep) => prevStep + 1);
    setData((prevData) => {
      const last = prevData[prevData.length - 1] || settings;
      const newPoint = {
        step: prevData.length,
        plants: Math.max(10, last.plants + Math.floor(Math.random() * 20 - 10)),
        herbivores: Math.max(5, last.herbivores + Math.floor(Math.random() * 10 - 5)),
        carnivores: Math.max(2, last.carnivores + Math.floor(Math.random() * 5 - 2)),
        createdAt: new Date().toISOString(),
      };

      const events = [
        { message: "New plant growth detected 🌿", severity: "info" },
        { message: "Herbivore consumed a plant 🌱", severity: "info" },
        { message: "Carnivore hunted a herbivore 🐇", severity: "warning" },
        { message: "Population stabilized 🧬", severity: "info" },
        { message: "Carnivore spotted in territory 🦊", severity: "info" },
      ];
      const chosen = events[Math.floor(Math.random() * events.length)];
      const logEntry = {
        id: Date.now() + Math.random(),
        message: chosen.message,
        severity: chosen.severity,
        createdAt: new Date().toISOString(),
        step: newPoint.step,
      };

      // Save snapshot (backend) and let backend emit alerts if needed
      saveSnapshot({ 
        ...newPoint, 
        events: [chosen],
        userId: "simulation-user" // Add userId if needed
      });

      // still log locally
      addLog(logEntry);

      return [...prevData, newPoint];
    });
  };

  const resetSimulation = async () => {
    setIsRunning(false);
    setStep(0);
    try {
      if (token) {
        const response = await authFetch("/api/simulation/reset", { 
          method: "DELETE" 
        });
        
        if (!response.ok) {
          throw new Error(`Reset failed: ${response.status}`);
        }
        
        console.log("✅ Simulation reset successfully");
      }
      setData([]);
      setLogs([]);
    } catch (err) {
      console.error("❌ Error resetting simulation:", err);
      addLog({
        id: Date.now(),
        message: "Failed to reset simulation on server",
        severity: "error",
        createdAt: new Date().toISOString(),
        step: 0,
      });
    }
  };

  const updateSettings = (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem("simulationSettings", JSON.stringify(updated));
    
    addLog({
      id: Date.now(),
      message: `Settings updated: ${Object.keys(newSettings).join(", ")}`,
      severity: "info",
      createdAt: new Date().toISOString(),
      step: step,
    });
  };

  // Toggle simulation function for external use
  const toggleSimulation = async () => {
    try {
      if (token) {
        const response = await authFetch("/api/simulation/toggle", {
          method: "POST",
        });
        
        if (!response.ok) {
          throw new Error(`Toggle failed: ${response.status}`);
        }
        
        const result = await response.json();
        setIsRunning(result.isRunning);
        console.log("✅ Simulation toggled:", result.message);
        
        addLog({
          id: Date.now(),
          message: result.message,
          severity: "info",
          createdAt: new Date().toISOString(),
          step: step,
        });
      } else {
        // Local toggle if no token
        setIsRunning(!isRunning);
      }
    } catch (err) {
      console.error("❌ Error toggling simulation:", err);
      // Fallback to local toggle
      setIsRunning(!isRunning);
    }
  };

  // effects: load history when token available & run interval
  useEffect(() => {
    if (token) {
      loadHistory();
    }
  }, [token]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(runStep, settings.speed);
    }
    return () => clearInterval(interval);
  }, [isRunning, settings.speed]);

  return (
    <SimulationContext.Provider
      value={{
        isRunning,
        step,
        data,
        logs,
        settings,
        startSimulation: () => setIsRunning(true),
        pauseSimulation: () => setIsRunning(false),
        toggleSimulation,
        resetSimulation,
        runStep,
        updateSettings,
        clearDatabase: resetSimulation,
        refreshHistory,
        exportLogs,
        addLog, // Expose addLog for external components
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => useContext(SimulationContext);