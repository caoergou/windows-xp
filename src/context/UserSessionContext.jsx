import React, { createContext, useState, useContext } from 'react';

const UserSessionContext = createContext();

export const useUserSession = () => useContext(UserSessionContext);

export const UserSessionProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: 'Administrator', avatar: 'user' });

  const login = (password) => {
      if (password === 'shanyue2015') {
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
