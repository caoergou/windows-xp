import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { useXPEventBus } from './EventBusContext';
import { useStorage } from './StorageContext';
import userConfig from '../data/user_config.json';
import { WALLPAPERS, DEFAULT_WALLPAPER_ID, type WallpaperItem } from '../data/wallpapers';
import type { Storage } from '../utils/storage';

interface UserSessionContextType {
  isLoggedIn: boolean;
  user: { name: string; avatar: string };
  wallpaper: string;
  setWallpaper: (wallpaper: string) => void;
  /** Wallpapers available to the picker (built-ins + any injected via props). */
  wallpapers: WallpaperItem[];
  /** Resolve a wallpaper id (or raw URL) to a usable image src. */
  resolveWallpaperSrc: (idOrUrl: string) => string;
  screensaverEnabled: boolean;
  setScreensaverEnabled: (enabled: boolean) => void;
  login: (password: string) => boolean;
  logout: () => void;
}

/** A string that is a direct image reference rather than a wallpaper id. */
const looksLikeUrl = (s: string): boolean =>
  /^(https?:|data:|blob:|\/|\.\/|\.\.\/)/.test(s) || /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(s);

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
  /** Override the login/user avatar (id in XPIcon map or an image URL) (#77). */
  avatar?: string;
  /** Extra wallpapers merged over the built-in list (by id; custom wins) (#77). */
  wallpapers?: WallpaperItem[];
  /** Initial wallpaper (id or URL) when the user hasn't picked one (#77). */
  defaultWallpaper?: string;
}> = ({
  children,
  username = userConfig.username,
  password = userConfig.password,
  autoLogin,
  avatar,
  wallpapers: customWallpapers,
  defaultWallpaper,
}) => {
  const storage = useStorage();
  const wallpaperKey = storage.key('wallpaper');
  const screensaverKey = storage.key('screensaver_enabled');

  // Built-ins + injected wallpapers; a custom entry with an existing id wins.
  const wallpapers = useMemo<WallpaperItem[]>(() => {
    if (!customWallpapers?.length) return WALLPAPERS;
    const byId = new Map(WALLPAPERS.map(w => [w.id, w]));
    for (const w of customWallpapers) byId.set(w.id, w);
    return [...byId.values()];
  }, [customWallpapers]);

  const resolveWallpaperSrc = useCallback(
    (idOrUrl: string): string => {
      const match = wallpapers.find(w => w.id === idOrUrl);
      if (match) return match.src;
      if (looksLikeUrl(idOrUrl)) return idOrUrl;
      return wallpapers.find(w => w.id === DEFAULT_WALLPAPER_ID)?.src ?? wallpapers[0]?.src ?? '';
    },
    [wallpapers]
  );

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => getInitialLoginState(storage, autoLogin));
  const [user, setUser] = useState<{ name: string; avatar: string }>({
    name: username,
    avatar: avatar ?? userConfig.avatar
  });
  const [wallpaper, setWallpaperState] = useState<string>(() =>
    storage.local.getItem(wallpaperKey) || defaultWallpaper || DEFAULT_WALLPAPER_ID
  );
  const [screensaverEnabled, setScreensaverEnabledState] = useState<boolean>(() => {
    const stored = storage.local.getItem(screensaverKey);
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    setUser(prev => ({ ...prev, name: username, avatar: avatar ?? userConfig.avatar }));
  }, [username, avatar]);

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
    wallpapers,
    resolveWallpaperSrc,
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
