import React, { useState, useEffect } from "react";
import { useSimulation } from "../context/SimulationContext";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

function Settings() {
  const { settings, updateSettings } = useSimulation();
  const [form, setForm] = useState(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings(form);
  };

  const previewData = Array.from({ length: 6 }, (_, i) => ({
    step: i,
    plants: Math.max(10, form.plants + Math.floor(Math.random() * 20 - 10) * i),
    herbivores: Math.max(5, form.herbivores + Math.floor(Math.random() * 10 - 5) * i),
    carnivores: Math.max(2, form.carnivores + Math.floor(Math.random() * 5 - 2) * i),
  }));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">⚙ Simulation Settings</h2>

      <form onSubmit={handleSubmit} className="space-y-4 card p-6">
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1">🌱 Starting Plants</label>
          <input
            type="number"
            name="plants"
            value={form.plants}
            onChange={handleChange}
            className="w-full p-2 rounded-md border dark:bg-gray-800 dark:border-gray-700"
            min="10"
          />
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1">🐇 Starting Herbivores</label>
          <input
            type="number"
            name="herbivores"
            value={form.herbivores}
            onChange={handleChange}
            className="w-full p-2 rounded-md border dark:bg-gray-800 dark:border-gray-700"
            min="5"
          />
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1">🦊 Starting Carnivores</label>
          <input
            type="number"
            name="carnivores"
            value={form.carnivores}
            onChange={handleChange}
            className="w-full p-2 rounded-md border dark:bg-gray-800 dark:border-gray-700"
            min="2"
          />
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1">⚡ Simulation Speed (ms per tick)</label>
          <input
            type="number"
            name="speed"
            value={form.speed}
            onChange={handleChange}
            className="w-full p-2 rounded-md border dark:bg-gray-800 dark:border-gray-700"
            min="200"
            step="100"
          />
        </div>

        <button
          type="submit"
          className="btn w-full bg-indigo-600 hover:bg-indigo-700"
        >
          Save Settings
        </button>
      </form>
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
          📊 Preview Simulation (first 5 ticks)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={previewData}>
            <XAxis dataKey="step" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="plants" stroke="#4caf50" strokeWidth={2} />
            <Line type="monotone" dataKey="herbivores" stroke="#2196f3" strokeWidth={2} />
            <Line type="monotone" dataKey="carnivores" stroke="#f44336" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Settings;
