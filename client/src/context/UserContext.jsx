// src/context/UserContext.js
import React, { createContext, useContext, useState } from 'react';

// 建立 Context
const UserContext = createContext();

// 提供者元件
export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState('Admin'); // 預設值

  return (
    <UserContext.Provider value={{ userId, setUserId }}>
      {children}
    </UserContext.Provider>
  );
};

// 自訂 Hook
export const useUser = () => useContext(UserContext);
