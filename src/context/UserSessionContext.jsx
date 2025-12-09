import React, { createContext, useState, useContext } from 'react';
import userConfig from '../data/user_config.json';

const UserSessionContext = createContext();

export const useUserSession = () => useContext(UserSessionContext);

export const UserSessionProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: userConfig.username, avatar: userConfig.avatar });

  const login = (password) => {
      if (password === userConfig.password) {
          setIsLoggedIn(true);
          return true;
      }
      return false;
  };

  const logout = () => {
      setIsLoggedIn(false);
  };

  return (
    <UserSessionContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </UserSessionContext.Provider>
  );
};
