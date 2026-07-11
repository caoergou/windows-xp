import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useXPEventBus } from './EventBusContext';
import { useStorage } from './StorageContext';
import userConfig from '../data/user_config.json';
import type { Storage } from '../utils/storage';

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
const getInitialLoginState = (storage: Storage, autoLogin?: boolean): boolean => {
  if (autoLogin) return true;

  const powerState = storage.local.getItem(storage.key('power_state'));
  const hasLoggedInBefore = storage.local.getItem(storage.key('logged_in')) === 'true';

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
  const storage = useStorage();
  const wallpaperKey = storage.key('wallpaper');
  const screensaverKey = storage.key('screensaver_enabled');

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => getInitialLoginState(storage, autoLogin));
  const [user, setUser] = useState<{ name: string; avatar: string }>({
    name: username,
    avatar: userConfig.avatar
  });
  const [wallpaper, setWallpaperState] = useState<string>(() =>
    storage.local.getItem(wallpaperKey) || 'Bliss'
  );
  const [screensaverEnabled, setScreensaverEnabledState] = useState<boolean>(() => {
    const stored = storage.local.getItem(screensaverKey);
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    setUser(prev => ({ ...prev, name: username }));
  }, [username]);

  useEffect(() => {
    if (autoLogin) {
      storage.local.setItem(storage.key('logged_in'), 'true');
      storage.local.setItem(storage.key('power_state'), 'running');
    }
  }, [autoLogin, storage]);

  const bus = useXPEventBus();

  const login = useCallback((inputPassword: string): boolean => {
    if (inputPassword === password) {
      setIsLoggedIn(true);
      storage.local.setItem(storage.key('logged_in'), 'true');
      storage.local.setItem(storage.key('power_state'), 'running');
      bus.emit({ type: 'session:login' });
      return true;
    }
    return false;
  }, [password, bus, storage]);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    storage.local.setItem(storage.key('power_state'), 'logout');
    bus.emit({ type: 'session:logout' });
  }, [bus, storage]);

  const setWallpaper = useCallback((id: string) => {
    setWallpaperState(id);
    storage.local.setItem(wallpaperKey, id);
  }, [storage, wallpaperKey]);

  const setScreensaverEnabled = useCallback((enabled: boolean) => {
    setScreensaverEnabledState(enabled);
    storage.local.setItem(screensaverKey, String(enabled));
  }, [storage, screensaverKey]);

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
