import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useSimulation } from "../context/SimulationContext";

export default function Simulation() {
  const {
    isRunning,
    step,
    data,
    settings,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    updateSettings,
  } = useSimulation();

  const speedPresets = {
    slow: 2000,
    normal: 1000,
    fast: 300,
  };

  const handleSpeedChange = (mode) => {
    updateSettings({ ...settings, speed: speedPresets[mode] });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          🧪 Live Simulation
        </h2>
        <div className="flex gap-3">
          {!isRunning ? (
            <button onClick={startSimulation} className="btn">
              ▶ Start
            </button>
          ) : (
            <button
              onClick={pauseSimulation}
              className="btn bg-yellow-500 hover:bg-yellow-600"
            >
              ⏸ Pause
            </button>
          )}
          <button
            onClick={resetSimulation}
            className="btn bg-red-500 hover:bg-red-600"
          >
            🔄 Reset
          </button>
        </div>
      </div>

      <div className="card flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Current Step
          </h3>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {step}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleSpeedChange("slow")}
            className={`btn ${
              settings.speed === speedPresets.slow ? "bg-blue-600 text-white" : ""
            }`}
          >
            🐢 Slow
          </button>
          <button
            onClick={() => handleSpeedChange("normal")}
            className={`btn ${
              settings.speed === speedPresets.normal ? "bg-blue-600 text-white" : ""
            }`}
          >
            ⚖ Normal
          </button>
          <button
            onClick={() => handleSpeedChange("fast")}
            className={`btn ${
              settings.speed === speedPresets.fast ? "bg-blue-600 text-white" : ""
            }`}
          >
            ⚡ Fast
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">
          Population Over Time
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="step" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="plants"
              stroke="#10b981"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="herbivores"
              stroke="#f59e0b"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="carnivores"
              stroke="#ef4444"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
