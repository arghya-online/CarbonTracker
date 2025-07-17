import React from "react";

const Learn = () => {
  const cards = [
    {
      title: "What is a Carbon Footprint?",
      content: "A carbon footprint is the total greenhouse gas emissions caused by an individual...",
    },
    {
      title: "How We Calculate",
      content: "We use IPCC and EPA emission factors to estimate CO₂ from your activities...",
    },
    {
      title: "Reduce Your Footprint",
      content: "Tips: Use public transport, eat less meat, save energy...",
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Learn About Your Footprint</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.2 }}
            className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow"
          >
            <h2 className="text-xl font-semibold">{card.title}</h2>
            <p>{card.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Learn;