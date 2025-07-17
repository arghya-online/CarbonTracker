import React from "react";
import useCarbonContext from "../context/useCarbonContext";
import { LineChart, BarChart, PieChart, RadarChart, Line, Pie } from "recharts";

const Dashboard = () => {
  const { logs } = useCarbonContext();
  const dailyData = logs.map((log) => ({
    date: log.date,
    emissions: Object.values(log.emissions).reduce((sum, val) => sum + val, 0),
  }));

  const categoryData = logs.length
    ? Object.keys(logs[logs.length - 1].emissions).map((key) => ({
        name: key,
        value: logs[logs.length - 1].emissions[key],
      }))
    : [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow">
          <h2 className="text-xl font-semibold">Today's Emissions</h2>
          <p>{dailyData[dailyData.length - 1]?.emissions.toFixed(2)} kg CO₂</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow">
          <h2 className="text-xl font-semibold">Weekly Total</h2>
          <p>
            {dailyData
              .slice(-7)
              .reduce((sum, log) => sum + log.emissions, 0)
              .toFixed(2)}{" "}
            kg CO₂
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Trends</h2>
        <LineChart width={600} height={300} data={dailyData}>
          <Line type="monotone" dataKey="emissions" stroke="#2F855A" />
        </LineChart>
        <PieChart width={600} height={300}>
          <Pie data={categoryData} dataKey="value" fill="#2B6CB0" />
        </PieChart>
      </div>
    </div>
  );
};

export default Dashboard;