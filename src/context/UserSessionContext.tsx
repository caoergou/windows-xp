import React, { createContext, useState, useContext } from 'react';
import userConfig from '../data/user_config.json';
import { UserSession } from '../types';

interface UserSessionContextType {
  isLoggedIn: boolean;
  user: { name: string; avatar: string };
  login: (password: string) => boolean;
  logout: () => void;
}

const UserSessionContext = createContext<UserSessionContextType | undefined>(undefined);

export const useUserSession = (): UserSessionContextType => {
  const context = useContext(UserSessionContext);
  if (context === undefined) {
    throw new Error('useUserSession must be used within a UserSessionProvider');
  }
  return context;
};

// Check if login is required: only after shutdown, restart, or logout
const getInitialLoginState = (): boolean => {
  const powerState = localStorage.getItem('xp_power_state');
  const hasLoggedInBefore = localStorage.getItem('xp_logged_in') === 'true';

  // Shutdown, restart, logout → need to login again
  if (powerState === 'shutdown' || powerState === 'restart' || powerState === 'logout') {
    return false;
  }

  // Previously logged in and not shutdown/restart/logout → skip login
  return hasLoggedInBefore;
};

export const UserSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(getInitialLoginState);
  const [user, setUser] = useState<{ name: string; avatar: string }>({
    name: userConfig.username,
    avatar: userConfig.avatar
  });

  const login = (password: string): boolean => {
    if (password === userConfig.password) {
      setIsLoggedIn(true);
      localStorage.setItem('xp_logged_in', 'true');
      localStorage.setItem('xp_power_state', 'running');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.setItem('xp_power_state', 'logout');
  };

  const contextValue: UserSessionContextType = {
    isLoggedIn,
    user,
    login,
    logout
  };

  return (
    <UserSessionContext.Provider value={contextValue}>
      {children}
    </UserSessionContext.Provider>
  );
};
