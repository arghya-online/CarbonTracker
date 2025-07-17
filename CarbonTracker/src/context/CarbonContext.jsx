import React, { createContext, useState } from "react";
import { saveLog, getLogsByUser } from "../utils/storage";

const CarbonContext = createContext();

export const CarbonProvider = ({ children }) => {
  const [userId] = useState("user_1"); // Static for now
  const [logs, setLogs] = useState(getLogsByUser(userId));

  const addLog = (date, data) => {
    saveLog(userId, date, data);
    setLogs(getLogsByUser(userId));
  };

  return (
    <CarbonContext.Provider value={{ userId, logs, addLog }}>
      {children}
    </CarbonContext.Provider>
  );
};

export { CarbonContext };