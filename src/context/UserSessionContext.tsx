import React, { createContext, useState, useContext, useEffect } from 'react';
import userConfig from '../data/user_config.json';
import { safeLocalStorage, getStorageKey } from '../utils/storage';

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
const getInitialLoginState = (autoLogin?: boolean): boolean => {
  if (autoLogin) return true;

  const powerState = safeLocalStorage.getItem(getStorageKey('power_state'));
  const hasLoggedInBefore = safeLocalStorage.getItem(getStorageKey('logged_in')) === 'true';

  // Shutdown, restart, logout → need to login again
  if (powerState === 'shutdown' || powerState === 'restart' || powerState === 'logout') {
    return false;
  }

  // Previously logged in and not shutdown/restart/logout → skip login
  return hasLoggedInBefore;
};

export const UserSessionProvider: React.FC<{
  children: React.ReactNode;
  username?: string;
  password?: string;
  autoLogin?: boolean;
}> = ({ children, username = userConfig.username, password = userConfig.password, autoLogin }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => getInitialLoginState(autoLogin));
  const [user, setUser] = useState<{ name: string; avatar: string }>({
    name: username,
    avatar: userConfig.avatar
  });

  useEffect(() => {
    setUser(prev => ({ ...prev, name: username }));
  }, [username]);

  useEffect(() => {
    if (autoLogin) {
      safeLocalStorage.setItem(getStorageKey('logged_in'), 'true');
      safeLocalStorage.setItem(getStorageKey('power_state'), 'running');
    }
  }, [autoLogin]);

  const login = (inputPassword: string): boolean => {
    if (inputPassword === password) {
      setIsLoggedIn(true);
      safeLocalStorage.setItem(getStorageKey('logged_in'), 'true');
      safeLocalStorage.setItem(getStorageKey('power_state'), 'running');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    safeLocalStorage.setItem(getStorageKey('power_state'), 'logout');
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
