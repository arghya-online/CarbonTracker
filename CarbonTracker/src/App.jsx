import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CarbonProvider } from "./context/CarbonContext";
import Sidebar from "./components/Sidebar/Sidebar.jsx";
import Dashboard from "./pages/Dashboard";
import LogActivity from "./pages/LogActivity";
import Compare from "./pages/Compare";
import Learn from "./pages/Learn";
import Settings from "./pages/Settings";

function App() {
  return (
    <CarbonProvider>
      <BrowserRouter>
        <div className="flex">
          <Sidebar />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/log" element={<LogActivity />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </CarbonProvider>
  );
}

export default App;