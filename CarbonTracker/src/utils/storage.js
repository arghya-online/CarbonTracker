export const saveLog = (userId, date, data) => {
  const key = `${userId}_${date}`;
  localStorage.setItem(key, JSON.stringify(data));
};

export const getLog = (userId, date) => {
  const key = `${userId}_${date}`;
  return JSON.parse(localStorage.getItem(key)) || null;
};

export const getLogsByUser = (userId) => {
  const logs = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(userId)) {
      logs.push(JSON.parse(localStorage.getItem(key)));
    }
  }
  return logs;
};