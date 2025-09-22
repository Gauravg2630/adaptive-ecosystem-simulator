import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Menu } from "lucide-react";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <aside className="hidden md:flex transition-all duration-300 ease-in-out">
        <Sidebar />
      </aside>

      <div
        className={`fixed inset-0 z-40 md:hidden transition-transform duration-500 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="relative w-64 bg-gray-900 h-full shadow-2xl animate-slide-in">
          <Sidebar />
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden relative">
        <Header />
        <div className="md:hidden absolute top-4 left-4 z-50">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:scale-105 transition"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <main className="flex-1 overflow-auto p-6 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
