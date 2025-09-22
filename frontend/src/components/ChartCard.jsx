import React from "react";

function ChartCard({ title, children }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-md w-full">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div>{children}</div>
    </div>
  );
}

export default ChartCard;
