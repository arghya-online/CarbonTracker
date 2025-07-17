import React, { useState } from "react";
import { emissionFactors } from "../utils/emissionFactors";

export const useCarbonCalculator = () => {
  const [emissions, setEmissions] = useState({
    transport: 0,
    electricity: 0,
    food: 0,
    purchases: 0,
    heatingCooling: 0,
  });

  const calculateEmissions = (category, data) => {
    let total = 0;
    if (category === "transport") {
      total = data.distance * emissionFactors.transport[data.mode];
    } else if (category === "electricity") {
      total = data.kWh * emissionFactors.electricity[data.location || "Global"];
    } else if (category === "food") {
      total = data.meals.reduce(
        (sum, meal) => sum + emissionFactors.food[meal.type],
        0
      );
    } else if (category === "purchases") {
      total = data.cost * emissionFactors.purchases[data.type];
    } else if (category === "heatingCooling") {
      total = data.hours * emissionFactors.heatingCooling[data.type];
    }
    setEmissions((prev) => ({ ...prev, [category]: total }));
    return total;
  };

  const getTotalEmissions = () =>
    Object.values(emissions).reduce((sum, val) => sum + val, 0);

  return { emissions, calculateEmissions, getTotalEmissions };
};