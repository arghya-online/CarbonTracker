import React from "react";
import useCarbonContext from "../context/useCarbonContext";
import { BarChart } from "recharts";

const Compare = () => {
  const { logs } = useCarbonContext();
  const latestLog = logs[logs.length - 1];
  const totalEmissions = latestLog
    ? Object.values(latestLog.emissions).reduce((sum, val) => sum + val, 0)
    : 0;

  const comparisonData = [
    { name: "Your Emissions", value: totalEmissions },
    { name: "Global Average", value: 6.8 },
    { name: "Indian Average", value: 4.5 },
    { name: "Sustainable Target", value: 2.5 },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Compare Your Footprint</h1>
      <BarChart width={600} height={300} data={comparisonData}>
        <Bar dataKey="value" fill="#2F855A" />
      </BarChart>
    </div>
  );
};

export default Compare;