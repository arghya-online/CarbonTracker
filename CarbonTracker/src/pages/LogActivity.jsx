import React, { useState } from "react";
import { useCarbonCalculator } from "../hooks/useCarbonCalculator";
import useCarbonContext from "../context/useCarbonContext";

const LogActivity = () => {
  const { calculateEmissions, emissions, getTotalEmissions } = useCarbonCalculator();
  const { addLog } = useCarbonContext();
  const [formData, setFormData] = useState({
    transport: { mode: "carPetrol", distance: 0 },
    electricity: { kWh: 0, location: "India" },
    food: { meals: [{ type: "vegan" }] },
    purchases: { type: "electronics", cost: 0 },
    heatingCooling: { type: "ac", hours: 0 },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    Object.keys(formData).forEach((category) => {
      calculateEmissions(category, formData[category]);
    });
    const date = new Date().toISOString().split("T")[0];
    addLog(date, { ...formData, emissions });
  };

  const dailyAverage = 6.8; // kg CO₂/day
  const totalEmissions = getTotalEmissions();

  return (
    <div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 max-w-4xl mx-auto"
    >
      <h1 className="text-3xl font-bold mb-6">Log Your Activity</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transport Section */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Transport</h2>
          <select
            value={formData.transport.mode}
            onChange={(e) =>
              setFormData({
                ...formData,
                transport: { ...formData.transport, mode: e.target.value },
              })
            }
            className="w-full p-2 mb-4 bg-gray-100 dark:bg-gray-700 rounded"
          >
            <option value="carPetrol">Car (Petrol)</option>
            <option value="carDiesel">Car (Diesel)</option>
            <option value="bus">Bus</option>
            <option value="train">Train</option>
            <option value="metro">Metro</option>
            <option value="flightShort">Flight (Short)</option>
            <option value="flightLong">Flight (Long)</option>
            <option value="walking">Walking</option>
            <option value="bicycle">Bicycle</option>
          </select>
          <input
            type="number"
            placeholder="Distance (km)"
            value={formData.transport.distance}
            onChange={(e) =>
              setFormData({
                ...formData,
                transport: { ...formData.transport, distance: e.target.value },
              })
            }
            className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded"
          />
        </div>

        {/* Electricity, Food, Purchases, Heating/Cooling Sections */}
        {/* Similar structure, omitted for brevity */}

        <button
          type="submit"
          className="col-span-1 md:col-span-2 bg-earthGreen text-white p-3 rounded-xl hover:bg-earthBlue"
        >
          Calculate & Save
        </button>
      </form>

      <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow">
        <h2 className="text-xl font-semibold">Today's Emissions: {totalEmissions.toFixed(2)} kg CO₂</h2>
        <p className={totalEmissions > dailyAverage ? "text-red-500" : "text-green-500"}>
          {totalEmissions > dailyAverage
            ? `Above daily average (${dailyAverage} kg)`
            : `Below daily average (${dailyAverage} kg)`}
        </p>
      </div>
    </div>
  );
};

export default LogActivity;