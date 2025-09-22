import React, { useMemo, useState } from "react";
import { useSimulation } from "../context/SimulationContext";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Search, Pin } from "lucide-react"; 

export default function LogBook() {
  const { logs, exportLogs, refreshHistory } = useSimulation();
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("all");
  const [pinned, setPinned] = useState(null);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const passSeverity = severity === "all" ? true : l.severity === severity || l.type === severity;
      const text = `${l.message} ${l.step || ""}`.toLowerCase();
      const passQuery = text.includes(query.trim().toLowerCase());
      return passSeverity && passQuery;
    });
  }, [logs, query, severity]);

  const handlePin = (entry) => {
    setPinned((p) => (p && p.createdAt === entry.createdAt ? null : entry));
  };

  const handleExport = () => {
    const url = exportLogs();
    const a = document.createElement("a");
    a.href = url;
    a.download = `ecosim-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search logs, e.g. 'Herbivore' or 'critical'"
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800"
          />
        </div>

        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-white dark:bg-gray-800"
        >
          <option value="all">All severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>

        <button
          onClick={handleExport}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Export
        </button>

        <button
          onClick={refreshHistory}
          className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-3">
          <AnimatePresence>
            {filtered.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-gray-50 dark:bg-gray-800 rounded">
                No logs match your filter.
              </motion.div>
            )}

            {filtered.map((entry) => (
              <motion.div
                key={entry.createdAt + entry.message}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`p-4 rounded-lg border shadow-sm flex justify-between items-start ${
                  entry.severity === "critical"
                    ? "bg-red-50 border-red-200"
                    : entry.severity === "warning"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-white border-gray-200"
                }`}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">
                      {entry.step !== undefined ? `Tick ${entry.step}` : ""}
                    </div>
                    <div className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="mt-2 text-sm text-gray-800 dark:text-gray-100">{entry.message}</div>
                </div>

                <div className="flex flex-col items-end gap-2 ml-4">
                  <button
                    onClick={() => handlePin(entry)}
                    title="Pin this entry"
                    className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700"
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-white dark:bg-gray-900 border">
            <h3 className="font-semibold mb-2">Pinned</h3>
            {pinned ? (
              <div>
                <div className="text-xs text-gray-500">{new Date(pinned.createdAt).toLocaleString()}</div>
                <div className="mt-2 text-sm">{pinned.message}</div>
                <div className="mt-3 text-xs text-gray-400">Severity: {pinned.severity}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Pin important entries to view here.</div>
            )}
          </div>

          <div className="p-4 rounded-lg bg-white dark:bg-gray-900 border">
            <h3 className="font-semibold mb-2">Quick actions</h3>
            <button onClick={handleExport} className="w-full mb-2 px-3 py-2 bg-indigo-600 text-white rounded">Download JSON</button>
            <button onClick={() => navigator.clipboard.writeText(JSON.stringify(logs.slice(0, 50), null, 2))} className="w-full px-3 py-2 bg-gray-100 rounded">Copy recent 50</button>
          </div>
        </div>
      </div>
    </div>
  );
}
