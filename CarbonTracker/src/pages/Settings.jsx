import React, { useState } from "react";

const Settings = () => {
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Appearance</h2>
        <button
          onClick={toggleTheme}
          className="bg-earthGreen text-white p-2 rounded-xl"
        >
          Toggle {theme === "light" ? "Dark" : "Light"} Mode
        </button>
      </div>
    </div>
  );
};

export default Settings;