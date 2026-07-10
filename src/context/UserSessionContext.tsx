import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useXPEventBus } from './EventBusContext';
import userConfig from '../data/user_config.json';
import { safeLocalStorage, getStorageKey } from '../utils/storage';

interface UserSessionContextType {
  isLoggedIn: boolean;
  user: { name: string; avatar: string };
  wallpaper: string;
  setWallpaper: (wallpaper: string) => void;
  screensaverEnabled: boolean;
  setScreensaverEnabled: (enabled: boolean) => void;
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

const WALLPAPER_KEY = getStorageKey('wallpaper');
const SCREENSAVER_KEY = getStorageKey('screensaver_enabled');

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
  const [wallpaper, setWallpaperState] = useState<string>(() =>
    safeLocalStorage.getItem(WALLPAPER_KEY) || 'Bliss'
  );
  const [screensaverEnabled, setScreensaverEnabledState] = useState<boolean>(() => {
    const stored = safeLocalStorage.getItem(SCREENSAVER_KEY);
    return stored === null ? true : stored === 'true';
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

  const bus = useXPEventBus();

  const login = useCallback((inputPassword: string): boolean => {
    if (inputPassword === password) {
      setIsLoggedIn(true);
      safeLocalStorage.setItem(getStorageKey('logged_in'), 'true');
      safeLocalStorage.setItem(getStorageKey('power_state'), 'running');
      bus.emit({ type: 'session:login' });
      return true;
    }
    return false;
  }, [password, bus]);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    safeLocalStorage.setItem(getStorageKey('power_state'), 'logout');
    bus.emit({ type: 'session:logout' });
  }, [bus]);

  const setWallpaper = useCallback((id: string) => {
    setWallpaperState(id);
    safeLocalStorage.setItem(WALLPAPER_KEY, id);
  }, []);

  const setScreensaverEnabled = useCallback((enabled: boolean) => {
    setScreensaverEnabledState(enabled);
    safeLocalStorage.setItem(SCREENSAVER_KEY, String(enabled));
  }, []);

  const contextValue: UserSessionContextType = {
    isLoggedIn,
    user,
    wallpaper,
    setWallpaper,
    screensaverEnabled,
    setScreensaverEnabled,
    login,
    logout
  };

  return (
    <UserSessionContext.Provider value={contextValue}>
      {children}
    </UserSessionContext.Provider>
  );
};
