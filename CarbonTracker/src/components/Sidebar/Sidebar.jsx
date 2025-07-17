import React from "react";
import { NavLink } from "react-router-dom";
import { HomeIcon, ChartBarIcon, BookOpenIcon, CogIcon } from "@heroicons/react/24/outline";

const Sidebar = () => {
  const navItems = [
    { name: "Dashboard", path: "/", icon: HomeIcon },
    { name: "Log Activity", path: "/log", icon: ChartBarIcon },
    { name: "Compare", path: "/compare", icon: ChartBarIcon },
    { name: "Learn", path: "/learn", icon: BookOpenIcon },
    { name: "Settings", path: "/settings", icon: CogIcon },
  ];

  return (
    <div className="w-64 h-screen bg-earthGreen text-white p-4">
      <h2 className="text-2xl font-bold mb-6">Carbon Tracker</h2>
      <nav>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center p-2 mb-2 rounded-lg ${isActive ? "bg-earthBlue" : "hover:bg-earthBlue"}`
            }
          >
            <item.icon className="w-6 h-6 mr-2" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;