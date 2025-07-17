export const emissionFactors = {
  transport: {
    carPetrol: 0.192, // kg CO₂/km
    carDiesel: 0.171,
    bus: 0.105,
    train: 0.041,
    metro: 0.033,
    flightShort: 0.255, // kg CO₂/km
    flightLong: 0.150,
    walking: 0,
    bicycle: 0,
  },
  electricity: {
    India: 0.82, // kg CO₂/kWh
    Global: 0.475, // Default
  },
  food: {
    vegan: 0.5, // kg CO₂/meal
    vegetarian: 0.8,
    mixed: 1.5,
    nonVeg: 2.5,
  },
  purchases: {
    electronics: 0.1, // kg CO₂/$
    clothes: 0.05,
    appliances: 0.15,
  },
  heatingCooling: {
    ac: 0.82, // Using India's electricity factor
    heater: 0.82,
  },
};