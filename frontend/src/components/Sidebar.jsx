import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  FileText,
  Settings,
  BookOpen,
  Monitor,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/simulation", label: "Simulation", icon: Activity },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/logbook", label: "Logbook", icon: BookOpen },
  { to: "/monitoring", label: "Monitoring", icon: Monitor },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 flex flex-col p-4 shadow-2xl">
      <h1 className="text-2xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 animate-pulse">
        EcoSim 🌱
      </h1>

      <nav className="space-y-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 relative group
              ${
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                  : "hover:bg-gray-800 hover:text-indigo-300 text-gray-300"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-5 h-5" />
                <span>{label}</span>

                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "100%", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute left-0 top-0 w-1 rounded-r-lg bg-indigo-400"
                    />
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6 text-xs text-gray-400 text-center border-t border-gray-700">
        © {new Date().getFullYear()} EcoSim | Adaptive Ecosystem
      </div>
    </div>
  );
}
